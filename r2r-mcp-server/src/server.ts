#!/usr/bin/env node
/**
 * R2R MCP Server
 * Model Context Protocol server for R2R RAG Agent
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import logger, { createModuleLogger } from './logger.js';
import { getR2RClient } from './r2r-client-sdk.js';

// Import tools
import { searchDocumentation, searchCodeExamples, findTestExamples } from './tools/search.js';
import { 
  askDocumentation, 
  getImplementationHelp, 
  debugWithRAG, 
  explainArchitecture 
} from './tools/rag.js';
import {
  storeExperience,
  retrieveSimilarExperiences,
  reflectOnPatterns,
  getMemoryStats,
} from './tools/memory.js';
import {
  queryCodeRelationships,
  findDependencies,
  findUsages,
  findTestCoverage,
  exploreArchitectureGraph,
} from './tools/graph.js';

const serverLogger = createModuleLogger('mcp-server');

// Load environment variables
config();

/**
 * Define MCP tools
 */
const TOOLS: Tool[] = [
  // Search tools
  {
    name: 'search_documentation',
    description: 'Search project documentation using semantic/hybrid search. Find relevant information from docs, code, and comments.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (natural language or keywords)',
        },
        top_k: {
          type: 'number',
          description: 'Number of results to return (default: 5)',
          default: 5,
        },
        search_mode: {
          type: 'string',
          enum: ['vector', 'keyword', 'hybrid'],
          description: 'Search mode (default: hybrid)',
          default: 'hybrid',
        },
        file_type: {
          type: 'string',
          description: 'Filter by file type (e.g., typescript, markdown)',
        },
        project_section: {
          type: 'string',
          enum: ['docs', 'src', 'tests', 'config'],
          description: 'Filter by project section',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_code_examples',
    description: 'Find code examples matching a pattern or description',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of what code you are looking for',
        },
        language: {
          type: 'string',
          description: 'Programming language (default: typescript)',
        },
        top_k: {
          type: 'number',
          description: 'Number of examples to return (default: 5)',
          default: 5,
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'find_test_examples',
    description: 'Find test examples for a specific feature or module',
    inputSchema: {
      type: 'object',
      properties: {
        feature: {
          type: 'string',
          description: 'Feature or module to find tests for',
        },
        top_k: {
          type: 'number',
          description: 'Number of test examples (default: 3)',
          default: 3,
        },
      },
      required: ['feature'],
    },
  },

  // RAG tools
  {
    name: 'ask_documentation',
    description: 'Ask a question about the project and get an AI-generated answer based on documentation. Uses RAG to provide accurate, context-aware responses.',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Your question about the project',
        },
        top_k: {
          type: 'number',
          description: 'Number of context documents to use (default: 5)',
          default: 5,
        },
        include_sources: {
          type: 'boolean',
          description: 'Include source documents in response (default: true)',
          default: true,
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'get_implementation_help',
    description: 'Get help implementing a feature with relevant patterns, examples, and guidelines',
    inputSchema: {
      type: 'object',
      properties: {
        feature_description: {
          type: 'string',
          description: 'Description of the feature to implement',
        },
        context: {
          type: 'object',
          description: 'Additional context about the implementation',
          properties: {
            file_path: { type: 'string' },
            existing_code: { type: 'string' },
            error_message: { type: 'string' },
          },
        },
      },
      required: ['feature_description'],
    },
  },
  {
    name: 'debug_with_rag',
    description: 'Debug an issue using RAG to find similar issues and solutions',
    inputSchema: {
      type: 'object',
      properties: {
        error_message: {
          type: 'string',
          description: 'The error message or problem description',
        },
        code_context: {
          type: 'string',
          description: 'Relevant code context',
        },
        file_path: {
          type: 'string',
          description: 'File path where the issue occurs',
        },
      },
      required: ['error_message'],
    },
  },
  {
    name: 'explain_architecture',
    description: 'Understand project architecture and design patterns for a specific aspect',
    inputSchema: {
      type: 'object',
      properties: {
        aspect: {
          type: 'string',
          description: 'Architecture aspect to explain (e.g., "API structure", "authentication flow")',
        },
      },
      required: ['aspect'],
    },
  },

  // Memory tools
  {
    name: 'store_experience',
    description: 'Store a development experience for future reference and learning',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'What task was being performed' },
            file_paths: { type: 'array', items: { type: 'string' } },
            technologies: { type: 'array', items: { type: 'string' } },
            error_type: { type: 'string' },
          },
          required: ['task'],
        },
        action_taken: {
          type: 'string',
          description: 'What action was taken to solve the problem',
        },
        outcome: {
          type: 'string',
          enum: ['success', 'failure', 'partial'],
          description: 'Outcome of the action',
        },
        learned_pattern: {
          type: 'string',
          description: 'Pattern or lesson learned',
        },
        code_snippet: {
          type: 'string',
          description: 'Relevant code snippet',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence in this solution (0-1)',
        },
      },
      required: ['context', 'action_taken', 'outcome'],
    },
  },
  {
    name: 'retrieve_similar_experiences',
    description: 'Find past experiences similar to the current situation',
    inputSchema: {
      type: 'object',
      properties: {
        current_context: {
          type: 'string',
          description: 'Description of current situation or problem',
        },
        top_k: {
          type: 'number',
          description: 'Number of similar experiences to return (default: 3)',
          default: 3,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        min_confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Minimum confidence threshold',
        },
      },
      required: ['current_context'],
    },
  },
  {
    name: 'reflect_on_patterns',
    description: 'Analyze accumulated experiences to identify patterns and insights',
    inputSchema: {
      type: 'object',
      properties: {
        area: {
          type: 'string',
          description: 'Specific area to analyze (e.g., "error handling", "testing")',
        },
        time_window_days: {
          type: 'number',
          description: 'Analyze experiences from the last N days',
        },
      },
    },
  },
  {
    name: 'get_memory_stats',
    description: 'Get statistics about accumulated experiences',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Graph tools
  {
    name: 'query_code_relationships',
    description: 'Query code relationships using GraphRAG - find how modules, functions, and files are connected',
    inputSchema: {
      type: 'object',
      properties: {
        entity_name: {
          type: 'string',
          description: 'Name of entity to query (module, function, file path)',
        },
        relationship_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['imports', 'calls', 'extends', 'implements', 'tests', 'depends_on'],
          },
          description: 'Types of relationships to include',
        },
        depth: {
          type: 'number',
          description: 'Depth of graph traversal (default: 1)',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
          default: 50,
        },
      },
      required: ['entity_name'],
    },
  },
  {
    name: 'find_dependencies',
    description: 'Find what a module depends on',
    inputSchema: {
      type: 'object',
      properties: {
        module_path: {
          type: 'string',
          description: 'Path to module',
        },
        include_transitive: {
          type: 'boolean',
          description: 'Include transitive dependencies (default: false)',
          default: false,
        },
      },
      required: ['module_path'],
    },
  },
  {
    name: 'find_usages',
    description: 'Find what code uses a module',
    inputSchema: {
      type: 'object',
      properties: {
        module_path: {
          type: 'string',
          description: 'Path to module',
        },
        depth: {
          type: 'number',
          description: 'Search depth (default: 1)',
          default: 1,
        },
      },
      required: ['module_path'],
    },
  },
  {
    name: 'find_test_coverage',
    description: 'Find test coverage for a module',
    inputSchema: {
      type: 'object',
      properties: {
        module_path: {
          type: 'string',
          description: 'Path to module',
        },
      },
      required: ['module_path'],
    },
  },
  {
    name: 'explore_architecture_graph',
    description: 'Explore module architecture and connections',
    inputSchema: {
      type: 'object',
      properties: {
        root_module: {
          type: 'string',
          description: 'Root module to start exploration (default: src/)',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum depth of exploration (default: 2)',
          default: 2,
        },
      },
    },
  },
];

