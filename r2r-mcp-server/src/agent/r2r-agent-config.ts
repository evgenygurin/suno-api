/**
 * R2R Agent Configuration Mapping
 * Maps persona selections to R2R Agent API configurations
 *
 * This connects our AI Persona Selector to R2R Agent API:
 * 1. AI Persona Selector analyzes request → selects persona
 * 2. Persona → R2R Agent configuration (mode, tools, params)
 * 3. Call R2R Agent API with configuration
 */

/**
 * R2R Agent mode configuration
 */
export type R2RAgentMode = 'rag' | 'research';

/**
 * R2R Agent tools (from R2R API documentation)
 */
export type R2RAgentTool =
  // RAG mode tools
  | 'search_file_knowledge'
  | 'get_file_content'
  | 'web_search'
  | 'web_scrape'
  // Research mode tools
  | 'rag'
  | 'reasoning'
  | 'critique'
  | 'python_executor';

/**
 * R2R Agent generation configuration
 */
export interface R2RGenerationConfig {
  model: string;
  extended_thinking?: boolean;
  thinking_budget?: number;
  temperature: number;
  top_p?: number | null;
  max_tokens_to_sample: number;
  stream: boolean;
}

/**
 * R2R Agent search settings
 */
export interface R2RSearchSettings {
  use_semantic_search?: boolean;
  use_fulltext_search?: boolean;
  use_hybrid_search?: boolean;
  hybrid_settings?: {
    full_text_weight: number;
    semantic_weight: number;
    full_text_limit?: number;
    rrf_k?: number;
  };
  filters?: Record<string, any>;
  limit?: number;
  use_web_search?: boolean;
  graph_settings?: {
    enabled: boolean;
  };
}

/**
 * Complete R2R Agent configuration
 */
export interface R2RAgentConfig {
  mode: R2RAgentMode;
  tools: R2RAgentTool[];
  generation_config: R2RGenerationConfig;
  search_settings: R2RSearchSettings;
}

/**
 * Persona-to-R2R mapping profiles
 */
export const PERSONA_R2R_CONFIGS: Record<string, R2RAgentConfig> = {
  developer: {
    mode: 'rag',
    tools: ['search_file_knowledge', 'get_file_content'],
    generation_config: {
      model: 'anthropic/claude-3-7-sonnet-20250219',
      extended_thinking: false,
      temperature: 0.3, // Low temp for precise code examples
      max_tokens_to_sample: 2000,
      stream: true,
    },
    search_settings: {
      use_semantic_search: true,
      use_fulltext_search: true,
      limit: 7,
      graph_settings: { enabled: true },
    },
  },

  architect: {
    mode: 'research', // Complex analysis requires research mode
    tools: ['rag', 'reasoning', 'critique'],
    generation_config: {
      model: 'anthropic/claude-3-opus-20240229', // Opus for architectural analysis
      extended_thinking: true,
      thinking_budget: 6144, // Higher budget for complex reasoning
      temperature: 0.5,
      max_tokens_to_sample: 4000,
      stream: true,
    },
    search_settings: {
      use_hybrid_search: true,
      hybrid_settings: {
        full_text_weight: 1.0,
        semantic_weight: 5.0,
        rrf_k: 50,
      },
      limit: 10, // More context for architecture
      graph_settings: { enabled: true },
    },
  },

  debugger: {
    mode: 'rag',
    tools: ['search_file_knowledge', 'get_file_content', 'web_search'],
    generation_config: {
      model: 'anthropic/claude-3-7-sonnet-20250219',
      extended_thinking: true,
      thinking_budget: 4096, // Extended thinking for debugging
      temperature: 0.4,
      max_tokens_to_sample: 2500,
      stream: true,
    },
    search_settings: {
      use_semantic_search: true,
      use_fulltext_search: true,
      limit: 8,
      use_web_search: true, // Can search for error solutions online
      graph_settings: { enabled: true },
    },
  },

  learner: {
    mode: 'rag',
    tools: ['search_file_knowledge', 'get_file_content', 'web_search'],
    generation_config: {
      model: 'anthropic/claude-3-7-sonnet-20250219',
      extended_thinking: false,
      temperature: 0.7, // Higher temp for varied explanations
      max_tokens_to_sample: 3000, // More tokens for detailed explanations
      stream: true,
    },
    search_settings: {
      use_semantic_search: true,
      use_fulltext_search: false, // Focus on semantic understanding
      limit: 8,
      use_web_search: true, // Can search for additional learning resources
      graph_settings: { enabled: false },
    },
  },

  tester: {
    mode: 'research', // Testing might require code execution
    tools: ['rag', 'reasoning', 'python_executor'],
    generation_config: {
      model: 'anthropic/claude-3-7-sonnet-20250219',
      extended_thinking: true,
      thinking_budget: 4096,
      temperature: 0.3,
      max_tokens_to_sample: 2000,
      stream: true,
    },
    search_settings: {
      use_semantic_search: true,
      use_fulltext_search: true,
      limit: 6,
      graph_settings: { enabled: true },
    },
  },
};

/**
 * Request complexity analysis
 */
export type RequestComplexity = 'simple' | 'moderate' | 'complex';

export interface RequestAnalysis {
  complexity: RequestComplexity;
  requires_code_execution: boolean;
  requires_web_search: boolean;
  requires_multi_step_reasoning: boolean;
  estimated_thinking_budget: number;
}

/**
 * Analyze request to determine optimal R2R Agent configuration
 */
