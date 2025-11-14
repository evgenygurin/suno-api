#!/usr/bin/env node
/**
 * R2R Agent CLI
 * Command-line interface for managing the R2R agent
 */

import { Command } from 'commander';
import { config } from 'dotenv';
import { spawn } from 'child_process';
import logger from '../logger.js';
import { getR2RClient } from '../r2r-client-sdk.js';
import { runIngestion } from '../ingestion/pipeline.js';

// Load environment
config();

const program = new Command();

program
  .name('r2r-agent')
  .description('R2R RAG Agent CLI for Suno API project')
  .version('1.0.0');

/**
 * Server command
 */
const serverCommand = program
  .command('server')
  .description('Manage MCP server');

serverCommand
  .command('start')
  .description('Start MCP server')
  .option('-d, --detach', 'Run in background')
  .action(async (options) => {
    logger.info('Starting MCP server');
    
    if (options.detach) {
      const child = spawn('npm', ['start'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      logger.info({ pid: child.pid }, 'MCP server started in background');
    } else {
      const child = spawn('npm', ['start'], {
        stdio: 'inherit',
      });
      
      child.on('exit', (code) => {
        logger.info({ exitCode: code }, 'MCP server stopped');
        process.exit(code || 0);
      });
    }
  });

serverCommand
  .command('dev')
  .description('Start MCP server in development mode')
  .action(() => {
    logger.info('Starting MCP server in dev mode');
    
    const child = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
    });
    
    child.on('exit', (code) => {
      logger.info({ exitCode: code }, 'MCP server stopped');
      process.exit(code || 0);
    });
  });

/**
 * Ingestion command
 */
program
  .command('ingest')
  .description('Ingest project documentation into R2R')
  .option('-r, --root <path>', 'Project root path', process.env.PROJECT_ROOT || '../')
  .option('-c, --chunk-size <size>', 'Chunk size', parseInt, 512)
  .option('-o, --chunk-overlap <overlap>', 'Chunk overlap', parseInt, 50)
  .option('--no-graph', 'Skip knowledge graph building')
  .action(async (options) => {
    try {
      logger.info({ options }, 'Starting ingestion');
      
      await runIngestion({
        projectRoot: options.root,
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
        buildGraph: options.graph,
      } as Parameters<typeof runIngestion>[0]);
      
      logger.info('Ingestion completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Ingestion failed');
      process.exit(1);
    }
  });

/**
 * Search command
 */
program
  .command('search <query>')
  .description('Search documentation')
  .option('-k, --top-k <number>', 'Number of results', parseInt, 5)
  .option('-m, --mode <mode>', 'Search mode (vector|keyword|hybrid)', 'hybrid')
  .action(async (query, options) => {
    try {
      logger.info({ query, options }, 'Searching');
      
      const client = getR2RClient();
      const response = await client.search({
        query,
        top_k: options.topK,
        search_mode: options.mode,
      });
      
      if (!response.success) {
        logger.error({ error: response.error }, 'Search failed');
        process.exit(1);
      }
      
      console.log('\n=== Search Results ===\n');
      response.data?.forEach((result, index) => {
        console.log(`${index + 1}. ${result.metadata.file_path} (score: ${result.score.toFixed(3)})`);
        console.log(`   ${result.content.substring(0, 200)}...\n`);
      });
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Search error');
      process.exit(1);
    }
  });

/**
 * Ask command (RAG)
 */
program
  .command('ask <question>')
  .description('Ask a question using RAG')
  .option('-k, --top-k <number>', 'Number of context documents', parseInt, 5)
  .action(async (question, options) => {
    try {
      logger.info({ question }, 'RAG query');
      
      const client = getR2RClient();
      const response = await client.ragCompletion({
        query: question,
        top_k: options.topK,
        stream: false,
        include_sources: true,
      });
      
      if (!response.success) {
        logger.error({ error: response.error }, 'RAG query failed');
        process.exit(1);
      }
      
      console.log('\n=== Answer ===\n');
      console.log(response.data?.answer);
      
      if (response.data?.sources && response.data.sources.length > 0) {
        console.log('\n=== Sources ===\n');
        response.data.sources.forEach((source, index) => {
          console.log(`${index + 1}. ${source.metadata.file_path}`);
        });
      }
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'RAG query error');
      process.exit(1);
    }
  });

/**
 * Memory commands
 */
const memoryCommand = program
  .command('memory')
  .description('Manage experience memory');