/**
 * Tool execution router
 */
async function executeTool(name: string, args: unknown): Promise<unknown> {
  serverLogger.info({ tool: name, args }, 'Executing tool');

  try {
    switch (name) {
      // Search tools
      case 'search_documentation':
        return await searchDocumentation(args as Parameters<typeof searchDocumentation>[0]);
      case 'search_code_examples':
        return await searchCodeExamples(args as Parameters<typeof searchCodeExamples>[0]);
      case 'find_test_examples':
        return await findTestExamples(args as Parameters<typeof findTestExamples>[0]);

      // RAG tools
      case 'ask_documentation':
        return await askDocumentation(args as Parameters<typeof askDocumentation>[0]);
      case 'get_implementation_help':
        return await getImplementationHelp(args as Parameters<typeof getImplementationHelp>[0]);
      case 'debug_with_rag':
        return await debugWithRAG(args as Parameters<typeof debugWithRAG>[0]);
      case 'explain_architecture':
        return await explainArchitecture(args as Parameters<typeof explainArchitecture>[0]);

      // Memory tools
      case 'store_experience':
        return await storeExperience(args as Parameters<typeof storeExperience>[0]);
      case 'retrieve_similar_experiences':
        return await retrieveSimilarExperiences(args as Parameters<typeof retrieveSimilarExperiences>[0]);
      case 'reflect_on_patterns':
        return await reflectOnPatterns(args as Parameters<typeof reflectOnPatterns>[0]);
      case 'get_memory_stats':
        return await getMemoryStats();

      // Graph tools
      case 'query_code_relationships':
        return await queryCodeRelationships(args as Parameters<typeof queryCodeRelationships>[0]);
      case 'find_dependencies':
        return await findDependencies(args as Parameters<typeof findDependencies>[0]);
      case 'find_usages':
        return await findUsages(args as Parameters<typeof findUsages>[0]);
      case 'find_test_coverage':
        return await findTestCoverage(args as Parameters<typeof findTestCoverage>[0]);
      case 'explore_architecture_graph':
        return await exploreArchitectureGraph(args as Parameters<typeof exploreArchitectureGraph>[0]);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    serverLogger.error({ error, tool: name }, 'Tool execution error');
    throw error;
  }
}

/**
 * Main server
 */
async function main() {
  serverLogger.info('Starting R2R MCP Server');

  // Validate environment
  if (!process.env.R2R_BASE_URL) {
    serverLogger.warn('R2R_BASE_URL not set, using default: http://localhost:7272');
  }

  // Test R2R connection
  try {
    const client = getR2RClient();
    const health = await client.healthCheck();
    if (health.success) {
      serverLogger.info({ r2rUrl: process.env.R2R_BASE_URL || 'http://localhost:7272' }, 'R2R connection successful');
    } else {
      serverLogger.error({ error: health.error }, 'R2R health check failed');
    }
  } catch (error) {
    serverLogger.error({ error }, 'Failed to connect to R2R');
  }

  // Create MCP server
  const server = new Server(
    {
      name: 'r2r-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool list request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    serverLogger.debug('Listing tools');
    return { tools: TOOLS };
  });

  // Handle tool execution request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    serverLogger.info({ tool: name }, 'Tool call request');

    try {
      const result = await executeTool(name, args);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      serverLogger.error({ error, tool: name }, 'Tool execution failed');
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  serverLogger.info('R2R MCP Server running on stdio');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    serverLogger.info('Shutting down gracefully');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    serverLogger.info('Shutting down gracefully');
    await server.close();
    process.exit(0);
  });
}

// Start server
main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
