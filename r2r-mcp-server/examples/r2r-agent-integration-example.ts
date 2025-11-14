/**
 * R2R Agent Integration Example
 *
 * Demonstrates complete workflow:
 * 1. User request → AI Persona Selector
 * 2. Persona selection → R2R Agent configuration
 * 3. R2R Agent API call → Streaming response
 * 4. Result processing → User output
 */

import { AIPersonaSelector } from '../src/agent/ai-persona-selector.js';
import { R2RRemoteAgent } from '../src/agent/r2r-remote-agent.js';
import { createModuleLogger } from '../src/logger.js';

const logger = createModuleLogger('example:r2r-agent');

/**
 * Example 1: Simple developer question
 */
async function example1SimpleQuery() {
  console.log('\n=== Example 1: Simple Developer Query ===\n');

  const request = 'How do I implement JWT authentication in FastAPI?';

  // Step 1: AI Persona Selector analyzes request
  const selector = new AIPersonaSelector();
  const selection = await selector.selectPersona(request);

  console.log('📊 Persona Selection:');
  console.log(`  Persona: ${selection.persona}`);
  console.log(`  Reasoning: ${selection.reasoning}`);
  console.log(`  Confidence: ${(selection.confidence * 100).toFixed(1)}%`);
  console.log(`  R2R Mode: ${selection.r2rConfig.mode}`);
  console.log(`  Tools: ${selection.r2rConfig.tools.join(', ')}`);
  console.log(`  Model: ${selection.r2rConfig.generation_config.model}`);

  // Step 2: Call R2R Agent API with configuration
  const agent = new R2RRemoteAgent();
  const response = await agent.process(request, selection.r2rConfig, true);

  console.log('\n💬 R2R Agent Response:');
  console.log(response.answer);

  console.log(`\n📑 Citations: ${response.citations.length}`);
  response.citations.slice(0, 3).forEach((citation, i) => {
    console.log(`  ${i + 1}. Score: ${citation.score.toFixed(3)} - ${citation.text.substring(0, 80)}...`);
  });

  console.log('\n📊 Metadata:');
  console.log(`  Mode: ${response.metadata.mode}`);
  console.log(`  Tools used: ${response.metadata.tools_used.join(', ')}`);
  console.log(`  Total time: ${response.metadata.total_time_ms}ms`);
  if (response.metadata.thinking_time_ms) {
    console.log(`  Thinking time: ${response.metadata.thinking_time_ms}ms`);
  }
}

/**
 * Example 2: Complex architectural analysis (should trigger research mode)
 */
async function example2ComplexAnalysis() {
  console.log('\n=== Example 2: Complex Architectural Analysis ===\n');

  const request = 'Analyze the trade-offs between microservices and monolithic architecture for a growing SaaS application. Consider scalability, development velocity, operational complexity, and team structure.';

  const selector = new AIPersonaSelector();
  const selection = await selector.selectPersona(request);

  console.log('📊 Persona Selection:');
  console.log(`  Persona: ${selection.persona}`);
  console.log(`  R2R Mode: ${selection.r2rConfig.mode}`);
  console.log(`  Tools: ${selection.r2rConfig.tools.join(', ')}`);
  console.log(`  Extended Thinking: ${selection.r2rConfig.generation_config.extended_thinking}`);
  console.log(`  Thinking Budget: ${selection.r2rConfig.generation_config.thinking_budget || 'N/A'}`);

  const agent = new R2RRemoteAgent();
  const response = await agent.process(request, selection.r2rConfig, true);

  console.log('\n🧠 Streaming Events:');
  response.events.forEach((event) => {
    const emoji = {
      thinking: '🧠',
      tool_call: '🔧',
      tool_result: '📊',
      citation: '📑',
      message: '💬',
      final_answer: '✅',
    }[event.type];

    if (event.type === 'thinking') {
      console.log(`${emoji} Thinking: ${event.content.substring(0, 60)}...`);
    } else if (event.type === 'tool_call') {
      console.log(`${emoji} Tool: ${event.content}`);
    } else if (event.type === 'message') {
      // Skip message chunks for brevity
    } else {
      console.log(`${emoji} ${event.type}: ${event.content.substring(0, 60)}...`);
    }
  });

  console.log('\n💬 Final Answer:');
  console.log(response.answer);

  console.log(`\n⏱️  Performance:`);
  console.log(`  Thinking: ${response.metadata.thinking_time_ms || 0}ms`);
  console.log(`  Total: ${response.metadata.total_time_ms}ms`);
}

