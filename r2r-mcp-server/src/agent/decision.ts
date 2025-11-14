/**
 * Agent Decision-Making System
 * Autonomous tool selection and workflow planning
 */

import { createModuleLogger } from '../logger.js';
import type { AgentPersona } from './config.js';
import { AIPersonaSelector } from './ai-persona-selector.js';

const logger = createModuleLogger('agent:decision');

// Initialize AI persona selector (singleton)
const aiSelector = new AIPersonaSelector();

/**
 * Tool selection decision
 */
export interface ToolDecision {
  tool_name: string;
  arguments: Record<string, unknown>;
  reasoning: string;
  confidence: number; // 0-1
}

/**
 * Workflow plan
 */
export interface WorkflowPlan {
  steps: ToolDecision[];
  parallel_groups: number[][]; // Indices of steps that can run in parallel
  estimated_duration_ms: number;
}

/**
 * Decision maker for autonomous agent behavior
 */
export class DecisionMaker {
  constructor(
    private persona: AgentPersona
  ) {}

  /**
   * Automatically select best persona based on request analysis
   * Uses AI (OpenAI) when available, falls back to keyword matching
   */
  static async selectPersona(request: string): Promise<string> {
    // Try AI selection first if enabled
    if (aiSelector.isEnabled()) {
      try {
        const aiResult = await aiSelector.selectPersona(request);

        logger.info({
          request: request.substring(0, 100),
          selectedPersona: aiResult.persona,
          reasoning: aiResult.reasoning,
          confidence: aiResult.confidence,
          method: 'ai'
        }, 'AI selected persona');

        return aiResult.persona;
      } catch (error) {
        logger.warn({ error }, 'AI persona selection failed, falling back to keyword matching');
        // Continue to fallback
      }
    }

    // Fallback to keyword-based selection
    logger.info('Using keyword-based persona selection');
    const lowerRequest = request.toLowerCase();

    // Persona selection patterns with confidence
    const personaScores: Record<string, number> = {
      developer: 0,
      architect: 0,
      debugger: 0,
      learner: 0,
      tester: 0,
    };

    // Developer patterns
    if (/implement|build|create|add|code|function|api|endpoint/.test(lowerRequest)) {
      personaScores.developer += 3;
    }
    if (/example|how to|snippet|sample/.test(lowerRequest)) {
      personaScores.developer += 2;
    }

    // Architect patterns
    if (/architecture|structure|design|pattern|overview|system/.test(lowerRequest)) {
      personaScores.architect += 3;
    }
    if (/depend|relationship|connect|module|component/.test(lowerRequest)) {
      personaScores.architect += 2;
    }
    if (/graph|hierarchy|organization/.test(lowerRequest)) {
      personaScores.architect += 2;
    }

    // Debugger patterns
    if (/error|bug|fail|broken|issue|problem|wrong|crash/.test(lowerRequest)) {
      personaScores.debugger += 3;
    }
    if (/debug|fix|troubleshoot|diagnose|why/.test(lowerRequest)) {
      personaScores.debugger += 2;
    }
    if (/timeout|exception|trace|stack/.test(lowerRequest)) {
      personaScores.debugger += 2;
    }

    // Learner patterns
    if (/what|how|why|explain|understand|learn|teach|tell me/.test(lowerRequest)) {
      personaScores.learner += 2;
    }
    if (/concept|theory|principle|idea|documentation/.test(lowerRequest)) {
      personaScores.learner += 2;
    }
    if (/mean|definition|describe/.test(lowerRequest)) {
      personaScores.learner += 1;
    }

    // Tester patterns
    if (/test|testing|coverage|unit test|integration/.test(lowerRequest)) {
      personaScores.tester += 4; // Higher priority for explicit testing terms
    }
    if (/quality|qa|verify|validate/.test(lowerRequest)) {
      personaScores.tester += 2;
    }

    // Find highest scoring persona (prefer more specialized persona in case of tie)
    const personaPriority = ['architect', 'debugger', 'tester', 'learner', 'developer'];
    let bestPersona = 'developer'; // default
    let maxScore = 0;

    for (const persona of personaPriority) {
      const score = personaScores[persona];
      if (score >= maxScore) {
        maxScore = score;
        bestPersona = persona;
      }
    }

    // Log decision
    logger.info({
      request: request.substring(0, 100),
      selectedPersona: bestPersona,
      scores: personaScores,
      confidence: maxScore > 0 ? 'auto-selected' : 'default'
    }, 'Auto-selected persona');

    return bestPersona;
  }

