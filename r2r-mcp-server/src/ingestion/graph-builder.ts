/**
 * Knowledge Graph Builder
 * Build GraphRAG relationships from ingested documents
 */

import { createModuleLogger } from '../logger.js';
import { getR2RClient } from '../r2r-client-sdk.js';
import type { IngestionRequest, Entity, Relationship } from '../types.js';

const logger = createModuleLogger('graph-builder');

/**
 * Build knowledge graph from ingested documents
 */
export async function buildKnowledgeGraph(requests: IngestionRequest[]): Promise<void> {
  logger.info({ documents: requests.length }, 'Building knowledge graph');

  try {
    // Extract entities and relationships
    const entities = extractEntities(requests);
    const relationships = extractRelationships(requests, entities);

    logger.info({ 
      entities: entities.length,
      relationships: relationships.length 
    }, 'Entities and relationships extracted');

    // Create in R2R
    const client = getR2RClient();

    // Create entities
    if (entities.length > 0) {
      const entityResponse = await client.createEntities(
        entities.map(e => ({
          name: e.name,
          type: e.type,
          metadata: e.metadata,
        }))
      );

      if (!entityResponse.success) {
        logger.error({ error: entityResponse.error }, 'Failed to create entities');
      } else {
        logger.info({ count: entities.length }, 'Entities created');
      }
    }

    // Create relationships
    if (relationships.length > 0) {
      const relResponse = await client.createRelationships(
        relationships.map(r => ({
          source: r.source,
          target: r.target,
          type: r.type,
          metadata: r.metadata,
        }))
      );

      if (!relResponse.success) {
        logger.error({ error: relResponse.error }, 'Failed to create relationships');
      } else {
        logger.info({ count: relationships.length }, 'Relationships created');
      }
    }

    logger.info('Knowledge graph built successfully');
  } catch (error) {
    logger.error({ error }, 'Graph building failed');
    throw error;
  }
}

/**
 * Extract entities from documents
 */
function extractEntities(requests: IngestionRequest[]): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();

  for (const request of requests) {
    const { metadata, content } = request;
    const filePath = metadata.file_path;

    // File entity
    if (!seen.has(filePath)) {
      entities.push({
        id: filePath,
        name: filePath.split('/').pop() || filePath,
        type: 'file',
        metadata: {
          file_type: metadata.file_type,
          project_section: metadata.project_section,
        },
      });
      seen.add(filePath);
    }

    // Module entities (for code files)
    if (metadata.file_type === 'typescript' || metadata.file_type === 'javascript') {
      // Extract functions
      const functions = extractFunctionNames(content);
      for (const func of functions) {
        const entityId = `${filePath}::${func}`;
        if (!seen.has(entityId)) {
          entities.push({
            id: entityId,
            name: func,
            type: 'function',
            metadata: {
              file: filePath,
              language: metadata.file_type,
            },
          });
          seen.add(entityId);
        }
      }

      // Extract classes
      const classes = extractClassNames(content);
      for (const cls of classes) {
        const entityId = `${filePath}::${cls}`;
        if (!seen.has(entityId)) {
          entities.push({
            id: entityId,
            name: cls,
            type: 'class',
            metadata: {
              file: filePath,
              language: metadata.file_type,
            },
          });
          seen.add(entityId);
        }
      }

      // Extract interfaces/types
      const interfaces = extractInterfaceNames(content);
      for (const iface of interfaces) {
        const entityId = `${filePath}::${iface}`;
        if (!seen.has(entityId)) {
          entities.push({
            id: entityId,
            name: iface,
            type: 'interface',
            metadata: {
              file: filePath,
              language: metadata.file_type,
            },
          });
          seen.add(entityId);
        }
      }
    }
  }

  return entities;
}

/**
 * Extract relationships from documents
 */
