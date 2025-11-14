/**
 * AI-Powered Persona Selection
 * Uses LLM to intelligently select the best persona for a request
 * With persistent conversation state across CLI runs
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { createModuleLogger } from '../logger.js';
import { AGENT_PERSONAS } from './config.js';
import {
  getR2RAgentConfig,
  type R2RAgentConfig
} from './r2r-agent-config.js';

const logger = createModuleLogger('agent:ai-selector');

/**
 * Conversation history entry for persona selection
 */
interface ConversationEntry {
  request: string;
  selectedPersona: string;
  reasoning: string;
  confidence: number;
  timestamp: string;
}

// History file path (persistent across CLI runs)
const HISTORY_DIR = path.join(process.cwd(), '.claude', 'data');
const HISTORY_FILE = path.join(HISTORY_DIR, 'ai-persona-history.json');

/**
 * AI Persona Selector using OpenAI with Persistent Conversation State
 */
export class AIPersonaSelector {
  private openai: OpenAI | null = null;
  private enabled: boolean = false;
  private conversationHistory: ConversationEntry[] = [];
  private readonly maxHistorySize: number = 10; // Keep last 10 selections

  constructor() {
    // Initialize OpenAI if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.enabled = true;
      logger.info('AI Persona Selector initialized with OpenAI');
    } else {
      logger.warn('OpenAI API key not found - AI persona selection disabled');
    }

