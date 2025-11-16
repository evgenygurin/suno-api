#!/usr/bin/env node
/**
 * Fast MCP Server for Suno API
 * A lightweight MCP server focused on low-latency, cache-friendly prompts
 * This server exposes a minimal toolset suitable for rapid RAG cycles
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { createModuleLogger } from './logger.js';
import { config } from 'dotenv';

// Lightweight in-memory cache
class SimpleCache<T> {
  private map = new Map<string, T>();
  get(key: string): T | undefined { return this.map.get(key); }
  set(key: string, value: T) { this.map.set(key, value); }
  clear() { this.map.clear(); }
}

const logger = createModuleLogger('fastmcp');
config();

// Simple, fast tools tailored for Suno API quick-runs
const TOOLS: Tool[] = [
  {
    name: 'fast_suno_docs_summary',
    description: 'Return a concise Suno API docs summary (static for speed).',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Optional topic keyword' }
      },
      required: [],
    },
  },
  {
    name: 'fast_echo',
    description: 'Echo back a prompt for testing latency',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text to echo' }
      },
      required: ['prompt'],
    },
  },
];

// Simple cache to avoid repeating docs summary calculations
const cache = new SimpleCache<string>();

// Minimal server
async function main() {
  // Use stdio transport for demonstration; can switch to HTTP in production if needed
  const transport = new StdioServerTransport();
  const server = new Server({ name: 'fastmcp-suno', transport });

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info('Listing fast tools');
    // Return only the names of available fast tools
    const toolNames = TOOLS.map((t) => t.name);
    return { tools: toolNames };
  });

  // Call tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, input } = request as any;
    logger.debug({ name, input }, 'Fast MCP tool call');
    // Basic guards
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) {
      return { error: 'unknown_tool', message: `Tool ${name} not found`, status: 404 };
    }

    // Very small, deterministic behavior for known tools
    if (name === 'fast_echo') {
      const prompt = (input?.prompt ?? '').toString();
      return { response: prompt };
    }

    if (name === 'fast_suno_docs_summary') {
      const topic = (input?.topic ?? 'general').toString();
      const key = `docs:${topic}`;
      const cached = cache.get(key);
      if (cached) {
        return { response: cached, cached: true };
      }
      // Lightweight, static summary (to avoid I/O in fast path)
      const summary = `SunO API docs summary for ${topic}: lightweight API surface including /api/generate, /api/get_limit, and authentication notes.`;
      cache.set(key, summary);
      return { response: summary };
    }

    // Fallback
    return { response: 'ok' };
  });

  await server.start();
  logger.info('Fast MCP server is running (stdio transport)');
}

main().catch((e) => {
  logger.error({ error: e }, 'Fast MCP server failed to start');
  process.exit(1);
});

