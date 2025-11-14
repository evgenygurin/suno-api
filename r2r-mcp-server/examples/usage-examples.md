# R2R Agent Usage Examples

Практические примеры использования R2R MCP Agent'а в различных сценариях.

## 🔍 Примеры поиска

### Пример 1: Поиск документации по функционалу

```bash
# Найти информацию о CAPTCHA handling
npm run cli search "CAPTCHA solving 2captcha" -k 5 -m hybrid
```

**Результат:**
```
1. src/lib/captcha.ts (score: 0.892)
   export async function solveCaptcha(page: Page) {
     // Wait for captcha iframe
     await page.waitForSelector('iframe[src*="hcaptcha"]', ...

2. CLAUDE.md (score: 0.845)
   ### CAPTCHA Problems
   - Is 2Captcha API key valid and has balance?
   - Is the browser locale set correctly?...
```

### Пример 2: Поиск кодовых паттернов

```bash
# Найти примеры error handling
npm run cli search "try catch error handling logging" \
  --file-type typescript \
  --project-section src
```

## 🤖 Примеры RAG

### Пример 1: Вопрос о проекте

```bash
npm run cli ask "How to add a new API endpoint?"
```

**Ответ от агента:**
```
=== Answer ===

To add a new API endpoint in this Next.js 14 App Router project:

1. Create a new route file in src/app/api/[endpoint]/route.ts
2. Export POST/GET functions with NextRequest/NextResponse
3. Follow these CLAUDE.md guidelines:
   - Use TypeScript with proper types (no 'any')
   - Implement error handling with try-catch
   - Use Pino logger for structured logging
   - Return consistent JSON format

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Your logic here
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Endpoint error');
    return NextResponse.json(
      { error: 'Internal error', message: error.message },
      { status: 500 }
    );
  }
}
```

=== Sources ===
1. CLAUDE.md
2. src/app/api/generate/route.ts
3. src/app/api/get/route.ts
```

### Пример 2: Помощь с имплементацией

Используя MCP в Claude Code:

**User:** "Мне нужно добавить rate limiting для API endpoint'ов"

**Claude (используя `get_implementation_help`):**

```typescript
// Claude автоматически:
1. Ищет похожие паттерны: get_implementation_help({
     feature_description: "rate limiting for API endpoints"
   })
   
2. Находит, что нужна middleware или upstash/redis

3. Предлагает решение:

// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### Пример 3: Debugging

```bash
npm run cli debug-with-rag \
  --error "TimeoutError: Navigation timeout exceeded" \
  --file src/lib/browser.ts \
  --code-context "await page.goto(url, { timeout: 30000 })"
```

**Ответ:**
```
Based on similar issues in the codebase and best practices:

1. Problem: Default timeout is too short for heavy pages with CAPTCHA
2. Solution from past experience (src/lib/captcha.ts):
   - Increase timeout to 60000ms
   - Add retry logic with exponential backoff
   - Use waitForLoadState('networkidle')

Recommended fix:
```typescript
async function navigateWithRetry(page: Page, url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { 
        timeout: 60000,
        waitUntil: 'networkidle' 
      });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      logger.warn({ attempt: i + 1, error }, 'Navigation retry');
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}
```
```

## 🧠 Примеры работы с памятью

### Пример 1: Сохранение успешного решения

```bash
npm run cli memory store \
  -t "Fixed CAPTCHA timeout in production" \
  -a "Increased timeout to 60s and added retry with exponential backoff. Also added waitForLoadState('networkidle')" \
  -o success \
  -l "CAPTCHA solving requires generous timeouts (60s+) and retry logic due to variable solving time" \
  --tags "captcha,timeout,production,retry-logic"
```

**Результат:**
```
✓ Experience stored: exp_1234567890_abc123
```

### Пример 2: Поиск похожего опыта

```bash
npm run cli memory search "rate limit error from API" -k 3
```

**Результат:**
```
=== Similar Experiences ===

1. Rate limit exceeded handling
   Outcome: success
   Pattern: Implement exponential backoff with jitter for API retries
   Tags: rate-limit, retry, api

2. Suno API 429 errors
   Outcome: success  
   Pattern: Add delay between requests and respect Retry-After header
   Tags: rate-limit, suno-api, http-429

3. Daily limit exceeded
   Outcome: partial
   Pattern: Cache results to reduce API calls
   Tags: rate-limit, caching, optimization
```

### Пример 3: Автоматическое применение опыта

**В Claude Code:**

```typescript
// User: "У меня ошибка rate limit от Suno API"

// Claude автоматически:
1. retrieve_similar_experiences({
     current_context: "rate limit error from Suno API"
   })
   → Находит 3 похожих случая
   
2. Анализирует паттерны:
   - Exponential backoff работал
   - Respecting Retry-After header помог
   - Кеширование снизило нагрузку

3. Предлагает комплексное решение:

async function apiCallWithRetry(fn: () => Promise<any>, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000
          : Math.min(1000 * 2 ** i, 30000); // Exponential backoff with cap
        
        logger.warn({ attempt: i + 1, delay }, 'Rate limited, retrying');
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

4. store_experience({
     context: { task: "Fixed rate limit with combined approach" },
     outcome: "success",
     learned_pattern: "Combine retry-after + exponential backoff + caching"
   })
```

## 🕸️ Примеры GraphRAG

### Пример 1: Анализ зависимостей

```bash
npm run cli graph deps src/app/api/generate/route.ts --transitive
```

