import axios, { AxiosInstance } from 'axios';
import logger from './logger';

// Default model for music generation
export const DEFAULT_MODEL = 'V3_5';

// Suno API models mapping
export const SUNO_MODELS = {
  'chirp-v3-5': 'V3_5',
  'chirp-v4': 'V4',
  'chirp-v4-5': 'V4_5',
  'chirp-v4-5-plus': 'V4_5PLUS',
  'chirp-v5': 'V5',
} as const;

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

class SunoApi {
  private static BASE_URL: string = 'https://api.sunoapi.org/api/v1';
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: SunoApi.BASE_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Maps old model names to new API model names
   */
  private mapModelName(oldModel?: string): string {
    if (!oldModel) return DEFAULT_MODEL;
    
    // If already in new format, return as is
    if (Object.values(SUNO_MODELS).includes(oldModel as any)) {
      return oldModel;
    }
    
    // Map old format to new format
    return SUNO_MODELS[oldModel as keyof typeof SUNO_MODELS] || DEFAULT_MODEL;
  }

  /**
   * Wait for task completion by polling the task status
   */
  private async waitForCompletion(taskId: string, maxWaitTime: number = 300000): Promise<AudioInfo[]> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await this.client.get<TaskStatusResponse>(
          `/generate/record-info?taskId=${taskId}`
        );

        const status = response.data.data.status;
        
        if (status === 'SUCCESS' && response.data.data.response?.data) {
          return response.data.data.response.data;
        } else if (status === 'FAILED') {
          throw new Error(`Generation failed: ${response.data.data.errorMessage || 'Unknown error'}`);
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        if (error.response?.data?.code !== 200) {
          throw error;
        }
        // Continue polling on other errors
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Task timeout: Generation took too long');
  }

