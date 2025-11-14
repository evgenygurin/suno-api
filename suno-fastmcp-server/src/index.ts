#!/usr/bin/env node
/**
 * Suno AI FastMCP Server
 *
 * A Model Context Protocol (MCP) server for Suno AI music generation API.
 * Provides tools for generating music, lyrics, and processing audio.
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { config } from 'dotenv';
import logger from './logger.js';
import { SunoClient, DEFAULT_MODEL } from './suno-client.js';

// Load environment variables
config();

// Validate API key
const SUNO_API_KEY = process.env.SUNO_API_KEY;
if (!SUNO_API_KEY) {
  console.error('FATAL: SUNO_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Suno client
let sunoClient: SunoClient;
try {
  sunoClient = new SunoClient(SUNO_API_KEY);
  console.error('Suno client initialized successfully');
} catch (error: any) {
  console.error('FATAL: Failed to initialize Suno client:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Create FastMCP server
const server = new FastMCP({
  name: 'suno-music-generator',
  version: '1.0.0',
});

console.error('Initializing Suno FastMCP Server');

// ============================================================================
// MUSIC GENERATION TOOLS
// ============================================================================

/**
 * Generate music from text prompt
 */
server.addTool({
  name: 'generate_music',
  description: 'Generate music from a text prompt. Returns task ID immediately or waits for completion.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Text description of the music to generate (e.g., "upbeat pop song about summer")'),
    make_instrumental: z.boolean().optional().default(false).describe('Generate instrumental-only music without vocals'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5', 'chirp-v3-5', 'chirp-v4', 'chirp-v4-5', 'chirp-v4-5-plus', 'chirp-v5']).optional().default('V3_5').describe('Model version to use for generation'),
    wait_audio: z.boolean().optional().default(false).describe('Wait for audio generation to complete (may take 2-4 minutes)'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing generate_music');

    try {
      const result = await sunoClient.generate(
        args.prompt,
        args.make_instrumental,
        args.model,
        args.wait_audio
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: args.wait_audio ? 'Music generated successfully' : 'Music generation started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in generate_music');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Generate custom music with detailed parameters
 */
server.addTool({
  name: 'generate_custom_music',
  description: 'Generate music with custom parameters including style, title, and tags. Provides more control than basic generation.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Lyrics or song description (not needed for instrumental)'),
    style: z.string().min(1).max(1000).describe('Music style/genre (e.g., "electronic, synthwave, 80s" or "acoustic pop, female vocals")'),
    title: z.string().min(1).max(80).describe('Song title'),
    make_instrumental: z.boolean().optional().default(false).describe('Generate instrumental-only music'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().default('V3_5').describe('Model version'),
    wait_audio: z.boolean().optional().default(false).describe('Wait for completion'),
    negative_tags: z.string().optional().describe('Styles to avoid (e.g., "jazz, classical")'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing generate_custom_music');

    try {
      const result = await sunoClient.customGenerate(
        args.prompt,
        args.style,
        args.title,
        args.make_instrumental,
        args.model,
        args.wait_audio,
        args.negative_tags
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: args.wait_audio ? 'Custom music generated successfully' : 'Custom music generation started.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in generate_custom_music');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

// ============================================================================
// INFORMATION & STATUS TOOLS
// ============================================================================

/**
 * Get audio information and status
 */
server.addTool({
  name: 'get_audio_info',
  description: 'Get information and status for one or more audio generation tasks. Use task IDs returned from generation.',
  parameters: z.object({
    task_ids: z.array(z.string()).min(1).describe('Array of task IDs to check (from generate_music or generate_custom_music)'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing get_audio_info');

    try {
      const result = await sunoClient.getAudioInfo(args.task_ids);

      return JSON.stringify({
        success: true,
        data: result,
        message: `Retrieved information for ${result.length} task(s)`,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in get_audio_info');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Get remaining API credits
 */
server.addTool({
  name: 'get_credits',
  description: 'Check remaining API credits/quota for the current API key.',
  parameters: z.object({}),
  execute: async () => {
    logger.info('Executing get_credits');

    try {
      const result = await sunoClient.getCredits();

      return JSON.stringify({
        success: true,
        data: result,
        message: `You have ${result.credits_left} credits remaining`,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in get_credits');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

// ============================================================================
// LYRICS TOOLS
// ============================================================================

/**
 * Generate lyrics from prompt
 */
server.addTool({
  name: 'generate_lyrics',
  description: 'Generate song lyrics from a text prompt. Useful for creating lyrics before generating music.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Description of the lyrics theme or topic (e.g., "a love song about the ocean")'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing generate_lyrics');

    try {
      const result = await sunoClient.generateLyrics(args.prompt);

      return JSON.stringify({
        success: true,
        data: { lyrics: result },
        message: 'Lyrics generated successfully',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in generate_lyrics');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Get timestamped lyrics
 */
server.addTool({
  name: 'get_timestamped_lyrics',
  description: 'Get lyrics with timestamps for a generated song. Useful for karaoke or subtitle generation.',
  parameters: z.object({
    song_id: z.string().describe('Song/task ID from a completed generation'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing get_timestamped_lyrics');

    try {
      const result = await sunoClient.getTimestampedLyrics(args.song_id);

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Retrieved timestamped lyrics',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in get_timestamped_lyrics');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

// ============================================================================
// AUDIO PROCESSING TOOLS
// ============================================================================

/**
 * Generate stems (vocal separation)
 */
server.addTool({
  name: 'generate_stems',
  description: 'Separate vocals and instruments from a song. Creates isolated vocal and instrumental tracks.',
  parameters: z.object({
    song_id: z.string().describe('Song/task ID from a completed generation'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing generate_stems');

    try {
      const result = await sunoClient.generateStems(args.song_id);

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Stem separation started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in generate_stems');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

// ============================================================================
// UTILITY TOOLS
// ============================================================================

/**
 * List available models
 */
server.addTool({
  name: 'list_models',
  description: 'Get information about available Suno AI music generation models and their capabilities.',
  parameters: z.object({}),
  execute: async () => {
    logger.info('Executing list_models');

    const models = [
      {
        id: 'V3_5',
        name: 'Chirp v3.5',
        max_duration: '4 minutes',
        description: 'Balanced model with creative diversity',
      },
      {
        id: 'V4',
        name: 'Chirp v4',
        max_duration: '4 minutes',
        description: 'Best audio quality with refined structure',
      },
      {
        id: 'V4_5',
        name: 'Chirp v4.5',
        max_duration: '8 minutes',
        description: 'Advanced features with superior audio blending',
      },
      {
        id: 'V4_5PLUS',
        name: 'Chirp v4.5 Plus',
        max_duration: '8 minutes',
        description: 'Richer sound with new creative capabilities',
      },
      {
        id: 'V5',
        name: 'Chirp v5',
        max_duration: '8 minutes',
        description: 'Superior musicality with faster generation',
      },
    ];

    return JSON.stringify({
      success: true,
      data: { models, default: DEFAULT_MODEL },
      message: `${models.length} models available`,
    });
  },
});

/**
 * Get API status
 */
server.addTool({
  name: 'get_api_status',
  description: 'Check if the Suno API is accessible and get current configuration.',
  parameters: z.object({}),
  execute: async () => {
    logger.info('Executing get_api_status');

    try {
      // Try to get credits as a health check
      const credits = await sunoClient.getCredits();

      return JSON.stringify({
        success: true,
        data: {
          status: 'operational',
          api_key_valid: true,
          credits_remaining: credits.credits_left,
          base_url: 'https://api.sunoapi.org/api/v1',
        },
        message: 'API is operational',
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        data: {
          status: 'error',
          api_key_valid: false,
        },
        error: error.message,
      });
    }
  },
});

// ============================================================================
// START SERVER
// ============================================================================

console.error('Starting Suno FastMCP Server...');

server.start({
  transportType: 'stdio',
}).then(() => {
  console.error('Suno FastMCP Server is running on stdio');
}).catch((error: any) => {
  console.error('FATAL: Failed to start server');
  console.error('Error message:', error?.message || 'Unknown error');
  console.error('Error stack:', error?.stack || 'No stack trace');
  console.error('Full error:', JSON.stringify(error, null, 2));
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  console.error('FATAL: Uncaught exception');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('FATAL: Unhandled promise rejection');
  console.error('Reason:', reason);
  process.exit(1);
});
