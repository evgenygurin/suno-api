# Vercel AI SDK + Trigger.dev Integration Guide

## 🎯 Overview

This guide demonstrates how to integrate **Vercel AI SDK** with **Trigger.dev** to build powerful AI-powered features in the suno-api project, inspired by the Deep Research Agent pattern.

## 📚 Key Concepts

### Vercel AI SDK (v5.0)

The Vercel AI SDK is a TypeScript toolkit for building AI applications with:
- **Streaming**: Real-time text and object generation
- **Tool Calling**: AI can invoke external functions/APIs
- **Multi-Step Execution**: Chain multiple tool calls automatically
- **Structured Output**: Generate type-safe JSON objects
- **Provider Agnostic**: Works with OpenAI, Anthropic, Google, etc.

### Trigger.dev (v4)

Trigger.dev is a background task processing platform providing:
- **Long-running tasks**: No timeouts on task execution
- **Realtime progress**: `useRealtimeTaskTrigger` React hook
- **Automatic retries**: Exponential backoff and error handling
- **Task orchestration**: `triggerAndWait()` for task dependencies
- **Scheduled tasks**: Cron-based scheduling

## 🏗️ Architecture Patterns

### Pattern 1: AI-Powered Background Tasks

**Use case**: Music generation with AI-enhanced prompts, style analysis, or quality assessment.

```typescript
// src/trigger/ai-music-generation.ts
import { task } from "@trigger.dev/sdk";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const aiEnhancedMusicGeneration = task({
  id: "ai-enhanced-music-generation",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload: {
    userPrompt: string;
    userId: string;
    preferences?: {
      genre?: string;
      mood?: string;
      instruments?: string[];
    };
  }, { ctx }) => {

    // Step 1: Use AI to enhance the user's prompt
    await ctx.updateMetadata({
      stage: "Analyzing prompt",
      progress: 10
    });

    const enhancedPromptResult = await streamText({
      model: openai('gpt-4o'),
      system: `You are a music prompt optimization expert. Enhance user prompts
               to be more specific and effective for music generation.
               Consider genre, mood, instruments, tempo, and style.`,
      prompt: `Enhance this music prompt: "${payload.userPrompt}"
               ${payload.preferences ? `User preferences: ${JSON.stringify(payload.preferences)}` : ''}`,
    });

    let enhancedPrompt = '';
    for await (const chunk of enhancedPromptResult.textStream) {
      enhancedPrompt += chunk;
    }

    await ctx.updateMetadata({
      stage: "Prompt enhanced",
      enhancedPrompt,
      progress: 30
    });

    // Step 2: Analyze style and generate metadata
    await ctx.updateMetadata({
      stage: "Analyzing style",
      progress: 50
    });

    const styleAnalysis = await streamText({
      model: openai('gpt-4o'),
      tools: {
        analyzeStyle: tool({
          description: 'Analyze the musical style and characteristics',
          inputSchema: z.object({
            genre: z.string(),
            mood: z.string(),
            tempo: z.enum(['slow', 'medium', 'fast']),
            instruments: z.array(z.string()),
          }),
          execute: async ({ genre, mood, tempo, instruments }) => {
            return {
              genre,
              mood,
              tempo,
              instruments,
              tags: [genre, mood, tempo, ...instruments],
            };
          },
        }),
      },
      stopWhen: stepCountIs(3),
      prompt: `Analyze this music prompt and extract style information: "${enhancedPrompt}"`,
    });

    const { toolResults } = await styleAnalysis;
    const musicMetadata = toolResults[0]?.result;

    await ctx.updateMetadata({
      stage: "Style analyzed",
      musicMetadata,
      progress: 70
    });

    // Step 3: Generate music with Suno API
    await ctx.updateMetadata({
      stage: "Generating music",
      progress: 80
    });

    // Trigger the actual music generation task
    const musicResult = await generateMusicTask.triggerAndWait({
      prompt: enhancedPrompt,
      make_instrumental: false,
      wait_audio: true,
    });

    if (!musicResult.ok) {
      throw new Error(`Music generation failed: ${musicResult.error}`);
    }

    await ctx.updateMetadata({
      stage: "Complete",
      progress: 100
    });

    return {
      success: true,
      originalPrompt: payload.userPrompt,
      enhancedPrompt,
      musicMetadata,
      generatedMusic: musicResult.output,
      userId: payload.userId,
    };
  },
});
```

