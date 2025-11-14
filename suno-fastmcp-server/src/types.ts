/**
 * Type definitions for Suno API responses
 */

// ============================================================================
// STEMS (VOCAL SEPARATION) TYPES
// ============================================================================

export interface StemsInfo {
  vocals?: {
    url: string;
    duration: string;
    format: string;
    bitrate: string;
  };
  instrumental?: {
    url: string;
    duration: string;
    format: string;
    bitrate: string;
  };
}

// ============================================================================
// AUDIO INFO
// ============================================================================

export interface AudioInfo {
  id: string;
  title?: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  stream_audio_url?: string;  // Streaming URL
  video_url?: string;
  created_at: string;
  model_name: string;
  gpt_description_prompt?: string;
  prompt?: string;
  status: string;
  type?: string;
  tags?: string;
  negative_tags?: string;
  duration?: string;
  error_message?: string;
  // Stems (from vocal separation)
  stems?: StemsInfo;
  original_song_id?: string;  // For stems/covers
  completed_at?: string;      // Completion timestamp
}

export interface TaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface TaskStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'GENERATING' | 'SUCCESS' | 'FAILED' | 'PENDING';
    errorMessage?: string;
    response?: {
      data: AudioInfo[];
    };
  };
}

export interface CreditsResponse {
  code: number;
  msg: string;
  data: number;
}

export interface LyricsTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface LyricsStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'GENERATING' | 'SUCCESS' | 'FAILED';
    errorMessage?: string;
    response?: {
      data: Array<{
        id: string;
        text: string;
        title: string;
      }>;
    };
  };
}

// ============================================================================
// WAV CONVERSION TYPES
// ============================================================================

export interface WAVConversionResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED';
    wavUrl?: string;
    fileSize?: number;
    duration?: string;
    errorMessage?: string;
  };
}

// ============================================================================
// MUSIC VIDEO TYPES
// ============================================================================

export interface MusicVideoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED';
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: string;
    resolution?: string;
    fileSize?: number;
    errorMessage?: string;
  };
}

// ============================================================================
// VOCAL SEPARATION STATUS
// ============================================================================

export interface StemsStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED';
    stems?: StemsInfo;
    originalSongId?: string;
    createdAt?: string;
    completedAt?: string;
    errorMessage?: string;
  };
}
