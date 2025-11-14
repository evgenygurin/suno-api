/**
 * R2R Agent Core Orchestration Engine
 * Autonomous agent that orchestrates all MCP tools with intelligence
 */

import { createModuleLogger } from '../logger.js';
import { AgentContext, StateManager, type ConversationState } from './context.js';
import { DecisionMaker, type ToolDecision, type WorkflowPlan } from './decision.js';
import {
  validateConfig,
  AGENT_PERSONAS,
  type AgentConfig,
  type AgentPersona,
} from './config.js';

// Tool imports
import { searchDocumentation, searchCodeExamples, findTestExamples } from '../tools/search.js';
import {
  askDocumentation,
  getImplementationHelp,
  debugWithRAG,
  explainArchitecture,
} from '../tools/rag.js';
import {
  storeExperience,
  retrieveSimilarExperiences,
  reflectOnPatterns,
  getMemoryStats,
} from '../tools/memory.js';
import {
  queryCodeRelationships,
  findDependencies,
  findUsages,
  findTestCoverage,
  exploreArchitectureGraph,
} from '../tools/graph.js';

const logger = createModuleLogger('agent:core');

/**
 * Agent response
 */
export interface AgentResponse {
  answer: string;
  sources?: Array<{ content: string; metadata: Record<string, unknown> }>;
  tool_calls: Array<{
    tool: string;
    success: boolean;
    duration_ms: number;
  }>;
  reasoning: string[];
  confidence: number;
  metadata: {
    execution_time_ms: number;
    persona: string;
    mode: string;
  };
}

/**
 * R2R Agent - Intelligent RAG/GraphRAG orchestration
 */
export class R2RAgent {
  private config: AgentConfig;
  private persona: AgentPersona;
  private context: AgentContext;
  private stateManager: StateManager;
  private decisionMaker: DecisionMaker;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = validateConfig(config);
    this.persona = AGENT_PERSONAS[this.config.persona];
    this.context = new AgentContext(this.config.max_context_memory);
    this.stateManager = new StateManager();
    this.decisionMaker = new DecisionMaker(this.persona);

