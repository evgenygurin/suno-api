# 🚀 Quick Start Guide

Быстрый старт для R2R MCP Agent за 5 минут.

## Prerequisites

- ✅ Node.js 18+
- ✅ Docker & Docker Compose
- ✅ OpenAI API key

## Installation (5 минут)

### Шаг 1: Автоматическая установка

```bash
cd r2r-mcp-server
./setup.sh
```

Скрипт автоматически:

1. Проверит зависимости
2. Создаст `.env` файл
3. Запустит R2R с Docker
4. Установит npm пакеты
5. Соберет TypeScript

### Шаг 2: Настройте .env

```bash
# Откройте .env
nano .env

# Добавьте ваш OpenAI API key
OPENAI_API_KEY=sk-your-key-here

# Сохраните (Ctrl+O, Enter, Ctrl+X)
```

### Шаг 3: Индексация документации

```bash
# Запустите ingestion (занимает 1-2 минуты)
npm run ingest
```

Это проиндексирует весь проект в R2R.

### Шаг 4: Тест

```bash
# Проверьте поиск
npm run cli search "playwright automation"

# Проверьте RAG
npm run cli ask "How to handle CAPTCHA?"

# Всё работает? 🎉
```

## Интеграция с Claude Desktop (2 минуты)

### macOS/Linux

```bash
# 1. Откройте конфиг
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 2. Добавьте:
{
  "mcpServers": {
    "r2r-suno-agent": {
      "command": "node",
      "args": ["/ПОЛНЫЙ/ПУТЬ/ДО/r2r-mcp-server/dist/server.js"],
      "env": {
        "R2R_BASE_URL": "http://localhost:7272"
      }
    }
  }
}

# 3. Замените /ПОЛНЫЙ/ПУТЬ/ДО/ на реальный путь:
pwd  # показывает текущий путь

# 4. Перезапустите Claude Desktop
```

### Windows

```powershell
# 1. Откройте конфиг
notepad "%APPDATA%\Claude\claude_desktop_config.json"

# 2. Добавьте тот же JSON (с правильным путем для Windows)
```

## First Use (1 минута)

### В Claude Code/Desktop

```
Вы: "Search documentation for CAPTCHA solving examples"

Claude: [использует search_documentation tool]
Нашел 5 результатов из src/lib/captcha.ts, CLAUDE.md...

Вы: "How do I add a new API endpoint?"

Claude: [использует ask_documentation tool]
Вот как добавить endpoint следуя CLAUDE.md правилам...
```

## Basic Commands

```bash
# Поиск
npm run cli search "query" [-k 5] [-m hybrid]

# RAG вопросы
npm run cli ask "question" [-k 5]

# Память
npm run cli memory store -t "task" -a "action" -o success
npm run cli memory search "context" [-k 3]

# Граф
npm run cli graph query "entity" [-d 1]
npm run cli graph deps "module"

# Сервер
npm run cli server dev     # development
npm run cli server start   # production

# Здоровье
npm run cli health
```

## Troubleshooting

### R2R не запускается

```bash
# Проверить статус
docker-compose ps

# Посмотреть логи
docker-compose logs r2r

# Перезапустить
docker-compose restart r2r
```

### "No results found"

```bash
# Переиндексировать
npm run ingest

# Проверить что есть документы
npm run cli search "*" -k 1
```

### "Cannot connect to R2R"

```bash
# Проверить что R2R работает
curl http://localhost:7272/v2/health

# Если нет - перезапустить Docker
docker-compose restart
```

### Claude не видит инструменты

1. Проверьте путь в `claude_desktop_config.json`
2. Путь должен быть **абсолютным** (не относительным)
3. Перезапустите Claude Desktop полностью (Quit, не просто закрыть окно)

## Next Steps

✅ Готово к использованию!

**Дальше:**

- 📖 Читайте [README.md](README.md) для полной документации
- 💡 Смотрите [примеры использования](examples/usage-examples.md)
- 🎯 Изучите [конфигурацию агента](config/agent.yaml)
- 🔧 Настройте [R2R параметры](r2r.toml)

## Common Use Cases

### 1. Спросить о проекте

```
Claude: ask_documentation("How does authentication work?")
```

### 2. Найти примеры кода

```
Claude: search_code_examples("error handling pattern")
```

### 3. Дебаг с помощью RAG

```
Claude: debug_with_rag("TimeoutError in browser.ts")
```

### 4. Проверить зависимости

```
Claude: find_dependencies("src/app/api/generate/route.ts")
```

### 5. Сохранить решение

```
Claude: store_experience({
  context: { task: "Fixed timeout" },
  action_taken: "Increased to 60s",
  outcome: "success"
})
```

## Tips

💡 **Best Practices:**

- Переиндексируйте после больших изменений: `npm run ingest`
- Используйте `memory store` для успешных решений
- Проверяйте `memory stats` периодически
- GraphRAG отлично подходит для рефакторинга

🎯 **Pro Tips:**

- Используйте `hybrid` search mode для лучших результатов
- Увеличьте `top_k` для более подробного контекста
- Комбинируйте tools: сначала search, потом ask
- Сохраняйте как успехи, так и неудачи в memory

## Support

- 📖 [Full Documentation](README.md)
- 💬 [GitHub Issues](https://github.com/your-repo/issues)
- 🌐 [R2R Docs](https://r2r-docs.sciphi.ai/)
- 🤖 [MCP Spec](https://spec.modelcontextprotocol.io/)

---

**Вопросы?** Спросите агента: `npm run cli ask "How does this work?"`
