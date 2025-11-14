# R2R Agent Configuration Reference

> Компактный справочник по конфигурации R2R Agent для быстрого использования агентами

## 📊 **Лимиты (Cloud vs Local)**

### SciPhi Cloud (Default/Free Tier)

**Ресурсы:**
- **Documents**: 100/user
- **Chunks**: 10,000/user
- **Collections**: 5/user
- **Rate Limit**: 60 req/min global

**File Upload Limits:**
- txt/md: 2MB
- csv/images: 5MB
- doc/xlsx: 10MB
- ppt: 20MB
- pdf: 30MB

**Per-Route Limits:**
- `/v3/retrieval/search`: 10/min, 3,000/month
- `/v3/retrieval/rag`: 5/min, 200/month
- `/v3/retrieval/agentic-rag`: 5/min, 100/month
- `/v3/documents/create`: 10/min, 200/month

### Starter Tier Overrides

- **Documents**: 1,000/user
- **Chunks**: 100,000/user
- **Collections**: 50/user

### Local Deployment (r2r.toml)

```toml
[app]
default_max_documents_per_user = 200
default_max_chunks_per_user = 50_000
default_max_collections_per_user = 20
default_max_upload_size = 10_000_000  # 10MB

[database.route_limits]
"/v3/retrieval/search" = { route_per_min = 50, monthly_limit = 10_000 }
```

---

## 🔍 **Search Settings** (`search_settings`)

### Search Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `"basic"` | Semantic only | Simple queries, fast |
| `"advanced"` | Hybrid (pre-tuned) | Production default |
| `"custom"` | Full control | Fine-tuning |

### Core Parameters

```python
search_settings = {
    # Search types
    "use_semantic_search": True,        # Vector search (default: True)
    "use_fulltext_search": True,        # Keyword search (default: False)
    "use_hybrid_search": True,          # Combine both (default: False)

    # Result control
    "limit": 10,                        # Max results (default: 10)
    "include_scores": True,             # Relevance scores
    "include_metadatas": True,          # Include metadata

    # Advanced strategies
    "search_strategy": "vanilla",       # "hyde"|"rag_fusion"|"vanilla"

    # Filtering (MongoDB-like)
    "filters": {
        "$and": [
            {"document_type": {"$eq": "pdf"}},
            {"metadata.year": {"$gt": 2023}}
        ]
    },

    # Hybrid tuning
    "hybrid_settings": {
        "semantic_weight": 5.0,         # Vector weight (1.0-10.0)
        "full_text_weight": 1.0,        # Keyword weight (1.0-10.0)
        "full_text_limit": 200,         # Initial fulltext results
        "rrf_k": 50                     # Reciprocal Rank Fusion (30-100)
    },

    # Vector index settings
    "chunk_settings": {
        "index_measure": "cosine_distance"  # "l2_distance"|"cosine_distance"
    }
}
```

### Hybrid Search Best Practices

**Recommended Ratios:**
- **Conceptual queries**: `semantic_weight: 5.0`, `full_text_weight: 1.0` (default)
- **Exact match focus**: `semantic_weight: 1.0`, `full_text_weight: 5.0`
- **Balanced**: `semantic_weight: 3.0`, `full_text_weight: 2.0`

**Performance:**
- `full_text_limit: 200` - balance speed/recall
- `rrf_k: 50` - default, increase (60-100) for more diversity
- `limit: 10` - standard, increase for broader context

---

## 🤖 **Generation Config** (`rag_generation_config`)

### Core Parameters

```python
rag_generation_config = {
    # Model selection
    "model": "anthropic/claude-3-7-sonnet-20250219",

    # Reasoning (Claude Opus/Sonnet only)
    "extended_thinking": True,          # Enable deep reasoning
    "thinking_budget": 4096,            # Tokens for thinking (1K-32K)

    # Generation control
    "temperature": 0.7,                 # Randomness (0.0-1.0)
    "top_p": None,                      # Nucleus sampling (0.0-1.0)
    "max_tokens_to_sample": 16000,     # Output limit (100-32K)

    # Response mode
    "stream": True                      # Streaming vs single response
}
```