**Результат:**
```
=== Dependencies of src/app/api/generate/route.ts ===

Direct dependencies:
- next/server (module)
- @/lib/logger (module)
- @/lib/browser (module)
- @/lib/captcha (module)
- @/types (module)

Transitive dependencies:
- pino (module, via @/lib/logger)
- playwright (module, via @/lib/browser)
- @/lib/2captcha (module, via @/lib/captcha)
```

### Пример 2: Найти где используется модуль

```bash
npm run cli graph usages src/lib/logger.ts
```

**Результат:**
```
=== Usages of src/lib/logger.ts ===

Used by:
- src/app/api/generate/route.ts (imports)
- src/app/api/get/route.ts (imports)
- src/lib/browser.ts (imports)
- src/lib/captcha.ts (imports)
- src/middleware.ts (imports)
```

### Пример 3: Test coverage

```bash
npm run cli graph coverage src/lib/captcha.ts
```

**Результат:**
```
=== Test Coverage for src/lib/captcha.ts ===

Tests:
- tests/captcha.test.ts (tests)
  - ✓ solveCaptcha with valid token
  - ✓ solveCaptcha timeout handling
  - ✓ solveCaptcha retry logic

Coverage: 3 test files, 8 test cases
```

### Пример 4: Архитектурный обзор

```bash
npm run cli graph explore src/app/api/ -d 2
```

**Результат:**
```
=== Architecture of src/app/api/ ===

Modules: 12
  - file: 6
  - function: 43
  - interface: 8

Relationships: 67
  - imports: 45
  - calls: 18
  - depends_on: 4

Most Connected Modules:
  - src/lib/logger.ts (15 connections)
  - src/lib/browser.ts (12 connections)
  - src/types.ts (10 connections)

Architecture Pattern: Layered (API → Lib → External)
```

## 🔄 Примеры интеграции workflow

### Workflow 1: Новая фича с полным циклом

```bash
# 1. Исследование
npm run cli ask "What's the pattern for adding API endpoints?"

# 2. Поиск примеров
npm run cli search "API route example POST" -k 3

# 3. Проверка зависимостей
npm run cli graph deps src/app/api/generate/route.ts

# 4. Имплементация (в коде)
# ... write code ...

# 5. Сохранение опыта
npm run cli memory store \
  -t "Added /api/user/credits endpoint" \
  -a "Created route with rate limiting, auth middleware, and proper error handling" \
  -o success \
  --tags "api,feature,credits"
```

### Workflow 2: Bug fix с использованием памяти

```typescript
// В Claude Code:

1. User: "У меня баг - browser не закрывается после error"

2. Claude:
   retrieve_similar_experiences({
     current_context: "browser not closing after error"
   })
   
   Находит: "Always use try-finally for browser cleanup"

3. debug_with_rag({
     error_message: "Browser process still running",
     file_path: "src/lib/browser.ts"
   })
   
   Находит паттерн в коде:
   
4. Предлагает fix:

async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>
): Promise<T> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch();
    return await fn(browser);
  } finally {
    if (browser) {
      await browser.close().catch(err => 
        logger.error({ err }, 'Failed to close browser')
      );
    }
  }
}

5. store_experience({
     context: { 
       task: "Fixed browser leak",
       error_type: "ResourceLeak"
     },
     action_taken: "Used try-finally pattern",
     outcome: "success",
     learned_pattern: "Always cleanup resources in finally block"
   })
```

### Workflow 3: Code review с GraphRAG

```bash
# Pull request review workflow

# 1. Найти все затронутые модули
git diff --name-only main | xargs -I {} npm run cli graph query {}

# 2. Проверить test coverage
git diff --name-only main | grep "^src/" | xargs -I {} npm run cli graph coverage {}

# 3. Найти что сломается
git diff --name-only main | grep "^src/" | xargs -I {} npm run cli graph usages {}

# 4. Проверить best practices
npm run cli reflect-patterns --area "code review"
```

## 💡 Advanced Use Cases

### Use Case 1: Documentation Generation

```typescript
// Generate docs from code understanding
async function generateDocs(modulePath: string) {
  // 1. Get module info
  const deps = await findDependencies({ module_path: modulePath });
  const usages = await findUsages({ module_path: modulePath });
  
  // 2. Ask for explanation
  const explanation = await askDocumentation({
    question: `Explain the purpose and usage of ${modulePath}`
  });
  
  // 3. Find examples
  const examples = await searchCodeExamples({
    description: `usage examples of ${modulePath}`
  });
  
  // 4. Generate markdown
  return `
# ${modulePath}

${explanation.answer}

## Dependencies
${deps.dependencies.map(d => `- ${d.name}`).join('\n')}

## Used By
${usages.usages.map(u => `- ${u.name}`).join('\n')}

## Examples
${examples.map(e => e.content).join('\n\n')}
  `;
}
```

### Use Case 2: Automated Refactoring Suggestions

```typescript
// Analyze codebase and suggest refactorings
async function suggestRefactorings() {
  // 1. Reflect on patterns
  const patterns = await reflectOnPatterns({
    area: "code quality"
  });
  
  // 2. Find anti-patterns
  const antiPatterns = await searchCodeExamples({
    description: "any type usage console.log"
  });
  
  // 3. Check graph for high coupling
  const graph = await exploreArchitectureGraph({
    root_module: "src/",
    max_depth: 2
  });
  
  // 4. Generate report
  return {
    anti_patterns: antiPatterns,
    high_coupling: graph.modules.filter(m => 
      m.connections > 10
    ),
    recommendations: patterns.patterns
  };
}
```

## 📚 More Examples

См. также:
- [Integration Tests](../tests/integration/) - полные примеры использования всех tools
- [README.md](../README.md) - основная документация
- [CLAUDE.md](../../CLAUDE.md) - guidelines проекта