### Pattern 2: Multi-Step Research Agent

**Use case**: Analyze music trends, find similar songs, or gather style references.

```typescript
// src/trigger/music-research-agent.ts
import { task } from "@trigger.dev/sdk";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const musicResearchAgent = task({
  id: "music-research-agent",
  run: async (payload: {
    query: string;
    depth: number;
    maxResults: number;
  }, { ctx }) => {

    const allFindings: Array<{
      query: string;
      results: any[];
      depth: number;
    }> = [];

    // Recursive research function
    async function researchQuery(
      query: string,
      currentDepth: number
    ): Promise<void> {
      if (currentDepth > payload.depth) return;

      await ctx.updateMetadata({
        stage: `Researching depth ${currentDepth}`,
        query,
        progress: (currentDepth / payload.depth) * 100,
      });

      const result = await streamText({
        model: openai('gpt-4o'),
        tools: {
          searchMusic: tool({
            description: 'Search for music information, trends, or similar songs',
            inputSchema: z.object({
              searchQuery: z.string(),
              category: z.enum(['trends', 'similar', 'style', 'artist']),
            }),
            execute: async ({ searchQuery, category }) => {
              // In real implementation, use Exa API or similar
              // For now, simulate search results
              return {
                results: [
                  { title: `Result for ${searchQuery}`, category, relevance: 0.9 },
                  { title: `Related ${category}`, relevance: 0.8 },
                ],
                relatedQueries: [
                  `${searchQuery} variations`,
                  `${searchQuery} inspiration`,
                ],
              };
            },
          }),
          generateFollowUpQueries: tool({
            description: 'Generate follow-up research queries',
            inputSchema: z.object({
              baseQuery: z.string(),
              findings: z.array(z.object({
                title: z.string(),
                relevance: z.number(),
              })),
            }),
            execute: async ({ baseQuery, findings }) => {
              return {
                queries: findings
                  .filter(f => f.relevance > 0.7)
                  .slice(0, 3)
                  .map(f => `${baseQuery} like ${f.title}`),
              };
            },
          }),
        },
        stopWhen: stepCountIs(5),
        prompt: `Research this music query and find relevant information: "${query}"
                 Generate follow-up queries for deeper research if needed.`,
      });

      const { toolResults } = await result;

      const searchResults = toolResults.find(r => r.toolName === 'searchMusic');
      const followUpQueries = toolResults.find(r => r.toolName === 'generateFollowUpQueries');

      if (searchResults) {
        allFindings.push({
          query,
          results: searchResults.result.results,
          depth: currentDepth,
        });
      }

      // Recursively research follow-up queries
      if (followUpQueries && currentDepth < payload.depth) {
        const queries = followUpQueries.result.queries.slice(0, payload.maxResults);
        for (const followUpQuery of queries) {
          await researchQuery(followUpQuery, currentDepth + 1);
        }
      }
    }

    // Start research
    await researchQuery(payload.query, 1);

    await ctx.updateMetadata({
      stage: "Complete",
      progress: 100,
      totalFindings: allFindings.length,
    });

    return {
      query: payload.query,
      depth: payload.depth,
      findings: allFindings,
      summary: `Found ${allFindings.length} research results across ${payload.depth} levels`,
    };
  },
});
```

### Pattern 3: Real-time AI Chat with Tool Calling

**Use case**: Interactive music generation assistant with real-time feedback.