function extractRelationships(
  requests: IngestionRequest[],
  entities: Entity[]
): Relationship[] {
  const relationships: Relationship[] = [];
  const entityIds = new Set(entities.map(e => e.id));

  for (const request of requests) {
    const { metadata, content } = request;
    const filePath = metadata.file_path;

    // Import relationships
    if (metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        // Resolve to actual file path (simplified)
        const depPath = resolveDependencyPath(dep, filePath);
        
        if (entityIds.has(depPath)) {
          relationships.push({
            source: filePath,
            target: depPath,
            type: 'imports',
            metadata: {
              module: dep,
            },
          });
        }
      }
    }

    // Function/class relationships within file
    if (metadata.file_type === 'typescript' || metadata.file_type === 'javascript') {
      const functions = extractFunctionNames(content);
      const classes = extractClassNames(content);

      // Link functions to file
      for (const func of functions) {
        const funcId = `${filePath}::${func}`;
        if (entityIds.has(funcId)) {
          relationships.push({
            source: funcId,
            target: filePath,
            type: 'depends_on',
            metadata: {
              relationship: 'defined_in',
            },
          });
        }
      }

      // Link classes to file
      for (const cls of classes) {
        const clsId = `${filePath}::${cls}`;
        if (entityIds.has(clsId)) {
          relationships.push({
            source: clsId,
            target: filePath,
            type: 'depends_on',
            metadata: {
              relationship: 'defined_in',
            },
          });
        }
      }

      // Extract class inheritance
      const inheritance = extractInheritance(content);
      for (const [child, parent] of inheritance) {
        const childId = `${filePath}::${child}`;
        const parentId = `${filePath}::${parent}`;
        
        if (entityIds.has(childId) && entityIds.has(parentId)) {
          relationships.push({
            source: childId,
            target: parentId,
            type: 'extends',
          });
        }
      }
    }

    // Test relationships
    if (metadata.project_section === 'tests') {
      // Find what this test tests (heuristic: similar file name in src/)
      const testedModule = findTestedModule(filePath);
      if (testedModule && entityIds.has(testedModule)) {
        relationships.push({
          source: filePath,
          target: testedModule,
          type: 'tests',
          metadata: {
            test_file: filePath,
          },
        });
      }
    }
  }

  return relationships;
}

/**
 * Extract function names from code
 */
function extractFunctionNames(content: string): string[] {
  const functions: string[] = [];
  
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /(\w+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>/g, // Object method shorthand
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.push(match[1]);
    }
  }

  return Array.from(new Set(functions));
}

/**
 * Extract class names from code
 */
function extractClassNames(content: string): string[] {
  const classes: string[] = [];
  const classRegex = /(?:export\s+)?class\s+(\w+)/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    classes.push(match[1]);
  }

  return classes;
}

/**
 * Extract interface/type names from code
 */
function extractInterfaceNames(content: string): string[] {
  const interfaces: string[] = [];
  
  const patterns = [
    /(?:export\s+)?interface\s+(\w+)/g,
    /(?:export\s+)?type\s+(\w+)\s*=/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      interfaces.push(match[1]);
    }
  }

  return Array.from(new Set(interfaces));
}

/**
 * Extract class inheritance relationships
 */
function extractInheritance(content: string): Array<[string, string]> {
  const inheritance: Array<[string, string]> = [];
  const extendsRegex = /class\s+(\w+)\s+extends\s+(\w+)/g;
  let match;

  while ((match = extendsRegex.exec(content)) !== null) {
    inheritance.push([match[1], match[2]]);
  }

  return inheritance;
}

/**
 * Resolve dependency path (simplified)
 */
function resolveDependencyPath(importPath: string, currentFile: string): string {
  // External packages
  if (!importPath.startsWith('.')) {
    return importPath;
  }

  // Relative imports - simplified resolution
  const currentDir = currentFile.split('/').slice(0, -1).join('/');
  
  if (importPath.startsWith('./')) {
    return `${currentDir}/${importPath.substring(2)}`;
  }

  if (importPath.startsWith('../')) {
    const parts = currentDir.split('/');
    let path = importPath;
    
    while (path.startsWith('../')) {
      parts.pop();
      path = path.substring(3);
    }
    
    return `${parts.join('/')}/${path}`;
  }

  return importPath;
}

/**
 * Find module that a test file tests (heuristic)
 */
function findTestedModule(testFilePath: string): string | null {
  // Remove test suffix and extension
  let modulePath = testFilePath
    .replace(/\.test\.(ts|tsx|js|jsx)$/, '')
    .replace(/\.spec\.(ts|tsx|js|jsx)$/, '')
    .replace(/^tests\//, 'src/');

  // Add back extension
  return `${modulePath}.ts`;
}