  /**
   * Analyze user request and decide which tools to use
   */
  async analyzeRequest(request: string): Promise<ToolDecision[]> {
    logger.info({ request: request.substring(0, 100) }, 'Analyzing request');

    const decisions: ToolDecision[] = [];

    // Pattern matching for common request types
    const patterns = this.getRequestPatterns();

    for (const pattern of patterns) {
      if (pattern.matches(request)) {
        const decision = pattern.createDecision(request, this.persona);
        if (decision.confidence >= 0.6) {
          decisions.push(decision);
        }
      }
    }

    // Sort by confidence
    decisions.sort((a, b) => b.confidence - a.confidence);

    logger.info({
      decisionsCount: decisions.length,
      topDecision: decisions[0]?.tool_name
    }, 'Request analysis completed');

    return decisions;
  }

  /**
   * Create workflow plan from decisions
   */
  async createWorkflowPlan(decisions: ToolDecision[]): Promise<WorkflowPlan> {
    logger.info({ stepsCount: decisions.length }, 'Creating workflow plan');

    // Analyze dependencies between tools
    const parallelGroups = this.identifyParallelSteps(decisions);

    // Estimate duration
    const estimatedDuration = decisions.reduce((sum, d) => {
      return sum + this.estimateToolDuration(d.tool_name);
    }, 0);

    return {
      steps: decisions,
      parallel_groups: parallelGroups,
      estimated_duration_ms: estimatedDuration,
    };
  }

  /**
   * Decide whether to store an experience
   */
  shouldStoreExperience(
    outcome: 'success' | 'failure' | 'partial',
    confidence: number
  ): boolean {
    // Always store failures for learning
    if (outcome === 'failure') return true;

    // Store successes based on persona learning rate and confidence
    const learningRate = this.persona.learning_rate;

    if (learningRate === 'aggressive') return true;
    if (learningRate === 'moderate') return confidence >= 0.7;
    if (learningRate === 'conservative') return confidence >= 0.85;

    return false;
  }

  /**
   * Decide when to trigger reflection
   */
  shouldTriggerReflection(experiencesStored: number, autoReflectFrequency: number): boolean {
    return autoReflectFrequency > 0 && experiencesStored % autoReflectFrequency === 0;
  }

  /**
   * Clear AI conversation history
   */
  clearConversationHistory(): void {
    if (aiSelector.isEnabled()) {
      aiSelector.clearHistory();
      logger.info('AI conversation history cleared');
    }
  }

  /**
   * Get AI conversation history size
   */
  getConversationHistorySize(): number {
    return aiSelector.isEnabled() ? aiSelector.getHistorySize() : 0;
  }

