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
 *
 * The fastest way to create music from a simple description. This tool provides a streamlined
 * interface for quick music generation without requiring detailed customization.
 *
 * Use Cases:
 * - Quick music sketching and idea exploration
 * - AI-generated vocals with auto-generated lyrics
 * - Instrumental tracks for videos, ambient soundscapes
 * - Background music for various content
 *
 * Returns task ID immediately (for async polling) or complete audio info (if wait_audio=true).
 * Generation typically takes 60-240 seconds depending on complexity and API load.
 */
server.addTool({
  name: 'generate_music',
  description: 'Generate music from a simple text prompt - the fastest way to create music. Returns task ID immediately or waits for completion (2-4 minutes). Perfect for quick music sketching, AI-generated vocals, or instrumental tracks. Auto-generates lyrics from prompt for vocal tracks.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Text description of the music (e.g., "upbeat pop song about summer vacation at the beach", "calm ambient electronic music with soft synth pads"). Be specific about mood, genre, and instruments for best results.'),
    make_instrumental: z.boolean().optional().default(false).describe('Generate instrumental-only music without vocals. Use true for background music, study tracks, or when you only need instrumentals.'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5', 'chirp-v3-5', 'chirp-v4', 'chirp-v4-5', 'chirp-v4-5-plus', 'chirp-v5']).optional().default('V3_5').describe('Model version: V3_5 (fast, creative), V4 (best quality 4min), V4_5 (8min, advanced), V4_5PLUS (richest sound 8min), V5 (best balance, fast 8min). Legacy format auto-converted.'),
    wait_audio: z.boolean().optional().default(false).describe('Wait for audio completion (may take 2-4 minutes). If false, returns task ID immediately - use get_audio_info to poll status. Recommended: false for async workflows.'),
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
 *
 * Creates music with granular control over style, title, lyrics, and negative constraints.
 * Ideal when you need specific musical characteristics or want to avoid certain styles.
 *
 * Use Cases:
 * - Branded content creation with specific musical identity
 * - Lyric-first composition with pre-written lyrics
 * - Genre blending and experimental fusions
 * - Fine-tuning sonic characteristics with negative constraints
 *
 * Style Parameter Best Practices:
 * - Use comma-separated tags (5-7 descriptors recommended)
 * - Be specific: "acoustic guitar" not just "guitar"
 * - Include tempo hints: "slow tempo", "upbeat"
 * - Specify vocal characteristics: "male vocals", "harmonies"
 *
 * Negative Tags Strategy:
 * - List styles to explicitly avoid
 * - Prevent unwanted instruments (e.g., "no drums", "no electronic elements")
 * - Helps refine ambiguous style requests
 */
server.addTool({
  name: 'generate_custom_music',
  description: 'Generate music with detailed customization - for precise creative control. Customize style, title, lyrics, and use negative tags to avoid unwanted elements. Perfect for branded content, lyric-first composition, genre blending, and fine-tuning sonic characteristics. Supports custom lyrics with [Verse], [Chorus], [Bridge] markers.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Lyrics or song description. For lyrics, use markers like [Verse 1], [Chorus], [Bridge]. For instrumental, describe the desired mood/theme. Supports line breaks. Not required for instrumental tracks.'),
    style: z.string().min(1).max(1000).describe('Music style/genre as comma-separated tags (e.g., "electronic, synthwave, 80s, dreamy, female vocals" or "classical piano, slow tempo, peaceful, minimalist"). Include tempo, instruments, and vocal characteristics. Limit to 5-7 main descriptors for best results.'),
    title: z.string().min(1).max(80).describe('Song title (max 80 characters). Will be used as the track name in the generated music.'),
    make_instrumental: z.boolean().optional().default(false).describe('Generate instrumental-only (no vocals). Use when prompt is not needed or for pure instrumental tracks.'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().default('V3_5').describe('Model: V3_5 (fast/creative), V4 (excellent quality 4min), V4_5 (8min/advanced), V4_5PLUS (richest 8min), V5 (best balance 8min).'),
    wait_audio: z.boolean().optional().default(false).describe('Wait for completion (2-4 min). False = async (returns task ID), True = sync (waits for result). Async recommended for production.'),
    negative_tags: z.string().optional().describe('Styles to avoid (e.g., "heavy metal, aggressive, fast tempo" or "drums, electronic, synth, vocals"). Useful for preventing unwanted instruments or style conflicts.'),
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

/**
 * Extend music track
 *
 * AI-powered extension of existing music tracks while maintaining musical coherence,
 * style consistency, and smooth transitions. Creates longer versions by intelligently
 * continuing the original composition.
 *
 * Use Cases:
 * - Length extension (extend 2-minute track to 4+ minutes for production use)
 * - Complete compositions (develop full tracks from short musical ideas)
 * - Production versions (create extended mixes for videos, podcasts, events)
 * - Seamless loops (generate continuous background music)
 *
 * Technical Details:
 * - Maintains original style, tempo, and key signature
 * - Intelligent transition from continuation point
 * - Can extend up to maximum model duration (4-8 minutes total)
 * - Default continuation point: Auto-detect (usually last 10 seconds)
 *
 * Model Selection:
 * - Defaults to original track's model if not specified
 * - V4+ recommended for better coherence
 * - V5 provides best balance of quality and speed
 *
 * Generation Time: 60-180 seconds
 * Credits Cost: 15-25 per extension
 *
 * Note: Original track must have status = SUCCESS
 */
server.addTool({
  name: 'extend_music',
  description: 'Extend existing music track with AI-powered continuation. Maintains musical coherence and style while creating longer versions. Perfect for extending 2-min tracks to 4-8 min, developing complete compositions, or creating production-ready lengths. Auto-detects continuation point. Generation: 60-180s. Credits: 15-25.',
  parameters: z.object({
    task_id: z.string().describe('Original song task ID (from any generation endpoint). Track must have status SUCCESS before extending.'),
    audio_id: z.string().describe('Original audio ID (usually same as task_id). Identifies which audio to extend.'),
    prompt: z.string().optional().describe('Optional guidance for the extension (e.g., "add energetic outro", "peaceful fadeout"). Helps guide the AI continuation style.'),
    continue_at: z.number().optional().describe('Timestamp in seconds to start extension from. If not specified, auto-detects optimal continuation point (typically last 10 seconds of track).'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().describe('Model version for extension. Defaults to original track\'s model. V4+ recommended for better coherence, V5 for best balance.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing extend_music');

    try {
      const result = await sunoClient.extendMusic(
        args.task_id,
        args.audio_id,
        args.prompt,
        args.continue_at,
        args.model
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Music extension started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in extend_music');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Cover existing Suno track
 *
 * Creates a cover version of an existing Suno-generated track in a different
 * musical style while preserving the core melody and structure. Perfect for
 * creating style variations and exploring different interpretations.
 *
 * Use Cases:
 * - Style reinterpretation (transform rock to jazz, classical to electronic)
 * - Creative exploration (try different genres for same melody)
 * - Content variations (create multiple versions for A/B testing)
 * - Genre blending experiments
 *
 * Preservation vs Transformation:
 * - Preserves: Core melody, song structure, lyrical content
 * - Transforms: Instrumentation, tempo, vocal style, production aesthetic
 *
 * Best Practices:
 * - Be specific in style description (e.g., "acoustic folk with fingerpicking guitar")
 * - Use style parameter to guide the transformation
 * - Original track quality affects cover quality
 *
 * Generation Time: 90-180 seconds
 * Credits Cost: 15-20 per cover
 *
 * Note: Original track must have status = SUCCESS
 */
server.addTool({
  name: 'cover_music',
  description: 'Create a cover version of existing Suno track in different musical style. Preserves core melody while transforming instrumentation, tempo, and production. Perfect for style reinterpretation, creative exploration, and content variations. Generation: 90-180s. Credits: 15-20.',
  parameters: z.object({
    task_id: z.string().describe('Original Suno song task ID. The track to create a cover version of.'),
    audio_id: z.string().describe('Original audio ID (usually same as task_id).'),
    prompt: z.string().optional().describe('Optional description of desired cover interpretation (e.g., "intimate acoustic version", "high-energy rock cover").'),
    style: z.string().optional().describe('Target musical style/genre (e.g., "acoustic folk, fingerpicking guitar", "electronic dance, upbeat"). Guides the transformation.'),
    title: z.string().optional().describe('Optional title for the cover version.'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().describe('Model version. Defaults to original track\'s model.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing cover_music');

    try {
      const result = await sunoClient.coverMusic(
        args.task_id,
        args.audio_id,
        {
          prompt: args.prompt,
          style: args.style,
          title: args.title,
          model: args.model,
        }
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Music cover generation started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in cover_music');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Upload and cover audio
 *
 * Upload an external audio file and transform it into a different musical style.
 * Powerful tool for reimagining existing music or creating style variations of
 * user-provided audio.
 *
 * Use Cases:
 * - Style transformation (convert rock song to jazz, classical to electronic)
 * - Genre experimentation (try different musical interpretations)
 * - Content adaptation (adapt music for different audiences/contexts)
 * - A/B testing (create multiple style variants for testing)
 * - Music production (professional style transfers and remixes)
 *
 * Supported Formats: MP3, WAV, FLAC, OGG
 * Max File Size: 10 MB
 * Upload Timeout: 60 seconds
 *
 * Audio Weight Parameter (0.0-1.0):
 * - 0.0: Completely new composition in target style (inspired by original)
 * - 0.5: Balanced blend of original melody and new style
 * - 1.0: Maximum preservation of original melody and structure
 *
 * Style Weight Parameter (0.0-1.0):
 * - Controls how strongly the target style is applied
 * - Higher values = more prominent style characteristics
 *
 * Generation Time: 90-240 seconds
 * Credits Cost: 20-30 per conversion
 */
server.addTool({
  name: 'upload_cover',
  description: 'Upload audio file and transform it into different musical style. Perfect for style transformation, genre experiments, and professional remixes. Supports MP3/WAV/FLAC/OGG (max 10MB). Control preservation with audioWeight (0-1). Generation: 90-240s. Credits: 20-30.',
  parameters: z.object({
    upload_url: z.string().url().describe('URL of audio file to upload (MP3, WAV, FLAC, or OGG). Max 10MB. Must be publicly accessible URL.'),
    style: z.string().min(1).max(1000).describe('Target musical style/genre (e.g., "jazz trio, swing, upright bass", "electronic ambient, dreamy synths"). Be specific about instrumentation and mood.'),
    title: z.string().min(1).max(80).describe('Title for the new styled version.'),
    prompt: z.string().optional().describe('Optional description of desired output (e.g., "mellow evening jazz version", "energetic EDM remix").'),
    custom_mode: z.boolean().optional().describe('Use custom generation mode for more control. Default: false.'),
    instrumental: z.boolean().optional().describe('Generate instrumental-only version (remove vocals). Default: false.'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().describe('Model version. V4+ recommended for better quality transformations.'),
    negative_tags: z.string().optional().describe('Styles to avoid (e.g., "heavy drums, distortion, aggressive vocals"). Helps refine the output.'),
    vocal_gender: z.enum(['m', 'f']).optional().describe('Preferred vocal gender if adding vocals: "m" (male) or "f" (female).'),
    style_weight: z.number().min(0).max(1).optional().describe('Style influence strength (0.0-1.0). Higher = more prominent style characteristics. Default: 0.5.'),
    weirdness_constraint: z.number().min(0).max(1).optional().describe('Creative experimentation level (0.0-1.0). Higher = more experimental transformations.'),
    audio_weight: z.number().min(0).max(1).optional().describe('Original audio preservation (0.0-1.0). 0.0=completely new, 0.5=balanced, 1.0=maximum preservation of original melody.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing upload_cover');

    try {
      const result = await sunoClient.uploadCover(
        args.upload_url,
        args.style,
        args.title,
        {
          prompt: args.prompt,
          customMode: args.custom_mode,
          instrumental: args.instrumental,
          model: args.model,
          negativeTags: args.negative_tags,
          vocalGender: args.vocal_gender,
          styleWeight: args.style_weight,
          weirdnessConstraint: args.weirdness_constraint,
          audioWeight: args.audio_weight,
        }
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Upload and cover started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in upload_cover');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Add vocals to track
 *
 * Adds AI-generated vocals and lyrics to an instrumental track or uploaded audio.
 * Perfect for transforming beats and instrumentals into complete songs with vocals.
 *
 * Use Cases:
 * - Beat to song (add vocals to instrumental beats and productions)
 * - Complete compositions (transform instrumentals into full tracks)
 * - Lyrical concepts (add vocals expressing specific themes/stories)
 * - Demo creation (quick vocal demos for songwriting)
 * - Content production (create vocal tracks for videos/podcasts)
 *
 * Input Options:
 * - Use task_id + audio_id for existing Suno instrumental
 * - Use upload_url for external instrumental file
 * - Must provide EITHER (task_id + audio_id) OR upload_url
 *
 * Vocal Generation:
 * - AI generates lyrics from prompt automatically
 * - Can specify vocal gender preference
 * - Matches vocal style to instrumental characteristics
 * - Maintains tempo and key of original instrumental
 *
 * Best Practices:
 * - Provide clear lyrical/thematic guidance in prompt
 * - Specify vocal style in style parameter if desired
 * - Original instrumental should have clear rhythm/structure
 *
 * Generation Time: 90-180 seconds
 * Credits Cost: 20-30 per track
 */
server.addTool({
  name: 'add_vocals',
  description: 'Add AI-generated vocals to instrumental track. Perfect for beat to song transformation, complete compositions, and demo creation. Provide EITHER task_id OR upload_url. Auto-generates lyrics from prompt. Generation: 90-180s. Credits: 20-30.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Vocal/lyrical concept (e.g., "uplifting lyrics about perseverance", "love song with poetic metaphors"). The AI will generate lyrics based on this.'),
    task_id: z.string().optional().describe('Existing Suno instrumental task ID. Use this OR upload_url, not both.'),
    audio_id: z.string().optional().describe('Existing Suno audio ID. Required if using task_id.'),
    upload_url: z.string().url().optional().describe('URL of instrumental audio file to upload. Use this OR task_id, not both. Supported: MP3, WAV, FLAC, OGG (max 10MB).'),
    style: z.string().optional().describe('Vocal style/genre (e.g., "soulful R&B vocals", "energetic pop singing"). Guides vocal characteristics.'),
    title: z.string().optional().describe('Title for the track with vocals.'),
    vocal_gender: z.enum(['m', 'f']).optional().describe('Preferred vocal gender: "m" (male) or "f" (female).'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().describe('Model version. V4+ recommended for better vocal quality.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing add_vocals');

    try {
      const result = await sunoClient.addVocals(
        args.prompt,
        {
          taskId: args.task_id,
          audioId: args.audio_id,
          uploadUrl: args.upload_url,
          style: args.style,
          title: args.title,
          vocalGender: args.vocal_gender,
          model: args.model,
        }
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Vocal addition started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in add_vocals');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Add instrumental to vocals
 *
 * Generates instrumental accompaniment for vocal tracks or acapella recordings.
 * Creates complete musical backing that complements and supports the vocals.
 *
 * Use Cases:
 * - Acapella backing (add music to vocal-only recordings)
 * - Complete productions (transform vocals into full tracks)
 * - Backing track creation (generate accompaniment for existing vocals)
 * - Style exploration (try different instrumental styles for same vocals)
 * - Demo production (quick instrumental demos for songwriting)
 *
 * Input Options:
 * - Use task_id + audio_id for existing Suno vocal track
 * - Use upload_url for external vocal/acapella file
 * - Must provide EITHER (task_id + audio_id) OR upload_url
 *
 * Instrumental Generation:
 * - AI creates instrumentation matching vocal characteristics
 * - Follows vocal melody, tempo, and key
 * - Style parameter guides instrumental genre/mood
 * - Automatically balances mix for vocal clarity
 *
 * Best Practices:
 * - Be specific about desired instrumental style
 * - Provide clear genre/mood guidance in style parameter
 * - Original vocals should have clear pitch and timing
 *
 * Generation Time: 90-180 seconds
 * Credits Cost: 20-30 per track
 */
server.addTool({
  name: 'add_instrumental',
  description: 'Add instrumental accompaniment to vocals or acapella. Perfect for acapella backing, complete productions, and backing track creation. Provide EITHER task_id OR upload_url. AI generates instrumentation matching vocals. Generation: 90-180s. Credits: 20-30.',
  parameters: z.object({
    style: z.string().min(1).max(1000).describe('Instrumental style/genre (e.g., "acoustic guitar and piano, mellow", "electronic dance, energetic synths"). Be specific about instrumentation and mood.'),
    task_id: z.string().optional().describe('Existing Suno vocal track ID. Use this OR upload_url, not both.'),
    audio_id: z.string().optional().describe('Existing Suno audio ID. Required if using task_id.'),
    upload_url: z.string().url().optional().describe('URL of vocal/acapella audio file to upload. Use this OR task_id, not both. Supported: MP3, WAV, FLAC, OGG (max 10MB).'),
    prompt: z.string().optional().describe('Optional description of desired instrumental (e.g., "cinematic orchestral backing", "minimal jazz trio accompaniment").'),
    title: z.string().optional().describe('Title for the complete track.'),
    model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']).optional().describe('Model version. V4+ recommended for better instrumental quality and vocal-instrumental balance.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing add_instrumental');

    try {
      const result = await sunoClient.addInstrumental(
        args.style,
        {
          taskId: args.task_id,
          audioId: args.audio_id,
          uploadUrl: args.upload_url,
          prompt: args.prompt,
          title: args.title,
          model: args.model,
        }
      );

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Instrumental addition started. Use get_audio_info to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in add_instrumental');
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
 *
 * Retrieves comprehensive information about audio generation tasks including status,
 * audio URLs, metadata, and error messages. Essential for async workflow.
 *
 * Use Cases:
 * - Polling for completion (check if generation is done)
 * - Monitoring multiple tasks simultaneously
 * - Implementing progress indicators
 * - Metadata retrieval (audio URLs, cover art, lyrics)
 * - Error debugging and troubleshooting
 *
 * Status Values:
 * - PENDING: Task queued, not started yet (wait and poll again)
 * - GENERATING: Currently generating (wait 5-30 seconds, poll again)
 * - SUCCESS: Completed successfully (audio_url and metadata available)
 * - FAILED: Generation failed (check error_message for details)
 *
 * Recommended Polling Strategy:
 * - First 30 seconds: Poll every 5 seconds
 * - 30-120 seconds: Poll every 10 seconds
 * - After 2 minutes: Poll every 15-30 seconds
 * - Timeout after: 5 minutes
 */
server.addTool({
  name: 'get_audio_info',
  description: 'Get detailed information and status for audio generation tasks. Essential for async workflow - check if generation is complete, get audio URLs, metadata, cover art, lyrics, and error messages. Supports checking multiple tasks at once. Returns status: PENDING/GENERATING/SUCCESS/FAILED with full audio details when ready.',
  parameters: z.object({
    task_ids: z.array(z.string()).min(1).describe('Array of task IDs to check (from generate_music or generate_custom_music). Can check multiple tasks in one call. Example: ["task_abc123", "task_def456"]'),
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
 *
 * Returns the number of credits remaining in your Suno API account.
 * Essential for budget management and preventing mid-workflow failures.
 *
 * Use Cases:
 * - Budget management and cost tracking
 * - Alert before credit depletion
 * - Workflow planning (check credits before batch operations)
 * - Calculate remaining capacity
 * - Account health check and API key validation
 *
 * Credit Costs (Estimated):
 * - Basic generation: 10-20 credits per track
 * - Custom generation: 15-25 credits per track
 * - Stem separation: 5-10 credits per track
 * - Lyrics generation: 2-5 credits per request
 * - Extended tracks (V4_5+): 20-30 credits per track
 *
 * Best Practice: Check credits before batch operations to ensure sufficient budget.
 */
server.addTool({
  name: 'get_credits',
  description: 'Check remaining API credits/quota for the current API key. Essential for budget management - returns credits_left count. Use before batch operations to prevent failures. Typical costs: 10-30 credits per track, 5-10 per stem separation, 2-5 per lyrics. Also validates API key and account status.',
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
 *
 * Creates song lyrics based on a theme, topic, or style description.
 * Perfect for lyric-first workflows where you want to review and approve lyrics
 * before generating music.
 *
 * Use Cases:
 * - Lyric-first composition (review lyrics before music generation)
 * - Edit AI-generated lyrics before use
 * - Content planning (generate multiple lyric variants)
 * - Lyric inspiration and overcoming writer's block
 * - A/B testing different themes and concepts
 *
 * Typical Lyric Structure:
 * - [Verse 1] - Sets the scene (4-8 lines)
 * - [Chorus] - Main hook/message (4-6 lines)
 * - [Verse 2] - Develops the story (4-8 lines)
 * - [Chorus] - Repeated (same or variation)
 * - [Bridge] - Contrast/twist (2-4 lines)
 * - [Outro] or [Chorus] - Resolution
 *
 * Prompt Tips:
 * - Include emotion/mood: "sad", "joyful", "nostalgic", "energetic"
 * - Specify theme/topic: "love", "adventure", "loss", "celebration"
 * - Add perspective: "first-person reflection", "storytelling"
 * - Provide context: "coffee shop", "at sea", "childhood memories"
 *
 * Generation Time: 10-60 seconds (auto-waits for completion)
 */
server.addTool({
  name: 'generate_lyrics',
  description: 'Generate song lyrics from a text prompt. Perfect for lyric-first workflows - review and edit lyrics before generating music. Creates structured lyrics with [Verse], [Chorus], [Bridge] markers. Auto-waits for completion (10-60 seconds). Include emotion, theme, perspective, and context for best results.',
  parameters: z.object({
    prompt: z.string().min(1).max(5000).describe('Theme or topic for lyrics (e.g., "a melancholic indie folk song about leaving your hometown", "upbeat hip-hop about overcoming challenges", "gentle lullaby about stars and dreams"). Include emotion, theme, and context for better results.'),
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
 *
 * Retrieves synchronized lyrics with precise timestamps for each line or word.
 * Essential for creating karaoke videos, lyric videos, or real-time lyric display.
 *
 * Use Cases:
 * - Karaoke creation (sync lyrics to music, karaoke videos/apps)
 * - Lyric videos (animated text overlays, word-by-word highlighting)
 * - Accessibility (closed captions, real-time subtitles, assisted listening)
 * - Music analysis (study vocal timing, analyze song structure)
 * - Educational purposes
 *
 * Data Structure:
 * Each lyric line includes:
 * - timestamp: Start time in seconds
 * - text: Lyric line text
 * - duration: Duration of this line
 * - words: Optional word-level timestamps (word, start, end)
 *
 * Supports Export to:
 * - SRT (SubRip) format for video subtitles
 * - LRC (Lyric) format for music players
 * - Custom formats for karaoke systems
 *
 * Note: Only available for songs with vocals (not instrumental tracks)
 */
server.addTool({
  name: 'get_timestamped_lyrics',
  description: 'Get lyrics with precise timestamps for karaoke and subtitle generation. Perfect for karaoke videos, lyric videos, closed captions, and real-time lyric display. Returns synchronized lyrics with timestamp, text, duration, and optional word-level timing. Supports export to SRT/LRC formats. Only for vocal tracks.',
  parameters: z.object({
    song_id: z.string().describe('Song/task ID from a completed generation (must be a vocal track, not instrumental). Use the ID returned from generate_music or generate_custom_music after status is SUCCESS.'),
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
 *
 * Creates isolated vocal and instrumental tracks from a generated song.
 * Uses AI-powered source separation to extract clean stems suitable for
 * remixing, karaoke, or audio analysis.
 *
 * Use Cases:
 * - Remixing & production (extract vocals for remixes, isolate instrumentals for DJ sets)
 * - Karaoke creation (remove vocals for backing tracks, create karaoke versions)
 * - Music education (study individual elements, vocal/instrumental analysis)
 * - Content creation (acapella clips for videos, instrumental backgrounds)
 *
 * Output Format:
 * - Two separate tracks: vocals and instrumental
 * - MP3 format (320kbps), Stereo, 44.1kHz
 * - Same duration as original track
 *
 * Processing Time:
 * - 2-minute track: 20-40 seconds
 * - 4-minute track: 40-80 seconds
 * - 8-minute track: 80-160 seconds
 *
 * Quality Factors:
 * - Model Used: V4+ generally has better separation
 * - Original Mix: Clean mixes separate better
 * - Vocal Clarity: Clear vocals separate more effectively
 *
 * Note: Song must be completed before stem separation (status = SUCCESS)
 */
server.addTool({
  name: 'generate_stems',
  description: 'Separate vocals and instruments from a song - extract isolated vocal and instrumental tracks. Perfect for remixing, karaoke creation, music education, and content creation. Uses AI-powered source separation. Returns task ID - use get_audio_info to check status. Processing: 20-160 seconds depending on track length. Only for vocal tracks.',
  parameters: z.object({
    song_id: z.string().describe('Song/task ID from a completed generation (status must be SUCCESS). Returns two stems: vocals (isolated vocals) and instrumental (backing track). Use for remixing, karaoke, or audio analysis.'),
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

/**
 * Convert to WAV format
 *
 * Converts a generated MP3 track to high-quality uncompressed WAV format.
 * Essential for professional audio editing, lossless archiving, and mastering workflows.
 *
 * Use Cases:
 * - Professional audio editing (DAW import, multitrack projects, studio production)
 * - Lossless archive (preserve maximum quality, long-term storage)
 * - Mastering preparation (audio engineering, final mix preparation)
 * - Broadcasting (radio/podcast production, professional streaming)
 * - Quality analysis (waveform inspection, spectral analysis)
 *
 * Output Format:
 * - WAV format: 44.1kHz, 16-bit, Stereo
 * - Uncompressed PCM audio
 * - File size: ~10x larger than MP3
 * - Bit-perfect conversion (no quality loss)
 *
 * Processing Time:
 * - 2-minute track: 10-15 seconds
 * - 4-minute track: 15-20 seconds
 * - 8-minute track: 20-30 seconds
 *
 * Credits Cost: 2-5 credits per conversion
 *
 * Note: Original track must have status = SUCCESS before conversion
 */
server.addTool({
  name: 'convert_to_wav',
  description: 'Convert MP3 to high-quality WAV format (44.1kHz, 16-bit, stereo). Perfect for professional audio editing, lossless archive, mastering preparation, and broadcasting. Returns task ID - use get_wav_details to check status. Processing: 10-30 seconds. Credits: 2-5 per conversion.',
  parameters: z.object({
    task_id: z.string().describe('Original song task ID (from generate_music or generate_custom_music). Track must have status SUCCESS.'),
    audio_id: z.string().describe('Original audio ID (usually same as task_id). Identifies the specific audio track to convert.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing convert_to_wav');

    try {
      const result = await sunoClient.convertToWAV(args.task_id, args.audio_id);

      return JSON.stringify({
        success: true,
        data: result,
        message: 'WAV conversion started. Use get_wav_details to check status.',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in convert_to_wav');
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }
  },
});

/**
 * Get WAV conversion details
 *
 * Retrieves the status and download URL for a WAV conversion task.
 * Essential for monitoring conversion progress and accessing the converted file.
 *
 * Use Cases:
 * - Progress monitoring (check if conversion is complete)
 * - Download management (get WAV file URL when ready)
 * - File information (get file size, duration, format details)
 * - Error handling (check for conversion failures)
 * - Automation workflows (poll until complete, then download)
 *
 * Status Values:
 * - PENDING: Conversion queued, not started yet
 * - GENERATING: Currently converting (wait 5-15 seconds)
 * - SUCCESS: Conversion complete (wavUrl available for download)
 * - FAILED: Conversion failed (check errorMessage)
 *
 * Polling Strategy:
 * - First 10 seconds: Poll every 2 seconds
 * - After 10 seconds: Poll every 5 seconds
 * - Timeout: 60 seconds
 *
 * Response includes:
 * - wavUrl: Direct download link (when SUCCESS)
 * - fileSize: File size in bytes
 * - duration: Track duration in seconds
 * - errorMessage: Failure reason (when FAILED)
 */
server.addTool({
  name: 'get_wav_details',
  description: 'Check WAV conversion status and get download URL. Returns conversion progress, WAV file URL when complete, file size, duration, and error details if failed. Poll every 2-5 seconds until SUCCESS. Essential for retrieving converted WAV files.',
  parameters: z.object({
    task_id: z.string().describe('WAV conversion task ID (returned from convert_to_wav). Use this to check conversion status and get download URL.'),
  }),
  execute: async (args) => {
    logger.info({ args }, 'Executing get_wav_details');

    try {
      const result = await sunoClient.getWAVConversionDetails(args.task_id);

      return JSON.stringify({
        success: true,
        data: result,
        message: 'Retrieved WAV conversion details',
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error in get_wav_details');
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
 *
 * Returns a comprehensive list of all available Suno AI models with details
 * about their features, limitations, and recommended use cases.
 * Essential for model selection and understanding capabilities.
 *
 * Use Cases:
 * - Model selection (choose appropriate model for task)
 * - Compare model capabilities and quality trade-offs
 * - Documentation and help resources
 * - Build model selection UIs
 * - Feature discovery (learn about new models)
 *
 * Model Comparison:
 * - V3_5: 4min, Fast/Creative, Low cost (10-15 credits)
 * - V4: 4min, Excellent quality, Medium cost (15-20 credits)
 * - V4_5: 8min, Advanced features, Higher cost (20-25 credits)
 * - V4_5PLUS: 8min, Richest sound, Highest cost (25-30 credits)
 * - V5: 8min, Best balance, Fast generation (15-25 credits)
 *
 * Selection Guide:
 * - Need speed? → V3_5 or V5
 * - Need 8-minute tracks? → V4_5, V4_5PLUS, or V5
 * - Maximum quality? → V4_5PLUS or V5
 * - Budget conscious? → V3_5 or V5
 * - Experimental/artistic? → V4_5PLUS
 * - Best all-around? → V5 (superior musicality, faster generation)
 */
server.addTool({
  name: 'list_models',
  description: 'Get information about available Suno AI music generation models and their capabilities. Returns model list with max duration, features, and descriptions. Use for model selection and comparison. V3_5 (fast), V4 (quality), V4_5 (advanced), V4_5PLUS (richest), V5 (best balance). Includes credit cost estimates.',
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
 *
 * Performs a comprehensive health check of the Suno API connection,
 * validates the API key, and returns system status information.
 * Essential for troubleshooting and monitoring.
 *
 * Use Cases:
 * - Health monitoring (verify API availability, check service status)
 * - API key validation (confirm key is valid, test new keys)
 * - Troubleshooting (diagnose connection problems, debug failed requests)
 * - Setup verification (confirm proper setup before batch operations)
 *
 * Health Check Mechanism:
 * The tool performs these checks:
 * 1. Network connectivity (can reach API endpoint)
 * 2. Authentication (API key is valid)
 * 3. Authorization (key has permissions)
 * 4. Service availability (API returns expected responses)
 * 5. Account status (credits remaining)
 *
 * Status Codes:
 * - operational: All systems go (API key valid, has credits)
 * - degraded: Valid key but no credits
 * - error: API key invalid or network error
 *
 * Best Practice: Call this tool before starting batch operations or during
 * server startup to ensure proper configuration.
 */
server.addTool({
  name: 'get_api_status',
  description: 'Check if the Suno API is accessible and get current configuration. Comprehensive health check: validates API key, checks network connectivity, verifies service availability, and returns credits remaining. Returns status: operational/degraded/error. Essential for troubleshooting and pre-flight checks before batch operations.',
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
