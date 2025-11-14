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

  // ============================================================================
  // MUSIC EXTENSION & MODIFICATION
  // ============================================================================

  /**
   * Extend existing music track
   */
  public async extendMusic(
    taskId: string,
    audioId: string,
    prompt?: string,
    continueAt?: number,
    model?: string
  ): Promise<AudioInfo[]> {
    try {
      const payload: any = {
        taskId,
        audioId,
      };

      if (prompt) {
        payload.prompt = prompt;
      }

      if (continueAt !== undefined) {
        payload.continueAt = continueAt;
      }

      if (model) {
        payload.model = this.mapModelName(model);
      }

      logger.info({ payload }, 'Extending music');

      const response = await this.client.post<TaskResponse>('/generate/extend', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const newTaskId = response.data.data.taskId;

      return [{
        id: newTaskId,
        original_song_id: taskId,
        status: 'GENERATING',
        created_at: new Date().toISOString(),
        model_name: this.mapModelName(model) || '',
      } as AudioInfo];
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error extending music');
      throw error;
    }
  }

  /**
   * Upload audio and create cover in different style
   */
  public async uploadCover(
    uploadUrl: string,
    style: string,
    title: string,
    options?: {
      prompt?: string;
      customMode?: boolean;
      instrumental?: boolean;
      model?: string;
      negativeTags?: string;
      vocalGender?: 'm' | 'f';
      styleWeight?: number;
      weirdnessConstraint?: number;
      audioWeight?: number;
    }
  ): Promise<AudioInfo[]> {
    try {
      const payload: any = {
        uploadUrl,
        style,
        title,
        customMode: options?.customMode ?? true,
        instrumental: options?.instrumental ?? false,
      };

      if (options?.prompt) payload.prompt = options.prompt;
      if (options?.model) payload.model = this.mapModelName(options.model);
      if (options?.negativeTags) payload.negativeTags = options.negativeTags;
      if (options?.vocalGender) payload.vocalGender = options.vocalGender;
      if (options?.styleWeight !== undefined) payload.styleWeight = options.styleWeight;
      if (options?.weirdnessConstraint !== undefined) payload.weirdnessConstraint = options.weirdnessConstraint;
      if (options?.audioWeight !== undefined) payload.audioWeight = options.audioWeight;

      logger.info({ payload }, 'Uploading and covering audio');

      const response = await this.client.post<TaskResponse>('/generate/upload-cover', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      return [{
        id: taskId,
        title,
        tags: style,
        status: 'GENERATING',
        created_at: new Date().toISOString(),
        model_name: this.mapModelName(options?.model) || '',
      } as AudioInfo];
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error uploading cover');
      throw error;
    }
  }

  /**
   * Create cover of existing Suno track
   */
  public async coverMusic(
    taskId: string,
    audioId: string,
    options?: {
      prompt?: string;
      style?: string;
      title?: string;
      model?: string;
    }
  ): Promise<AudioInfo[]> {
    try {
      const payload: any = {
        taskId,
        audioId,
      };

      if (options?.prompt) payload.prompt = options.prompt;
      if (options?.style) payload.style = options.style;
      if (options?.title) payload.title = options.title;
      if (options?.model) payload.model = this.mapModelName(options.model);

      logger.info({ payload }, 'Creating cover version');

      const response = await this.client.post<TaskResponse>('/generate/cover', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const newTaskId = response.data.data.taskId;

      return [{
        id: newTaskId,
        original_song_id: taskId,
        title: options?.title,
        tags: options?.style,
        status: 'GENERATING',
        created_at: new Date().toISOString(),
        model_name: this.mapModelName(options?.model) || '',
      } as AudioInfo];
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error creating cover');
      throw error;
    }
  }

  // ============================================================================
  // VOCAL & INSTRUMENTAL ADDITION
  // ============================================================================

  /**
   * Add vocals to instrumental track
   */
  public async addVocals(
    prompt: string,
    options: {
      taskId?: string;
      audioId?: string;
      uploadUrl?: string;
      style?: string;
      title?: string;
      vocalGender?: 'm' | 'f';
      model?: string;
    }
  ): Promise<AudioInfo[]> {
    try {
      if (!options.taskId && !options.uploadUrl) {
        throw new Error('Either taskId or uploadUrl must be provided');
      }

      const payload: any = {
        prompt,
      };

      if (options.taskId) {
        payload.taskId = options.taskId;
        payload.audioId = options.audioId || options.taskId;
      }

      if (options.uploadUrl) {
        payload.uploadUrl = options.uploadUrl;
      }

      if (options.style) payload.style = options.style;
      if (options.title) payload.title = options.title;
      if (options.vocalGender) payload.vocalGender = options.vocalGender;
      if (options.model) payload.model = this.mapModelName(options.model);

      logger.info({ payload }, 'Adding vocals');

      const response = await this.client.post<TaskResponse>('/generate/add-vocals', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      return [{
        id: taskId,
        original_song_id: options.taskId,
        title: options.title,
        tags: options.style,
        status: 'GENERATING',
        created_at: new Date().toISOString(),
        model_name: this.mapModelName(options.model) || '',
      } as AudioInfo];
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error adding vocals');
      throw error;
    }
  }

  /**
   * Add instrumental accompaniment to vocals
   */
  public async addInstrumental(
    style: string,
    options: {
      taskId?: string;
      audioId?: string;
      uploadUrl?: string;
      prompt?: string;
      title?: string;
      model?: string;
    }
  ): Promise<AudioInfo[]> {
    try {
      if (!options.taskId && !options.uploadUrl) {
        throw new Error('Either taskId or uploadUrl must be provided');
      }

      const payload: any = {
        style,
      };

      if (options.taskId) {
        payload.taskId = options.taskId;
        payload.audioId = options.audioId || options.taskId;
      }

      if (options.uploadUrl) {
        payload.uploadUrl = options.uploadUrl;
      }

      if (options.prompt) payload.prompt = options.prompt;
      if (options.title) payload.title = options.title;
      if (options.model) payload.model = this.mapModelName(options.model);

      logger.info({ payload }, 'Adding instrumental');

      const response = await this.client.post<TaskResponse>('/generate/add-instrumental', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      const taskId = response.data.data.taskId;

      return [{
        id: taskId,
        original_song_id: options.taskId,
        title: options.title,
        tags: style,
        status: 'GENERATING',
        created_at: new Date().toISOString(),
        model_name: this.mapModelName(options.model) || '',
      } as AudioInfo];
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error adding instrumental');
      throw error;
    }
  }

  // ============================================================================
  // AUDIO PROCESSING
  // ============================================================================

  /**
   * Convert audio to WAV format
   */
  public async convertToWAV(taskId: string, audioId: string): Promise<{ taskId: string }> {
    try {
      const response = await this.client.post('/generate/convert-to-wav', {
        taskId,
        audioId,
      });

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      return {
        taskId: response.data.data.taskId,
      };
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error converting to WAV');
      throw error;
    }
  }

  /**
   * Get WAV conversion status and download URL
   */
  public async getWAVConversionDetails(taskId: string): Promise<object> {
    try {
      const response = await this.client.get(`/generate/wav-conversion-info?taskId=${taskId}`);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      return response.data.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error getting WAV conversion details');
      throw error;
    }
  }

  /**
   * Upload file from URL
   * Downloads a file from the provided URL and stores it
   */
  public async uploadFileFromUrl(fileUrl: string): Promise<object> {
    try {
      const payload = {
        fileUrl,
      };

      logger.info({ payload }, 'Uploading file from URL');

      const response = await this.client.post('/file-url-upload', payload);

      if (response.data.code !== 200) {
        throw new Error(`API Error: ${response.data.msg}`);
      }

      return response.data.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error uploading file from URL');
      throw error;
    }
  }
}
