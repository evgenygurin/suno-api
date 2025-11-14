import crypto from 'crypto';
import logger from './logger';

/**
 * Verify Trigger.dev webhook signature using HMAC SHA256
 *
 * This prevents unauthorized webhooks from being processed by your application.
 * Trigger.dev signs each webhook with your webhook secret.
 *
 * @param payload - The raw request body (string)
 * @param signature - The signature from x-trigger-signature header
 * @param secret - Your webhook secret from environment variables
 * @returns true if signature is valid, false otherwise
 */
export function verifyTriggerWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Trigger.dev uses HMAC SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    // This ensures that attackers can't learn information about the signature
    // by measuring how long it takes to compare
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      logger.warn({
        expectedSignature: expectedSignature.substring(0, 10) + '...',
        receivedSignature: signature.substring(0, 10) + '...',
      }, 'Webhook signature mismatch');
    }

    return isValid;
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
    }, 'Error verifying webhook signature');
    return false;
  }
}

/**
 * Parse and validate Trigger.dev webhook event
 *
 * @param payload - The raw request body (string)
 * @returns Parsed event object or null if invalid
 */
export function parseTriggerWebhookEvent(payload: string): any | null {
  try {
    const event = JSON.parse(payload);

    // Validate event structure
    if (!event.type || !event.run) {
      logger.warn({ event }, 'Invalid webhook event structure');
      return null;
    }

    return event;
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
    }, 'Failed to parse webhook payload');
    return null;
  }
}

/**
 * Generate a webhook secret for development/testing
 * Use this to generate secrets instead of hardcoding them
 *
 * @returns A random hex string suitable for webhook secrets
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
