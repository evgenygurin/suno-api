/**
 * R2R Agent Configuration System
 * Defines agent personas, modes, and behavior profiles
 */

import { z } from 'zod';

/**
 * Agent persona defines specialized behavior patterns
 */
export const AgentPersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  // Tool preferences - which tools this persona prefers
  preferred_tools: z.array(z.string()),

  // Search behavior
  search_strategy: z.enum(['precise', 'exploratory', 'comprehensive']),
  default_top_k: z.number().min(1).max(20),

  // RAG behavior
  use_rag_by_default: z.boolean(),
  rag_context_size: z.number().min(3).max(10),

  // Memory behavior
  store_experiences_automatically: z.boolean(),
  learning_rate: z.enum(['conservative', 'moderate', 'aggressive']),

  // Graph analysis preferences
  use_graph_analysis: z.boolean(),
  graph_depth: z.number().min(1).max(3),
});

export type AgentPersona = z.infer<typeof AgentPersonaSchema>;

/**
 * Predefined agent personas
 */
export const AGENT_PERSONAS: Record<string, AgentPersona> = {
  developer: {
    id: 'developer',
    name: 'Developer Assistant',
    description: 'Focused on practical development tasks, code examples, and implementation help',
    preferred_tools: [
      'search_code_examples',
      'get_implementation_help',
      'find_dependencies',
      'debug_with_rag',
    ],
    search_strategy: 'precise',
    default_top_k: 5,
    use_rag_by_default: true,
    rag_context_size: 7,
    store_experiences_automatically: true,
    learning_rate: 'moderate',
    use_graph_analysis: true,
    graph_depth: 2,
  },

  architect: {
    id: 'architect',
    name: 'Architecture Explorer',
    description: 'Focused on understanding system architecture, design patterns, and high-level structure',
    preferred_tools: [
      'explore_architecture_graph',
      'explain_architecture',
      'query_code_relationships',
      'find_dependencies',
      'find_usages',
    ],
    search_strategy: 'comprehensive',
    default_top_k: 10,
    use_rag_by_default: true,
    rag_context_size: 10,
    store_experiences_automatically: true,
    learning_rate: 'aggressive',
    use_graph_analysis: true,
    graph_depth: 3,
  },

  debugger: {
    id: 'debugger',
    name: 'Debug Specialist',
    description: 'Focused on debugging, error analysis, and troubleshooting',
    preferred_tools: [
      'debug_with_rag',
      'retrieve_similar_experiences',
      'search_documentation',
      'find_test_coverage',
    ],
    search_strategy: 'exploratory',
    default_top_k: 8,
    use_rag_by_default: true,
    rag_context_size: 8,
    store_experiences_automatically: true,
    learning_rate: 'aggressive',
    use_graph_analysis: true,
    graph_depth: 2,
  },

  learner: {
    id: 'learner',
    name: 'Learning Assistant',
    description: 'Focused on understanding and explaining concepts, accumulating knowledge',
    preferred_tools: [
      'ask_documentation',
      'explain_architecture',
      'search_documentation',
      'reflect_on_patterns',
    ],
    search_strategy: 'exploratory',
    default_top_k: 7,
    use_rag_by_default: true,
    rag_context_size: 8,
    store_experiences_automatically: true,
    learning_rate: 'aggressive',
    use_graph_analysis: false,
    graph_depth: 1,
  },

  tester: {
    id: 'tester',
    name: 'Test Coverage Assistant',
    description: 'Focused on testing, test coverage, and quality assurance',
    preferred_tools: [
      'find_test_examples',
      'find_test_coverage',
      'search_code_examples',
      'get_implementation_help',
    ],
    search_strategy: 'precise',
    default_top_k: 5,
    use_rag_by_default: true,
    rag_context_size: 6,
    store_experiences_automatically: true,
    learning_rate: 'moderate',
    use_graph_analysis: true,
    graph_depth: 1,
  },
};

/**
 * Agent mode defines operational behavior
 */
export const AgentModeSchema = z.object({
  mode: z.enum(['interactive', 'autonomous', 'advisory']),
  description: z.string(),
});

export type AgentMode = z.infer<typeof AgentModeSchema>;

export const AGENT_MODES: Record<string, AgentMode> = {
  interactive: {
    mode: 'interactive',
    description: 'Agent waits for explicit commands, provides detailed explanations',
  },
  autonomous: {
    mode: 'autonomous',
    description: 'Agent makes decisions independently, chains tools automatically',
  },
  advisory: {
    mode: 'advisory',
    description: 'Agent suggests actions but waits for user confirmation',
  },
};

/**
 * Agent configuration
 */
export const AgentConfigSchema = z.object({
  persona: z.string().default('developer'),
  mode: z.enum(['interactive', 'autonomous', 'advisory']).default('interactive'),

  // Context management
  max_context_memory: z.number().min(5).max(50).default(20),
  context_window_size: z.number().min(1).max(10).default(5),

  // Tool usage
  max_tool_chain_depth: z.number().min(1).max(10).default(5),
  parallel_tool_execution: z.boolean().default(true),

  // Memory settings
  experience_storage_enabled: z.boolean().default(true),
  auto_reflect_frequency: z.number().min(0).default(10), // Reflect every N experiences

  // Quality control
  min_confidence_threshold: z.number().min(0).max(1).default(0.6),
  max_retries: z.number().min(0).max(5).default(2),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Get default agent configuration
 */
export function getDefaultConfig(personaId?: string): AgentConfig {
  const persona = personaId ? AGENT_PERSONAS[personaId] : AGENT_PERSONAS.developer;

  return {
    persona: persona?.id || 'developer',
    mode: 'interactive',
    max_context_memory: 20,
    context_window_size: 5,
    max_tool_chain_depth: 5,
    parallel_tool_execution: true,
    experience_storage_enabled: true,
    auto_reflect_frequency: 10,
    min_confidence_threshold: 0.6,
    max_retries: 2,
  };
}

/**
 * Validate and merge configuration
 */
export function validateConfig(config: Partial<AgentConfig>): AgentConfig {
  const defaultConfig = getDefaultConfig(config.persona);
  const merged = { ...defaultConfig, ...config };
  return AgentConfigSchema.parse(merged);
}