```typescript
// src/app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { tasks } from '@trigger.dev/sdk';
import type { generateMusicTask } from '@/trigger/generate-music';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a music generation assistant. Help users create amazing music
             by understanding their vision and triggering music generation tasks.
             Always confirm parameters before generating music.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      generateMusic: tool({
        description: 'Generate music based on user prompt',
        inputSchema: z.object({
          prompt: z.string().describe('The music generation prompt'),
          instrumental: z.boolean().describe('Whether to make instrumental'),
          waitForAudio: z.boolean().describe('Wait for audio to complete'),
        }),
        execute: async ({ prompt, instrumental, waitForAudio }) => {
          // Trigger background task
          const handle = await tasks.trigger<typeof generateMusicTask>(
            "generate-music",
            {
              prompt,
              make_instrumental: instrumental,
              wait_audio: waitForAudio,
            }
          );

          return {
            taskId: handle.id,
            status: 'Music generation started',
            message: `Generating music for: "${prompt}"`,
          };
        },
      }),
      checkMusicStatus: tool({
        description: 'Check the status of a music generation task',
        inputSchema: z.object({
          taskId: z.string().describe('The task ID to check'),
        }),
        execute: async ({ taskId }) => {
          // In real implementation, query Trigger.dev API for status
          return {
            taskId,
            status: 'processing',
            progress: 75,
            estimatedCompletion: '30 seconds',
          };
        },
      }),
      enhancePrompt: tool({
        description: 'Enhance a music prompt with AI suggestions',
        inputSchema: z.object({
          prompt: z.string().describe('The original prompt'),
          style: z.string().optional().describe('Desired musical style'),
        }),
        execute: async ({ prompt, style }) => {
          // Use AI to enhance the prompt
          const enhancement = await streamText({
            model: openai('gpt-4o'),
            prompt: `Enhance this music prompt with more detail and specificity:
                     Original: "${prompt}"
                     ${style ? `Style: ${style}` : ''}

                     Provide a more detailed, effective prompt for music generation.`,
          });

          let enhancedPrompt = '';
          for await (const chunk of enhancement.textStream) {
            enhancedPrompt += chunk;
          }

          return {
            original: prompt,
            enhanced: enhancedPrompt,
            suggestions: [
              'Add tempo information',
              'Specify instruments',
              'Include mood descriptors',
            ],
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 4: Client-Side Real-time Progress

**Use case**: Show real-time progress of AI + music generation in the UI.

```typescript
// src/app/components/AIEnhancedMusicGenerator.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useRealtimeTaskTrigger } from '@trigger.dev/react-hooks';
import { useState } from 'react';
import type { aiEnhancedMusicGeneration } from '@/trigger/ai-music-generation';

