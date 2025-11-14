/**
 * Test AI Persona Selector Configuration Generation
 * Shows different configs and budgets for various request types
 */

import { AIPersonaSelector } from './src/agent/ai-persona-selector.js';

// Test requests with different characteristics
const testRequests = [
  // Simple implementation (should be RAG, no extended thinking)
  {
    name: 'Simple Implementation',
    request: 'How do I implement JWT authentication in FastAPI?',
    expected: { mode: 'rag', thinking_budget: 0, persona: 'developer' }
  },

  // Complex architectural analysis (should be Research, high thinking budget)
  {
    name: 'Complex Architecture',
    request: 'Analyze the trade-offs between microservices and monolithic architecture for a growing SaaS application. Consider scalability, development velocity, operational complexity, and team structure.',
    expected: { mode: 'research', thinking_budget: 6144, persona: 'architect' }
  },

  // Debugging with error (should be RAG with web search)
  {
    name: 'Debugging Error',
    request: 'I\'m getting "TypeError: Cannot read property \'map\' of undefined" in my React component when rendering a list. How do I fix this?',
    expected: { mode: 'rag', thinking_budget: 0, persona: 'debugger' }
  },

  // Code execution (should upgrade to research + python_executor)
  {
    name: 'Code Execution',
    request: 'Calculate the factorial of 20 and explain the algorithm complexity. Show your work.',
    expected: { mode: 'research', thinking_budget: 8192, persona: 'developer' }
  },

  // Learning/explanation (should be RAG, learner persona)
  {
    name: 'Learning Question',
    request: 'What is GraphRAG and how does it differ from traditional RAG?',
    expected: { mode: 'rag', thinking_budget: 0, persona: 'learner' }
  },

  // Latest trends (should add web_search)
  {
    name: 'Latest Trends',
    request: 'What are the latest best practices for React performance optimization in 2025?',
    expected: { mode: 'rag', thinking_budget: 4096, persona: 'developer' }
  },

  // Multi-step reasoning (should upgrade to research)
  {
    name: 'Multi-Step Analysis',
    request: 'Compare the implications of using GraphQL vs REST API, evaluate performance trade-offs, and design a migration strategy.',
    expected: { mode: 'research', thinking_budget: 8192, persona: 'architect' }
  },

  // Simple question (minimal config)
  {
    name: 'Simple Question',
    request: 'What is FastAPI?',
    expected: { mode: 'rag', thinking_budget: 0, persona: 'learner' }
  }
];

async function main() {
  console.log('🧪 Testing AI Persona Selector Configuration Generation\n');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const selector = new AIPersonaSelector();

  for (const test of testRequests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Request: "${test.request.substring(0, 80)}${test.request.length > 80 ? '...' : ''}"`);
    console.log();

    try {
      const result = await selector.selectPersona(test.request);

      console.log(`✅ AI Selection:`);
      console.log(`   Persona: ${result.persona}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${result.reasoning}`);

      console.log(`\n📊 R2R Agent Configuration:`);
      console.log(`   Mode: ${result.r2rConfig.mode}`);
      console.log(`   Tools: ${result.r2rConfig.tools.join(', ')}`);
      console.log(`   Model: ${result.r2rConfig.generation_config.model}`);
      console.log(`   Temperature: ${result.r2rConfig.generation_config.temperature}`);

      if (result.r2rConfig.generation_config.extended_thinking) {
        console.log(`   Extended Thinking: ✅ ENABLED`);
        console.log(`   Thinking Budget: ${result.r2rConfig.generation_config.thinking_budget} tokens`);
      } else {
        console.log(`   Extended Thinking: ❌ disabled`);
        console.log(`   Thinking Budget: 0 tokens (no deep reasoning)`);
      }

      if (result.r2rConfig.search_settings.use_web_search) {
        console.log(`   Web Search: ✅ enabled`);
      }

      // Compare with expected
      const matches = {
        mode: result.r2rConfig.mode === test.expected.mode,
        persona: result.persona === test.expected.persona,
        budget: (result.r2rConfig.generation_config.thinking_budget || 0) === test.expected.thinking_budget
      };

      const allMatch = Object.values(matches).every(m => m);
      console.log(`\n🎯 Expected vs Actual:`);
      console.log(`   Mode: ${matches.mode ? '✅' : '❌'} (expected: ${test.expected.mode}, got: ${result.r2rConfig.mode})`);
      console.log(`   Persona: ${matches.persona ? '✅' : '❌'} (expected: ${test.expected.persona}, got: ${result.persona})`);
      console.log(`   Budget: ${matches.budget ? '✅' : '❌'} (expected: ${test.expected.thinking_budget}, got: ${result.r2rConfig.generation_config.thinking_budget || 0})`);

    } catch (error) {
      console.error(`❌ Error:`, error);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ Configuration generation test completed!');
  console.log('\n📈 Summary of Thinking Budgets:');
  console.log('   - Simple questions: 0 tokens (fast RAG)');
  console.log('   - Moderate complexity: 4096 tokens (basic reasoning)');
  console.log('   - Complex architecture: 6144 tokens (deep analysis)');
  console.log('   - Code execution/multi-step: 8192 tokens (maximum reasoning)');
}

main().catch(console.error);