memoryCommand
  .command('store')
  .description('Store an experience')
  .requiredOption('-t, --task <task>', 'Task description')
  .requiredOption('-a, --action <action>', 'Action taken')
  .requiredOption('-o, --outcome <outcome>', 'Outcome (success|failure|partial)')
  .option('-l, --learned <pattern>', 'Learned pattern')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    try {
      const { storeExperience } = await import('../tools/memory.js');
      
      const result = await storeExperience({
        timestamp: new Date().toISOString(),
        context: {
          task: options.task,
        },
        action_taken: options.action,
        outcome: options.outcome,
        learned_pattern: options.learned,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
      });
      
      if (result.success) {
        console.log(`✓ Experience stored: ${result.data?.id}`);
        process.exit(0);
      } else {
        console.error(`✗ Failed to store experience: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error({ error }, 'Store experience error');
      process.exit(1);
    }
  });

memoryCommand
  .command('search <context>')
  .description('Search for similar experiences')
  .option('-k, --top-k <number>', 'Number of results', parseInt, 3)
  .action(async (context, options) => {
    try {
      const { retrieveSimilarExperiences } = await import('../tools/memory.js');
      
      const result = await retrieveSimilarExperiences({
        current_context: context,
        top_k: options.topK,
      });
      
      if (!result.success) {
        console.error(`✗ Search failed: ${result.error}`);
        process.exit(1);
      }
      
      console.log('\n=== Similar Experiences ===\n');
      result.data?.forEach((exp, index) => {
        console.log(`${index + 1}. ${exp.context.task}`);
        console.log(`   Outcome: ${exp.outcome}`);
        if (exp.learned_pattern) {
          console.log(`   Pattern: ${exp.learned_pattern}`);
        }
        console.log('');
      });
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Search experiences error');
      process.exit(1);
    }
  });

memoryCommand
  .command('stats')
  .description('Show memory statistics')
  .action(async () => {
    try {
      const { getMemoryStats } = await import('../tools/memory.js');
      
      const result = await getMemoryStats();
      
      if (!result.success) {
        console.error(`✗ Failed to get stats: ${result.error}`);
        process.exit(1);
      }
      
      console.log('\n=== Memory Statistics ===\n');
      console.log(`Total experiences: ${result.data?.total_experiences}`);
      console.log(`Successful: ${result.data?.successful}`);
      console.log(`Failed: ${result.data?.failed}`);
      console.log(`Partial: ${result.data?.partial}`);
      
      if (result.data?.most_common_tags && result.data.most_common_tags.length > 0) {
        console.log(`\nMost common tags: ${result.data.most_common_tags.join(', ')}`);
      }
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Memory stats error');
      process.exit(1);
    }
  });

/**
 * Graph commands
 */
const graphCommand = program
  .command('graph')
  .description('Query knowledge graph');

graphCommand
  .command('query <entity>')
  .description('Query relationships for an entity')
  .option('-d, --depth <depth>', 'Query depth', parseInt, 1)
  .option('-t, --types <types>', 'Relationship types (comma-separated)')
  .action(async (entity, options) => {
    try {
      const { queryCodeRelationships } = await import('../tools/graph.js');
      
      const result = await queryCodeRelationships({
        entity_name: entity,
        depth: options.depth,
        relationship_types: options.types ? options.types.split(',') : undefined,
      });
      
      if (!result.success) {
        console.error(`✗ Query failed: ${result.error}`);
        process.exit(1);
      }
      
      console.log('\n=== Entities ===\n');
      result.data?.entities.forEach(e => {
        console.log(`- ${e.name} (${e.type})`);
      });
      
      console.log('\n=== Relationships ===\n');
      result.data?.relationships.forEach(r => {
        console.log(`${r.source} --[${r.type}]--> ${r.target}`);
      });
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Graph query error');
      process.exit(1);
    }
  });

graphCommand
  .command('deps <module>')
  .description('Find dependencies of a module')
  .option('--transitive', 'Include transitive dependencies')
  .action(async (module, options) => {
    try {
      const { findDependencies } = await import('../tools/graph.js');
      
      const result = await findDependencies({
        module_path: module,
        include_transitive: options.transitive,
      });
      
      if (!result.success) {
        console.error(`✗ Query failed: ${result.error}`);
        process.exit(1);
      }
      
      console.log(`\n=== Dependencies of ${module} ===\n`);
      result.data?.dependencies.forEach(dep => {
        console.log(`- ${dep.name} (${dep.type})`);
      });
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Dependencies query error');
      process.exit(1);
    }
  });

/**
 * Health check
 */
program
  .command('health')
  .description('Check R2R server health')
  .action(async () => {
    try {
      const client = getR2RClient();
      const response = await client.healthCheck();
      
      if (response.success) {
        console.log('✓ R2R server is healthy');
        process.exit(0);
      } else {
        console.error('✗ R2R server is unhealthy');
        console.error(response.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('✗ Failed to connect to R2R server');
      console.error(error);
      process.exit(1);
    }
  });

// Parse and execute
program.parse();
