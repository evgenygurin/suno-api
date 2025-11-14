#!/usr/bin/env node
/**
 * R2R Agent CLI
 * Command-line interface for the intelligent R2R agent
 */

import { Command } from 'commander';
import { config } from 'dotenv';
import { R2RAgent, AGENT_PERSONAS, AGENT_MODES } from '../agent/index.js';
import logger from '../logger.js';

// Load environment
config();

const program = new Command();

program
  .name('r2r-agent')
  .description('Intelligent R2R agent with autonomous tool orchestration')
  .version('1.0.0');

/**
 * Ask command - Process request with agent
 */
program
  .command('ask <request>')
  .description('Ask the agent a question or make a request')
  .option('-p, --persona <persona>', 'Agent persona (developer|architect|debugger|learner|tester) - auto-selected if not provided')
  .option('-m, --mode <mode>', 'Agent mode (interactive|autonomous|advisory)', 'interactive')
  .option('--verbose', 'Show detailed reasoning and tool calls')
  .action(async (request, options) => {
    try {
      // Auto-select persona if not specified
      const autoSelect = !options.persona;
      const personaToUse = options.persona || 'developer'; // fallback for initialization

      logger.info({
        request,
        persona: autoSelect ? 'auto' : options.persona,
        mode: options.mode
      }, 'Processing agent request');

      const agent = new R2RAgent({
        persona: personaToUse,
        mode: options.mode,
      });

      console.log('\n🤖 Agent thinking...\n');

      const response = await agent.process(request, autoSelect);

      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`📝 **Answer** (confidence: ${(response.confidence * 100).toFixed(1)}%)\n`);
      console.log(response.answer);
      console.log('\n═══════════════════════════════════════════════════════\n');

      if (options.verbose && response.reasoning.length > 0) {
        console.log('💭 **Reasoning:**\n');
        response.reasoning.forEach((r, i) => {
          console.log(`${i + 1}. ${r}`);
        });
        console.log('');
      }

      if (options.verbose && response.tool_calls.length > 0) {
        console.log('🔧 **Tool Calls:**\n');
        response.tool_calls.forEach((call) => {
          const status = call.success ? '✓' : '✗';
          console.log(`${status} ${call.tool} (${call.duration_ms}ms)`);
        });
        console.log('');
      }

      if (response.sources && response.sources.length > 0) {
        console.log(`📚 **Sources:** ${response.sources.length} document(s)\n`);
        if (options.verbose) {
          response.sources.forEach((source, i) => {
            console.log(`${i + 1}. ${source.metadata.file_path || 'unknown'}`);
          });
          console.log('');
        }
      }

      console.log(`⏱️  Executed in ${response.metadata.execution_time_ms}ms\n`);

      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Agent request error');
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show agent status and statistics')
  .option('-p, --persona <persona>', 'Persona to check', 'developer')
  .action(async (options) => {
    try {
      const agent = new R2RAgent({
        persona: options.persona,
      });

      const status = agent.getStatus();

      console.log('\n🤖 **Agent Status**\n');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`**Persona:** ${status.persona.name} (${status.persona.id})`);
      console.log(`**Description:** ${status.persona.description}\n`);
      console.log(`**Mode:** ${status.config.mode}`);
      console.log(`**Search Strategy:** ${status.persona.search_strategy}`);
      console.log(`**Learning Rate:** ${status.persona.learning_rate}\n`);

      console.log('**Context:**');
      console.log(`  - Total entries: ${status.context_summary.total_entries}`);
      console.log(`  - Time span: ${status.context_summary.time_span_minutes} minutes`);
      console.log(`  - Entry types: ${JSON.stringify(status.context_summary.by_type)}\n`);

      console.log('**Tool Usage:**');
      console.log(`  - Total calls: ${status.tool_stats.tool_calls}`);
      console.log(`  - Success rate: ${(status.tool_stats.success_rate * 100).toFixed(1)}%`);
      console.log(`  - Avg duration: ${status.tool_stats.avg_execution_time_ms}ms`);
      if (Object.keys(status.tool_stats.tools_used).length > 0) {
        console.log(`  - Tools used: ${JSON.stringify(status.tool_stats.tools_used)}\n`);
      }

      console.log('**State:**');
      console.log(`  - Current task: ${status.state.current_task || 'none'}`);
      console.log(`  - Tasks completed: ${status.state.tasks_completed}`);
      console.log(`  - Experiences stored: ${status.state.experiences_stored}`);
      console.log(`  - Last reflection: ${status.state.last_reflection || 'never'}`);
      console.log(`  - Active since: ${status.state.active_since}\n`);

      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Status error');
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

/**
 * Personas command
 */
program
  .command('personas')
  .description('List available agent personas')
  .action(() => {
    console.log('\n🎭 **Available Agent Personas**\n');
    console.log('═══════════════════════════════════════════════════════\n');

    Object.entries(AGENT_PERSONAS).forEach(([_id, persona]) => {
      console.log(`**${persona.name}** (${persona.id})`);
      console.log(`  ${persona.description}`);
      console.log(`  - Preferred tools: ${persona.preferred_tools.slice(0, 3).join(', ')}...`);
      console.log(`  - Search: ${persona.search_strategy}, top_k: ${persona.default_top_k}`);
      console.log(`  - Learning: ${persona.learning_rate}, Graph: ${persona.use_graph_analysis}\n`);
    });

    console.log('Usage: r2r-agent ask --persona <persona> "your request"\n');
    process.exit(0);
  });

/**
 * Modes command
 */
program
  .command('modes')
  .description('List available agent modes')
  .action(() => {
    console.log('\n⚙️  **Available Agent Modes**\n');
    console.log('═══════════════════════════════════════════════════════\n');

    Object.entries(AGENT_MODES).forEach(([_id, mode]) => {
      console.log(`**${mode.mode}**`);
      console.log(`  ${mode.description}\n`);
    });

    console.log('Usage: r2r-agent ask --mode <mode> "your request"\n');
    process.exit(0);
  });

/**
 * Reset command
 */
program
  .command('reset')
  .description('Reset agent context and state')
  .option('-p, --persona <persona>', 'Persona to reset', 'developer')
  .action(async (options) => {
    try {
      const agent = new R2RAgent({
        persona: options.persona,
      });

      agent.reset();

      console.log('✓ Agent context and state reset successfully\n');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Reset error');
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

/**
 * Interactive mode
 */
program
  .command('interactive')
  .description('Start interactive agent session')
  .option('-p, --persona <persona>', 'Agent persona', 'developer')
  .action(async (options) => {
    const readline = await import('readline');

    console.log('\n🤖 **R2R Agent Interactive Mode**\n');
    console.log(`Persona: ${options.persona}`);
    console.log('Type your requests, or "exit" to quit\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const agent = new R2RAgent({
      persona: options.persona,
      mode: 'interactive',
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();

      if (input === 'exit' || input === 'quit') {
        console.log('\nGoodbye! 👋\n');
        rl.close();
        process.exit(0);
      }

      if (input === '') {
        rl.prompt();
        return;
      }

      try {
        const response = await agent.process(input);

        console.log('\n' + response.answer + '\n');
        console.log(`(confidence: ${(response.confidence * 100).toFixed(1)}%, ${response.tool_calls.length} tools, ${response.metadata.execution_time_ms}ms)\n`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      }

      rl.prompt();
    });
  });

// Parse and execute
program.parse();
