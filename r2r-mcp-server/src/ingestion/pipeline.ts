#!/usr/bin/env node
/**
 * Document Ingestion Pipeline
 * Scans project and ingests documentation into R2R
 */

import { config } from 'dotenv';
import { readFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { createModuleLogger } from '../logger.js';
import { getR2RClient } from '../r2r-client-sdk.js';

// Load environment variables
config();
import { chunkDocument } from './chunking.js';
import { buildKnowledgeGraph } from './graph-builder.js';
import type { DocumentMetadata, IngestionRequest } from '../types.js';

const logger = createModuleLogger('ingestion');

interface IngestionConfig {
  projectRoot: string;
  patterns: {
    include: string[];
    exclude: string[];
  };
  chunkSize: number;
  chunkOverlap: number;
  buildGraph: boolean;
}

const DEFAULT_CONFIG: IngestionConfig = {
  projectRoot: process.env.PROJECT_ROOT || '../',
  patterns: {
    include: [
      '**/*.md',
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      'src/**/*',
      'tests/**/*',
      'CLAUDE.md',
      'README.md',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.map',
      '**/r2r-mcp-server/**', // Don't ingest ourselves!
    ],
  },
  chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '512'),
  chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50'),
  buildGraph: true,
};

/**
 * Determine file type from extension
 */
function getFileType(filePath: string): DocumentMetadata['file_type'] {
  const ext = extname(filePath).toLowerCase();
  
  const typeMap: Record<string, DocumentMetadata['file_type']> = {
    '.md': 'markdown',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
  };

  return typeMap[ext] || 'text';
}

/**
 * Determine project section from file path
 */
function getProjectSection(filePath: string): DocumentMetadata['project_section'] {
  if (filePath.startsWith('src/')) return 'src';
  if (filePath.startsWith('tests/') || filePath.includes('test')) return 'tests';
  if (filePath.match(/\.(json|yaml|yml|toml|env)$/)) return 'config';
  return 'docs';
}

/**
 * Extract metadata from file
 */
function extractMetadata(
  filePath: string,
  content: string,
  stats: ReturnType<typeof statSync> | undefined
): DocumentMetadata {
  const fileType = getFileType(filePath);

  let metadata: DocumentMetadata = {
    file_path: filePath,
    file_type: fileType,
    last_modified: stats?.mtime.toISOString() || new Date().toISOString(),
    project_section: getProjectSection(filePath),
  };

  // Extract frontmatter from markdown
  if (fileType === 'markdown') {
    try {
      const parsed = matter(content);
      if (parsed.data) {
        metadata = {
          ...metadata,
          ...parsed.data,
        };
      }
    } catch (error) {
      logger.debug({ filePath, error }, 'Failed to parse frontmatter');
    }
  }

  // Extract imports and exports for code files
  if (fileType === 'typescript' || fileType === 'javascript') {
    const imports = extractImports(content);
    const exports = extractExports(content);
    
    if (imports.length > 0) {
      metadata.dependencies = imports;
    }
    
    if (exports.length > 0) {
      metadata.exports = exports;
    }

    // Detect language features
    if (content.includes('async ') || content.includes('await ')) {
      metadata.language = 'async';
    }
  }

  return metadata;
}

/**
 * Extract import statements from code
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  
  // ES6 imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Require statements
  const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
  
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return Array.from(new Set(imports));
}

/**
 * Extract export statements from code
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  // Named exports
  const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Default exports
  if (content.includes('export default')) {
    exports.push('default');
  }

  return exports;
}

/**
 * Scan project files
 */
async function scanProjectFiles(config: IngestionConfig): Promise<string[]> {
  logger.info({ projectRoot: config.projectRoot }, 'Scanning project files');

  const files: string[] = [];

  for (const pattern of config.patterns.include) {
    const matches = await glob(pattern, {
      cwd: config.projectRoot,
      ignore: config.patterns.exclude,
      absolute: false,
      nodir: true,
    });
    
    files.push(...matches);
  }

  const uniqueFiles = Array.from(new Set(files));
  
  logger.info({ count: uniqueFiles.length }, 'Files found');

  return uniqueFiles;
}

/**
 * Binary file extensions that should be skipped
 */
const BINARY_EXTENSIONS = new Set([
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
  '.exe', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot', '.otf'
]);

/**
 * Process single file for ingestion
 */
