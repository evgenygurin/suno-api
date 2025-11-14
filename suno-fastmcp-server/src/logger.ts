import pino from 'pino';

/**
 * MCP Logger Configuration
 *
 * CRITICAL: MCP servers communicate via JSON-RPC over stdio.
 * - stdout MUST be reserved for JSON-RPC protocol messages ONLY
 * - stderr is for all logging output
 *
 * File descriptor 2 = stderr
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          destination: 2, // Write to stderr (fd 2)
        },
      }
    : undefined,
}, pino.destination({ dest: 2, sync: false })); // Fallback: write to stderr

export default logger;
