/**
 * R2R REST API Client
 * Typed wrapper for R2R backend operations
 */

import { createModuleLogger } from './logger.js';
import type {
  R2RResponse,
  R2RDocument,
  R2RCollection,
  IngestionRequest,
  SearchRequest,
  SearchResult,
  RAGRequest,
  RAGResponse,
  GraphQueryRequest,
  GraphQueryResponse,
} from './types.js';

const logger = createModuleLogger('r2r-client');

export class R2RClient {
  private baseUrl: string;
  private apiKey?: string;
  private defaultCollection: string = 'suno-api-docs';

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.R2R_BASE_URL || 'http://localhost:7272';
    this.apiKey = apiKey || process.env.R2R_API_KEY;

    logger.info({ baseUrl: this.baseUrl }, 'R2R client initialized');
  }

  /**
   * Make HTTP request to R2R API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<R2RResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      logger.debug({ method, url, hasBody: !!body }, 'R2R API request');

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error({ status: response.status, data }, 'R2R API error');
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || response.statusText,
            details: data,
          },
        };
      }

      logger.debug({ status: response.status }, 'R2R API response');
      return { success: true, data: data.results || data };
    } catch (error) {
      logger.error({ error, endpoint }, 'R2R API request failed');
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  // ============================================================================
  // Collections Management
  // ============================================================================

  /**
   * Create a new collection for organizing documents
   */
  async createCollection(
    name: string,
    description?: string
  ): Promise<R2RResponse<R2RCollection>> {
    logger.info({ name, description }, 'Creating collection');
    
    return this.request<R2RCollection>('/v2/collections', 'POST', {
      name,
      description,
    });
  }

  /**
   * Get collection by name or ID
   */
  async getCollection(identifier: string): Promise<R2RResponse<R2RCollection>> {
    return this.request<R2RCollection>(`/v2/collections/${identifier}`);
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<R2RResponse<R2RCollection[]>> {
    return this.request<R2RCollection[]>('/v2/collections');
  }

  // ============================================================================
  // Document Ingestion
  // ============================================================================

  /**
   * Ingest a document into R2R
   */
  async ingestDocument(request: IngestionRequest): Promise<R2RResponse<R2RDocument>> {
    logger.info({ 
      documentId: request.document_id,
      fileType: request.metadata.file_type,
      contentLength: request.content.length 
    }, 'Ingesting document');

    return this.request<R2RDocument>('/v2/ingest_chunks', 'POST', {
      chunks: [{
        text: request.content,
        metadata: {
          ...request.metadata,
          document_id: request.document_id,
        },
      }],
      collection_ids: [this.defaultCollection],
      run_with_orchestration: false,
    });
  }

  /**
   * Ingest multiple documents in batch
   */
  async ingestDocuments(
    requests: IngestionRequest[]
  ): Promise<R2RResponse<R2RDocument[]>> {
    logger.info({ count: requests.length }, 'Batch ingesting documents');

    const chunks = requests.map(req => ({
      text: req.content,
      metadata: {
        ...req.metadata,
        document_id: req.document_id,
      },
    }));

    return this.request<R2RDocument[]>('/v2/ingest_chunks', 'POST', {
      chunks,
      collection_ids: [this.defaultCollection],
      run_with_orchestration: false,
    });
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: string): Promise<R2RResponse<void>> {
    logger.info({ documentId }, 'Deleting document');
    return this.request<void>(`/v2/documents/${documentId}`, 'DELETE');
  }

  /**
   * List all documents
   */
  async listDocuments(): Promise<R2RResponse<R2RDocument[]>> {
    return this.request<R2RDocument[]>('/v2/documents');
  }

  // ============================================================================
  // Search
  // ============================================================================

  /**
   * Search for relevant documents
   */
  async search(request: SearchRequest): Promise<R2RResponse<SearchResult[]>> {
    logger.info({ 
      query: request.query.substring(0, 50),
      topK: request.top_k,
      searchMode: request.search_mode 
    }, 'Searching documents');

    return this.request<SearchResult[]>('/v2/search', 'POST', {
      query: request.query,
      limit: request.top_k,
      filters: request.filters,
      search_settings: {
        use_hybrid_search: request.search_mode === 'hybrid',
        use_semantic_search: request.search_mode === 'vector' || request.search_mode === 'hybrid',
      },
    });
  }

  // ============================================================================
  // RAG (Retrieval-Augmented Generation)
  // ============================================================================

  /**
   * Perform RAG completion - answer question using retrieved context
   */
  async ragCompletion(request: RAGRequest): Promise<R2RResponse<RAGResponse>> {
    logger.info({ 
      query: request.query.substring(0, 50),
      topK: request.top_k,
      stream: request.stream 
    }, 'RAG completion');

    const response = await this.request<{
      completion: { choices: Array<{ message: { content: string } }> };
      search_results?: { results: SearchResult[] };
    }>('/v2/retrieval/rag', 'POST', {
      query: request.query,
      rag_generation_config: {
        stream: request.stream,
        temperature: 0.7,
        max_tokens: 2000,
      },
      search_settings: {
        limit: request.top_k,
      },
    });

    if (!response.success || !response.data) {
      return response as R2RResponse<RAGResponse>;
    }

    // Transform R2R response to our format
    const ragResponse: RAGResponse = {
      answer: response.data.completion.choices[0]?.message?.content || '',
      sources: response.data.search_results?.results || [],
    };

    return { success: true, data: ragResponse };
  }

  // ============================================================================
  // Graph Operations
  // ============================================================================

  /**
   * Query knowledge graph for entity relationships
   */
  async queryGraph(request: GraphQueryRequest): Promise<R2RResponse<GraphQueryResponse>> {
    logger.info({ 
      entityId: request.entity_id,
      relationshipTypes: request.relationship_types,
      depth: request.depth 
    }, 'Querying knowledge graph');

    return this.request<GraphQueryResponse>('/v2/graphs/entities', 'POST', {
      entity_ids: [request.entity_id],
      relationship_types: request.relationship_types,
      max_depth: request.depth,
      limit: request.limit,
    });
  }

  /**
   * Create entities in knowledge graph
   */
  async createEntities(
    entities: Array<{ name: string; type: string; metadata?: Record<string, unknown> }>
  ): Promise<R2RResponse<void>> {
    logger.info({ count: entities.length }, 'Creating graph entities');

    return this.request('/v2/graphs/entities', 'POST', {
      entities: entities.map(e => ({
        name: e.name,
        category: e.type,
        metadata: e.metadata,
      })),
    });
  }

  /**
   * Create relationships in knowledge graph
   */
  async createRelationships(
    relationships: Array<{
      source: string;
      target: string;
      type: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<R2RResponse<void>> {
    logger.info({ count: relationships.length }, 'Creating graph relationships');

    return this.request('/v2/graphs/relationships', 'POST', {
      relationships: relationships.map(r => ({
        subject: r.source,
        object: r.target,
        predicate: r.type,
        metadata: r.metadata,
      })),
    });
  }

  // ============================================================================
  // Health & Status
  // ============================================================================

  /**
   * Check R2R server health
   */
  async healthCheck(): Promise<R2RResponse<{ status: string }>> {
    return this.request<{ status: string }>('/v2/health');
  }

  /**
   * Get server info
   */
  async getServerInfo(): Promise<R2RResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>('/v2/system/status');
  }
}

// Singleton instance
let clientInstance: R2RClient | null = null;

export const getR2RClient = (): R2RClient => {
  if (!clientInstance) {
    clientInstance = new R2RClient();
  }
  return clientInstance;
};
