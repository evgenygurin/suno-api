#!/usr/bin/env node

/**
 * Trigger.dev Webhook Testing Utility
 *
 * Test your webhook endpoint locally without needing Trigger.dev to send real events.
 *
 * Usage:
 *   npm run webhook:test
 *   npm run webhook:test -- --event=run.failed
 *   npm run webhook:test -- --no-signature  # Test without signature
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

// Configuration
const config = {
  url: args.url || 'http://localhost:3000/api/v2/webhooks/trigger',
  event: args.event || 'run.completed',
  secret: args.secret || process.env.TRIGGER_WEBHOOK_SECRET,
  useSignature: !args['no-signature'],
};

// Load environment variables
function loadEnv() {
  const fs = require('fs');
  const path = require('path');

  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Generate test webhook payloads
function generatePayload(eventType) {
  const baseRun = {
    id: 'run_test_' + Math.random().toString(36).substring(7),
    taskIdentifier: 'generate-music',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      userId: 'test_user_123',
      testMode: true,
    },
  };

  const payloads = {
    'run.completed': {
      type: 'run.completed',
      run: {
        ...baseRun,
        status: 'COMPLETED',
        output: {
          success: true,
          data: [
            {
              id: 'song_test_123',
              title: 'Test Webhook Song',
              audio_url: 'https://cdn.suno.ai/test_webhook.mp3',
              duration: 120,
              prompt: 'webhook test - happy tune',
              created_at: new Date().toISOString(),
            },
          ],
        },
      },
    },
    'run.failed': {
      type: 'run.failed',
      run: {
        ...baseRun,
        status: 'FAILED',
        output: {
          success: false,
          error: 'Test error: CAPTCHA solving failed after 3 attempts',
        },
        attempts: [
          { attempt: 1, error: 'CAPTCHA timeout' },
          { attempt: 2, error: 'CAPTCHA timeout' },
          { attempt: 3, error: 'CAPTCHA timeout' },
        ],
      },
    },
    'run.canceled': {
      type: 'run.canceled',
      run: {
        ...baseRun,
        status: 'CANCELED',
      },
    },
    'run.started': {
      type: 'run.started',
      run: {
        ...baseRun,
        status: 'EXECUTING',
      },
    },
  };

  return payloads[eventType] || payloads['run.completed'];
}

// Generate HMAC signature
function generateSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

// Send webhook request
async function sendWebhook(url, payload, signature) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = JSON.stringify(payload);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'TriggerDev-Webhook-Test/1.0',
      },
    };

    if (signature) {
      options.headers['x-trigger-signature'] = signature;
    }

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Main test function
async function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║      Trigger.dev Webhook Testing Utility        ║', 'blue');
  log('╚════════════════════════════════════════════════════╝\n', 'blue');

  // Load .env
  loadEnv();

  // Update config with loaded env
  if (!config.secret && process.env.TRIGGER_WEBHOOK_SECRET) {
    config.secret = process.env.TRIGGER_WEBHOOK_SECRET;
  }

  // Display configuration
  log('Configuration:', 'bold');
  log(`  URL: ${config.url}`, 'blue');
  log(`  Event: ${config.event}`, 'blue');
  log(`  Signature: ${config.useSignature ? 'Enabled' : 'Disabled'}`, 'blue');

  if (config.useSignature && !config.secret) {
    log('\n⚠️  Warning: Signature verification enabled but no secret found!', 'yellow');
    log('Set TRIGGER_WEBHOOK_SECRET in .env or use --no-signature flag\n', 'yellow');
  }

  // Generate payload
  const payload = generatePayload(config.event);

  log('\nPayload:', 'bold');
  log(JSON.stringify(payload, null, 2), 'reset');

  // Generate signature if needed
  let signature = null;
  if (config.useSignature && config.secret) {
    const payloadString = JSON.stringify(payload);
    signature = generateSignature(payloadString, config.secret);
    log('\nSignature:', 'bold');
    log(`  ${signature.substring(0, 20)}...`, 'blue');
  }

  // Send webhook
  log('\nSending webhook...', 'bold');

  try {
    const response = await sendWebhook(config.url, payload, signature);

    log('\nResponse:', 'bold');
    log(`  Status: ${response.statusCode}`, response.statusCode === 200 ? 'green' : 'red');

    if (response.statusCode === 200) {
      log('  ✅ Webhook received successfully!', 'green');
    } else if (response.statusCode === 401) {
      log('  ❌ Unauthorized - signature verification failed', 'red');
      log('  Check that TRIGGER_WEBHOOK_SECRET matches in both .env and test', 'yellow');
    } else {
      log(`  ⚠️  Unexpected status code: ${response.statusCode}`, 'yellow');
    }

    if (response.body) {
      try {
        const body = JSON.parse(response.body);
        log('\n  Body:', 'bold');
        log(JSON.stringify(body, null, 4), 'reset');
      } catch {
        log('\n  Body (raw):', 'bold');
        log(response.body, 'reset');
      }
    }

    log('\n✨ Test completed!', 'green');

  } catch (error) {
    log('\n❌ Error sending webhook:', 'red');
    log(`  ${error.message}`, 'red');

    if (error.code === 'ECONNREFUSED') {
      log('\n  Is your server running?', 'yellow');
      log('  Try: npm run dev', 'yellow');
    }

    process.exit(1);
  }
}

// Show usage if --help
if (args.help) {
  console.log(`
${colors.bold}Trigger.dev Webhook Testing Utility${colors.reset}

${colors.bold}Usage:${colors.reset}
  npm run webhook:test
  npm run webhook:test -- --event=run.failed
  npm run webhook:test -- --no-signature
  npm run webhook:test -- --url=https://your-domain.com/api/v2/webhooks/trigger

${colors.bold}Options:${colors.reset}
  --url=<url>           Webhook URL (default: http://localhost:3000/api/v2/webhooks/trigger)
  --event=<type>        Event type (default: run.completed)
  --secret=<secret>     Webhook secret (default: from .env)
  --no-signature        Don't include signature header
  --help                Show this help message

${colors.bold}Event Types:${colors.reset}
  run.completed         Job finished successfully
  run.failed            Job failed after all retries
  run.canceled          Job was manually canceled
  run.started           Job started executing

${colors.bold}Examples:${colors.reset}
  # Test successful completion
  npm run webhook:test

  # Test failure scenario
  npm run webhook:test -- --event=run.failed

  # Test without signature (should fail if verification enabled)
  npm run webhook:test -- --no-signature

  # Test remote server
  npm run webhook:test -- --url=https://your-app.vercel.app/api/v2/webhooks/trigger
`);
  process.exit(0);
}

// Run test
main().catch(error => {
  log('\n❌ Fatal error:', 'red');
  log(`  ${error.message}`, 'red');
  process.exit(1);
});
