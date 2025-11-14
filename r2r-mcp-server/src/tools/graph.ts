/**
 * MCP Tools for GraphRAG - Knowledge Graph Operations
 */

import { getR2RClient } from '../r2r-client.js';
import { createModuleLogger } from '../logger.js';
import {
  GraphQueryRequestSchema,
  type ToolResult,
  type GraphQueryResponse,
  type Entity,
  type Relationship,
} from '../types.js';

const logger = createModuleLogger('tools:graph');

/**
 * Query code relationships using GraphRAG
 * Find how modules, functions, and files are connected
 */
export async function queryCodeRelationships(params: {
  entity_name: string; // e.g., "generateMusic", "src/app/api/generate"
  relationship_types?: Array<'imports' | 'calls' | 'extends' | 'implements' | 'tests' | 'depends_on'>;
  depth?: number;
  limit?: number;
}): Promise<ToolResult<GraphQueryResponse>> {
  const startTime = Date.now();

  try {
    logger.info({ 
      entity: params.entity_name,
      relationshipTypes: params.relationship_types,
      depth: params.depth 
    }, 'Querying code relationships');

    const queryRequest = GraphQueryRequestSchema.parse({
      entity_id: params.entity_name,
      relationship_types: params.relationship_types,
      depth: params.depth || 1,
      limit: params.limit || 50,
    });

    const client = getR2RClient();
    const response = await client.queryGraph(queryRequest);

    if (!response.success) {
      logger.error({ error: response.error }, 'Graph query failed');
      return {
        success: false,
        error: response.error?.message || 'Graph query failed',
        metadata: {
          execution_time_ms: Date.now() - startTime,
        },
      };
    }

    logger.info({ 
      entitiesCount: response.data?.entities.length || 0,
      relationshipsCount: response.data?.relationships.length || 0,
      executionTime: Date.now() - startTime 
    }, 'Graph query completed');

    return {
      success: true,
      data: response.data!,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'graphrag',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Graph query error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        execution_time_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Find dependencies of a module or file
 * What does this code depend on?
 */
export async function findDependencies(params: {
  module_path: string;
  include_transitive?: boolean;
}): Promise<ToolResult<{ dependencies: Entity[]; relationships: Relationship[] }>> {
  const startTime = Date.now();

  try {
    logger.info({ modulePath: params.module_path }, 'Finding dependencies');

    const client = getR2RClient();
    const response = await client.queryGraph({
      entity_id: params.module_path,
      relationship_types: ['imports', 'depends_on'],
      depth: params.include_transitive ? 2 : 1,
      limit: 100,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || 'Failed to find dependencies',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: {
        dependencies: response.data.entities,
        relationships: response.data.relationships,
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'dependency_graph',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Find dependencies error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Find what depends on a module or file
 * What code uses this?
 */
export async function findUsages(params: {
  module_path: string;
  depth?: number;
}): Promise<ToolResult<{ usages: Entity[]; relationships: Relationship[] }>> {
  const startTime = Date.now();

  try {
    logger.info({ modulePath: params.module_path }, 'Finding usages');

    const client = getR2RClient();
    
    // Query reverse dependencies
    const response = await client.queryGraph({
      entity_id: params.module_path,
      relationship_types: ['imports', 'calls', 'depends_on'],
      depth: params.depth || 1,
      limit: 100,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || 'Failed to find usages',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    // Filter for reverse relationships (things that depend on this module)
    const reverseRelationships = response.data.relationships.filter(
      rel => rel.target === params.module_path
    );

    const usageEntities = response.data.entities.filter(entity =>
      reverseRelationships.some(rel => rel.source === entity.id)
    );

    logger.info({ 
      usagesCount: usageEntities.length,
      executionTime: Date.now() - startTime 
    }, 'Usages found');

    return {
      success: true,
      data: {
        usages: usageEntities,
        relationships: reverseRelationships,
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'usage_graph',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Find usages error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Find test coverage for a module
 * What tests cover this code?
 */
export async function findTestCoverage(params: {
  module_path: string;
}): Promise<ToolResult<{ tests: Entity[]; coverage_relationships: Relationship[] }>> {
  const startTime = Date.now();

  try {
    logger.info({ modulePath: params.module_path }, 'Finding test coverage');

    const client = getR2RClient();
    const response = await client.queryGraph({
      entity_id: params.module_path,
      relationship_types: ['tests'],
      depth: 1,
      limit: 50,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || 'Failed to find test coverage',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    const testRelationships = response.data.relationships.filter(
      rel => rel.type === 'tests' && rel.target === params.module_path
    );

    const testEntities = response.data.entities.filter(
      entity => testRelationships.some(rel => rel.source === entity.id)
    );

    logger.info({ 
      testsCount: testEntities.length,
      executionTime: Date.now() - startTime 
    }, 'Test coverage found');

    return {
      success: true,
      data: {
        tests: testEntities,
        coverage_relationships: testRelationships,
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'test_coverage_graph',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Find test coverage error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Explore module architecture and connections
 * Get a high-level view of how code is organized
 */
export async function exploreArchitectureGraph(params: {
  root_module?: string;
  max_depth?: number;
}): Promise<ToolResult<{ 
  modules: Entity[];
  connections: Relationship[];
  summary: string;
}>> {
  const startTime = Date.now();

  try {
    logger.info({ 
      rootModule: params.root_module || 'all',
      maxDepth: params.max_depth 
    }, 'Exploring architecture graph');

    const client = getR2RClient();
    
    const queryParams: Parameters<typeof client.queryGraph>[0] = {
      entity_id: params.root_module || 'src/',
      relationship_types: ['imports', 'depends_on', 'extends', 'implements'],
      depth: params.max_depth || 2,
      limit: 200,
    };

    const response = await client.queryGraph(queryParams);

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || 'Failed to explore architecture',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    // Generate summary
    const summary = generateArchitectureSummary(
      response.data.entities,
      response.data.relationships
    );

    logger.info({ 
      modulesCount: response.data.entities.length,
      connectionsCount: response.data.relationships.length,
      executionTime: Date.now() - startTime 
    }, 'Architecture exploration completed');

    return {
      success: true,
      data: {
        modules: response.data.entities,
        connections: response.data.relationships,
        summary,
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'architecture_graph',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Explore architecture error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Helper: Generate architecture summary from graph data
 */
function generateArchitectureSummary(
  entities: Entity[],
  relationships: Relationship[]
): string {
  const modulesByType = entities.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relationshipsByType = relationships.reduce((acc, rel) => {
    acc[rel.type] = (acc[rel.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = `
Architecture Summary:
- Total Modules: ${entities.length}
  ${Object.entries(modulesByType).map(([type, count]) => `  - ${type}: ${count}`).join('\n  ')}

- Total Relationships: ${relationships.length}
  ${Object.entries(relationshipsByType).map(([type, count]) => `  - ${type}: ${count}`).join('\n  ')}

- Most Connected Modules: ${findMostConnected(entities, relationships, 5).join(', ')}
  `.trim();

  return summary;
}

/**
 * Helper: Find most connected modules
 */
function findMostConnected(
  entities: Entity[],
  relationships: Relationship[],
  limit: number
): string[] {
  const connectionCounts: Record<string, number> = {};

  for (const rel of relationships) {
    connectionCounts[rel.source] = (connectionCounts[rel.source] || 0) + 1;
    connectionCounts[rel.target] = (connectionCounts[rel.target] || 0) + 1;
  }

  return Object.entries(connectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => {
      const entity = entities.find(e => e.id === id);
      return entity?.name || id;
    });
}
