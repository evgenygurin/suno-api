/**
 * Agent Context Management
 * Maintains conversation history, tool results, and working memory
 */

import { z } from 'zod';
import { createModuleLogger } from '../logger.js';

const logger = createModuleLogger('agent:context');

/**
 * Context entry types
 */
export const ContextEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['user_message', 'agent_thought', 'tool_call', 'tool_result', 'decision']),
  content: z.unknown(),
  metadata: z.record(z.unknown()).optional(),
});

export type ContextEntry = z.infer<typeof ContextEntrySchema>;

/**
 * Agent working memory
 */
export class AgentContext {
  private entries: ContextEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 20) {
    this.maxEntries = maxEntries;
  }

  /**
   * Add entry to context
   */
  add(entry: Omit<ContextEntry, 'id' | 'timestamp'>): void {
    const newEntry: ContextEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.entries.push(newEntry);

    // Trim old entries if needed
    if (this.entries.length > this.maxEntries) {
      const removed = this.entries.slice(0, this.entries.length - this.maxEntries);
      this.entries = this.entries.slice(-this.maxEntries);

      logger.debug({
        removedCount: removed.length,
        currentCount: this.entries.length
      }, 'Context trimmed');
    }

    logger.debug({
      type: entry.type,
      totalEntries: this.entries.length
    }, 'Context entry added');
  }

  /**
   * Get recent entries
   */
  getRecent(count?: number): ContextEntry[] {
    const n = count || this.entries.length;
    return this.entries.slice(-n);
  }

  /**
   * Get entries by type
   */
  getByType(type: ContextEntry['type']): ContextEntry[] {
    return this.entries.filter(e => e.type === type);
  }

  /**
   * Get entries in time window
   */
  getInWindow(windowMinutes: number): ContextEntry[] {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.entries.filter(e => new Date(e.timestamp) >= cutoff);
  }

  /**
   * Search context entries
   */
  search(query: string): ContextEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(entry => {
      const contentStr = JSON.stringify(entry.content).toLowerCase();
      return contentStr.includes(lowerQuery);
    });
  }

  /**
   * Get context summary
   */
  getSummary(): {
    total_entries: number;
    by_type: Record<string, number>;
    time_span_minutes: number;
    recent_activity: string[];
  } {
    const byType = this.entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeSpan = this.entries.length > 0
      ? (new Date().getTime() - new Date(this.entries[0].timestamp).getTime()) / (1000 * 60)
      : 0;

    const recentActivity = this.entries
      .slice(-5)
      .map(e => `${e.type}: ${this.summarizeContent(e.content)}`);

    return {
      total_entries: this.entries.length,
      by_type: byType,
      time_span_minutes: Math.round(timeSpan),
      recent_activity: recentActivity,
    };
  }

  /**
   * Get tool usage statistics
   */
  getToolStats(): {
    tool_calls: number;
    tools_used: Record<string, number>;
    success_rate: number;
    avg_execution_time_ms: number;
  } {
    const toolCalls = this.getByType('tool_call');
    const toolResults = this.getByType('tool_result');

    const toolsUsed = toolCalls.reduce((acc, call) => {
      const toolName = (call.content as any)?.tool_name || 'unknown';
      acc[toolName] = (acc[toolName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successful = toolResults.filter(
      result => (result.content as any)?.success === true
    ).length;

    const successRate = toolResults.length > 0
      ? successful / toolResults.length
      : 0;

    const executionTimes = toolResults
      .map(result => (result.content as any)?.metadata?.execution_time_ms)
      .filter((t): t is number => typeof t === 'number');

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    return {
      tool_calls: toolCalls.length,
      tools_used: toolsUsed,
      success_rate: successRate,
      avg_execution_time_ms: Math.round(avgExecutionTime),
    };
  }

  /**
   * Clear context
   */
  clear(): void {
    const previousCount = this.entries.length;
    this.entries = [];
    logger.info({ previousCount }, 'Context cleared');
  }

  /**
   * Export context for storage
   */
  export(): ContextEntry[] {
    return [...this.entries];
  }

  /**
   * Import context from storage
   */
  import(entries: ContextEntry[]): void {
    this.entries = entries.slice(-this.maxEntries);
    logger.info({ importedCount: entries.length }, 'Context imported');
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Helper: Summarize content for logging
   */
  private summarizeContent(content: unknown): string {
    const str = JSON.stringify(content);
    return str.length > 50 ? `${str.substring(0, 50)}...` : str;
  }
}

/**
 * Conversation state tracking
 */
export interface ConversationState {
  current_task: string | null;
  tasks_completed: number;
  experiences_stored: number;
  last_reflection: string | null;
  active_since: string;
}

export class StateManager {
  private state: ConversationState;

  constructor() {
    this.state = {
      current_task: null,
      tasks_completed: 0,
      experiences_stored: 0,
      last_reflection: null,
      active_since: new Date().toISOString(),
    };
  }

  setCurrentTask(task: string): void {
    this.state.current_task = task;
  }

  completeTask(): void {
    this.state.tasks_completed += 1;
    this.state.current_task = null;
  }

  recordExperience(): void {
    this.state.experiences_stored += 1;
  }

  recordReflection(): void {
    this.state.last_reflection = new Date().toISOString();
  }

  getState(): ConversationState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      current_task: null,
      tasks_completed: 0,
      experiences_stored: 0,
      last_reflection: null,
      active_since: new Date().toISOString(),
    };
  }
}