export default function AIEnhancedMusicGenerator() {
  const [userPrompt, setUserPrompt] = useState('');

  // Chat with AI assistant
  const { messages, sendMessage } = useChat({
    api: '/api/chat',
  });

  // Real-time task progress
  const { submit: triggerGeneration, metadata } = useRealtimeTaskTrigger<
    typeof aiEnhancedMusicGeneration
  >('ai-enhanced-music-generation');

  const handleGenerate = async () => {
    // Option 1: Direct task trigger with real-time progress
    await triggerGeneration({
      userPrompt,
      userId: 'user-123',
      preferences: {
        genre: 'electronic',
        mood: 'upbeat',
      },
    });

    // Option 2: Chat-based generation
    // sendMessage({
    //   text: `Generate music: ${userPrompt}`,
    // });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI-Enhanced Music Generator</h1>

      {/* Input Section */}
      <div className="mb-6">
        <textarea
          className="w-full p-4 border rounded-lg"
          placeholder="Describe the music you want to create..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          rows={4}
        />
        <button
          onClick={handleGenerate}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Generate Music with AI
        </button>
      </div>

      {/* Real-time Progress */}
      {metadata && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Generation Progress</h2>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-300 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${metadata.progress || 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {metadata.progress}% - {metadata.stage}
            </p>
          </div>

          {/* Stage Details */}
          {metadata.enhancedPrompt && (
            <div className="mb-2">
              <strong>Enhanced Prompt:</strong>
              <p className="text-sm text-gray-700">{metadata.enhancedPrompt}</p>
            </div>
          )}

          {metadata.musicMetadata && (
            <div>
              <strong>Detected Style:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {metadata.musicMetadata.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto'
                : 'bg-gray-100'
            } max-w-[80%]`}
          >
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <p key={i}>{part.text}</p>;
                case 'tool-generateMusic':
                  return (
                    <div key={i} className="mt-2 p-2 bg-white rounded">
                      <strong>🎵 Music Generation Started</strong>
                      <p className="text-sm">{part.output?.message}</p>
                      <p className="text-xs text-gray-500">
                        Task ID: {part.output?.taskId}
                      </p>
                    </div>
                  );
                case 'tool-enhancePrompt':
                  return (
                    <div key={i} className="mt-2 p-2 bg-white rounded">
                      <strong>✨ Prompt Enhanced</strong>
                      <p className="text-sm">{part.output?.enhanced}</p>
                    </div>
                  );
              }
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 Implementation Checklist

### 1. Install Dependencies

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic zod
npm install @trigger.dev/react-hooks
```

### 2. Configure Environment Variables

```bash
# .env
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Anthropic API Key (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Trigger.dev (already configured)
TRIGGER_API_KEY=tr_dev_...
TRIGGER_PROJECT_REF=proj_...
```

### 3. Create AI Tools Directory

```bash
mkdir -p src/lib/ai-tools
```

### 4. Implement Core AI Tools

```typescript
// src/lib/ai-tools/music-tools.ts
import { tool } from "ai";
import { z } from "zod";

export const musicTools = {
  enhancePrompt: tool({
    description: 'Enhance a music generation prompt',
    inputSchema: z.object({
      prompt: z.string(),
      genre: z.string().optional(),
      mood: z.string().optional(),
    }),
    execute: async ({ prompt, genre, mood }) => {
      // Implementation
      return { enhanced: `${prompt} (${genre}, ${mood})` };
    },
  }),

  analyzeStyle: tool({
    description: 'Analyze musical style from prompt',
    inputSchema: z.object({
      prompt: z.string(),
    }),
    execute: async ({ prompt }) => {
      // Use AI to analyze
      return {
        genre: 'electronic',
        mood: 'upbeat',
        tempo: 'medium',
        instruments: ['synth', 'drums'],
      };
    },
  }),

  suggestVariations: tool({
    description: 'Suggest prompt variations',
    inputSchema: z.object({
      prompt: z.string(),
      count: z.number().default(3),
    }),
    execute: async ({ prompt, count }) => {
      return {
        variations: Array(count).fill(`Variation of: ${prompt}`),
      };
    },
  }),
};
```

### 5. Update Trigger.dev Tasks

Integrate AI tools into existing tasks in `src/trigger/`:

- `generate-music.ts` - Add AI prompt enhancement
- `cookie-refresh.ts` - Add AI-powered CAPTCHA solving strategies
- `batch-generation.ts` - Add AI optimization for batch processing
- `webhook-notify.ts` - Add AI-generated summaries

## 📊 Best Practices

### 1. Error Handling

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

try {
  const result = await streamText({
    model: openai('gpt-4o'),
    prompt: userPrompt,
    onFinish: async ({ text, usage, steps }) => {
      logger.info({
        totalTokens: usage.totalTokens,
        steps: steps.length,
      }, 'AI generation completed');
    },
  });

  let fullText = '';
  for await (const chunk of result.textStream) {
    fullText += chunk;
  }

  return { success: true, text: fullText };
} catch (error) {
  logger.error({ error }, 'AI generation failed');

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('rate_limit')) {
      // Implement exponential backoff
      await wait.for({ seconds: 5 });
      // Retry
    }
  }

  throw error;
}
```

### 2. Token Optimization

```typescript
// Use streaming to reduce latency
const result = streamText({
  model: openai('gpt-4o-mini'), // Use mini for simple tasks
  prompt: shortPrompt,
  maxTokens: 500, // Limit response length
});

// Process chunks as they arrive
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### 3. Caching Strategies

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// Use system prompts for caching
const result = await generateText({
  model: openai('gpt-4o'),
  system: `You are a music expert. ${systemContext}`, // Cached
  prompt: userQuery, // Dynamic
});
```

### 4. Multi-Provider Fallback

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

async function generateWithFallback(prompt: string) {
  try {
    return await generateText({
      model: openai('gpt-4o'),
      prompt,
    });
  } catch (error) {
    logger.warn('OpenAI failed, falling back to Anthropic');
    return await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt,
    });
  }
}
```

## 🎯 Use Cases for suno-api

### High-Priority Use Cases

1. **AI Prompt Enhancement** ✅
   - Auto-enhance user prompts before generation
   - Suggest improvements and variations
   - Detect and fix common prompt issues

2. **Music Style Analysis** ✅
   - Analyze generated music characteristics
   - Tag music with genres, moods, instruments
   - Build music recommendation system

3. **Intelligent CAPTCHA Solving** ⏳
   - AI-powered CAPTCHA detection strategies
   - Adaptive solving based on success rates
   - Pattern recognition for optimization

4. **Content Moderation** ⏳
   - Analyze prompts for inappropriate content
   - Suggest family-friendly alternatives
   - Auto-flag problematic generations

5. **Usage Analytics & Insights** ⏳
   - AI-generated usage reports
   - Trend analysis and forecasting
   - Anomaly detection

### Implementation Priority

**Phase 1: Core AI Features** (Week 1-2)
- [ ] AI prompt enhancement endpoint
- [ ] Style analysis integration
- [ ] Basic tool calling setup

**Phase 2: Advanced Features** (Week 3-4)
- [ ] Multi-step research agent
- [ ] Real-time chat assistant
- [ ] Streaming progress updates

**Phase 3: Optimization** (Week 5-6)
- [ ] Token usage optimization
- [ ] Multi-provider fallback
- [ ] Caching strategies
- [ ] Performance monitoring

## 📚 Additional Resources

### Vercel AI SDK
- **Documentation**: https://sdk.vercel.ai/docs
- **Examples**: https://github.com/vercel/ai/tree/main/examples
- **API Reference**: https://sdk.vercel.ai/docs/reference

### Trigger.dev
- **Documentation**: https://trigger.dev/docs
- **React Hooks**: https://trigger.dev/docs/frontend/react-hooks
- **Task Orchestration**: https://trigger.dev/docs/tasks

### Integration Guides
- **Deep Research Agent**: https://trigger.dev/blog/building-a-deep-research-agent
- **AI + Background Jobs**: https://trigger.dev/docs/guides/ai-sdk
- **Real-time Updates**: https://trigger.dev/docs/frontend/overview

## 🚀 Next Steps

1. **Review this guide** and identify which patterns fit your use cases
2. **Set up AI SDK** by installing dependencies and configuring API keys
3. **Start with Pattern 1** (AI-Powered Background Tasks) for quick wins
4. **Implement real-time progress** using `useRealtimeTaskTrigger` hook
5. **Add tool calling** to existing chat or API endpoints
6. **Monitor and optimize** token usage and performance

---

**Questions?** Check the [Vercel AI SDK docs](https://sdk.vercel.ai/docs) or [Trigger.dev docs](https://trigger.dev/docs)

**Need help?** Open an issue in the repository or ask in #suno-api-dev
