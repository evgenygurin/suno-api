/**
 * MCP Tools for documentation search
 */

import { getR2RClient } from '../r2r-client.js';
import { createModuleLogger } from '../logger.js';
import { SearchRequestSchema, type ToolResult, type SearchResult } from '../types.js';

const logger = createModuleLogger('tools:search');

/**
 * Search project documentation using semantic/hybrid search
 * 
 * This tool performs intelligent search across project documentation,
 * code, and comments using vector embeddings and keyword matching.
 */
export async function searchDocumentation(params: {
  query: string;
  top_k?: number;
  search_mode?: 'vector' | 'keyword' | 'hybrid';
  file_type?: string;
  project_section?: string;
}): Promise<ToolResult<SearchResult[]>> {
  const startTime = Date.now();
  
  try {
    logger.info({ query: params.query, topK: params.top_k }, 'Searching documentation');

    // Validate input
    const searchRequest = SearchRequestSchema.parse({
      query: params.query,
      top_k: params.top_k || 5,
      search_mode: params.search_mode || 'hybrid',
      filters: {
        ...(params.file_type && { file_type: params.file_type }),
        ...(params.project_section && { project_section: params.project_section }),
      },
    });

    const client = getR2RClient();
    const response = await client.search(searchRequest);

    if (!response.success) {
      logger.error({ error: response.error }, 'Search failed');
      return {
        success: false,
        error: response.error?.message || 'Search failed',
        metadata: {
          execution_time_ms: Date.now() - startTime,
        },
      };
    }

    logger.info({ 
      resultsCount: response.data?.length || 0,
      executionTime: Date.now() - startTime 
    }, 'Search completed');

    return {
      success: true,
      data: response.data || [],
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'r2r_search',
      },
    };
  } catch (error) {
    logger.error({ error, params }, 'Search error');
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
 * Search for code examples matching a pattern or description
 */
export async function searchCodeExamples(params: {
  description: string;
  language?: string;
  top_k?: number;
}): Promise<ToolResult<SearchResult[]>> {
  const startTime = Date.now();

  try {
    logger.info({ description: params.description }, 'Searching code examples');

    const client = getR2RClient();
    const response = await client.search({
      query: params.description,
      top_k: params.top_k || 5,
      search_mode: 'hybrid',
      filters: {
        file_type: params.language || 'typescript',
        project_section: 'src',
      },
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Search failed',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: response.data || [],
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'code_examples',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Code example search error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Find test examples for a specific feature or module
 */
export async function findTestExamples(params: {
  feature: string;
  top_k?: number;
}): Promise<ToolResult<SearchResult[]>> {
  const startTime = Date.now();

  try {
    logger.info({ feature: params.feature }, 'Finding test examples');

    const client = getR2RClient();
    const response = await client.search({
      query: `test examples for ${params.feature}`,
      top_k: params.top_k || 3,
      search_mode: 'hybrid',
      filters: {
        project_section: 'tests',
      },
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Search failed',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: response.data || [],
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'test_examples',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Test example search error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}
