/**
 * Core types for R2R MCP Server
 */

import { z } from 'zod';

// ============================================================================
// R2R API Types
// ============================================================================

export const DocumentMetadataSchema = z.object({
  file_path: z.string(),
  file_type: z.enum(['markdown', 'typescript', 'javascript', 'json', 'yaml', 'text']),
  last_modified: z.string().datetime(),
  project_section: z.enum(['docs', 'src', 'tests', 'config']).optional(),
  language: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  exports: z.array(z.string()).optional(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

export const IngestionRequestSchema = z.object({
  document_id: z.string(),
  content: z.string(),
  metadata: DocumentMetadataSchema,
  chunk_size: z.number().optional(),
  chunk_overlap: z.number().optional(),
});

export type IngestionRequest = z.infer<typeof IngestionRequestSchema>;

export const SearchRequestSchema = z.object({
  query: z.string(),
  top_k: z.number().default(5),
  filters: z.record(z.any()).optional(),
  search_mode: z.enum(['vector', 'keyword', 'hybrid']).default('hybrid'),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResultSchema = z.object({
  document_id: z.string(),
  content: z.string(),
  metadata: DocumentMetadataSchema,
  score: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const RAGRequestSchema = z.object({
  query: z.string(),
  top_k: z.number().default(5),
  stream: z.boolean().default(false),
  include_sources: z.boolean().default(true),
});

export type RAGRequest = z.infer<typeof RAGRequestSchema>;

export const RAGResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(SearchResultSchema),
  confidence: z.number().optional(),
});

export type RAGResponse = z.infer<typeof RAGResponseSchema>;

// ============================================================================
// GraphRAG Types
// ============================================================================

export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['module', 'function', 'class', 'interface', 'constant', 'file']),
  metadata: z.record(z.any()).optional(),
});

export type Entity = z.infer<typeof EntitySchema>;

export const RelationshipSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(['imports', 'calls', 'extends', 'implements', 'tests', 'depends_on']),
  metadata: z.record(z.any()).optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

export const GraphQueryRequestSchema = z.object({
  entity_id: z.string(),
  relationship_types: z.array(RelationshipSchema.shape.type).optional(),
  depth: z.number().default(1),
  limit: z.number().default(50),
});

export type GraphQueryRequest = z.infer<typeof GraphQueryRequestSchema>;

export const GraphQueryResponseSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
});

export type GraphQueryResponse = z.infer<typeof GraphQueryResponseSchema>;

// ============================================================================
// Memory/Experience Types
// ============================================================================

export const ExperienceSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  context: z.object({
    task: z.string(),
    file_paths: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    error_type: z.string().optional(),
  }),
  action_taken: z.string(),
  outcome: z.enum(['success', 'failure', 'partial']),
  learned_pattern: z.string().optional(),
  code_snippet: z.string().optional(),
  tags: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type Experience = z.infer<typeof ExperienceSchema>;

export const StoreExperienceRequestSchema = ExperienceSchema.omit({ id: true });
export type StoreExperienceRequest = z.infer<typeof StoreExperienceRequestSchema>;

export const RetrieveSimilarExperiencesRequestSchema = z.object({
  current_context: z.string(),
  top_k: z.number().default(3),
  tags: z.array(z.string()).optional(),
  min_confidence: z.number().min(0).max(1).optional(),
});

export type RetrieveSimilarExperiencesRequest = z.infer<typeof RetrieveSimilarExperiencesRequestSchema>;

// ============================================================================
// Agent Configuration Types
// ============================================================================

export const AgentConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  personality: z.object({
    role: z.string(),
    constraints: z.array(z.string()),
    guidelines: z.array(z.string()),
  }),
  rag_settings: z.object({
    top_k: z.number(),
    similarity_threshold: z.number().min(0).max(1),
    chunk_size: z.number(),
    chunk_overlap: z.number(),
    search_mode: SearchRequestSchema.shape.search_mode,
  }),
  memory_settings: z.object({
    retention_days: z.number(),
    max_items: z.number(),
    auto_reflect: z.boolean(),
    reflection_interval_hours: z.number().optional(),
  }),
  graph_settings: z.object({
    enabled: z.boolean(),
    max_depth: z.number(),
    relationship_types: z.array(RelationshipSchema.shape.type),
  }),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ============================================================================
// R2R Client Response Types
// ============================================================================

export interface R2RResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface R2RDocument {
  id: string;
  collection_ids: string[];
  metadata: DocumentMetadata;
  created_at: string;
  updated_at: string;
}

export interface R2RCollection {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// ============================================================================
// MCP Tool Result Types
// ============================================================================

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    execution_time_ms: number;
    source?: string;
    [key: string]: unknown;
  };
}
