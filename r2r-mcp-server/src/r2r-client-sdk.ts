/**
 * R2R Client using official r2r-js SDK
 * Supports R2R v3 API automatically
 */

import { r2rClient } from 'r2r-js';
import { createModuleLogger } from './logger.js';

const logger = createModuleLogger('r2r-client-sdk');

/**
 * Initialize R2R client with official SDK
 */
export function createR2RClient(): r2rClient {
  const baseUrl = process.env.R2R_BASE_URL || 'http://localhost:7272';
  const anonymousTelemetry = false; // Disable telemetry

  logger.info({ baseUrl: baseUrl.replace(/\/+$/, '') }, 'Initializing R2R SDK client');

  // Constructor: r2rClient(baseURL: string, anonymousTelemetry?: boolean, options?: R2RClientOptions)
  const client = new r2rClient(baseUrl, anonymousTelemetry);

  return client;
}

/**
 * Extended R2R Client with v2 compatibility methods
 * Transforms SDK v3 responses to v2 format: { success, data, error }
 */
class ExtendedR2RClient extends r2rClient {
  // v2 compatibility: search
  async search(params: any) {
    try {
      const response = await this.retrieval.search(params);
      // SDK v3 returns CombinedSearchResponse with chunkSearchResults, graphSearchResults, etc.
      // Extract chunkSearchResults array for backward compatibility
      const results = (response as any)?.results?.chunkSearchResults || [];
      return { success: true, data: results };
    } catch (error: any) {
      return { success: false, error: error.message || 'Search failed' };
    }
  }

  // v2 compatibility: ragCompletion
  async ragCompletion(params: any) {
    try {
      const response = await this.retrieval.rag(params);
      return { success: true, data: response.results || response };
    } catch (error: any) {
      return { success: false, error: error.message || 'RAG completion failed' };
    }
  }

  // v2 compatibility: healthCheck
  async healthCheck() {
    try {
      const response = await this.system.health();
      return { success: true, data: response.results || response };
    } catch (error: any) {
      return { success: false, error: error.message || 'Health check failed' };
    }
  }

  // v2 compatibility: ingestDocument
  async ingestDocument(params: any) {
    try {
      const response = await this.documents.create(params);
      return { success: true, data: response.results || response };
    } catch (error: any) {
      return { success: false, error: error.message || 'Document ingestion failed' };
    }
  }

