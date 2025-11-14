# R2R MCP Agent for Suno API

Интеллектуальный агент на базе [R2R (RAG-фреймворка)](https://github.com/SciPhi-AI/R2R) с интеграцией через Model Context Protocol (MCP) для проекта Suno API.

## 🎯 Возможности

### RAG (Retrieval-Augmented Generation)

- **Семантический поиск** по документации проекта
- **Hybrid search** (векторный + ключевые слова)
- **Контекстные ответы** на вопросы о проекте
- **Помощь в имплементации** фич с примерами и паттернами

### GraphRAG

- **Граф знаний** о структуре кода
- **Анализ зависимостей** между модулями
- **Поиск использований** (где используется модуль/функция)
- **Test coverage mapping** (какие тесты покрывают код)

### Experience Memory

- **Накопление опыта** решений и паттернов
- **Поиск похожих ситуаций** из прошлого
- **Автоматическая рефлексия** для выявления patterns
- **Статистика** успешных/неуспешных подходов

### MCP Integration

- **Прямая интеграция с Claude** через MCP protocol
- **16 специализированных инструментов** для разработки
- **Real-time** доступ к документации и истории

## 🏗️ Архитектура

```
┌─────────────────┐
│  Claude (User)  │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐      ┌──────────────┐
│  MCP Server     │◄────►│  R2R Client  │
│  (TypeScript)   │      │  (REST API)  │
└─────────────────┘      └──────┬───────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │   R2R Server    │
         │              │  (Python/API)   │
         │              └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐      ┌──────────────────┐
│  Ingestion      │      │  PostgreSQL +    │
│  Pipeline       │─────►│  pgvector        │
└─────────────────┘      └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ и npm
- Docker и Docker Compose
- OpenAI API ключ (для эмбеддингов и RAG)

### 1. Установка R2R

```bash
cd r2r-mcp-server

# Скопировать и настроить .env
cp .env.example .env

# Отредактировать .env:
# - R2R_BASE_URL=http://localhost:7272
# - OPENAI_API_KEY=your_key_here
nano .env

# Запустить R2R с PostgreSQL
docker-compose up -d

# Проверить статус
docker-compose ps
docker-compose logs r2r
```

### 2. Установка MCP Server

```bash
# Установить зависимости
npm install

# Собрать TypeScript
npm run build

# Проверить подключение к R2R
npm run cli health
```

### 3. Индексация документации

```bash
# Запустить ingestion pipeline
npm run ingest

# Или через CLI с параметрами
npm run cli ingest -- \
  --root ../ \
  --chunk-size 512 \
  --chunk-overlap 50
```

Это проиндексирует:

- `README.md`, `CLAUDE.md` (правила проекта)
- Все `*.ts`, `*.tsx` файлы в `src/`
- Тесты в `tests/`
- И построит knowledge graph

### 4. Тестирование

```bash
# Проверить search
npm run cli search "how to handle CAPTCHA"

# Проверить RAG
npm run cli ask "What are the guidelines for error handling?"

# Проверить graph
npm run cli graph query src/app/api/generate
```

### 5. Запуск MCP Server

```bash
# Development mode (с hot reload)
npm run dev

# Production mode
npm start
```

## 🔧 Интеграция с Claude Desktop

### Вариант 1: Через stdio (рекомендуется)

Добавьте в `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "r2r-suno-agent": {
      "command": "node",
      "args": [
        "/absolute/path/to/r2r-mcp-server/dist/server.js"
      ],
      "env": {
        "R2R_BASE_URL": "http://localhost:7272",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Вариант 2: Через HTTP (альтернатива)

```json
{
  "mcpServers": {
    "r2r-suno-agent": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

После настройки перезапустите Claude Desktop.

## 📚 Использование

### MCP Tools

После интеграции Claude получит доступ к этим инструментам:

#### 🔍 Search Tools

**`search_documentation`** - Поиск по документации

```typescript
{
  query: "playwright browser automation",
  top_k: 5,
  search_mode: "hybrid", // vector | keyword | hybrid
  file_type: "typescript",
  project_section: "src"
}
```

**`search_code_examples`** - Поиск примеров кода

```typescript
{
  description: "how to solve CAPTCHA with 2captcha",
  language: "typescript",
  top_k: 3
}
```

**`find_test_examples`** - Поиск тестов

```typescript
{
  feature: "API endpoint testing",
  top_k: 3
}
```

#### 🤖 RAG Tools

**`ask_documentation`** - Вопросы о проекте

```typescript
{
  question: "How does CAPTCHA solving work in this project?",
  top_k: 5,
  include_sources: true
}
```

**`get_implementation_help`** - Помощь с имплементацией

```typescript
{
  feature_description: "Add new API endpoint for user settings",
  context: {
    file_path: "src/app/api/settings/route.ts",
    error_message: "Type error in request handler"
  }
}
```

**`debug_with_rag`** - Помощь с дебагом

```typescript
{
  error_message: "TypeError: Cannot read property 'click' of null",
  code_context: "await page.click('.captcha-button')",
  file_path: "src/lib/captcha.ts"
}
```

**`explain_architecture`** - Объяснение архитектуры

```typescript
{
  aspect: "authentication flow" // or "API structure", "database design"
}
```

#### 🧠 Memory Tools

**`store_experience`** - Сохранить опыт

```typescript
{
  context: {
    task: "Fixed CAPTCHA timeout issue",
    file_paths: ["src/lib/captcha.ts"],
    technologies: ["Playwright", "2Captcha"],
    error_type: "TimeoutError"
  },
  action_taken: "Increased timeout from 30s to 60s and added retry logic",
  outcome: "success",
  learned_pattern: "CAPTCHA solving can take longer under load - always use generous timeouts with retries",
  tags: ["captcha", "timeout", "error-handling"]
}
```

**`retrieve_similar_experiences`** - Найти похожий опыт

```typescript
{
  current_context: "Getting timeout errors when solving CAPTCHA",
  top_k: 3,
  tags: ["captcha", "timeout"]
}
```

**`reflect_on_patterns`** - Анализ паттернов

```typescript
{
  area: "error handling", // or "testing", "API design"
  time_window_days: 30
}
```

**`get_memory_stats`** - Статистика памяти

```typescript
{} // No parameters
```

#### 🕸️ Graph Tools

**`query_code_relationships`** - Связи в графе

```typescript
{
  entity_name: "src/lib/captcha.ts",
  relationship_types: ["imports", "calls"],
  depth: 2,
  limit: 50
}
```

**`find_dependencies`** - Зависимости модуля

```typescript
{
  module_path: "src/app/api/generate/route.ts",
  include_transitive: true
}
```

**`find_usages`** - Где используется

```typescript
{
  module_path: "src/lib/logger.ts",
  depth: 1
}
```

**`find_test_coverage`** - Покрытие тестами

```typescript
{
  module_path: "src/app/api/generate/route.ts"
}
```

**`explore_architecture_graph`** - Исследовать архитектуру

```typescript
{
  root_module: "src/",
  max_depth: 2
}
```

### CLI Usage

```bash
# Search
npm run cli search "playwright automation"
npm run cli search "CAPTCHA handling" -k 10 -m hybrid

# RAG
npm run cli ask "How to add a new API endpoint?"
npm run cli ask "What are the TypeScript conventions?" -k 7

# Memory
npm run cli memory store \
  -t "Fixed rate limit error" \
  -a "Added exponential backoff" \
  -o success \
  --tags "rate-limit,retry"

npm run cli memory search "rate limit issues" -k 5
npm run cli memory stats

# Graph
npm run cli graph query src/lib/captcha.ts -d 2
npm run cli graph deps src/app/api/generate/route.ts --transitive

# Server
npm run cli server start
npm run cli server dev

# Health
npm run cli health
```

## 🎯 Примеры использования

### Сценарий 1: Добавление новой функциональности

```typescript
// В Claude Code:
// Вы: "Мне нужно добавить endpoint для получения credits пользователя"

// Claude использует:
1. search_code_examples({ description: "API endpoint credits" })
   → Находит примеры endpoint'ов
   
2. ask_documentation({ question: "How to create API routes?" })
   → Получает guidelines из CLAUDE.md
   
3. find_dependencies({ module_path: "src/app/api/generate/route.ts" })
   → Видит какие утилиты используют другие endpoints
   
4. store_experience({
     context: { task: "Created /api/credits endpoint" },
     action_taken: "...",
     outcome: "success"
   })
   → Сохраняет опыт для будущего
```

### Сценарий 2: Дебаг ошибки

```typescript
// Вы: "У меня CAPTCHA timeout в production"

// Claude:
1. retrieve_similar_experiences({ 
     current_context: "CAPTCHA timeout in production" 
   })
   → Находит, что уже решали эту проблему
   
2. debug_with_rag({
     error_message: "TimeoutError: CAPTCHA solving timeout",
     file_path: "src/lib/captcha.ts"
   })
   → Получает контекстное решение
   
3. Предлагает fix на основе прошлого опыта
```

### Сценарий 3: Рефакторинг

```typescript
// Вы: "Нужно отрефакторить error handling"

// Claude:
1. reflect_on_patterns({ area: "error handling" })
   → Анализирует накопленные best practices
   
2. explore_architecture_graph({ root_module: "src/" })
   → Видит все модули с error handling
   
3. search_code_examples({ description: "error handling patterns" })
   → Находит примеры правильного handling
   
4. Предлагает consistent подход для всего проекта
```

## ⚙️ Конфигурация

### Environment Variables

```bash
# R2R Backend
R2R_BASE_URL=http://localhost:7272
R2R_API_KEY=optional_but_recommended

# OpenAI
OPENAI_API_KEY=sk-...

# MCP Server
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost

# Logging
LOG_LEVEL=info  # debug | info | warn | error
NODE_ENV=development

# Paths
PROJECT_ROOT=../
DOCS_PATH=../
CODE_PATH=../src

# RAG Settings
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.7
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=50

# Memory
MEMORY_RETENTION_DAYS=90
MAX_MEMORY_ITEMS=10000
```

### Agent Configuration

Редактируйте `config/agent.yaml` для настройки:

- **Personality** - правила и guidelines для агента
- **RAG settings** - параметры поиска и retrieval
- **Memory settings** - политики накопления опыта
- **Graph settings** - настройки knowledge graph
- **Performance** - оптимизация производительности

### R2R Configuration

Редактируйте `r2r.toml` для настройки:

- **Embedding model** - OpenAI vs local models
- **Completion model** - GPT-4 vs GPT-3.5
- **Chunking strategy** - размер chunks и overlap
- **Search strategy** - vector vs keyword vs hybrid
- **Knowledge graph** - включение GraphRAG

## 🔄 Обновление индекса

### Автоматическое обновление

```bash
# Через git hook (при каждом commit)
cat > ../.git/hooks/post-commit << 'EOF'
#!/bin/bash
cd r2r-mcp-server
npm run ingest
EOF

chmod +x ../.git/hooks/post-commit
```

### Ручное обновление

```bash
# Полное переиндексирование
npm run ingest

# Только новые файлы
npm run cli ingest -- --incremental

# Только граф (без re-ingestion)
npm run cli ingest -- --graph-only
```

### Selective update

```bash
# Только документация
npm run ingest -- --include "**/*.md"

# Только src/
npm run ingest -- --include "src/**/*.ts"
```

## 🧪 Тестирование

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Test specific tool
npm run cli search "test query"
npm run cli ask "test question"
```

## 📊 Мониторинг

### Logs

```bash
# Real-time logs
docker-compose logs -f r2r

# MCP server logs
npm run dev  # with pino-pretty

# Query logs
tail -f logs/agent.log
```

### Metrics

```bash
# R2R metrics (if enabled)
curl http://localhost:7272/v2/system/status

# Memory stats
npm run cli memory stats

# Graph stats
npm run cli graph query src/ -d 1 | jq '.data | length'
```

## 🐛 Troubleshooting

### R2R не запускается

```bash
# Проверить Docker
docker-compose ps
docker-compose logs r2r

# Проверить PostgreSQL
docker exec -it r2r-postgres psql -U postgres -d r2r -c "\l"

# Пересоздать
docker-compose down -v
docker-compose up -d
```

### MCP server не подключается

```bash
# Проверить R2R доступность
npm run cli health

# Проверить порты
lsof -i :7272
lsof -i :3001

# Дебаг режим
LOG_LEVEL=debug npm run dev
```

### Ingestion fails

```bash
# Проверить PROJECT_ROOT
echo $PROJECT_ROOT

# Запустить с дебагом
LOG_LEVEL=debug npm run ingest

# Проверить права доступа
ls -la ../src/
```

### Search returns no results

```bash
# Проверить, что документы проиндексированы
npm run cli search "*" -k 1

# Проверить в R2R
curl http://localhost:7272/v2/documents

# Переиндексировать
npm run ingest
```

## 🔒 Security

- ⚠️ **Никогда** не коммитьте `.env` файл
- ⚠️ Используйте `R2R_API_KEY` в production
- ⚠️ Ограничьте доступ к R2R порту (7272)
- ⚠️ Используйте HTTPS для production
- ⚠️ Регулярно обновляйте зависимости

```bash
# Generate secure API key
openssl rand -hex 32

# Add to .env
R2R_API_KEY=generated_key_here
```

## 🚀 Production Deployment

### Docker Production

```bash
# Build optimized image
docker build -t r2r-mcp-server:prod .

# Run with production config
docker run -d \
  --name r2r-mcp \
  -e NODE_ENV=production \
  -e R2R_BASE_URL=https://r2r.yourapp.com \
  -p 3001:3001 \
  r2r-mcp-server:prod
```

### Vercel/Railway/Fly.io

Для serverless deployment используйте HTTP transport вместо stdio.

## 📖 Дополнительные ресурсы

- [R2R Documentation](https://r2r-docs.sciphi.ai/)
- [MCP Protocol Spec](https://spec.modelcontextprotocol.io/)
- [Suno API Project](../README.md)
- [CLAUDE.md - Project Guidelines](../CLAUDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT

---

**Made with ❤️ for Suno API project**

Вопросы? Создайте issue или спросите агента: `npm run cli ask "How does this work?"`