    // Load conversation history from disk
    this.loadHistory();
  }

  /**
   * Select best persona using AI and return R2R Agent configuration
   */
  async selectPersona(request: string): Promise<{
    persona: string;
    reasoning: string;
    confidence: number;
    r2rConfig: R2RAgentConfig; // R2R Agent configuration (required)
  }> {
    if (!this.enabled || !this.openai) {
      throw new Error('AI Persona Selector not initialized');
    }

    try {
      logger.info({ request: request.substring(0, 100) }, 'AI analyzing request for persona selection');

      // Create persona descriptions for the AI
      const personaDescriptions = Object.entries(AGENT_PERSONAS).map(([id, persona]) => ({
        id,
        name: persona.name,
        description: persona.description,
        strengths: this.getPersonaStrengths(id),
      }));

      // Build AI prompt
      const systemPrompt = this.buildSystemPrompt(personaDescriptions);
      const userPrompt = this.buildUserPrompt(request);

      // Call OpenAI with structured outputs (modern approach)
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-nano', // Fastest nano model with structured outputs support
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'persona_selection',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                persona: {
                  type: 'string',
                  enum: ['developer', 'architect', 'debugger', 'learner', 'tester'],
                  description: 'The selected persona ID',
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of why this persona was selected (1-2 sentences)',
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score for this selection (0-1)',
                },
              },
              required: ['persona', 'reasoning', 'confidence'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.3, // Low temperature for consistent selection
      });

      // Parse AI response (guaranteed to match schema)
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI did not return persona selection');
      }

      const result = JSON.parse(content);

      // Generate R2R Agent configuration based on persona + request
      const r2rConfig = getR2RAgentConfig(
        result.persona,
        request,
        this.conversationHistory
      );

      logger.info({
        request: request.substring(0, 100),
        selectedPersona: result.persona,
        reasoning: result.reasoning,
        confidence: result.confidence,
        historySize: this.conversationHistory.length,
        r2rMode: r2rConfig.mode,
        r2rTools: r2rConfig.tools,
      }, 'AI selected persona with R2R Agent configuration');

      // Add to conversation history
      this.addToHistory({
        request,
        selectedPersona: result.persona,
        reasoning: result.reasoning,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      });

      return {
        persona: result.persona,
        reasoning: result.reasoning,
        confidence: result.confidence,
        r2rConfig,
      };
    } catch (error) {
      logger.error({ error }, 'AI persona selection failed');
      throw error;
    }
  }

  /**
   * Add selection to conversation history and persist to disk
   */
  private addToHistory(entry: ConversationEntry): void {
    this.conversationHistory.push(entry);

    // Trim history to max size
    if (this.conversationHistory.length > this.maxHistorySize) {
      this.conversationHistory.shift(); // Remove oldest
    }

    logger.debug({
      historySize: this.conversationHistory.length,
      latestSelection: entry.selectedPersona,
    }, 'Updated conversation history');

    // Persist to disk
    this.saveHistory();
  }

  /**
   * Get conversation history summary for AI context
   */
  private getHistorySummary(): string {
    if (this.conversationHistory.length === 0) {
      return 'No previous selections in this session.';
    }

    const summary = this.conversationHistory.map((entry, index) => {
      return `${index + 1}. Request: "${entry.request.substring(0, 60)}${entry.request.length > 60 ? '...' : ''}"
   Selected: ${entry.selectedPersona} (confidence: ${entry.confidence.toFixed(2)})
   Reasoning: ${entry.reasoning}`;
    }).join('\n\n');

    return `Previous ${this.conversationHistory.length} selection(s) in this session:\n\n${summary}`;
  }

  /**
   * Clear conversation history (memory and disk)
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.saveHistory(); // Clear disk storage too
    logger.info('Conversation history cleared');
  }

  /**
   * Get current history size
   */
  getHistorySize(): number {
    return this.conversationHistory.length;
  }

  /**
   * Load conversation history from disk
   */
  private loadHistory(): void {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const history = JSON.parse(data);

        if (Array.isArray(history)) {
          this.conversationHistory = history.slice(-this.maxHistorySize); // Keep only last N entries
          logger.info({
            historySize: this.conversationHistory.length,
            historyFile: HISTORY_FILE,
          }, 'Loaded conversation history from disk');
        }
      }
    } catch (error) {
      logger.warn({ error, historyFile: HISTORY_FILE }, 'Failed to load conversation history, starting fresh');
      this.conversationHistory = [];
    }
  }

  /**
   * Save conversation history to disk
   */
  private saveHistory(): void {
    try {
      // Ensure directory exists
      if (!fs.existsSync(HISTORY_DIR)) {
        fs.mkdirSync(HISTORY_DIR, { recursive: true });
      }

      // Save history as pretty JSON
      fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(this.conversationHistory, null, 2),
        'utf-8'
      );

      logger.debug({
        historySize: this.conversationHistory.length,
        historyFile: HISTORY_FILE,
      }, 'Saved conversation history to disk');
    } catch (error) {
      logger.error({ error, historyFile: HISTORY_FILE }, 'Failed to save conversation history');
    }
  }

  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(personas: Array<{ id: string; name: string; description: string; strengths: string[] }>): string {
    const historyContext = this.getHistorySummary();

    return `You are an intelligent agent persona selector for an R2R RAG/GraphRAG agent system.

Your task: Analyze user requests and select the BEST agent persona to handle them.

**IMPORTANT: Consider conversation history** when making your selection. If the user has been working on related tasks, maintain context and continuity. For example:
- If previous requests were about debugging, the current request might be a follow-up
- If user switched from debugging to implementing, they might need a different persona
- Recognize patterns: testing → fixing bugs → implementing features → architecture review

Conversation History:
${historyContext}

Available Personas:
${personas.map(p => `
**${p.id}** (${p.name})
Description: ${p.description}
Best for: ${p.strengths.join(', ')}
`).join('\n')}

Selection Guidelines:
1. **Understand Intent**: Look beyond keywords - understand what the user really wants
2. **Consider Context**: What type of help does the user need? (code, architecture, debugging, learning, testing)
3. **Match Strengths**: Select the persona whose strengths best align with the request
4. **Be Confident**: Give high confidence (0.8+) for clear requests, lower (0.5-0.7) for ambiguous ones
5. **Language Agnostic**: Analyze requests in any language (English, Russian, etc.)
6. **Default Wisely**: When uncertain, prefer 'developer' (general purpose) or 'learner' (explanatory)

Key Decision Patterns:
- Code implementation, features, APIs → **developer**
- Architecture, design, structure, relationships → **architect**
- Errors, bugs, crashes, debugging → **debugger**
- Understanding, explanation, learning → **learner**
- Testing, coverage, quality, validation → **tester**`;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(request: string): string {
    return `Analyze this request and select the best persona to handle it:

Request: "${request}"

Select the persona that can best address this request. Consider:
- What is the user asking for?
- What type of expertise is needed?
- What would be the most helpful response?
- **How does this request relate to previous requests in the conversation history?**
- Should you maintain the same persona for continuity, or switch to a different one?

Guidelines for using history:
- If this is a follow-up question (e.g., "why does it fail?" after "implement X"), consider the context
- If user is switching topics completely, don't be constrained by previous selections
- Recognize work patterns: testing → debugging → implementing → architecture review
- Higher confidence when request clearly follows from history

Return a JSON object with:
- persona: the selected persona ID
- reasoning: brief explanation (1-2 sentences) - mention if history influenced your choice
- confidence: score from 0 to 1 (higher if history provides clear context)`;
  }

  /**
   * Get persona strengths for description
   */
  private getPersonaStrengths(personaId: string): string[] {
    const strengths: Record<string, string[]> = {
      developer: [
        'Code implementation',
        'API development',
        'Feature building',
        'Code examples',
        'Technical implementation',
      ],
      architect: [
        'System design',
        'Architecture patterns',
        'Code structure',
        'Module relationships',
        'Dependency analysis',
      ],
      debugger: [
        'Error diagnosis',
        'Bug fixing',
        'Performance issues',
        'Troubleshooting',
        'Root cause analysis',
      ],
      learner: [
        'Concept explanation',
        'Documentation',
        'Theory and principles',
        'Understanding complex topics',
        'Educational guidance',
      ],
      tester: [
        'Test coverage',
        'Quality assurance',
        'Test strategy',
        'Validation and verification',
        'Testing best practices',
      ],
    };

    return strengths[personaId] || ['General assistance'];
  }

  /**
   * Check if AI selection is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
