/**
 * Evaluation Framework for AI Persona Selection
 * Based on OpenAI's model optimization best practices
 *
 * Workflow:
 * 1. Define test cases with expected personas
 * 2. Run persona selector against test cases
 * 3. Grade results (correct/incorrect, confidence)
 * 4. Generate performance metrics
 * 5. Identify areas for improvement
 */

import { createModuleLogger } from '../logger.js';
import { DecisionMaker } from './decision.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = createModuleLogger('agent:evals');

/**
 * Test case for persona selection evaluation
 */
export interface PersonaTestCase {
  id: string;
  request: string;
  expectedPersona: string;
  category: 'implementation' | 'architecture' | 'debugging' | 'learning' | 'testing';
  difficulty: 'easy' | 'medium' | 'hard' | 'ambiguous';
  notes?: string;
}

/**
 * Result of a single evaluation
 */
export interface EvalResult {
  testCase: PersonaTestCase;
  selectedPersona: string;
  confidence: number;
  reasoning: string;
  correct: boolean;
  duration_ms: number;
  method: 'ai' | 'keywords';
}

/**
 * Aggregated evaluation metrics
 */
export interface EvalMetrics {
  totalTests: number;
  correctSelections: number;
  incorrectSelections: number;
  accuracy: number;
  avgConfidence: number;
  avgDuration: number;
  aiMethod: number;
  keywordsMethod: number;
  byCategory: Record<string, { total: number; correct: number; accuracy: number }>;
  byDifficulty: Record<string, { total: number; correct: number; accuracy: number }>;
}

/**
 * Test dataset: Representative real-world requests
 */
export const PERSONA_TEST_CASES: PersonaTestCase[] = [
  // Implementation tasks (developer)
  {
    id: 'impl-1',
    request: 'Implement JWT authentication for API endpoints',
    expectedPersona: 'developer',
    category: 'implementation',
    difficulty: 'easy',
  },
  {
    id: 'impl-2',
    request: 'Add rate limiting to the API using Redis',
    expectedPersona: 'developer',
    category: 'implementation',
    difficulty: 'medium',
  },
  {
    id: 'impl-3',
    request: 'Build a webhook handler for Stripe payment events',
    expectedPersona: 'developer',
    category: 'implementation',
    difficulty: 'medium',
  },
  {
    id: 'impl-4',
    request: 'Create GraphQL resolver for user profile',
    expectedPersona: 'developer',
    category: 'implementation',
    difficulty: 'easy',
  },
  {
    id: 'impl-5',
    request: 'Реализуй систему авторизации через OAuth2',
    expectedPersona: 'developer',
    category: 'implementation',
    difficulty: 'medium',
    notes: 'Russian language test',
  },

  // Architecture tasks (architect)
  {
    id: 'arch-1',
    request: 'Explain the overall architecture of this system',
    expectedPersona: 'architect',
    category: 'architecture',
    difficulty: 'easy',
  },
  {
    id: 'arch-2',
    request: 'How should we structure microservices for scalability?',
    expectedPersona: 'architect',
    category: 'architecture',
    difficulty: 'hard',
  },
  {
    id: 'arch-3',
    request: 'What are the dependencies between modules?',
    expectedPersona: 'architect',
    category: 'architecture',
    difficulty: 'medium',
  },
  {
    id: 'arch-4',
    request: 'Design a caching strategy for this API',
    expectedPersona: 'architect',
    category: 'architecture',
    difficulty: 'hard',
  },
  {
    id: 'arch-5',
    request: 'Show me the component hierarchy',
    expectedPersona: 'architect',
    category: 'architecture',
    difficulty: 'easy',
  },

  // Debugging tasks (debugger)
  {
    id: 'debug-1',
    request: 'Why is authentication failing with 401 error?',
    expectedPersona: 'debugger',
    category: 'debugging',
    difficulty: 'easy',
  },
  {
    id: 'debug-2',
    request: 'Application crashes with TypeError: Cannot read property',
    expectedPersona: 'debugger',
    category: 'debugging',
    difficulty: 'medium',
  },
  {
    id: 'debug-3',
    request: 'Database connection timeout after 30 seconds',
    expectedPersona: 'debugger',
    category: 'debugging',
    difficulty: 'medium',
  },
  {
    id: 'debug-4',
    request: 'Memory leak in production server',
    expectedPersona: 'debugger',
    category: 'debugging',
    difficulty: 'hard',
  },
  {
    id: 'debug-5',
    request: 'Почему падает приложение при загрузке?',
    expectedPersona: 'debugger',
    category: 'debugging',
    difficulty: 'easy',
    notes: 'Russian language test',
  },

  // Learning tasks (learner)
  {
    id: 'learn-1',
    request: 'What is GraphRAG and how does it work?',
    expectedPersona: 'learner',
    category: 'learning',
    difficulty: 'easy',
  },
  {
    id: 'learn-2',
    request: 'Explain the concept of event-driven architecture',
    expectedPersona: 'learner',
    category: 'learning',
    difficulty: 'medium',
  },
  {
    id: 'learn-3',
    request: 'How does JWT token validation work?',
    expectedPersona: 'learner',
    category: 'learning',
    difficulty: 'easy',
  },
  {
    id: 'learn-4',
    request: 'Tell me about SOLID principles',
    expectedPersona: 'learner',
    category: 'learning',
    difficulty: 'medium',
  },
  {
    id: 'learn-5',
    request: 'What are the differences between REST and GraphQL?',
    expectedPersona: 'learner',
    category: 'learning',
    difficulty: 'easy',
  },

  // Testing tasks (tester)
  {
    id: 'test-1',
    request: 'Write tests for authentication module',
    expectedPersona: 'tester',
    category: 'testing',
    difficulty: 'easy',
  },
  {
    id: 'test-2',
    request: 'Check test coverage for API endpoints',
    expectedPersona: 'tester',
    category: 'testing',
    difficulty: 'medium',
  },
  {
    id: 'test-3',
    request: 'Create integration tests for payment flow',
    expectedPersona: 'tester',
    category: 'testing',
    difficulty: 'hard',
  },
  {
    id: 'test-4',
    request: 'How should we test error handling?',
    expectedPersona: 'tester',
    category: 'testing',
    difficulty: 'medium',
  },
  {
    id: 'test-5',
    request: 'Validate input sanitization works correctly',
    expectedPersona: 'tester',
    category: 'testing',
    difficulty: 'medium',
  },

  // Ambiguous cases (edge cases)
  {
    id: 'ambig-1',
    request: 'Help with API',
    expectedPersona: 'developer',
    category: 'implementation',
    difficulty: 'ambiguous',
    notes: 'Too vague - could be any persona',
  },
  {
    id: 'ambig-2',
    request: 'Need to understand and fix performance issues',
    expectedPersona: 'debugger',
    category: 'debugging',
    difficulty: 'ambiguous',
    notes: 'Mix of learning and debugging',
  },
  {
    id: 'ambig-3',
    request: 'Review system design and implement improvements',
    expectedPersona: 'architect',
    category: 'architecture',
    difficulty: 'ambiguous',
    notes: 'Mix of architecture and implementation',
  },
];