  // v2 compatibility: queryGraph (not available in SDK v3)
  async queryGraph(params: any) {
    try {
      // Graph querying in v3 SDK uses retrieval.search with graphSearchSettings
      const response = await this.retrieval.search({
        query: params.query || '',
        searchMode: 'custom',
        searchSettings: {
          graphSearchSettings: {
            enabled: true,
            ...params
          }
        }
      });
      // Extract graph data from response
      const graphResults = (response as any)?.results?.graphSearchResults || {};
      return {
        success: true,
        data: {
          entities: graphResults.entities || [],
          relationships: graphResults.relationships || []
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Graph query failed' };
    }
  }

  // v2 compatibility: createEntities (batch operation)
  async createEntities(entities: any[]) {
    try {
      // v3 SDK uses createEntity (singular), batch it
      const results = await Promise.all(
        entities.map(entity => this.graphs.createEntity(entity))
      );
      return { success: true, results };
    } catch (error: any) {
      return { success: false, error: error.message || 'Create entities failed' };
    }
  }

  // v2 compatibility: createRelationships (batch operation)
  async createRelationships(relationships: any[]) {
    try {
      // v3 SDK uses createRelationship (singular), batch it
      const results = await Promise.all(
        relationships.map(rel => this.graphs.createRelationship(rel))
      );
      return { success: true, results };
    } catch (error: any) {
      return { success: false, error: error.message || 'Create relationships failed' };
    }
  }
}

/**
 * Singleton instance
 */
let clientInstance: ExtendedR2RClient | null = null;

export const getR2RClient = (): ExtendedR2RClient => {
  if (!clientInstance) {
    const baseUrl = process.env.R2R_BASE_URL || 'http://localhost:7272';
    const anonymousTelemetry = false;
    logger.info({ baseUrl: baseUrl.replace(/\/+$/, '') }, 'Initializing Extended R2R SDK client');
    clientInstance = new ExtendedR2RClient(baseUrl, anonymousTelemetry) as ExtendedR2RClient;
  }
  return clientInstance;
};

/**
 * Health check wrapper with proper error handling
 */
export async function checkHealth(): Promise<{ status: string; version?: string }> {
  try {
    const client = getR2RClient();
    const response = await client.system.health();

    logger.info({ response }, 'Health check successful');

    // R2R v3 returns { results: { message: "ok" } }
    return {
      status: 'ok',
      version: 'v3'
    };
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    throw error;
  }
}

/**
 * Search documents using official SDK
 */
export async function searchDocuments(query: string, limit: number = 5) {
  try {
    const client = getR2RClient();

    logger.info({
      query: query.substring(0, 50),
      limit
    }, 'Searching documents');

    const results = await client.retrieval.search({
      query,
      searchMode: 'basic',
      searchSettings: {
        useHybridSearch: true,
        limit
      }
    });

    // CombinedSearchResponse: { chunkSearchResults, graphSearchResults, documentSearchResults, webSearchResults }
    const resultCount = (results as any)?.results?.chunkSearchResults?.length || 0;
    logger.debug({ resultCount }, 'Search completed');

    return results;
  } catch (error) {
    logger.error({ error, query }, 'Search failed');
    throw error;
  }
}

/**
 * RAG completion using official SDK
 */
export async function ragCompletion(query: string, options?: {
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  limit?: number;
}) {
  try {
    const client = getR2RClient();

    logger.info({
      query: query.substring(0, 50),
      stream: options?.stream || false
    }, 'RAG completion');

    const response = await client.retrieval.rag({
      query,
      searchMode: 'basic',
      ragGenerationConfig: {
        stream: options?.stream || false,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      },
      searchSettings: {
        limit: options?.limit || 5,
      }
    });

    return response;
  } catch (error) {
    logger.error({ error, query }, 'RAG completion failed');
    throw error;
  }
}

/**
 * List collections using official SDK
 */
export async function listCollections() {
  try {
    const client = getR2RClient();

    logger.info('Listing collections');

    const collections = await client.collections.list();

    logger.debug({ count: collections?.results?.length || 0 }, 'Collections listed');

    return collections;
  } catch (error) {
    logger.error({ error }, 'List collections failed');
    throw error;
  }
}

/**
 * Ingest documents using official SDK
 */
export async function ingestDocuments(
  files: Array<{ path: string; name: string }>,
  options?: {
    metadatas?: Array<Record<string, unknown>>;
    collectionIds?: string[];
  }
) {
  try {
    const client = getR2RClient();

    logger.info({
      fileCount: files.length,
      collectionIds: options?.collectionIds
    }, 'Ingesting documents');

    // Ingest each file separately using documents.create
    const results = await Promise.all(
      files.map(async (file, index) => {
        return client.documents.create({
          file: file.path,
          metadata: options?.metadatas?.[index] || {},
          collectionIds: options?.collectionIds,
        });
      })
    );

    logger.info({ count: results.length }, 'Documents ingested');

    return results;
  } catch (error) {
    logger.error({ error, fileCount: files.length }, 'Ingest failed');
    throw error;
  }
}

/**
 * List documents using official SDK
 */
export async function listDocuments() {
  try {
    const client = getR2RClient();

    logger.info('Listing documents');

    const documents = await client.documents.list();

    logger.debug({ count: documents?.results?.length || 0 }, 'Documents listed');

    return documents;
  } catch (error) {
    logger.error({ error }, 'List documents failed');
    throw error;
  }
}

/**
 * Delete document using official SDK
 */
export async function deleteDocument(documentId: string) {
  try {
    const client = getR2RClient();

    logger.info({ documentId }, 'Deleting document');

    const result = await client.documents.delete({ id: documentId });

    logger.info({ documentId }, 'Document deleted');

    return result;
  } catch (error) {
    logger.error({ error, documentId }, 'Delete document failed');
    throw error;
  }
}

export default {
  getR2RClient,
  checkHealth,
  searchDocuments,
  ragCompletion,
  listCollections,
  ingestDocuments,
  listDocuments,
  deleteDocument,
};
