/**
 * MCP Tools for RAG (Retrieval-Augmented Generation)
 */

import { getR2RClient } from '../r2r-client.js';
import { createModuleLogger } from '../logger.js';
import { RAGRequestSchema, type ToolResult, type RAGResponse } from '../types.js';

const logger = createModuleLogger('tools:rag');

/**
 * Ask a question about the project documentation
 * Uses RAG to provide accurate answers based on actual project docs
 */
export async function askDocumentation(params: {
  question: string;
  top_k?: number;
  include_sources?: boolean;
}): Promise<ToolResult<RAGResponse>> {
  const startTime = Date.now();

  try {
    logger.info({ question: params.question.substring(0, 100) }, 'RAG query');

    const ragRequest = RAGRequestSchema.parse({
      query: params.question,
      top_k: params.top_k || 5,
      stream: false,
      include_sources: params.include_sources ?? true,
    });

    const client = getR2RClient();
    const response = await client.ragCompletion(ragRequest);

    if (!response.success) {
      logger.error({ error: response.error }, 'RAG query failed');
      return {
        success: false,
        error: response.error?.message || 'RAG query failed',
        metadata: {
          execution_time_ms: Date.now() - startTime,
        },
      };
    }

    logger.info({ 
      answerLength: response.data?.answer.length || 0,
      sourcesCount: response.data?.sources.length || 0,
      executionTime: Date.now() - startTime 
    }, 'RAG query completed');

    return {
      success: true,
      data: response.data!,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'r2r_rag',
      },
    };
  } catch (error) {
    logger.error({ error }, 'RAG query error');
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
 * Get help with implementing a specific feature
 * Searches for relevant patterns, examples, and guidelines
 */
export async function getImplementationHelp(params: {
  feature_description: string;
  context?: {
    file_path?: string;
    existing_code?: string;
    error_message?: string;
  };
}): Promise<ToolResult<RAGResponse>> {
  const startTime = Date.now();

  try {
    logger.info({ feature: params.feature_description }, 'Getting implementation help');

    // Construct enhanced query with context
    let query = `How to implement: ${params.feature_description}`;
    
    if (params.context) {
      if (params.context.file_path) {
        query += `\nFile: ${params.context.file_path}`;
      }
      if (params.context.existing_code) {
        query += `\nExisting code:\n${params.context.existing_code.substring(0, 500)}`;
      }
      if (params.context.error_message) {
        query += `\nError: ${params.context.error_message}`;
      }
    }

    const client = getR2RClient();
    const response = await client.ragCompletion({
      query,
      top_k: 7, // More context for implementation help
      stream: false,
      include_sources: true,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Failed to get implementation help',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: response.data!,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'implementation_help',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Implementation help error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Debug an issue using RAG to find relevant troubleshooting info
 */
export async function debugWithRAG(params: {
  error_message: string;
  code_context?: string;
  file_path?: string;
}): Promise<ToolResult<RAGResponse>> {
  const startTime = Date.now();

  try {
    logger.info({ error: params.error_message.substring(0, 100) }, 'Debugging with RAG');

    const query = `
Debug this error: ${params.error_message}
${params.file_path ? `File: ${params.file_path}` : ''}
${params.code_context ? `\nCode context:\n${params.code_context.substring(0, 500)}` : ''}

Find similar issues, solutions, and relevant documentation.
    `.trim();

    const client = getR2RClient();
    const response = await client.ragCompletion({
      query,
      top_k: 5,
      stream: false,
      include_sources: true,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Debug query failed',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: response.data!,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'debug_rag',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Debug RAG error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Understand project architecture and design patterns
 */
export async function explainArchitecture(params: {
  aspect: string; // e.g., "authentication flow", "API structure", "database design"
}): Promise<ToolResult<RAGResponse>> {
  const startTime = Date.now();

  try {
    logger.info({ aspect: params.aspect }, 'Explaining architecture');

    const query = `Explain the project's ${params.aspect}. Include:
- Architecture overview
- Key components and their responsibilities
- Design patterns used
- Integration points
- Best practices to follow`;

    const client = getR2RClient();
    const response = await client.ragCompletion({
      query,
      top_k: 8, // More comprehensive context for architecture
      stream: false,
      include_sources: true,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Architecture explanation failed',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    return {
      success: true,
      data: response.data!,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'architecture_explanation',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Architecture explanation error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}
