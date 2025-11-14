/**
 * R2R Remote Agent Integration
 * Calls R2R Agent API with configuration from AI Persona Selector
 *
 * Architecture flow:
 * 1. User request → AI Persona Selector → persona + R2R config
 * 2. R2R config → R2RRemoteAgent → R2R API call
 * 3. R2R API → streaming events → processed response
 * 4. Response → user
 */

import { r2rClient } from 'r2r-js';
import { createModuleLogger } from '../logger.js';
import type { R2RAgentConfig } from './r2r-agent-config.js';

const logger = createModuleLogger('agent:r2r-remote');

/**
 * R2R Agent streaming event types
 */
export type R2REventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'citation'
  | 'message'
  | 'final_answer';

/**
 * Processed R2R Agent event
 */
export interface R2REvent {
  type: R2REventType;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * R2R Agent response
 */
export interface R2RAgentResponse {
  answer: string;
  citations: Array<{
    text: string;
    score: number;
    metadata: Record<string, any>;
  }>;
  events: R2REvent[];
  metadata: {
    mode: 'rag' | 'research';
    tools_used: string[];
    thinking_time_ms?: number;
    total_time_ms: number;
    conversation_id?: string;
  };
}

/**
 * R2R Remote Agent - Calls R2R API with persona-based configuration
 */
export class R2RRemoteAgent {
  private client: r2rClient;
  private conversationId?: string;

  constructor(baseUrl: string = process.env.R2R_API_URL || process.env.R2R_BASE_URL || 'http://localhost:7272') {
    this.client = new r2rClient(baseUrl);
    logger.info({ baseUrl }, 'R2R Remote Agent initialized');
  }