export function analyzeRequest(request: string): RequestAnalysis {
  const lowerRequest = request.toLowerCase();

  // Check for code execution indicators
  const requiresCodeExecution =
    /calculate|compute|run|execute|factorial|algorithm complexity/.test(lowerRequest);

  // Check for web search indicators
  const requiresWebSearch =
    /latest|current|recent|compare with|industry|best practices|trends/.test(lowerRequest);

  // Check for multi-step reasoning indicators
  const requiresMultiStep =
    /analyze.*implications|compare.*evaluate|design.*implement|review.*suggest/.test(lowerRequest) ||
    /why.*how|what.*why|explain.*analyze/.test(lowerRequest);

  // Determine complexity
  let complexity: RequestComplexity = 'simple';
  let thinkingBudget = 0;

  if (requiresCodeExecution || requiresMultiStep) {
    complexity = 'complex';
    thinkingBudget = 8192;
  } else if (requiresWebSearch || lowerRequest.split(' ').length > 15) {
    complexity = 'moderate';
    thinkingBudget = 4096;
  }

  return {
    complexity,
    requires_code_execution: requiresCodeExecution,
    requires_web_search: requiresWebSearch,
    requires_multi_step_reasoning: requiresMultiStep,
    estimated_thinking_budget: thinkingBudget,
  };
}

/**
 * Get R2R Agent configuration for a persona and request
 *
 * This is the main function that connects AI Persona Selector to R2R Agent:
 * 1. Takes selected persona + user request
 * 2. Analyzes request complexity
 * 3. Returns optimized R2R Agent configuration
 */
export function getR2RAgentConfig(
  personaId: string,
  request: string,
  conversationHistory?: any[]
): R2RAgentConfig {
  // Get base configuration for persona
  const baseConfig = PERSONA_R2R_CONFIGS[personaId] || PERSONA_R2R_CONFIGS.developer;

  // Analyze request to optimize configuration
  const analysis = analyzeRequest(request);

  // Clone config to avoid mutation
  const config: R2RAgentConfig = JSON.parse(JSON.stringify(baseConfig));

  // Adjust based on request analysis

  // 1. Upgrade to research mode if needed
  if (analysis.requires_multi_step_reasoning && config.mode === 'rag') {
    config.mode = 'research';
    config.tools = ['rag', 'reasoning'];
  }

  // 2. Add code execution tool if needed
  if (analysis.requires_code_execution && !config.tools.includes('python_executor')) {
    if (config.mode === 'research') {
      config.tools.push('python_executor');
    } else {
      // Upgrade to research mode for code execution
      config.mode = 'research';
      config.tools = ['rag', 'reasoning', 'python_executor'];
    }
  }

  // 3. Add web search if needed
  if (analysis.requires_web_search) {
    if (config.mode === 'rag' && !config.tools.includes('web_search')) {
      config.tools.push('web_search' as R2RAgentTool);
    }
    config.search_settings.use_web_search = true;
  }

  // 4. Adjust thinking budget
  if (config.generation_config.extended_thinking) {
    config.generation_config.thinking_budget = Math.max(
      config.generation_config.thinking_budget || 0,
      analysis.estimated_thinking_budget
    );
  } else if (analysis.estimated_thinking_budget > 0) {
    // Enable extended thinking if needed
    config.generation_config.extended_thinking = true;
    config.generation_config.thinking_budget = analysis.estimated_thinking_budget;
  }

  // 5. Adjust based on conversation history length
  if (conversationHistory && conversationHistory.length > 5) {
    // Long conversation - increase context
    config.search_settings.limit = Math.min(
      (config.search_settings.limit || 5) + 3,
      15
    );
  }

  return config;
}

/**
 * Format R2R Agent API request payload
 */
export function formatR2RAgentRequest(
  request: string,
  config: R2RAgentConfig,
  conversationId?: string
): any {
  const payload: any = {
    message: {
      role: 'user',
      content: request,
    },
    mode: config.mode,
    search_settings: config.search_settings,
  };

  // Add tools based on mode
  if (config.mode === 'rag') {
    payload.rag_tools = config.tools;
    payload.rag_generation_config = config.generation_config;
  } else {
    payload.research_tools = config.tools;
    payload.research_generation_config = config.generation_config;
  }

  // Add conversation context if available
  if (conversationId) {
    payload.conversation_id = conversationId;
  }

  return payload;
}

/**
 * Quick configuration presets for common scenarios
 */
export const R2R_QUICK_CONFIGS = {
  FAST_QUERY: {
    mode: 'rag' as R2RAgentMode,
    tools: ['search_file_knowledge'] as R2RAgentTool[],
    generation_config: {
      model: 'anthropic/claude-3-haiku-20240307',
      temperature: 0.3,
      max_tokens_to_sample: 500,
      stream: true,
    },
    search_settings: {
      use_semantic_search: true,
      limit: 3,
    },
  },

  DEEP_RESEARCH: {
    mode: 'research' as R2RAgentMode,
    tools: ['rag', 'reasoning', 'critique', 'python_executor'] as R2RAgentTool[],
    generation_config: {
      model: 'anthropic/claude-3-opus-20240229',
      extended_thinking: true,
      thinking_budget: 8192,
      temperature: 0.7,
      max_tokens_to_sample: 8000,
      stream: true,
    },
    search_settings: {
      use_hybrid_search: true,
      hybrid_settings: {
        full_text_weight: 1.0,
        semantic_weight: 5.0,
        rrf_k: 50,
      },
      limit: 15,
      use_web_search: true,
      graph_settings: { enabled: true },
    },
  },

  CODE_EXECUTION: {
    mode: 'research' as R2RAgentMode,
    tools: ['python_executor', 'reasoning'] as R2RAgentTool[],
    generation_config: {
      model: 'anthropic/claude-3-7-sonnet-20250219',
      extended_thinking: true,
      thinking_budget: 4096,
      temperature: 0.2,
      max_tokens_to_sample: 2000,
      stream: false,
    },
    search_settings: {
      limit: 5,
    },
  },
} as const;