  /**
   * Get request patterns for tool selection
   */
  private getRequestPatterns(): RequestPattern[] {
    return [
      // Search patterns
      {
        matches: (req: string) => /find|search|look for|where is/.test(req.toLowerCase()),
        createDecision: (req: string, persona: AgentPersona) => ({
          tool_name: 'search_documentation',
          arguments: {
            query: req,
            top_k: persona.default_top_k,
            search_mode: persona.search_strategy === 'precise' ? 'keyword' : 'hybrid',
          },
          reasoning: 'User is searching for information',
          confidence: 0.85,
        }),
      },

      // Code examples pattern
      {
        matches: (req: string) =>
          /example|how to|implement|code for/.test(req.toLowerCase()) &&
          /(function|class|component|api)/.test(req.toLowerCase()),
        createDecision: (req: string, persona: AgentPersona) => ({
          tool_name: 'search_code_examples',
          arguments: {
            description: req,
            top_k: persona.default_top_k,
          },
          reasoning: 'User needs code examples',
          confidence: 0.80,
        }),
      },

      // Implementation help pattern
      {
        matches: (req: string) => /implement|build|create|add|feature/.test(req.toLowerCase()),
        createDecision: (req: string, _persona: AgentPersona) => ({
          tool_name: 'get_implementation_help',
          arguments: {
            feature_description: req,
          },
          reasoning: 'User needs implementation guidance',
          confidence: 0.75,
        }),
      },

      // Debug pattern
      {
        matches: (req: string) =>
          /error|bug|fail|broken|issue|problem|debug|why/.test(req.toLowerCase()),
        createDecision: (req: string, _persona: AgentPersona) => ({
          tool_name: 'debug_with_rag',
          arguments: {
            error_message: req,
          },
          reasoning: 'User is debugging an issue',
          confidence: 0.85,
        }),
      },

      // Architecture pattern
      {
        matches: (req: string) =>
          /architecture|structure|design|how does|explain|understand/.test(req.toLowerCase()),
        createDecision: (req: string, _persona: AgentPersona) => ({
          tool_name: 'explain_architecture',
          arguments: {
            aspect: req,
          },
          reasoning: 'User wants to understand architecture',
          confidence: 0.75,
        }),
      },

      // Dependencies pattern
      {
        matches: (req: string) => /depend|import|use|require/.test(req.toLowerCase()),
        createDecision: (req: string, _persona: AgentPersona) => ({
          tool_name: 'find_dependencies',
          arguments: {
            module_path: this.extractModulePath(req),
            include_transitive: /all|transitive|indirect/.test(req.toLowerCase()),
          },
          reasoning: 'User wants to understand dependencies',
          confidence: 0.70,
        }),
      },

      // Test pattern
      {
        matches: (req: string) => /test|coverage|tested|testing/.test(req.toLowerCase()),
        createDecision: (req: string, _persona: AgentPersona) => ({
          tool_name: 'find_test_coverage',
          arguments: {
            module_path: this.extractModulePath(req),
          },
          reasoning: 'User is checking test coverage',
          confidence: 0.75,
        }),
      },

      // Question pattern (RAG)
      {
        matches: (req: string) =>
          /what|how|why|when|who|where|explain|tell me|describe/.test(req.toLowerCase()),
        createDecision: (req: string, persona: AgentPersona) => ({
          tool_name: 'ask_documentation',
          arguments: {
            question: req,
            top_k: persona.rag_context_size,
            include_sources: true,
          },
          reasoning: 'User has a question about the project',
          confidence: 0.70,
        }),
      },

      // Graph exploration pattern
      {
        matches: (req: string) =>
          /explore|overview|map|connected|relationship/.test(req.toLowerCase()),
        createDecision: (req: string, persona: AgentPersona) => ({
          tool_name: 'explore_architecture_graph',
          arguments: {
            root_module: this.extractModulePath(req) || 'src/',
            max_depth: persona.graph_depth,
          },
          reasoning: 'User wants to explore code relationships',
          confidence: 0.70,
        }),
      },
    ];
  }

  /**
   * Identify which steps can run in parallel
   */
  private identifyParallelSteps(decisions: ToolDecision[]): number[][] {
    // Simple heuristic: search tools can run in parallel, others sequential
    const parallelToolGroups: string[][] = [
      ['search_documentation', 'search_code_examples', 'find_test_examples'],
    ];

    const groups: number[][] = [];
    let currentGroup: number[] = [];

    decisions.forEach((decision, index) => {
      const canParallel = parallelToolGroups.some(group =>
        group.includes(decision.tool_name)
      );

      if (canParallel && currentGroup.length === 0) {
        currentGroup.push(index);
      } else if (canParallel && currentGroup.length > 0) {
        currentGroup.push(index);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        groups.push([index]);
        currentGroup = [];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Estimate tool execution duration
   */
  private estimateToolDuration(toolName: string): number {
    const estimates: Record<string, number> = {
      search_documentation: 500,
      search_code_examples: 500,
      find_test_examples: 500,
      ask_documentation: 2000,
      get_implementation_help: 2500,
      debug_with_rag: 2000,
      explain_architecture: 2500,
      store_experience: 800,
      retrieve_similar_experiences: 1000,
      reflect_on_patterns: 2000,
      get_memory_stats: 300,
      query_code_relationships: 1500,
      find_dependencies: 1200,
      find_usages: 1200,
      find_test_coverage: 1000,
      explore_architecture_graph: 2000,
    };

    return estimates[toolName] || 1000;
  }

  /**
   * Extract module path from request
   */
  private extractModulePath(request: string): string {
    // Look for file path patterns
    const pathMatch = request.match(/([a-z0-9_/-]+\.(ts|js|tsx|jsx|py))/i);
    if (pathMatch) return pathMatch[1];

    // Look for src/ patterns
    const srcMatch = request.match(/(src\/[a-z0-9_/-]+)/i);
    if (srcMatch) return srcMatch[1];

    // Default
    return 'src/';
  }
}

/**
 * Request pattern interface
 */
interface RequestPattern {
  matches: (request: string) => boolean;
  createDecision: (request: string, persona: AgentPersona) => ToolDecision;
}
