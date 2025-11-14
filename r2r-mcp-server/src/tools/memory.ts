/**
 * MCP Tools for Experience Memory System
 * Stores and retrieves development experiences for learning
 */

import { getR2RClient } from '../r2r-client.js';
import { createModuleLogger } from '../logger.js';
import {
  StoreExperienceRequestSchema,
  RetrieveSimilarExperiencesRequestSchema,
  type ToolResult,
  type Experience,
  type StoreExperienceRequest,
} from '../types.js';

const logger = createModuleLogger('tools:memory');

/**
 * Store a development experience for future reference
 * This creates organizational memory of solutions and patterns
 */
export async function storeExperience(
  params: StoreExperienceRequest
): Promise<ToolResult<{ id: string }>> {
  const startTime = Date.now();

  try {
    logger.info({ 
      task: params.context.task,
      outcome: params.outcome 
    }, 'Storing experience');

    // Validate input
    const validatedParams = StoreExperienceRequestSchema.parse(params);

    // Generate unique ID
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create structured content for ingestion
    const content = `
## Experience: ${validatedParams.context.task}

**Timestamp:** ${new Date().toISOString()}

**Context:**
- Task: ${validatedParams.context.task}
${validatedParams.context.file_paths ? `- Files: ${validatedParams.context.file_paths.join(', ')}` : ''}
${validatedParams.context.technologies ? `- Technologies: ${validatedParams.context.technologies.join(', ')}` : ''}
${validatedParams.context.error_type ? `- Error Type: ${validatedParams.context.error_type}` : ''}

**Action Taken:**
${validatedParams.action_taken}

**Outcome:** ${validatedParams.outcome}

${validatedParams.learned_pattern ? `**Learned Pattern:**\n${validatedParams.learned_pattern}` : ''}

${validatedParams.code_snippet ? `**Code Snippet:**\n\`\`\`\n${validatedParams.code_snippet}\n\`\`\`` : ''}

${validatedParams.tags ? `**Tags:** ${validatedParams.tags.join(', ')}` : ''}
    `.trim();

    const client = getR2RClient();
    
    // Ingest as document
    const response = await client.ingestDocument({
      document_id: id,
      content,
      metadata: {
        file_path: `experiences/${id}.md`,
        file_type: 'markdown',
        last_modified: new Date().toISOString(),
        project_section: 'docs',
        // Store experience metadata for filtering
        experience_metadata: {
          ...validatedParams,
          id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (!response.success) {
      logger.error({ error: response.error }, 'Failed to store experience');
      return {
        success: false,
        error: response.error?.message || 'Failed to store experience',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    logger.info({ id, executionTime: Date.now() - startTime }, 'Experience stored');

    return {
      success: true,
      data: { id },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'experience_memory',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Store experience error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Retrieve experiences similar to current situation
 * Helps apply past learnings to new problems
 */
export async function retrieveSimilarExperiences(params: {
  current_context: string;
  top_k?: number;
  tags?: string[];
  min_confidence?: number;
}): Promise<ToolResult<Experience[]>> {
  const startTime = Date.now();

  try {
    logger.info({ 
      context: params.current_context.substring(0, 100),
      topK: params.top_k 
    }, 'Retrieving similar experiences');

    const validatedParams = RetrieveSimilarExperiencesRequestSchema.parse(params);

    const client = getR2RClient();
    
    // Search for similar experiences
    const searchResponse = await client.search({
      query: validatedParams.current_context,
      top_k: validatedParams.top_k,
      search_mode: 'hybrid',
      filters: {
        project_section: 'docs',
        file_path: { $regex: '^experiences/' },
        ...(validatedParams.tags && validatedParams.tags.length > 0 && {
          'experience_metadata.tags': { $in: validatedParams.tags },
        }),
      },
    });

    if (!searchResponse.success) {
      return {
        success: false,
        error: searchResponse.error?.message || 'Search failed',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    // Extract experiences from results
    const experiences: Experience[] = (searchResponse.data || [])
      .map(result => result.metadata.experience_metadata)
      .filter((exp): exp is Experience => {
        if (!exp) return false;
        if (validatedParams.min_confidence && exp.confidence) {
          return exp.confidence >= validatedParams.min_confidence;
        }
        return true;
      });

    logger.info({ 
      count: experiences.length,
      executionTime: Date.now() - startTime 
    }, 'Similar experiences retrieved');

    return {
      success: true,
      data: experiences,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'experience_retrieval',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Retrieve experiences error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Analyze accumulated experiences to identify patterns
 * This is a reflection mechanism for continuous learning
 */
export async function reflectOnPatterns(params: {
  area?: string; // e.g., "error handling", "API design", "testing"
  time_window_days?: number;
}): Promise<ToolResult<{ patterns: string[]; insights: string }>> {
  const startTime = Date.now();

  try {
    logger.info({ area: params.area }, 'Reflecting on patterns');

    const client = getR2RClient();

    // Query for reflection
    const query = params.area
      ? `Analyze patterns and best practices in ${params.area} based on past experiences`
      : 'Identify common patterns, anti-patterns, and learnings from development experiences';

    const ragResponse = await client.ragCompletion({
      query,
      top_k: 10, // Broader context for pattern analysis
      stream: false,
      include_sources: true,
    });

    if (!ragResponse.success || !ragResponse.data) {
      return {
        success: false,
        error: ragResponse.error?.message || 'Reflection failed',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    // Extract patterns from successful experiences
    const successfulExperiences = ragResponse.data.sources
      .map(s => s.metadata.experience_metadata)
      .filter((exp): exp is Experience => exp?.outcome === 'success');

    const patterns = Array.from(
      new Set(
        successfulExperiences
          .map(exp => exp.learned_pattern)
          .filter((p): p is string => !!p)
      )
    );

    logger.info({ 
      patternsCount: patterns.length,
      executionTime: Date.now() - startTime 
    }, 'Pattern reflection completed');

    return {
      success: true,
      data: {
        patterns,
        insights: ragResponse.data.answer,
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'pattern_reflection',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Pattern reflection error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Get statistics about accumulated experiences
 */
export async function getMemoryStats(): Promise<
  ToolResult<{
    total_experiences: number;
    successful: number;
    failed: number;
    partial: number;
    most_common_tags: string[];
  }>
> {
  const startTime = Date.now();

  try {
    logger.info('Getting memory statistics');

    const client = getR2RClient();

    // Get all experience documents
    const searchResponse = await client.search({
      query: 'experiences',
      top_k: 100, // Get many for stats
      search_mode: 'keyword',
      filters: {
        project_section: 'docs',
        file_path: { $regex: '^experiences/' },
      },
    });

    if (!searchResponse.success) {
      return {
        success: false,
        error: 'Failed to get statistics',
        metadata: { execution_time_ms: Date.now() - startTime },
      };
    }

    const experiences = (searchResponse.data || [])
      .map(r => r.metadata.experience_metadata)
      .filter((exp): exp is Experience => !!exp);

    const stats = {
      total_experiences: experiences.length,
      successful: experiences.filter(e => e.outcome === 'success').length,
      failed: experiences.filter(e => e.outcome === 'failure').length,
      partial: experiences.filter(e => e.outcome === 'partial').length,
      most_common_tags: getMostCommonTags(experiences, 10),
    };

    logger.info({ stats }, 'Memory statistics retrieved');

    return {
      success: true,
      data: stats,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        source: 'memory_stats',
      },
    };
  } catch (error) {
    logger.error({ error }, 'Memory stats error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { execution_time_ms: Date.now() - startTime },
    };
  }
}

/**
 * Helper: Get most common tags from experiences
 */
function getMostCommonTags(experiences: Experience[], limit: number): string[] {
  const tagCounts: Record<string, number> = {};

  for (const exp of experiences) {
    if (exp.tags) {
      for (const tag of exp.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}
