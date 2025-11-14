/**
 * AI-Enhanced Music Generator Component
 *
 * React component that demonstrates real-time AI-powered music generation
 * with live progress updates using Trigger.dev's useRealtimeTaskTrigger hook.
 *
 * Features:
 * - Real-time progress bar with stage updates
 * - AI prompt enhancement preview
 * - Musical style metadata display
 * - Generated music results
 * - Error handling with retry capability
 *
 * @see /docs/AI_SDK_INTEGRATION.md
 */

'use client';

import { useRealtimeTaskTrigger } from '@trigger.dev/react-hooks';
import { useState, useCallback } from 'react';
import type { aiEnhancedMusicGeneration } from '@/trigger/ai-enhanced-generation';

// ============================================================================
// Types
// ============================================================================

interface MusicStyle {
  genre: string;
  mood: string;
  tempo: 'slow' | 'medium' | 'fast';
  instruments: string[];
  tags: string[];
}

interface TaskMetadata {
  stage: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  enhancedPrompt?: string;
  musicStyle?: MusicStyle;
  processingTime?: number;
  error?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function AIEnhancedMusicGenerator() {
  // ========================================
  // State Management
  // ========================================
  const [userPrompt, setUserPrompt] = useState('');
  const [userId, setUserId] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [makeInstrumental, setMakeInstrumental] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ========================================
  // Trigger.dev Real-time Hook
  // ========================================
  const {
    submit: triggerGeneration,
    error,
    isLoading,
    metadata,
    result,
  } = useRealtimeTaskTrigger<typeof aiEnhancedMusicGeneration>(
    'ai-enhanced-music-generation'
  );

  // ========================================
  // Event Handlers
  // ========================================
  const handleGenerate = useCallback(async () => {
    if (!userPrompt.trim()) {
      alert('Please enter a music prompt');
      return;
    }

    await triggerGeneration({
      userPrompt,
      userId: userId || `user-${Date.now()}`,
      preferences: {
        genre: genre || undefined,
        mood: mood || undefined,
        make_instrumental: makeInstrumental,
      },
    });
  }, [userPrompt, userId, genre, mood, makeInstrumental, triggerGeneration]);

  const handleReset = useCallback(() => {
    setUserPrompt('');
    setGenre('');
    setMood('');
    setMakeInstrumental(false);
  }, []);

  // ========================================
  // Computed Values
  // ========================================
  const taskMetadata = metadata as TaskMetadata | undefined;
  const progressPercent = taskMetadata?.progress || 0;
  const isGenerating = isLoading;
  const hasResult = !!result;
  const hasError = !!error;

  // ========================================
  // Render
  // ========================================
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎵 AI-Enhanced Music Generator
        </h1>
        <p className="text-gray-600">
          Powered by OpenAI GPT-4o + Suno API + Trigger.dev
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Music
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="e.g., A dreamy electronic track with ethereal synths and gentle beats, perfect for late night coding..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={4}
            disabled={isGenerating}
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1 text-right">
            {userPrompt.length}/500 characters
          </p>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="user-123"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Genre
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="electronic, jazz, rock..."
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Mood
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="upbeat, relaxing, energetic..."
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="instrumental"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={makeInstrumental}
                  onChange={(e) => setMakeInstrumental(e.target.checked)}
                  disabled={isGenerating}
                />
                <label htmlFor="instrumental" className="ml-2 text-sm text-gray-700">
                  Make Instrumental
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !userPrompt.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? '🎵 Generating...' : '🚀 Generate Music with AI'}
          </button>

          {(hasResult || hasError) && (
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Real-time Progress Section */}
      {isGenerating && taskMetadata && (
        <div className="bg-blue-50 rounded-lg shadow-md p-6 space-y-4 animate-pulse">
          <h2 className="text-xl font-semibold text-gray-900">
            🎨 AI Magic in Progress...
          </h2>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {taskMetadata.stage}
              </span>
              <span className="text-sm text-gray-500">
                Step {taskMetadata.currentStep}/{taskMetadata.totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {progressPercent.toFixed(0)}%
            </p>
          </div>

          {/* Enhanced Prompt Preview */}
          {taskMetadata.enhancedPrompt && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                ✨ AI-Enhanced Prompt:
              </h3>
              <p className="text-sm text-gray-600 italic">
                "{taskMetadata.enhancedPrompt}"
              </p>
            </div>
          )}

          {/* Style Analysis */}
          {taskMetadata.musicStyle && (
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                🎼 Detected Musical Style:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Genre</p>
                  <p className="text-sm font-medium">{taskMetadata.musicStyle.genre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mood</p>
                  <p className="text-sm font-medium">{taskMetadata.musicStyle.mood}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tempo</p>
                  <p className="text-sm font-medium capitalize">
                    {taskMetadata.musicStyle.tempo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Instruments</p>
                  <p className="text-sm font-medium">
                    {taskMetadata.musicStyle.instruments.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
              {/* Tags */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {taskMetadata.musicStyle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {hasError && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Generation Failed
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error instanceof Error ? error.message : String(error)}
              </p>
              <button
                onClick={handleGenerate}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {hasResult && result && (
        <div className="bg-green-50 rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              ✅ Music Generated Successfully!
            </h2>
            <span className="text-sm text-gray-500">
              {result.processingTime ? `${(result.processingTime / 1000).toFixed(1)}s` : ''}
            </span>
          </div>

          {/* Original vs Enhanced Prompt */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Your Original Prompt:
              </h3>
              <p className="text-sm text-gray-600">"{result.originalPrompt}"</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                AI-Enhanced Prompt:
              </h3>
              <p className="text-sm text-gray-600 italic">
                "{result.enhancedPrompt}"
              </p>
            </div>
          </div>

          {/* Music Style Info */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              🎼 Musical Characteristics:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500">Genre</p>
                <p className="text-sm font-medium">{result.musicStyle.genre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mood</p>
                <p className="text-sm font-medium">{result.musicStyle.mood}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tempo</p>
                <p className="text-sm font-medium capitalize">
                  {result.musicStyle.tempo}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Instruments</p>
                <p className="text-sm font-medium">
                  {result.musicStyle.instruments.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Generated Music */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              🎵 Generated Music:
            </h3>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(result.generatedMusic, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>
          AI enhancement powered by{' '}
          <strong className="text-gray-700">OpenAI GPT-4o</strong> •
          Music generation by{' '}
          <strong className="text-gray-700">Suno API</strong> •
          Background tasks by{' '}
          <strong className="text-gray-700">Trigger.dev</strong>
        </p>
      </div>
    </div>
  );
}
