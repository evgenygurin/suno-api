# Как распознается персона: Полная таблица

| Запрос | Ключевые слова | Персона | Баллы |
|--------|----------------|---------|-------|
| "Show me test coverage" | test (+4), show (+2 learner) | **tester** | tester:4, learner:2 |
| "Why timeout?" | why (+2+2), timeout (+2) | **debugger** | debugger:4, learner:2 |
| "What is the architecture?" | architecture (+3), what (+2) | **architect** | architect:3, learner:2 |
| "Fix error in API" | fix (+2), error (+3), api (+3) | **debugger** | debugger:5, developer:3 |
| "Implement JWT auth" | implement (+3), api (+3) | **developer** | developer:6 |
| "Explain RAG" | explain (+2) | **learner** | learner:2 |

## Приоритет при равных баллах

Если несколько персон набрали одинаковые баллы:

```
architect > debugger > tester > learner > developer
```

Более специализированная персона всегда в приоритете!

## Где находится код

**Файл**: `src/agent/decision.ts` → метод `DecisionMaker.selectPersona()`

**Строки**: 41-124

**Использование**:
- CLI: автоматически, если не указан `--persona`
- MCP: автоматически, если не указан параметр `persona`
- Программно: `agent.process(request, autoSelect = true)`

## Логирование

Каждое решение логируется в формате:

```json
{
  "selectedPersona": "debugger",
  "scores": {"developer":0, "architect":0, "debugger":4, "learner":2, "tester":0},
  "confidence": "auto-selected"
}
```

Это позволяет видеть, почему была выбрана конкретная персона!
