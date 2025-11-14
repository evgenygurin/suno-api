/**
 * AI-Enhanced Music Generation Task
 *
 * This task demonstrates integration between Trigger.dev and Vercel AI SDK
 * for intelligent music generation with real-time progress updates.
 *
 * Features:
 * - AI prompt enhancement using OpenAI GPT-4o
 * - Musical style analysis and metadata extraction
 * - Real-time progress updates via metadata
 * - Multi-step execution with tool calling
 * - Structured output with Zod validation
 *
 * @see /docs/AI_SDK_INTEGRATION.md for full documentation
 */

import { task } from "@trigger.dev/sdk";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import logger from "@/lib/logger";
import { generateMusicTask } from "./tasks/generate-music";

// ============================================================================
// Types & Schemas
// ============================================================================

/**
 * Musical style metadata schema
 */
const musicStyleSchema = z.object({
  genre: z.string().describe("Primary musical genre"),
  mood: z.string().describe("Emotional mood of the music"),
  tempo: z.enum(["slow", "medium", "fast"]).describe("Tempo classification"),
  instruments: z.array(z.string()).describe("Suggested instruments"),
  tags: z.array(z.string()).describe("Searchable tags"),
});

type MusicStyle = z.infer<typeof musicStyleSchema>;

/**
 * Task input payload
 */
interface AIEnhancedGenerationPayload {
  userPrompt: string;
  userId: string;
  preferences?: {
    genre?: string;
    mood?: string;
    instruments?: string[];
    make_instrumental?: boolean;
  };
}

/**
 * Task output result
 */
interface AIEnhancedGenerationResult {
  success: boolean;
  originalPrompt: string;
  enhancedPrompt: string;
  musicStyle: MusicStyle;
  generatedMusic: any;
  userId: string;
  processingTime: number;
}

// ============================================================================
// AI Tools Definition
// ============================================================================

/**
 * Tool for analyzing musical style from prompt
 */
const analyzeStyleTool = tool({
  description: `Analyze the musical style and characteristics from a prompt.
                Extract genre, mood, tempo, and suggested instruments.`,
  inputSchema: musicStyleSchema,
  execute: async (style) => {
    logger.info({ style }, "Style analysis completed");
    return {
      ...style,
      tags: [
        style.genre.toLowerCase(),
        style.mood.toLowerCase(),
        style.tempo,
        ...style.instruments.map(i => i.toLowerCase()),
      ],
    };
  },
});

/**
 * Tool for generating prompt variations
 */
const generateVariationsTool = tool({
  description: "Generate alternative variations of a music prompt",
  inputSchema: z.object({
    basePrompt: z.string(),
    variations: z.array(z.string()).max(3),
  }),
  execute: async ({ basePrompt, variations }) => {
    logger.info({ basePrompt, count: variations.length }, "Generated variations");
    return { basePrompt, variations };
  },
});

// ============================================================================
// Main Task
// ============================================================================