  /**
   * Process request using R2R Agent API
   *
   * @param request User's question/request
   * @param config R2R Agent configuration (from AI Persona Selector)
   * @param stream Enable streaming (default: true)
   * @returns R2R Agent response with answer, citations, and metadata
   */
  async process(
    request: string,
    config: R2RAgentConfig,
    stream: boolean = true
  ): Promise<R2RAgentResponse> {
    const startTime = Date.now();

    logger.info({
      request: request.substring(0, 100),
      mode: config.mode,
      tools: config.tools,
      model: config.generation_config.model,
    }, 'Processing request with R2R Agent API');

    try {
      // Update stream setting in config
      const apiConfig = JSON.parse(JSON.stringify(config)); // Deep clone
      apiConfig.generation_config.stream = stream;

      // Build API request payload
      const payload: any = {
        message: {
          role: 'user',
          content: request,
        },
        mode: config.mode,
        search_settings: config.search_settings,
      };

      // Add tools and generation config based on mode
      if (config.mode === 'rag') {
        payload.rag_tools = config.tools;
        payload.rag_generation_config = apiConfig.generation_config;
      } else {
        payload.research_tools = config.tools;
        payload.research_generation_config = apiConfig.generation_config;
      }

      // Add conversation context if available
      if (this.conversationId) {
        payload.conversation_id = this.conversationId;
      }

      // Call R2R Agent API
      let response: any;
      const events: R2REvent[] = [];
      const toolsUsed = new Set<string>();
      let thinkingTimeMs = 0;

      if (stream) {
        // Streaming mode - process events
        response = await this.client.retrieval.agent(payload);

        let fullAnswer = '';
        let citations: any[] = [];

        for await (const event of response) {
          const processedEvent = this.processEvent(event);
          if (processedEvent) {
            events.push(processedEvent);

            // Track tools used
            if (processedEvent.type === 'tool_call' && processedEvent.metadata?.name) {
              toolsUsed.add(processedEvent.metadata.name);
            }

            // Accumulate answer
            if (processedEvent.type === 'message') {
              fullAnswer += processedEvent.content;
            }

            // Capture final answer
            if (processedEvent.type === 'final_answer' && processedEvent.metadata) {
              fullAnswer = processedEvent.metadata.generated_answer || fullAnswer;
              citations = processedEvent.metadata.citations || [];
              if (processedEvent.metadata.conversation_id) {
                this.conversationId = processedEvent.metadata.conversation_id;
              }
            }

            // Track thinking time
            if (processedEvent.type === 'thinking' && processedEvent.metadata?.duration_ms) {
              thinkingTimeMs += processedEvent.metadata.duration_ms;
            }
          }
        }

        const totalTimeMs = Date.now() - startTime;

        logger.info({
          mode: config.mode,
          toolsUsed: Array.from(toolsUsed),
          eventsCount: events.length,
          thinkingTimeMs,
          totalTimeMs,
        }, 'R2R Agent completed (streaming)');

        return {
          answer: fullAnswer,
          citations: this.formatCitations(citations),
          events,
          metadata: {
            mode: config.mode,
            tools_used: Array.from(toolsUsed),
            thinking_time_ms: thinkingTimeMs > 0 ? thinkingTimeMs : undefined,
            total_time_ms: totalTimeMs,
            conversation_id: this.conversationId,
          },
        };
      } else {
        // Non-streaming mode - direct response
        response = await this.client.retrieval.agent(payload);

        const totalTimeMs = Date.now() - startTime;
        const answer = response.results?.messages?.[response.results.messages.length - 1]?.content || '';
        const citations = response.results?.citations || [];

        if (response.results?.conversation_id) {
          this.conversationId = response.results.conversation_id;
        }

        logger.info({
          mode: config.mode,
          totalTimeMs,
          hasAnswer: !!answer,
          citationsCount: citations.length,
        }, 'R2R Agent completed (non-streaming)');

        return {
          answer,
          citations: this.formatCitations(citations),
          events: [],
          metadata: {
            mode: config.mode,
            tools_used: config.tools,
            total_time_ms: totalTimeMs,
            conversation_id: this.conversationId,
          },
        };
      }
    } catch (error) {
      logger.error({ error, mode: config.mode }, 'R2R Agent API call failed');
      throw new Error(`R2R Agent API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process streaming event from R2R API
   */
  private processEvent(event: any): R2REvent | null {
    try {
      // Detect event type based on structure
      if (event.data?.delta?.content?.[0]?.payload?.value !== undefined) {
        // ThinkingEvent or MessageEvent
        const content = event.data.delta.content[0].payload.value;
        const isThinking = event.data.delta.content[0].type === 'thinking';

        return {
          type: isThinking ? 'thinking' : 'message',
          content,
          metadata: {
            role: event.data.role,
          },
        };
      } else if (event.data?.name && event.data?.arguments) {
        // ToolCallEvent
        return {
          type: 'tool_call',
          content: `${event.data.name}(${JSON.stringify(event.data.arguments)})`,
          metadata: {
            name: event.data.name,
            arguments: event.data.arguments,
            id: event.data.id,
          },
        };
      } else if (event.data?.content && typeof event.data.content === 'string') {
        // ToolResultEvent
        return {
          type: 'tool_result',
          content: event.data.content,
          metadata: {
            tool_call_id: event.data.tool_call_id,
          },
        };
      } else if (event.data?.id && event.object === 'citation') {
        // CitationEvent
        return {
          type: 'citation',
          content: event.data.payload?.text || '',
          metadata: {
            id: event.data.id,
            score: event.data.payload?.score,
            document: event.data.payload?.metadata,
          },
        };
      } else if (event.data?.generated_answer) {
        // FinalAnswerEvent
        return {
          type: 'final_answer',
          content: event.data.generated_answer,
          metadata: {
            generated_answer: event.data.generated_answer,
            citations: event.data.citations,
            conversation_id: event.data.conversation_id,
          },
        };
      }

      // Unknown event type
      logger.debug({ event }, 'Unknown R2R event type');
      return null;
    } catch (error) {
      logger.error({ error, event }, 'Failed to process R2R event');
      return null;
    }
  }

  /**
   * Format citations from R2R response
   */
  private formatCitations(citations: any[]): Array<{
    text: string;
    score: number;
    metadata: Record<string, any>;
  }> {
    if (!Array.isArray(citations)) {
      return [];
    }

    return citations.map((citation) => ({
      text: citation.payload?.text || citation.text || '',
      score: citation.payload?.score || citation.score || 0,
      metadata: citation.payload?.metadata || citation.metadata || {},
    }));
  }

  /**
   * Reset conversation context
   */
  resetConversation(): void {
    this.conversationId = undefined;
    logger.info('Conversation context reset');
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | undefined {
    return this.conversationId;
  }
}