    logger.info({
      persona: this.persona.name,
      mode: this.config.mode
    }, 'Agent initialized');
  }

  /**
   * Process user request with autonomous tool orchestration
   * Auto-selects persona if config allows
   */
  async process(request: string, autoSelectPersona: boolean = false): Promise<AgentResponse> {
    const startTime = Date.now();

    // Auto-select persona if enabled
    if (autoSelectPersona) {
      const selectedPersonaId = await DecisionMaker.selectPersona(request);
      if (selectedPersonaId !== this.persona.id) {
        this.changePersona(selectedPersonaId);
      }
    }

    logger.info({ request: request.substring(0, 100), persona: this.persona.id }, 'Processing request');

    // Add request to context
    this.context.add({
      type: 'user_message',
      content: { message: request },
    });

    try {
      // Step 1: Analyze request and decide which tools to use
      const decisions = await this.decisionMaker.analyzeRequest(request);

      if (decisions.length === 0) {
        logger.warn('No tools matched the request');
        return this.createFallbackResponse(request, startTime);
      }

      // Step 2: Create workflow plan
      const plan = await this.decisionMaker.createWorkflowPlan(decisions);

      // Step 3: Execute workflow
      const results = await this.executeWorkflow(plan);

      // Step 4: Synthesize answer
      const response = await this.synthesizeAnswer(request, results, decisions, startTime);

      // Step 5: Store experience if appropriate
      await this.considerStoringExperience(request, response);

      // Step 6: Trigger reflection if needed
      await this.considerReflection();

      return response;
    } catch (error) {
      logger.error({ error }, 'Agent processing error');

      return {
        answer: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tool_calls: [],
        reasoning: ['Error during processing'],
        confidence: 0,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          persona: this.persona.id,
          mode: this.config.mode,
        },
      };
    }
  }

  /**
   * Execute workflow plan
   */
  private async executeWorkflow(plan: WorkflowPlan): Promise<Array<{
    tool: string;
    success: boolean;
    result: unknown;
    duration_ms: number;
  }>> {
    logger.info({ stepsCount: plan.steps.length }, 'Executing workflow');

    const results: Array<{
      tool: string;
      success: boolean;
      result: unknown;
      duration_ms: number;
    }> = [];

    for (const group of plan.parallel_groups) {
      const groupSteps = group.map(index => plan.steps[index]);

      // Execute steps in group (parallel if multiple)
      const groupPromises = groupSteps.map(step => this.executeTool(step));

      if (this.config.parallel_tool_execution && groupSteps.length > 1) {
        // Parallel execution
        const groupResults = await Promise.allSettled(groupPromises);
        groupResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              tool: groupSteps[index].tool_name,
              success: false,
              result: { error: result.reason },
              duration_ms: 0,
            });
          }
        });
      } else {
        // Sequential execution
        for (const step of groupSteps) {
          const result = await this.executeTool(step);
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Execute single tool
   */
  private async executeTool(decision: ToolDecision): Promise<{
    tool: string;
    success: boolean;
    result: unknown;
    duration_ms: number;
  }> {
    const startTime = Date.now();

    logger.info({
      tool: decision.tool_name,
      reasoning: decision.reasoning
    }, 'Executing tool');

    // Add to context
    this.context.add({
      type: 'tool_call',
      content: {
        tool_name: decision.tool_name,
        arguments: decision.arguments,
        reasoning: decision.reasoning,
      },
    });

    try {
      let result: unknown;

      // Route to appropriate tool
      switch (decision.tool_name) {
        case 'search_documentation':
          result = await searchDocumentation(decision.arguments as Parameters<typeof searchDocumentation>[0]);
          break;
        case 'search_code_examples':
          result = await searchCodeExamples(decision.arguments as Parameters<typeof searchCodeExamples>[0]);
          break;
        case 'find_test_examples':
          result = await findTestExamples(decision.arguments as Parameters<typeof findTestExamples>[0]);
          break;
        case 'ask_documentation':
          result = await askDocumentation(decision.arguments as Parameters<typeof askDocumentation>[0]);
          break;
        case 'get_implementation_help':
          result = await getImplementationHelp(decision.arguments as Parameters<typeof getImplementationHelp>[0]);
          break;
        case 'debug_with_rag':
          result = await debugWithRAG(decision.arguments as Parameters<typeof debugWithRAG>[0]);
          break;
        case 'explain_architecture':
          result = await explainArchitecture(decision.arguments as Parameters<typeof explainArchitecture>[0]);
          break;
        case 'retrieve_similar_experiences':
          result = await retrieveSimilarExperiences(decision.arguments as Parameters<typeof retrieveSimilarExperiences>[0]);
          break;
        case 'reflect_on_patterns':
          result = await reflectOnPatterns(decision.arguments as Parameters<typeof reflectOnPatterns>[0]);
          break;
        case 'get_memory_stats':
          result = await getMemoryStats();
          break;
        case 'query_code_relationships':
          result = await queryCodeRelationships(decision.arguments as Parameters<typeof queryCodeRelationships>[0]);
          break;
        case 'find_dependencies':
          result = await findDependencies(decision.arguments as Parameters<typeof findDependencies>[0]);
          break;
        case 'find_usages':
          result = await findUsages(decision.arguments as Parameters<typeof findUsages>[0]);
          break;
        case 'find_test_coverage':
          result = await findTestCoverage(decision.arguments as Parameters<typeof findTestCoverage>[0]);
          break;
        case 'explore_architecture_graph':
          result = await exploreArchitectureGraph(decision.arguments as Parameters<typeof exploreArchitectureGraph>[0]);
          break;
        default:
          throw new Error(`Unknown tool: ${decision.tool_name}`);
      }

      const duration = Date.now() - startTime;
      const success = (result as any)?.success !== false;

      // Add result to context
      this.context.add({
        type: 'tool_result',
        content: result,
        metadata: { tool_name: decision.tool_name, duration_ms: duration },
      });

      logger.info({
        tool: decision.tool_name,
        success,
        duration_ms: duration
      }, 'Tool executed');

      return {
        tool: decision.tool_name,
        success,
        result,
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error({
        tool: decision.tool_name,
        error
      }, 'Tool execution failed');

      return {
        tool: decision.tool_name,
        success: false,
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration_ms: duration,
      };
    }
  }

  /**
   * Synthesize answer from tool results
   */
  private async synthesizeAnswer(
    _request: string,
    results: Array<{ tool: string; success: boolean; result: unknown; duration_ms: number }>,
    decisions: ToolDecision[],
    startTime: number
  ): Promise<AgentResponse> {
    logger.info({ resultsCount: results.length }, 'Synthesizing answer');

    // Extract main answer from RAG results
    let mainAnswer: string | undefined;
    let sources: Array<{ content: string; metadata: Record<string, unknown> }> = [];

    const ragResults = results.filter(r =>
      r.tool.includes('ask') || r.tool.includes('help') || r.tool.includes('debug') || r.tool.includes('explain')
    );

    if (ragResults.length > 0) {
      const ragResult = ragResults[0].result as any;
      if (ragResult?.success && ragResult?.data) {
        mainAnswer = ragResult.data.answer;
        sources = ragResult.data.sources || [];
      }
    }

    // If no RAG answer, construct from search/graph results
    if (!mainAnswer) {
      mainAnswer = this.constructAnswerFromResults(results);
    }

    const toolCalls = results.map(r => ({
      tool: r.tool,
      success: r.success,
      duration_ms: r.duration_ms,
    }));

    const reasoning = decisions.map(d => d.reasoning);

    // Calculate confidence
    const successRate = results.filter(r => r.success).length / results.length;
    const avgDecisionConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
    const confidence = (successRate + avgDecisionConfidence) / 2;

    return {
      answer: mainAnswer,
      sources: sources.length > 0 ? sources : undefined,
      tool_calls: toolCalls,
      reasoning,
      confidence,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        persona: this.persona.id,
        mode: this.config.mode,
      },
    };
  }

  /**
   * Construct answer from non-RAG results
   */
  private constructAnswerFromResults(
    results: Array<{ tool: string; success: boolean; result: unknown }>
  ): string {
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      return 'I was unable to find relevant information to answer your question.';
    }

    const parts: string[] = ['Based on the available information:\n'];

    for (const result of successfulResults) {
      const data = (result.result as any)?.data;

      if (Array.isArray(data)) {
        parts.push(`\n**${result.tool}** found ${data.length} results.`);
      } else if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        parts.push(`\n**${result.tool}** returned: ${keys.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Create fallback response when no tools match
   */
  private createFallbackResponse(_request: string, startTime: number): AgentResponse {
    return {
      answer: `I'm not sure how to help with that request. I have ${Object.keys(AGENT_PERSONAS).length} personas available (${Object.keys(AGENT_PERSONAS).join(', ')}). Try asking about code, architecture, debugging, or testing.`,
      tool_calls: [],
      reasoning: ['No matching tools for request'],
      confidence: 0.3,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        persona: this.persona.id,
        mode: this.config.mode,
      },
    };
  }

  /**
   * Consider storing experience
   */
  private async considerStoringExperience(
    request: string,
    response: AgentResponse
  ): Promise<void> {
    if (!this.persona.store_experiences_automatically) return;

    const outcome = response.confidence >= 0.7 ? 'success'
      : response.confidence >= 0.4 ? 'partial'
      : 'failure';

    const shouldStore = this.decisionMaker.shouldStoreExperience(outcome, response.confidence);

    if (shouldStore) {
      logger.info({ outcome, confidence: response.confidence }, 'Storing experience');

      await storeExperience({
        timestamp: new Date().toISOString(),
        context: {
          task: request,
          technologies: [this.persona.id],
        },
        action_taken: `Used tools: ${response.tool_calls.map(t => t.tool).join(', ')}`,
        outcome,
        learned_pattern: response.reasoning.join('; '),
        tags: [this.persona.id, 'agent', outcome],
        confidence: response.confidence,
      });

      this.stateManager.recordExperience();
    }
  }

  /**
   * Consider triggering reflection
   */
  private async considerReflection(): Promise<void> {
    const state = this.stateManager.getState();

    const shouldReflect = this.decisionMaker.shouldTriggerReflection(
      state.experiences_stored,
      this.config.auto_reflect_frequency
    );

    if (shouldReflect) {
      logger.info({ experiencesStored: state.experiences_stored }, 'Triggering reflection');

      await reflectOnPatterns({
        area: this.persona.id,
      });

      this.stateManager.recordReflection();
    }
  }

  /**
   * Get agent status
   */
  getStatus(): {
    config: AgentConfig;
    persona: AgentPersona;
    context_summary: ReturnType<AgentContext['getSummary']>;
    tool_stats: ReturnType<AgentContext['getToolStats']>;
    state: ConversationState;
  } {
    return {
      config: this.config,
      persona: this.persona,
      context_summary: this.context.getSummary(),
      tool_stats: this.context.getToolStats(),
      state: this.stateManager.getState(),
    };
  }

  /**
   * Change persona
   */
  changePersona(personaId: string): void {
    if (!AGENT_PERSONAS[personaId]) {
      throw new Error(`Unknown persona: ${personaId}`);
    }

    this.persona = AGENT_PERSONAS[personaId];
    this.config.persona = personaId;
    this.decisionMaker = new DecisionMaker(this.persona);

    logger.info({ newPersona: this.persona.name }, 'Persona changed');
  }

  /**
   * Reset agent state
   */
  reset(): void {
    this.context.clear();
    this.stateManager.reset();
    logger.info('Agent reset');
  }
}