  /**
   * Generate music based on prompt
   * @param prompt The text prompt to generate audio from
   * @param make_instrumental Whether to generate instrumental only
   * @param model Model version to use
   * @param wait_audio Whether to wait for audio generation to complete
   */
  public async generate(
    prompt: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false
  ): Promise<AudioInfo[]> {
    try {
      const payload = {
        prompt,
        customMode: false,
        instrumental: make_instrumental,
        model: this.mapModelName(model),
      };

      logger.info({ payload }, 'Generating music with payload');

      const response = await this.client.post<TaskResponse>('/generate', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      if (wait_audio) {
        return await this.waitForCompletion(taskId);
      } else {
        // Return task info without waiting
        return [{
          id: taskId,
          status: 'GENERATING',
          created_at: new Date().toISOString(),
          model_name: this.mapModelName(model),
        } as AudioInfo];
      }
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error generating music');
      throw error;
    }
  }

  /**
   * Generate custom music with detailed parameters
   */
  public async custom_generate(
    prompt: string,
    tags: string,
    title: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false,
    negative_tags?: string
  ): Promise<AudioInfo[]> {
    try {
      const payload: any = {
        customMode: true,
        style: tags,
        title,
        instrumental: make_instrumental,
        model: this.mapModelName(model),
      };

      // Only add prompt if not instrumental
      if (!make_instrumental) {
        payload.prompt = prompt;
      }

      if (negative_tags) {
        payload.negativeTags = negative_tags;
      }

      logger.info({ payload }, 'Generating custom music with payload');

      const response = await this.client.post<TaskResponse>('/generate', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      if (wait_audio) {
        return await this.waitForCompletion(taskId);
      } else {
        return [{
          id: taskId,
          title,
          tags,
          negative_tags,
          status: 'GENERATING',
          created_at: new Date().toISOString(),
          model_name: this.mapModelName(model),
        } as AudioInfo];
      }
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error generating custom music');
      throw error;
    }
  }

  /**
   * Get audio information by task IDs
   */
  public async get(taskIds?: string[], page?: string | null): Promise<AudioInfo[]> {
    try {
      if (!taskIds || taskIds.length === 0) {
        // Get all user's music - this functionality needs to be implemented differently
        // For now, throw an error
        throw new Error('Getting all music is not supported in the new API. Please provide specific task IDs.');
      }

      const results: AudioInfo[] = [];

      for (const taskId of taskIds) {
        const response = await this.client.get<TaskStatusResponse>(
          `/generate/record-info?taskId=${taskId}`
        );

        if (response.data.code === 200 && response.data.data.response?.data) {
          results.push(...response.data.data.response.data);
        } else if (response.data.code === 200) {
          // Task is still processing
          results.push({
            id: taskId,
            status: response.data.data.status,
            created_at: new Date().toISOString(),
            model_name: '',
          } as AudioInfo);
        }
      }

      return results;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error getting audio info');
      throw error;
    }
  }

  /**
   * Get remaining credits
   */
  public async get_credits(): Promise<{ credits_left: number }> {
    try {
      const response = await this.client.get<CreditsResponse>('/generate/credit');

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      return {
        credits_left: response.data.data,
      };
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error getting credits');
      throw error;
    }
  }

  /**
   * Generate lyrics based on prompt
   */
  public async generateLyrics(prompt: string): Promise<string> {
    try {
      const response = await this.client.post<LyricsTaskResponse>('/lyrics', {
        prompt,
      });

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      // Wait for lyrics generation
      const startTime = Date.now();
      const maxWaitTime = 60000; // 60 seconds
      const pollInterval = 3000; // 3 seconds

      while (Date.now() - startTime < maxWaitTime) {
        const statusResponse = await this.client.get<LyricsStatusResponse>(
          `/lyrics/record-info?taskId=${taskId}`
        );

        if (statusResponse.data.data.status === 'SUCCESS' && statusResponse.data.data.response?.data) {
          return statusResponse.data.data.response.data[0].text;
        } else if (statusResponse.data.data.status === 'FAILED') {
          throw new Error(`Lyrics generation failed: ${statusResponse.data.data.errorMessage}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      throw new Error('Lyrics generation timeout');
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error generating lyrics');
      throw error;
    }
  }

  /**
   * Extend audio (requires uploading audio first)
   */
  public async extendAudio(
    audioId: string,
    prompt: string = '',
    continueAt: number,
    tags: string = '',
    negative_tags: string = '',
    title: string = '',
    model?: string,
    wait_audio?: boolean
  ): Promise<AudioInfo[]> {
    try {
      // Note: The new API requires different approach for extending audio
      // It uses upload-and-extend endpoint
      throw new Error('Audio extension requires uploading the audio file. Use upload-and-extend endpoint instead.');
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error extending audio');
      throw error;
    }
  }

  /**
   * Get clip information - not directly supported in new API
   */
  public async getClip(clipId: string): Promise<object> {
    // This functionality is replaced by get() method with task ID
    return this.get([clipId]).then(results => results[0]);
  }

  /**
   * Concatenate - not supported in new API
   */
  public async concatenate(clip_id: string): Promise<AudioInfo> {
    throw new Error('Concatenate is not supported in the new API');
  }

  /**
   * Generate stems - now called vocal separation in new API
   */
  public async generateStems(song_id: string): Promise<AudioInfo[]> {
    try {
      const response = await this.client.post('/vocal-removal/generate', {
        taskId: song_id,
        audioId: song_id,
      });

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      // Return task info
      return [{
        id: taskId,
        status: 'GENERATING',
        created_at: new Date().toISOString(),
        model_name: '',
      } as AudioInfo];
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error generating stems');
      throw error;
    }
  }

  /**
   * Get aligned lyrics - not directly supported in new API
   * New API uses get-timestamped-lyrics endpoint
   */
  public async getLyricAlignment(song_id: string): Promise<object> {
    try {
      const response = await this.client.get(`/get-timestamped-lyrics?taskId=${song_id}&audioId=${song_id}`);
      
      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      return response.data.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error getting lyric alignment');
      throw error;
    }
  }

  /**
   * Get persona - not directly supported in basic new API
   */
  public async getPersonaPaginated(personaId: string, page: number = 1): Promise<any> {
    throw new Error('Persona pagination is not supported in the new API. Use personaId parameter during generation instead.');
  }
}

/**
 * Factory function to create or retrieve cached SunoApi instance
 */
export const sunoApi = async (apiKey?: string): Promise<SunoApi> => {
  const resolvedApiKey = apiKey || process.env.SUNO_API_KEY;
  
  if (!resolvedApiKey) {
    logger.error({}, 'No API key provided! Please provide SUNO_API_KEY in environment variables or pass it as parameter.');
    throw new Error('Please provide SUNO_API_KEY in environment variables or pass it as parameter.');
  }

  return new SunoApi(resolvedApiKey);
};