/**
 * Grader: Evaluate persona selection correctness
 */
export class PersonaSelectionGrader {
  /**
   * Grade a single evaluation result
   */
  grade(result: EvalResult): {
    score: number; // 0-1
    feedback: string;
  } {
    const { testCase, selectedPersona, confidence, correct } = result;

    // Exact match = full score
    if (correct) {
      return {
        score: 1.0,
        feedback: `✅ Correct: ${selectedPersona} (confidence: ${confidence.toFixed(2)})`,
      };
    }

    // Wrong selection = zero score
    return {
      score: 0.0,
      feedback: `❌ Incorrect: Expected ${testCase.expectedPersona}, got ${selectedPersona} (confidence: ${confidence.toFixed(2)})`,
    };
  }

  /**
   * Calculate aggregate metrics
   */
  calculateMetrics(results: EvalResult[]): EvalMetrics {
    const totalTests = results.length;
    const correctSelections = results.filter(r => r.correct).length;
    const incorrectSelections = totalTests - correctSelections;
    const accuracy = totalTests > 0 ? correctSelections / totalTests : 0;

    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
    const avgDuration = results.reduce((sum, r) => sum + r.duration_ms, 0) / totalTests;

    const aiMethod = results.filter(r => r.method === 'ai').length;
    const keywordsMethod = results.filter(r => r.method === 'keywords').length;

    // By category
    const byCategory: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const result of results) {
      const cat = result.testCase.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, correct: 0, accuracy: 0 };
      }
      byCategory[cat].total++;
      if (result.correct) byCategory[cat].correct++;
    }
    for (const cat in byCategory) {
      byCategory[cat].accuracy = byCategory[cat].correct / byCategory[cat].total;
    }

    // By difficulty
    const byDifficulty: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const result of results) {
      const diff = result.testCase.difficulty;
      if (!byDifficulty[diff]) {
        byDifficulty[diff] = { total: 0, correct: 0, accuracy: 0 };
      }
      byDifficulty[diff].total++;
      if (result.correct) byDifficulty[diff].correct++;
    }
    for (const diff in byDifficulty) {
      byDifficulty[diff].accuracy = byDifficulty[diff].correct / byDifficulty[diff].total;
    }

    return {
      totalTests,
      correctSelections,
      incorrectSelections,
      accuracy,
      avgConfidence,
      avgDuration,
      aiMethod,
      keywordsMethod,
      byCategory,
      byDifficulty,
    };
  }
}

/**
 * Evaluation runner
 */
export class PersonaEvaluator {
  private grader = new PersonaSelectionGrader();

