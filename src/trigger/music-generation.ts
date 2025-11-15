import { task } from "@trigger.dev/sdk/v3";
import { sunoApi } from "@/lib/SunoApi";
import logger from "@/lib/logger";

export const generateMusicTask = task({
  id: "generate-music",
  run: async (payload: {
    prompt: string;
    make_instrumental?: boolean;
    model?: string;
    wait_audio?: boolean;
  }) => {
    logger.info({ payload }, "Starting music generation task");

    try {
      const api = await sunoApi();

      const result = await api.generate(
        payload.prompt,
        payload.make_instrumental ?? false,
        payload.model ?? "V3_5",
        payload.wait_audio ?? false
      );

      logger.info({ result }, "Music generation completed");

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error({ error }, "Music generation failed");
      throw error;
    }
  },
});

export const getMusicStatusTask = task({
  id: "get-music-status",
  run: async (payload: { taskIds: string[] }) => {
    logger.info({ taskIds: payload.taskIds }, "Checking music status");

    try {
      const api = await sunoApi();
      const result = await api.get(payload.taskIds);

      logger.info({ result }, "Music status retrieved");

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error({ error }, "Failed to get music status");
      throw error;
    }
  },
});