async function processFile(
  filePath: string,
  config: IngestionConfig
): Promise<IngestionRequest[]> {
  const absolutePath = join(config.projectRoot, filePath);
  const ext = extname(filePath).toLowerCase();

  // Skip binary files
  if (BINARY_EXTENSIONS.has(ext)) {
    logger.debug({ filePath, extension: ext }, 'Skipping binary file');
    return [];
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const stats = statSync(absolutePath);
    
    // Extract metadata
    const metadata = extractMetadata(filePath, content, stats);
    
    // Chunk document
    const chunks = chunkDocument(content, {
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      fileType: metadata.file_type,
    });

    // Create ingestion requests for each chunk
    const requests: IngestionRequest[] = chunks.map((chunk, index) => ({
      document_id: `${filePath}#chunk${index}`,
      content: chunk,
      metadata: {
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length,
      } as DocumentMetadata,
      chunk_size: config.chunkSize,
      chunk_overlap: config.chunkOverlap,
    }));

    logger.debug({ 
      filePath, 
      chunks: chunks.length 
    }, 'File processed');

    return requests;
  } catch (error) {
    logger.error({ filePath, error }, 'Failed to process file');
    return [];
  }
}

/**
 * Ingest documents into R2R using SDK
 */
async function ingestDocuments(requests: IngestionRequest[]): Promise<void> {
  logger.info({ count: requests.length }, 'Ingesting documents');

  const client = getR2RClient();

  // Group chunks by file path (remove chunk suffix)
  const fileGroups = new Map<string, IngestionRequest[]>();
  for (const req of requests) {
    const filePath = req.document_id.split('#')[0];
    if (!fileGroups.has(filePath)) {
      fileGroups.set(filePath, []);
    }
    fileGroups.get(filePath)!.push(req);
  }

  let ingested = 0;
  let failed = 0;

  // Ingest each file with its chunks
  for (const [filePath, chunks] of fileGroups) {
    try {
      // Sort chunks by index to maintain order
      const sortedChunks = chunks.sort((a, b) =>
        (a.metadata.chunk_index || 0) - (b.metadata.chunk_index || 0)
      );

      // Use SDK's documents.create with pre-chunked content
      // Suno collection UUID: 77b761f2-5676-40a6-beb2-fc58ac32c4af
      await client.documents.create({
        chunks: sortedChunks.map(c => c.content),
        metadata: {
          ...sortedChunks[0].metadata,
          total_chunks: sortedChunks.length,
          file_path: filePath,
        },
        collectionIds: ['77b761f2-5676-40a6-beb2-fc58ac32c4af'],  // Suno collection UUID
      });

      ingested += chunks.length;
      logger.info({
        file: filePath,
        chunks: chunks.length,
        progress: `${ingested}/${requests.length}`,
        percentage: Math.round((ingested / requests.length) * 100)
      }, 'File ingested');
    } catch (error) {
      failed += chunks.length;
      logger.error({
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        file: filePath
      }, 'File ingestion failed');
    }
  }

  logger.info({
    total: requests.length,
    ingested,
    failed,
    files: fileGroups.size
  }, 'Ingestion completed');
}

/**
 * Main ingestion pipeline
 */
export async function runIngestion(config: Partial<IngestionConfig> = {}): Promise<void> {
  const fullConfig: IngestionConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  logger.info({ config: fullConfig }, 'Starting ingestion pipeline');

  const startTime = Date.now();

  try {
    // Step 1: Scan files
    const files = await scanProjectFiles(fullConfig);

    if (files.length === 0) {
      logger.warn('No files found to ingest');
      return;
    }

    // Step 2: Process files
    logger.info('Processing files');
    const allRequests: IngestionRequest[] = [];

    for (const file of files) {
      const requests = await processFile(file, fullConfig);
      allRequests.push(...requests);
    }

    logger.info({ 
      files: files.length,
      chunks: allRequests.length 
    }, 'Files processed');

    // Step 3: Ingest into R2R
    await ingestDocuments(allRequests);

    // Step 4: Build knowledge graph (if enabled)
    if (fullConfig.buildGraph) {
      logger.info('Building knowledge graph');
      await buildKnowledgeGraph(allRequests);
    }

    const duration = Date.now() - startTime;
    logger.info({ 
      duration: `${(duration / 1000).toFixed(2)}s`,
      files: files.length,
      chunks: allRequests.length 
    }, 'Ingestion pipeline completed');
  } catch (error) {
    logger.error({ error }, 'Ingestion pipeline failed');
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngestion().catch((error) => {
    logger.error({ error }, 'Ingestion failed');
    process.exit(1);
  });
}
