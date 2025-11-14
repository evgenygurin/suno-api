/**
 * Type definitions for Suno API responses
 */

export interface AudioInfo {
  id: string;
  title?: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
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
