/**
 * Intelligent document chunking
 * Context-aware chunking for different file types
 */

import { createModuleLogger } from '../logger.js';
import type { DocumentMetadata } from '../types.js';

const logger = createModuleLogger('chunking');

interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  fileType: DocumentMetadata['file_type'];
}

/**
 * Chunk document with overlap and context preservation
 */
export function chunkDocument(content: string, options: ChunkingOptions): string[] {
  const { chunkSize, chunkOverlap, fileType } = options;

  // Use specialized chunking for code
  if (fileType === 'typescript' || fileType === 'javascript') {
    return chunkCode(content, chunkSize, chunkOverlap);
  }

  // Use specialized chunking for markdown
  if (fileType === 'markdown') {
    return chunkMarkdown(content, chunkSize, chunkOverlap);
  }

  // Default: simple sliding window chunking
  return slidingWindowChunk(content, chunkSize, chunkOverlap);
}

/**
 * Chunk code files respecting function/class boundaries
 */
function chunkCode(content: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = [];
  const lines = content.split('\n');

  let currentChunk: string[] = [];
  let currentSize = 0;
  let inBlock = false;
  let blockType: 'function' | 'class' | 'interface' | null = null;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect block start
    if (!inBlock) {
      if (
        trimmed.startsWith('function ') ||
        trimmed.startsWith('async function ') ||
        trimmed.startsWith('export function ') ||
        trimmed.startsWith('export async function ')
      ) {
        blockType = 'function';
        inBlock = true;
        braceCount = 0;
      } else if (
        trimmed.startsWith('class ') ||
        trimmed.startsWith('export class ')
      ) {
        blockType = 'class';
        inBlock = true;
        braceCount = 0;
      } else if (
        trimmed.startsWith('interface ') ||
        trimmed.startsWith('export interface ') ||
        trimmed.startsWith('type ') ||
        trimmed.startsWith('export type ')
      ) {
        blockType = 'interface';
        inBlock = true;
        braceCount = 0;
      }
    }

    // Count braces
    if (inBlock) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount === 0 && line.includes('}')) {
        inBlock = false;
        blockType = null;
      }
    }

    currentChunk.push(line);
    currentSize += line.length + 1; // +1 for newline

    // Create chunk at block boundaries or size limit
    if (
      (!inBlock && currentSize >= chunkSize) ||
      currentSize >= chunkSize * 2 // Hard limit
    ) {
      const chunkText = currentChunk.join('\n');
      if (chunkText.trim()) {
        chunks.push(chunkText);
      }

      // Overlap: keep last few lines
      const overlapLines = Math.floor(chunkOverlap / 50); // Approximate lines for overlap
      currentChunk = currentChunk.slice(-overlapLines);
      currentSize = currentChunk.reduce((sum, l) => sum + l.length + 1, 0);
    }
  }

  // Add remaining content
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join('\n');
    if (chunkText.trim()) {
      chunks.push(chunkText);
    }
  }

  logger.debug({ chunks: chunks.length }, 'Code chunked');
  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Chunk markdown files respecting heading hierarchy
 */
function chunkMarkdown(content: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = [];
  const lines = content.split('\n');

  let currentChunk: string[] = [];
  let currentSize = 0;
  let currentHeading = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect heading
    if (trimmed.startsWith('#')) {
      // If we have accumulated content, save it
      if (currentSize >= chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
        
        // Overlap: keep heading and a few lines
        const overlapLines = Math.min(5, Math.floor(currentChunk.length / 2));
        currentChunk = [currentHeading, ...currentChunk.slice(-overlapLines)];
        currentSize = currentChunk.reduce((sum, l) => sum + l.length + 1, 0);
      }

      currentHeading = line;
    }

    currentChunk.push(line);
    currentSize += line.length + 1;

    // Hard size limit
    if (currentSize >= chunkSize * 2) {
      chunks.push(currentChunk.join('\n'));
      
      const overlapLines = Math.floor(chunkOverlap / 50);
      currentChunk = [currentHeading, ...currentChunk.slice(-overlapLines)];
      currentSize = currentChunk.reduce((sum, l) => sum + l.length + 1, 0);
    }
  }

  // Add remaining content
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join('\n');
    if (chunkText.trim()) {
      chunks.push(chunkText);
    }
  }

  logger.debug({ chunks: chunks.length }, 'Markdown chunked');
  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Simple sliding window chunking
 */
function slidingWindowChunk(content: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < content.length; i += chunkSize - chunkOverlap) {
    const chunk = content.slice(i, i + chunkSize);
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }

  logger.debug({ chunks: chunks.length }, 'Sliding window chunked');
  return chunks;
}