  /**
   * Run evaluation on test dataset
   */
  async runEvals(
    testCases: PersonaTestCase[] = PERSONA_TEST_CASES,
    options: {
      parallel?: boolean;
      saveResults?: boolean;
    } = {}
  ): Promise<{
    results: EvalResult[];
    metrics: EvalMetrics;
  }> {
    logger.info({ testCount: testCases.length }, 'Starting persona selection evaluation');

    const results: EvalResult[] = [];

    // Run tests sequentially or in parallel
    if (options.parallel) {
      const promises = testCases.map(testCase => this.runSingleEval(testCase));
      results.push(...(await Promise.all(promises)));
    } else {
      for (const testCase of testCases) {
        const result = await this.runSingleEval(testCase);
        results.push(result);
      }
    }

    // Calculate metrics
    const metrics = this.grader.calculateMetrics(results);

    logger.info({
      accuracy: (metrics.accuracy * 100).toFixed(1) + '%',
      avgConfidence: metrics.avgConfidence.toFixed(2),
      avgDuration: metrics.avgDuration.toFixed(0) + 'ms',
    }, 'Evaluation completed');

    // Save results if requested
    if (options.saveResults) {
      this.saveResults(results, metrics);
    }

    return { results, metrics };
  }

  /**
   * Run single evaluation
   */
  private async runSingleEval(testCase: PersonaTestCase): Promise<EvalResult> {
    const startTime = Date.now();

    try {
      // Select persona using actual implementation
      const selectedPersona = await DecisionMaker.selectPersona(testCase.request);

      // Check if correct
      const correct = selectedPersona === testCase.expectedPersona;

      // Estimate confidence and method (we don't have direct access to these)
      // In real implementation, we'd need to expose these from DecisionMaker
      const confidence = 0.85; // Placeholder
      const reasoning = 'Evaluated via test framework';
      const method: 'ai' | 'keywords' = 'ai'; // Placeholder

      const duration_ms = Date.now() - startTime;

      return {
        testCase,
        selectedPersona,
        confidence,
        reasoning,
        correct,
        duration_ms,
        method,
      };
    } catch (error) {
      logger.error({ error, testCase }, 'Evaluation failed for test case');
      throw error;
    }
  }

  /**
   * Save evaluation results to disk
   */
  private saveResults(results: EvalResult[], metrics: EvalMetrics): void {
    const outputDir = path.join(process.cwd(), '.claude', 'data', 'evals');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(outputDir, `eval-results-${timestamp}.json`);
    const metricsFile = path.join(outputDir, `eval-metrics-${timestamp}.json`);

    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2), 'utf-8');

    logger.info({ resultsFile, metricsFile }, 'Evaluation results saved');
  }

  /**
   * Print evaluation report to console
   */
  printReport(results: EvalResult[], metrics: EvalMetrics): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERSONA SELECTION EVALUATION REPORT');
    console.log('='.repeat(80) + '\n');

    // Overall metrics
    console.log('Overall Performance:');
    console.log(`  Total Tests:        ${metrics.totalTests}`);
    console.log(`  Correct:            ${metrics.correctSelections} ✅`);
    console.log(`  Incorrect:          ${metrics.incorrectSelections} ❌`);
    console.log(`  Accuracy:           ${(metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`  Avg Confidence:     ${metrics.avgConfidence.toFixed(2)}`);
    console.log(`  Avg Duration:       ${metrics.avgDuration.toFixed(0)}ms`);
    console.log(`  AI Method:          ${metrics.aiMethod} (${((metrics.aiMethod / metrics.totalTests) * 100).toFixed(0)}%)`);
    console.log(`  Keyword Method:     ${metrics.keywordsMethod} (${((metrics.keywordsMethod / metrics.totalTests) * 100).toFixed(0)}%)`);

    // By category
    console.log('\nPerformance by Category:');
    for (const [category, stats] of Object.entries(metrics.byCategory)) {
      console.log(`  ${category.padEnd(20)} ${stats.correct}/${stats.total} (${(stats.accuracy * 100).toFixed(0)}%)`);
    }

    // By difficulty
    console.log('\nPerformance by Difficulty:');
    for (const [difficulty, stats] of Object.entries(metrics.byDifficulty)) {
      console.log(`  ${difficulty.padEnd(20)} ${stats.correct}/${stats.total} (${(stats.accuracy * 100).toFixed(0)}%)`);
    }

    // Incorrect selections
    const incorrectResults = results.filter(r => !r.correct);
    if (incorrectResults.length > 0) {
      console.log('\n❌ Incorrect Selections:');
      for (const result of incorrectResults) {
        console.log(`  [${result.testCase.id}] "${result.testCase.request.substring(0, 50)}..."`);
        console.log(`      Expected: ${result.testCase.expectedPersona}, Got: ${result.selectedPersona}`);
        console.log(`      Confidence: ${result.confidence.toFixed(2)}, Category: ${result.testCase.category}, Difficulty: ${result.testCase.difficulty}`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}