### Model Selection Guide

| Model | Speed | Cost | Use Case |
|-------|-------|------|----------|
| **claude-3-haiku-20240307** | ⚡ Fast | 💰 Low | Simple Q&A, speed-critical |
| **claude-3-7-sonnet-20250219** | ⚖️ Balanced | 💰💰 Medium | Production default, complex reasoning |
| **claude-3-opus-20240229** | 🐢 Slow | 💰💰💰 High | Deep analysis, research mode |

### Performance Optimization

**Fast Response (time-critical):**
```python
{
    "model": "anthropic/claude-3-haiku-20240307",
    "max_tokens_to_sample": 200,
    "temperature": 0.3,
    "stream": True
}
```

**High Quality (accuracy-critical):**
```python
{
    "model": "anthropic/claude-3-opus-20240229",
    "extended_thinking": True,
    "thinking_budget": 8192,
    "max_tokens_to_sample": 32000,
    "temperature": 0.7,
    "stream": False
}
```

**Balanced (production):**
```python
{
    "model": "anthropic/claude-3-7-sonnet-20250219",
    "extended_thinking": True,
    "thinking_budget": 4096,
    "max_tokens_to_sample": 1000,
    "temperature": 0.7,
    "stream": True
}
```

---

## 🛠️ **Agent Tools**

### RAG Mode (`mode="rag"`)

```python
rag_tools = [
    "search_file_knowledge",  # Core: semantic/hybrid search
    "get_file_content",       # Core: retrieve full documents
    "web_search",             # Optional: internet search
    "web_scrape"              # Optional: scrape specific URLs
]
```

**Use for:**
- Q&A from documents
- Summarization tasks
- Fact-finding queries
- Document-based research

### Research Mode (`mode="research"`)

```python
research_tools = [
    "rag",                    # Use RAG as sub-tool
    "reasoning",              # Extended reasoning chains
    "critique",               # Self-critique and refinement
    "python_executor"         # Execute Python code
]
```

**Use for:**
- Complex reasoning problems
- Mathematical computations
- Multi-step analysis
- Philosophical questions

### Tool Selection Strategy

| Scenario | Tools | Rationale |
|----------|-------|-----------|
| **Simple Q&A** | `["search_file_knowledge"]` | Minimize latency |
| **Document Retrieval** | `["search_file_knowledge", "get_file_content"]` | Standard RAG |
| **Current Events** | `["search_file_knowledge", "web_search"]` | Hybrid knowledge |
| **Deep Analysis** | `["rag", "reasoning", "critique"]` | Research mode |
| **Computation** | `["reasoning", "python_executor"]` | Code execution |

---

## 🎯 **Modes of Operation**

### RAG Mode

**Focus**: Retrieval-first, answer from documents

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "Summarize Q1 results"},
    search_settings={
        "use_hybrid_search": True,
        "limit": 25
    },
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "max_tokens_to_sample": 1000,
        "stream": True
    },
    rag_tools=["search_file_knowledge", "get_file_content"],
    mode="rag"
)
```

### Research Mode

**Focus**: Reasoning-first, complex analysis

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "Analyze the complexity of this algorithm"},
    research_generation_config={
        "model": "anthropic/claude-3-opus-20240229",
        "extended_thinking": True,
        "thinking_budget": 8192,
        "max_tokens_to_sample": 32000,
        "stream": True
    },
    research_tools=["rag", "reasoning", "critique", "python_executor"],
    mode="research"
)
```

---

## 🔐 **Filtering & Collections**

### MongoDB-like Filter Syntax

