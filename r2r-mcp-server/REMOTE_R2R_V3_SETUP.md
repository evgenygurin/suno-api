# Подключение к Remote R2R v3

Твой R2R сервер работает на **v3 API**: `http://136.119.36.216:7272`

## Проблема

Текущий MCP сервер написан под R2R v2 API, а у тебя v3. Основные отличия:

| Feature | v2 API | v3 API |
|---------|--------|--------|
| Health endpoint | `/v2/health` | `/v3/health` |
| Collections | `/v2/collections` | `/v3/collections` |
| Search | `/v2/search` | `/v3/chunks/search` |
| Ingest | `/v2/ingest_chunks` | `/v3/chunks` (POST) |
| Documents | `/v2/documents` | `/v3/documents` |
| RAG | `/v2/retrieval/rag` | `/v3/retrieval/rag` |

## Быстрое Решение (2 варианта)

### Вариант 1: Использовать официальный R2R Python Client

Самый простой способ - использовать официальный Python клиент R2R, который поддерживает v3:

```bash
# В другой директории создай Python MCP сервер
mkdir ~/r2r-python-mcp
cd ~/r2r-python-mcp

# Установи R2R SDK
pip install r2r

# Создай simple MCP server
```

**Плюсы**: Официальная поддержка, автоматически работает с v3
**Минусы**: Нужно писать Python код

### Вариант 2: Обновить текущий TypeScript клиент

Обновить `src/r2r-client.ts` для v3 API.

#### Что нужно изменить:

**1. Health Check (строка 325)**
```typescript
// Было:
async healthCheck(): Promise<R2RResponse<{ status: string }>> {
  return this.request<{ status: string }>('/v2/health');
}

// Стало:
async healthCheck(): Promise<R2RResponse<{ message: string }>> {
  const response = await this.request<{ message: string }>('/v3/health');
  // v3 возвращает { results: { message: "ok" } }
  return {
    results: { message: response.results.message || 'ok' }
  };
}
```

**2. Search (строка 202)**
```typescript
// Было:
return this.request<SearchResult[]>('/v2/search', 'POST', {
  query: request.query,
  limit: request.top_k,
});

// Стало:
return this.request<SearchResult[]>('/v3/chunks/search', 'POST', {
  query: request.query,
  limit: request.top_k,
});
```

**3. Collections (строки 103, 113, 120)**
```typescript
// Все endpoints остаются почти такими же, только /v2/ → /v3/
'/v2/collections' → '/v3/collections'
'/v2/collections/${identifier}' → '/v3/collections/${identifier}'
```

**4. Ingest (строки 137, 166)**
```typescript
// Было:
return this.request<R2RDocument>('/v2/ingest_chunks', 'POST', {
  chunks: [...]
});

// Стало:
return this.request<R2RDocument>('/v3/chunks', 'POST', {
  chunks: [...]
});
```

**5. RAG (строка 230)**
```typescript
// Endpoints в v3 могут отличаться, нужно проверить документацию
// Возможно: /v3/retrieval/rag или /v3/retrieval/completion
```

#### Автоматическое обновление (скрипт)

```bash
cd /Users/laptop/dev/suno-api/r2r-mcp-server

# Создай резервную копию
cp src/r2r-client.ts src/r2r-client.ts.backup

# Простая замена v2 → v3 (может потребовать доработки)
sed -i '' 's|/v2/|/v3/|g' src/r2r-client.ts
sed -i '' 's|/v2/ingest_chunks|/v3/chunks|g' src/r2r-client.ts
sed -i '' 's|/v2/search|/v3/chunks/search|g' src/r2r-client.ts

# Обновить health check response type
sed -i '' 's|{ status: string }|{ message: string }|g' src/r2r-client.ts
```

### Вариант 3: Временно использовать v2 API (если доступно)

Проверь, поддерживает ли твой R2R сервер обратную совместимость с v2:

```bash
curl -s http://136.119.36.216:7272/v2/health
```

Если работает - просто используй текущий код без изменений.

## Рекомендация

**Самый быстрый путь**: Обновить endpoints в `src/r2r-client.ts`

1. Сделай резервную копию:
   ```bash
   cp src/r2r-client.ts src/r2r-client.ts.v2backup
   ```

2. Замени endpoints через sed (см. выше) или вручную

3. Создай .env:
   ```bash
   cat > .env << 'EOF'
   R2R_BASE_URL=http://136.119.36.216:7272
   R2R_API_KEY=your_api_key_if_needed
   OPENAI_API_KEY=your_openai_key
   PROJECT_ROOT=../
   DOCS_PATH=../
   CODE_PATH=../src
   EOF
   ```

4. Установи зависимости:
   ```bash
   npm install
   npm run build
   ```

5. Проверь подключение:
   ```bash
   npm run cli health
   ```

6. Индексируй документацию:
   ```bash
   npm run ingest
   ```

## Тестирование v3 endpoints вручную

```bash
# Health check
curl http://136.119.36.216:7272/v3/health

# List collections
curl http://136.119.36.216:7272/v3/collections

# Search
curl -X POST http://136.119.36.216:7272/v3/chunks/search \
  -H "Content-Type: application/json" \
  -d '{"query": "playwright", "limit": 5}'
```

## Полная документация R2R v3 API

Смотри OpenAPI schema:
```bash
curl http://136.119.36.216:7272/openapi.json | python3 -m json.tool > r2r-v3-openapi.json
```

Или в браузере: http://136.119.36.216:7272/docs

## Если нужна помощь

1. Проверь логи R2R сервера на 136.119.36.216:7272
2. Посмотри официальную документацию: https://r2r-docs.sciphi.ai/
3. Проверь примеры в репозитории R2R

---

**Следующие шаги после обновления:**

1. `npm install && npm run build`
2. `npm run cli health` - проверка подключения
3. `npm run ingest` - индексация документации
4. `npm run cli search "CAPTCHA"` - тест поиска
5. `npm run dev` - запуск MCP сервера
