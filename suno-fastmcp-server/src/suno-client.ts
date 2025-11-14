import axios, { AxiosInstance } from 'axios';
import logger from './logger.js';
import type {
  AudioInfo,
  TaskResponse,
  TaskStatusResponse,
  CreditsResponse,
  LyricsTaskResponse,
  LyricsStatusResponse,
} from './types.js';

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

export class SunoClient {
  private static BASE_URL: string = 'https://api.sunoapi.org/api/v1';
  private readonly client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: SunoClient.BASE_URL,
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

      logger.info({ payload }, 'Generating music');

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
  public async customGenerate(
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

      logger.info({ payload }, 'Generating custom music');

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
  public async getAudioInfo(taskIds: string[]): Promise<AudioInfo[]> {
    try {
      if (!taskIds || taskIds.length === 0) {
        throw new Error('Please provide at least one task ID');
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
  public async getCredits(): Promise<{ credits_left: number }> {
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
   * Generate stems (vocal separation)
   */
  public async generateStems(songId: string): Promise<AudioInfo[]> {
    try {
      const response = await this.client.post('/vocal-removal/generate', {
        taskId: songId,
        audioId: songId,
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
   * Get timestamped lyrics
   */
  public async getTimestampedLyrics(songId: string): Promise<object> {
    try {
      const response = await this.client.get(`/get-timestamped-lyrics?taskId=${songId}&audioId=${songId}`);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      return response.data.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error getting timestamped lyrics');
      throw error;
    }
  }
}
