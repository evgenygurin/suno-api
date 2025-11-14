#!/usr/bin/env node

/**
 * CLI for running persona selection evaluations
 *
 * Usage:
 *   npm run eval                    # Run all evals
 *   npm run eval -- --save          # Save results to disk
 *   npm run eval -- --parallel      # Run tests in parallel
 *   npm run eval -- --category impl # Run only implementation tests
 */

import { PersonaEvaluator, PERSONA_TEST_CASES } from '../agent/evals.js';
import { createModuleLogger } from '../logger.js';

const logger = createModuleLogger('cli:eval');

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI options
  const options = {
    parallel: args.includes('--parallel'),
    saveResults: args.includes('--save'),
    category: args.find(arg => arg.startsWith('--category='))?.split('=')[1],
  };

  console.log('🧪 Running Persona Selection Evaluations...\n');

  // Filter test cases by category if specified
  let testCases = PERSONA_TEST_CASES;
  if (options.category) {
    testCases = PERSONA_TEST_CASES.filter(tc => tc.category === options.category);
    console.log(`Filtering by category: ${options.category} (${testCases.length} tests)\n`);
  }

  // Run evaluations
  const evaluator = new PersonaEvaluator();
  const { results, metrics } = await evaluator.runEvals(testCases, options);

  // Print report
  evaluator.printReport(results, metrics);

  // Exit with error code if accuracy is below threshold
  const MIN_ACCURACY = 0.80; // 80% minimum
  if (metrics.accuracy < MIN_ACCURACY) {
    console.error(`❌ Accuracy ${(metrics.accuracy * 100).toFixed(1)}% is below minimum threshold ${MIN_ACCURACY * 100}%`);
    process.exit(1);
  }

  console.log(`✅ All evaluations passed (accuracy: ${(metrics.accuracy * 100).toFixed(1)}%)`);
  process.exit(0);
}

main().catch(error => {
  logger.error({ error }, 'Evaluation failed');
  console.error('❌ Evaluation failed:', error.message);
  process.exit(1);
});
