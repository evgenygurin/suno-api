#!/usr/bin/env node

/**
 * Trigger.dev Deployment Pre-flight Checklist
 *
 * Run this before deploying to ensure everything is configured correctly.
 *
 * Usage:
 *   node scripts/trigger-deploy-check.js
 *   npm run trigger:check
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function header(message) {
  log(`\n${colors.bold}${message}${colors.reset}`, 'blue');
}

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });

  return env;
}

// Check if required environment variables are set
function checkEnvironmentVariables(env) {
  header('1. Environment Variables');

  const required = [
    { key: 'TRIGGER_API_KEY', desc: 'Trigger.dev API Key' },
    { key: 'TRIGGER_PROJECT_REF', desc: 'Trigger.dev Project Reference' },
  ];

  const optional = [
    { key: 'TRIGGER_WEBHOOK_SECRET', desc: 'Webhook signature verification secret' },
    { key: 'SUNO_API_KEY', desc: 'Suno.ai API Key' },
  ];

  let allRequired = true;

  required.forEach(({ key, desc }) => {
    if (env[key] && env[key] !== `your_${key.toLowerCase()}_here`) {
      success(`${desc} (${key})`);
    } else {
      error(`${desc} (${key}) - NOT SET`);
      allRequired = false;
    }
  });

  optional.forEach(({ key, desc }) => {
    if (env[key] && env[key] !== `your_${key.toLowerCase()}_here`) {
      success(`${desc} (${key})`);
    } else {
      warning(`${desc} (${key}) - NOT SET (optional but recommended)`);
    }
  });

  return allRequired;
}

// Check if trigger configuration exists
function checkTriggerConfig() {
  header('2. Trigger.dev Configuration');

  const configPath = path.join(process.cwd(), 'trigger.config.ts');
  if (fs.existsSync(configPath)) {
    success('trigger.config.ts exists');
    return true;
  } else {
    error('trigger.config.ts not found');
    info('Run: npx trigger-cli@latest init');
    return false;
  }
}

// Check if trigger tasks directory exists
function checkTriggerTasks() {
  header('3. Trigger Tasks');

  const tasksDir = path.join(process.cwd(), 'src', 'trigger', 'tasks');
  if (!fs.existsSync(tasksDir)) {
    error('src/trigger/tasks directory not found');
    return false;
  }

  const files = fs.readdirSync(tasksDir);
  const taskFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js'));

  if (taskFiles.length === 0) {
    error('No task files found in src/trigger/tasks/');
    return false;
  }

  success(`Found ${taskFiles.length} task file(s):`);
  taskFiles.forEach(file => {
    info(`  - ${file}`);
  });

  return true;
}

// Check if dependencies are installed
function checkDependencies() {
  header('4. Dependencies');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = packageJson.dependencies || {};

  if (deps['@trigger.dev/sdk']) {
    success(`@trigger.dev/sdk installed (${deps['@trigger.dev/sdk']})`);
  } else {
    error('@trigger.dev/sdk not installed');
    info('Run: npm install @trigger.dev/sdk@latest');
    return false;
  }

  const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@trigger.dev', 'sdk');
  if (fs.existsSync(nodeModulesPath)) {
    success('node_modules installed');
  } else {
    warning('node_modules not found - run npm install');
    return false;
  }

  return true;
}

// Check API endpoints
function checkApiEndpoints() {
  header('5. API Endpoints');

  const endpoints = [
    { path: 'src/app/api/v2/generate/route.ts', desc: 'Job trigger endpoint' },
    { path: 'src/app/api/v2/jobs/[runId]/route.ts', desc: 'Job status endpoint' },
    { path: 'src/app/api/v2/webhooks/trigger/route.ts', desc: 'Webhook endpoint' },
  ];

  let allExist = true;

  endpoints.forEach(({ path: filePath, desc }) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      success(desc);
    } else {
      error(`${desc} - file not found: ${filePath}`);
      allExist = false;
    }
  });

  return allExist;
}

// Generate deployment command
function generateDeployCommand(env) {
  header('6. Ready to Deploy');

  const isProd = process.argv.includes('--prod');

  if (isProd) {
    warning('Production deployment mode');
    info('Ensure TRIGGER_API_KEY is set to production key (tr_prod_...)');
  } else {
    info('Development deployment mode');
  }

  console.log('\nRun deployment with:');
  log(`  npm run trigger:deploy${isProd ? ' -- --prod' : ''}`, 'bold');

  console.log('\nOr manually:');
  log(`  npx trigger-cli@latest deploy${isProd ? ' --prod' : ''}`, 'bold');
}

// Main checklist
async function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'blue');
  log('║   Trigger.dev Deployment Pre-flight Checklist   ║', 'blue');
  log('╚════════════════════════════════════════════════════╝\n', 'blue');

  const env = loadEnv();

  const checks = {
    env: checkEnvironmentVariables(env),
    config: checkTriggerConfig(),
    tasks: checkTriggerTasks(),
    deps: checkDependencies(),
    endpoints: checkApiEndpoints(),
  };

  const allPassed = Object.values(checks).every(Boolean);

  if (allPassed) {
    header('✨ All Checks Passed!');
    success('Your project is ready for deployment');
    generateDeployCommand(env);
    process.exit(0);
  } else {
    header('❌ Some Checks Failed');
    error('Please fix the issues above before deploying');

    console.log('\nQuick fixes:');
    if (!checks.env) {
      info('  1. Copy .env.example to .env and fill in values');
    }
    if (!checks.config) {
      info('  2. Run: npx trigger-cli@latest init');
    }
    if (!checks.deps) {
      info('  3. Run: npm install');
    }

    console.log('\nFor detailed setup instructions, see:');
    info('  docs/TRIGGER_FIRST_DEPLOY.md');

    process.exit(1);
  }
}

// Run checklist
main().catch(error => {
  console.error('\nFatal error:', error.message);
  process.exit(1);
});
