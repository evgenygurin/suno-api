# ✅ Remote R2R v3 Setup Complete

Настроен для работы с **удаленным R2R v3 сервером**: `http://136.119.36.216:7272`

## Что было сделано

### 1. Установлен официальный R2R JavaScript SDK

```bash
npm install r2r-js
```

### 2. Создан новый клиент `r2r-client-sdk.ts`

Использует официальный `r2rClient` из `r2r-js`:
- ✅ Автоматическая поддержка R2R v3 API
- ✅ Typed методы: `client.system.health()`, `client.retrieval.search()`, etc.
- ✅ Unified API: `client.collections`, `client.documents`, `client.retrieval`

### 3. Обновлен `.env` для remote сервера

```env
R2R_BASE_URL=http://136.119.36.216:7272
```

### 4. Создан тест `test-remote-r2r.ts`

Проверяет:
- Health check
- List collections
- List documents
- Search functionality

## Проверка подключения

```bash
cd /Users/laptop/dev/suno-api/r2r-mcp-server
npx tsx test-remote-r2r.ts
```

**Результат:**
```text
✅ Health: ok (v3)
✅ Found 3 collections: suno, r2r-documentation, Default
✅ Found 100 documents
✅ Search API работает
```

## Архитектура

### Старый клиент (v2, deprecated)
```text
src/r2r-client.ts (backup: .v2backup)
```

Ручной HTTP клиент с hardcoded v2 endpoints.

### Новый клиент (v3, активный)
```text
src/r2r-client-sdk.ts
```

Официальный SDK с автоматической поддержкой v3 API:
```typescript
import { r2rClient } from 'r2r-js';

const client = new r2rClient(baseUrl, anonymousTelemetry);

// System
await client.system.health();
await client.system.status();

// Search
await client.retrieval.search({ query, searchSettings });
await client.retrieval.rag({ query, ragGenerationConfig });

// Documents
await client.documents.list();
await client.documents.create({ file, collectionIds });
await client.documents.delete({ id });

// Collections
await client.collections.list();
await client.collections.create({ name, description });
```

## Доступные данные на сервере

### Коллекции
1. **suno** - основная коллекция для Suno API
2. **r2r-documentation** - документация R2R
3. **Default** - default collection

### Документы
- 100+ документов уже загружено
- Включают `.py`, `.md` файлы
- Примеры: `upload_to_r2r.py`, `upload-and-extend-audio.md`

## Следующие шаги

### 1. Индексация документации проекта

```bash
# Обновить ingestion pipeline для использования SDK
npm run ingest
```

### 2. Тестирование поиска

```bash
npm run cli search "CAPTCHA"
npm run cli search "Playwright automation"
npm run cli ask "How to solve CAPTCHAs?"
```

### 3. Запуск MCP сервера

```bash
npm run dev
```

MCP сервер автоматически будет использовать удаленный R2R v3.

## Преимущества официального SDK

1. **Автоматическая поддержка v3 API** - не нужно ручное обновление endpoints
2. **Type safety** - полная типизация всех методов
3. **Меньше кода** - SDK инкапсулирует сложную логику
4. **Меньше багов** - официальная поддержка и тесты
5. **Forward compatibility** - автоматические обновления при новых версиях

## Troubleshooting

### Проверка подключения

```bash
curl http://136.119.36.216:7272/v3/health
# {"results":{"message":"ok"}}
```

### Проверка коллекций

```bash
curl http://136.119.36.216:7272/v3/collections
```

### Логи

MCP сервер использует structured logging (Pino):
- Все запросы логируются
- Уровень: `LOG_LEVEL=info` (по умолчанию)
- Формат: JSON с pretty print

## Документация

- **R2R v3 API**: https://r2r-docs.sciphi.ai/
- **r2r-js SDK**: https://github.com/SciPhi-AI/R2R/tree/main/js
- **MCP Integration**: [README.md](./README.md)

---

**Дата**: 2024-11-14
**Сервер**: http://136.119.36.216:7272
**API Version**: v3
**SDK**: r2r-js (official)