```python
search_settings = {
    "filters": {
        # Exact match
        {"document_type": {"$eq": "pdf"}},

        # Comparison
        {"metadata.year": {"$gt": 2023}},
        {"metadata.pages": {"$lt": 100}},

        # In list
        {"metadata.category": {"$in": ["ethics", "policy"]}},

        # Overlap (for arrays)
        {"collection_ids": {"$overlap": ["collection-uuid"]}},

        # Logical operators
        "$and": [
            {"document_type": {"$eq": "pdf"}},
            {"metadata.year": {"$gt": 2023}}
        ],
        "$or": [
            {"metadata.category": {"$eq": "research"}},
            {"metadata.category": {"$eq": "documentation"}}
        ]
    },
    "limit": 10
}
```

### Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal to | `{"year": {"$eq": 2024}}` |
| `$gt` | Greater than | `{"year": {"$gt": 2023}}` |
| `$lt` | Less than | `{"pages": {"$lt": 50}}` |
| `$in` | In list | `{"type": {"$in": ["pdf", "docx"]}}` |
| `$overlap` | Array overlap | `{"tags": {"$overlap": ["ai"]}}` |
| `$and` | Logical AND | `{"$and": [{...}, {...}]}` |
| `$or` | Logical OR | `{"$or": [{...}, {...}]}` |

---

## 🔄 **Multi-Turn Conversations**

### Maintaining Context

```python
# Create conversation
conversation = client.conversations.create()
conversation_id = conversation.results.id

# First turn
first_response = client.retrieval.agent(
    message={"role": "user", "content": "What does DeepSeek R1 imply?"},
    conversation_id=conversation_id,
    mode="rag"
)

# Follow-up query (maintains context)
follow_up = client.retrieval.agent(
    message={"role": "user", "content": "How does it compare to others?"},
    conversation_id=conversation_id,  # Same conversation
    mode="rag"
)
# Agent knows "it" refers to DeepSeek R1
```

---

## 📈 **Local Configuration (r2r.toml)**

### Chunk Enrichment

```toml
[ingestion]
  [ingestion.chunk_enrichment_settings]
   enable_chunk_enrichment = true
   n_chunks = 2  # Preceding/succeeding chunks for context
```

**When to enable:**
- Long documents with cross-references
- Need more context around chunks
- Trading off: increased storage/processing time

---

## ⚡ **Performance Tuning Recipes**

### 1. Fast Response (< 2s target)

```python
{
    "model": "anthropic/claude-3-haiku-20240307",
    "max_tokens_to_sample": 200,
    "stream": True,
    "rag_tools": ["search_file_knowledge"],
    "search_settings": {
        "limit": 5,
        "use_semantic_search": True,
        "use_hybrid_search": False
    }
}
```

**Use case**: Real-time chat, quick lookups

### 2. Balanced (2-5s target)

```python
{
    "model": "anthropic/claude-3-7-sonnet-20250219",
    "max_tokens_to_sample": 1000,
    "stream": True,
    "rag_tools": ["search_file_knowledge", "get_file_content"],
    "search_settings": {
        "limit": 10,
        "use_hybrid_search": True,
        "hybrid_settings": {
            "semantic_weight": 5.0,
            "full_text_weight": 1.0
        }
    }
}
```

**Use case**: Production Q&A, standard RAG

### 3. High Accuracy (5-30s target)

```python
{
    "model": "anthropic/claude-3-opus-20240229",
    "extended_thinking": True,
    "thinking_budget": 8192,
    "max_tokens_to_sample": 32000,
    "stream": True,
    "research_tools": ["rag", "reasoning", "critique"],
    "search_settings": {
        "limit": 25,
        "use_hybrid_search": True,
        "search_strategy": "rag_fusion"
    }
}
```

**Use case**: Research, legal analysis, critical decisions

---

## 🎭 **Event Streaming**

### Event Types

When `stream: True`, handle these events:

```python
from r2r import (
    ThinkingEvent,      # 🧠 Reasoning process
    ToolCallEvent,      # 🔧 Tool invocation
    ToolResultEvent,    # 📊 Tool results
    CitationEvent,      # 📑 Document citations
    MessageEvent,       # 💬 Response chunks
    FinalAnswerEvent    # ✅ Complete answer
)

for event in response:
    if isinstance(event, ThinkingEvent):
        print(event.data.delta.content[0].payload.value, end="")
    elif isinstance(event, ToolCallEvent):
        print(f"Tool: {event.data.name}({event.data.arguments})")
    elif isinstance(event, MessageEvent):
        print(event.data.delta.content[0].payload.value, end="")
    elif isinstance(event, FinalAnswerEvent):
        print(f"Citations: {len(event.data.citations)}")
```

---

## ⚠️ **Critical Rules & Gotchas**

### 1. Trigger.dev Integration

❌ **NEVER wrap in Promise.all/allSettled:**
```python
# WRONG
await Promise.all([
    task.triggerAndWait({...}),
    task.triggerAndWait({...})
])
```

✅ **Sequential execution:**
```python
result1 = await task.triggerAndWait({...})
result2 = await task.triggerAndWait({...})
```

### 2. Result Object Handling

❌ **Direct access to output:**
```python
output = await task.triggerAndWait({...})
print(output.data)  # WRONG
```

✅ **Check result.ok first:**
```python
result = await task.triggerAndWait({...})
if result.ok:
    print(result.output)  # Correct
else:
    print(result.error)
```

### 3. Token Budgets

- `thinking_budget` tokens **DO NOT** count toward compute usage if thinking > 5 seconds
- Extended thinking automatically checkpointed

### 4. Rate Limit Strategy

**Cloud deployment:**
- Global 60 req/min applies to ALL users from same IP
- Per-route limits are MORE restrictive
- Use batch operations where possible

**Local deployment:**
- Configure limits in `r2r.toml`
- No IP-based throttling

---

## 🔧 **Quick Diagnostic Checklist**

| Problem | Check | Solution |
|---------|-------|----------|
| **Too slow** | Token limits, model choice | Use Haiku, reduce `max_tokens`, limit tools |
| **Low accuracy** | Search settings, tool selection | Increase `limit`, enable hybrid, add filters |
| **Rate limited** | Request frequency, tier | Upgrade tier, use local deployment, batch requests |
| **High costs** | Model choice, token usage | Switch to Haiku, reduce `thinking_budget` |
| **Missing results** | Filters, search mode | Broaden filters, use hybrid search |
| **Poor citations** | Tool configuration | Add `get_file_content` tool |

---

## 📚 **Quick Reference Card**

### Minimal RAG Query

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "Your question"},
    mode="rag"
)
```

### Production RAG Query

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "Your question"},
    search_settings={
        "use_hybrid_search": True,
        "limit": 10
    },
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "temperature": 0.7,
        "max_tokens_to_sample": 1000,
        "stream": True
    },
    rag_tools=["search_file_knowledge", "get_file_content"],
    mode="rag"
)
```

### Research Query

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "Complex analysis task"},
    research_generation_config={
        "model": "anthropic/claude-3-opus-20240229",
        "extended_thinking": True,
        "thinking_budget": 8192,
        "max_tokens_to_sample": 32000,
        "stream": True
    },
    research_tools=["rag", "reasoning", "critique"],
    mode="research"
)
```

---

## 📖 **Further Reading**

- **Full Documentation**: [r2r-docs.sciphi.ai](https://r2r-docs.sciphi.ai)
- **Quickstart**: [/documentation/quickstart](https://r2r-docs.sciphi.ai/documentation/quickstart)
- **Advanced RAG**: [/documentation/advanced-rag](https://r2r-docs.sciphi.ai/documentation/advanced-rag)
- **Agentic RAG**: [/documentation/retrieval/agentic-rag](https://r2r-docs.sciphi.ai/documentation/retrieval/agentic-rag)

---

**Generated by**: Claude Code + Context7 MCP
**Last Updated**: 2025-01-14
**Version**: 1.0