export const aiEnhancedMusicGeneration = task({
  id: "ai-enhanced-music-generation",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  run: async (
    payload: AIEnhancedGenerationPayload,
    { ctx }
  ): Promise<AIEnhancedGenerationResult> => {
    const startTime = Date.now();

    logger.info(
      {
        userId: payload.userId,
        promptLength: payload.userPrompt.length,
        hasPreferences: !!payload.preferences,
      },
      "Starting AI-enhanced music generation"
    );

    try {
      // ======================================================================
      // Step 1: Enhance User Prompt with AI
      // ======================================================================
      await ctx.updateMetadata({
        stage: "Analyzing and enhancing prompt",
        progress: 10,
        currentStep: 1,
        totalSteps: 4,
      });

      logger.info("Starting prompt enhancement");

      const enhancementResult = await streamText({
        model: openai("gpt-4o"),
        system: `You are a music prompt optimization expert for AI music generation.
                 Your role is to enhance user prompts to be more specific, vivid, and effective.

                 Guidelines:
                 - Add specific genre, mood, and instrument details
                 - Include tempo and rhythm suggestions
                 - Enhance descriptive language for better results
                 - Keep the user's core vision intact
                 - Make prompts concise but detailed (2-3 sentences max)

                 Output only the enhanced prompt, nothing else.`,
        prompt: `Enhance this music prompt: "${payload.userPrompt}"

                 ${
                   payload.preferences
                     ? `User preferences:
                 - Genre: ${payload.preferences.genre || "any"}
                 - Mood: ${payload.preferences.mood || "any"}
                 - Instruments: ${payload.preferences.instruments?.join(", ") || "any"}
                 - Instrumental: ${payload.preferences.make_instrumental ? "yes" : "no"}`
                     : ""
                 }`,
      });

      let enhancedPrompt = "";
      for await (const chunk of enhancementResult.textStream) {
        enhancedPrompt += chunk;
      }

      logger.info({ enhancedPrompt }, "Prompt enhancement completed");

      await ctx.updateMetadata({
        stage: "Prompt enhanced",
        enhancedPrompt,
        progress: 30,
        currentStep: 2,
        totalSteps: 4,
      });

      // ======================================================================
      // Step 2: Analyze Musical Style with AI Tools
      // ======================================================================
      await ctx.updateMetadata({
        stage: "Analyzing musical style",
        progress: 50,
        currentStep: 3,
        totalSteps: 4,
      });

      logger.info("Starting style analysis");

      const styleAnalysisResult = await streamText({
        model: openai("gpt-4o"),
        tools: {
          analyzeStyle: analyzeStyleTool,
          generateVariations: generateVariationsTool,
        },
        stopWhen: (message) => {
          // Stop when we have the style analysis
          return message.toolCalls?.some(call => call.toolName === "analyzeStyle") ?? false;
        },
        maxSteps: 3,
        prompt: `Analyze this enhanced music prompt and extract detailed style information:

                 Prompt: "${enhancedPrompt}"

                 Call the analyzeStyle tool with:
                 - genre: The primary musical genre
                 - mood: The emotional mood/feeling
                 - tempo: slow, medium, or fast
                 - instruments: Array of suggested instruments (3-5 items)

                 Be specific and creative in your analysis.`,
      });

      // Extract tool results
      const { toolResults } = await styleAnalysisResult;
      const styleAnalysis = toolResults.find(
        (r) => r.toolName === "analyzeStyle"
      );

      if (!styleAnalysis) {
        throw new Error("Style analysis tool was not called");
      }

      const musicStyle = styleAnalysis.result as MusicStyle;

      logger.info({ musicStyle }, "Style analysis completed");

      await ctx.updateMetadata({
        stage: "Style analyzed",
        musicStyle,
        progress: 70,
        currentStep: 3,
        totalSteps: 4,
      });

      // ======================================================================
      // Step 3: Generate Music via Suno API
      // ======================================================================
      await ctx.updateMetadata({
        stage: "Generating music with Suno",
        progress: 80,
        currentStep: 4,
        totalSteps: 4,
      });

      logger.info("Triggering music generation");

      // Trigger the actual music generation task and wait for result
      const musicResult = await generateMusicTask.triggerAndWait({
        prompt: enhancedPrompt,
        make_instrumental: payload.preferences?.make_instrumental ?? false,
        wait_audio: true,
      });

      // Check if generation was successful
      if (!musicResult.ok) {
        logger.error({ error: musicResult.error }, "Music generation failed");
        throw new Error(`Music generation failed: ${musicResult.error}`);
      }

      logger.info("Music generation completed");

      // ======================================================================
      // Step 4: Complete and Return Results
      // ======================================================================
      const processingTime = Date.now() - startTime;

      await ctx.updateMetadata({
        stage: "Complete",
        progress: 100,
        currentStep: 4,
        totalSteps: 4,
        processingTime,
      });

      const result: AIEnhancedGenerationResult = {
        success: true,
        originalPrompt: payload.userPrompt,
        enhancedPrompt,
        musicStyle,
        generatedMusic: musicResult.output,
        userId: payload.userId,
        processingTime,
      };

      logger.info(
        {
          userId: payload.userId,
          processingTime,
          musicCount: Array.isArray(musicResult.output)
            ? musicResult.output.length
            : 1,
        },
        "AI-enhanced generation completed successfully"
      );

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId: payload.userId,
          processingTime,
        },
        "AI-enhanced generation failed"
      );

      // Update metadata with error state
      await ctx.updateMetadata({
        stage: "Failed",
        error: error instanceof Error ? error.message : String(error),
        progress: 0,
      });

      throw error;
    }
  },
});

// ============================================================================
// Helper Functions for Testing
// ============================================================================

/**
 * Test function to verify AI SDK integration
 * Can be called directly or via separate test task
 */
export async function testAIIntegration() {
  logger.info("Testing AI SDK integration");

  try {
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      prompt: "Say 'AI SDK is working!' in a creative way",
    });

    let response = "";
    for await (const chunk of result.textStream) {
      response += chunk;
    }

    logger.info({ response }, "AI SDK integration test successful");
    return { success: true, response };

  } catch (error) {
    logger.error({ error }, "AI SDK integration test failed");
    return { success: false, error };
  }
}