/**
 * Example 3: Debugging scenario (should include web search)
 */
async function example3Debugging() {
  console.log('\n=== Example 3: Debugging Scenario ===\n');

  const request = 'I\'m getting "TypeError: Cannot read property \'map\' of undefined" in my React component. The error occurs when rendering a list. How do I fix this?';

  const selector = new AIPersonaSelector();
  const selection = await selector.selectPersona(request);

  console.log('📊 Persona Selection:');
  console.log(`  Persona: ${selection.persona} (expected: debugger)`);
  console.log(`  Web Search Enabled: ${selection.r2rConfig.search_settings.use_web_search ? 'Yes' : 'No'}`);
  console.log(`  Tools: ${selection.r2rConfig.tools.join(', ')}`);

  const agent = new R2RRemoteAgent();
  const response = await agent.process(request, selection.r2rConfig, true);

  console.log('\n💬 Debug Advice:');
  console.log(response.answer);
}

/**
 * Example 4: Multi-turn conversation
 */
async function example4MultiTurn() {
  console.log('\n=== Example 4: Multi-Turn Conversation ===\n');

  const agent = new R2RRemoteAgent();
  const selector = new AIPersonaSelector();

  // First question
  const request1 = 'What is GraphRAG?';
  const selection1 = await selector.selectPersona(request1);

  console.log('🗣️  Turn 1: "What is GraphRAG?"');
  const response1 = await agent.process(request1, selection1.r2rConfig, false);
  console.log(`   Answer: ${response1.answer.substring(0, 100)}...`);
  console.log(`   Conversation ID: ${response1.metadata.conversation_id}`);

  // Follow-up question (agent maintains context)
  const request2 = 'How is it different from traditional RAG?';
  const selection2 = await selector.selectPersona(request2);

  console.log('\n🗣️  Turn 2: "How is it different from traditional RAG?"');
  const response2 = await agent.process(request2, selection2.r2rConfig, false);
  console.log(`   Answer: ${response2.answer.substring(0, 100)}...`);
  console.log(`   Same conversation: ${response2.metadata.conversation_id === response1.metadata.conversation_id ? 'Yes ✅' : 'No ❌'}`);

  // Reset conversation
  agent.resetConversation();
  selector.clearHistory();
  console.log('\n🔄 Conversation reset');
}

/**
 * Example 5: Code execution scenario
 */
async function example5CodeExecution() {
  console.log('\n=== Example 5: Code Execution ===\n');

  const request = 'Calculate the factorial of 20 and explain the algorithm complexity. Show your work.';

  const selector = new AIPersonaSelector();
  const selection = await selector.selectPersona(request);

  console.log('📊 Persona Selection:');
  console.log(`  Persona: ${selection.persona}`);
  console.log(`  Mode: ${selection.r2rConfig.mode} (expected: research)`);
  console.log(`  Tools: ${selection.r2rConfig.tools.join(', ')} (expected: python_executor)`);

  const agent = new R2RRemoteAgent();
  const response = await agent.process(request, selection.r2rConfig, true);

  console.log('\n🔧 Tools Used:');
  response.metadata.tools_used.forEach((tool) => {
    console.log(`  - ${tool}`);
  });

  console.log('\n💬 Response:');
  console.log(response.answer);
}

/**
 * Run all examples
 */
async function main() {
  console.log('🚀 R2R Agent Integration Examples\n');
  console.log('This demonstrates the complete AI Persona Selector → R2R Agent workflow');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // Check if OPENAI_API_KEY is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY environment variable not set');
      console.error('   AI Persona Selector requires OpenAI API key');
      process.exit(1);
    }

    // Check if R2R API is accessible
    const r2rUrl = process.env.R2R_API_URL || process.env.R2R_BASE_URL || 'http://localhost:7272';
    console.log(`📡 R2R API: ${r2rUrl}\n`);

    // Run examples
    await example1SimpleQuery();
    await example2ComplexAnalysis();
    await example3Debugging();
    await example4MultiTurn();
    await example5CodeExecution();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
