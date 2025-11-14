# Remote R2R Server Capabilities

## Server Info

**URL**: `http://136.119.36.216:7272`
**API Version**: v3
**Project**: `r2r_default`
**Config**: `/app/user_configs/gemini-openai.toml`
**Platform**: GCP (Vertex AI)

---

## 🧠 AI Models Available

### Language Models (LLM)
- ✅ **Google Gemini** (via Vertex AI) - Primary
  - `gemini-1.5-flash` - Fast, cost-effective
  - `gemini-1.5-pro` - Advanced reasoning
  - Project: `r2r-full-deployment`
  - Region: `us-central1`

- ✅ **OpenAI** - Available
  - GPT-4, GPT-4-turbo
  - GPT-3.5-turbo

- ✅ **Anthropic Claude** - Available
  - claude-3-opus
  - claude-3-sonnet
  - claude-3-haiku

- ✅ **Mistral AI** - Available
  - mistral-small, mistral-medium, mistral-large

- ✅ **Groq** - Ultra-fast inference
  - llama-3.1, mixtral

- ✅ **Cohere** - Available
  - command, command-light

- ✅ **Anyscale** - Available

### Embedding Models
- ✅ **OpenAI Embeddings** - Primary
  - `text-embedding-3-small` (1536 dim)
  - `text-embedding-3-large` (3072 dim)
  - `text-embedding-ada-002` (legacy)

- ✅ **Cohere Embeddings** - Available
- ✅ **HuggingFace** - Local option

---

## 🗄️ Database & Storage

### Vector Database
- **PostgreSQL + pgvector**
  - Host: `postgres` (internal)
  - Max connections: 1024
  - Statement cache: 100

### Collections
1. **suno** - Suno API documentation
2. **r2r-documentation** - R2R framework docs
3. **Default** - General collection

### Documents
- **100+** documents indexed
- Formats: `.py`, `.md`, `.txt`, etc.

---

## 🔍 Search Capabilities

### Search Modes
- ✅ **Hybrid Search** - Vector + Keyword (recommended)
- ✅ **Vector Search** - Semantic similarity
- ✅ **Keyword Search** - Full-text search
- ✅ **Graph Search** - Knowledge graph traversal

### RAG (Retrieval-Augmented Generation)
- ✅ Context-aware answers
- ✅ Citation tracking
- ✅ Multi-source synthesis
- ✅ Streaming responses

---

## 🕸️ Knowledge Graph

**Status**: ✅ **Enabled**

### Features
- Entity extraction
- Relationship mapping
- Graph enrichment
- Graph-based search

### Extraction Model
- **Gemini 1.5 Flash** for KG extraction
- Automatic entity recognition
- Relationship inference

---

## 🔧 Document Processing

### Unstructured.io Integration
- ✅ API Key configured
- ✅ 10 workers
- Service URL: `http://unstructured:7275`

### Supported Formats
- Markdown (`.md`)
- Python (`.py`)
- TypeScript/JavaScript (`.ts`, `.js`)
- JSON (`.json`)
- YAML (`.yaml`, `.yml`)
- Text (`.txt`)
- PDFs, DOCX, etc. (via Unstructured)

### Processing Features
- Chunking: Recursive (512 tokens, overlap 50)
- Metadata extraction
- Table extraction
- Image description

---

## 🔐 Authentication & OAuth

### OAuth Providers
- ✅ **GitHub OAuth**
  - Client ID: `Ov23liWP8ZlsVpO9467j`
  - Callback: `http://136.119.36.216:7272/v3/auth/github/callback`

- ⚠️ **Google OAuth** - Not configured

### Auth Provider
- ✅ **Supabase** integration
  - URL: `https://loksebakfgmongqmecab.supabase.co`

---

## 🌐 Web Search Integration

### Search Engines
- ✅ **Firecrawl** - Web scraping
- ✅ **Serper** - Google search API
- ✅ **Tavily** - AI-powered search

### Use Cases
- Real-time information retrieval
- Web content augmentation
- Citation from live sources

---

## 📊 Observability

### Hatchet (Task Queue)
- ✅ Enabled
- TLS: none (internal)

### Logging
- Level: INFO
- Format: Structured JSON
- Provider: Local

---

## 🎯 Recommended Usage

### For RAG Applications
```typescript
// Best configuration for Suno API docs
const response = await client.retrieval.rag({
  query: "How to solve CAPTCHAs in Playwright?",
  searchMode: 'basic',
  ragGenerationConfig: {
    model: 'gemini/gemini-1.5-flash', // Fast & cheap
    temperature: 0.7,
    max_tokens: 2000
  },
  searchSettings: {
    useHybridSearch: true,
    limit: 5
  }
});
```

### For Search Only
```typescript
const results = await client.retrieval.search({
  query: "CAPTCHA solving",
  searchMode: 'basic',
  searchSettings: {
    useHybridSearch: true,  // Vector + keyword
    limit: 10
  }
});
```

### For Document Ingestion
```typescript
await client.documents.create({
  file: './docs/api-guide.md',
  metadata: {
    title: 'API Guide',
    section: 'documentation',
    version: '2.0'
  },
  collectionIds: ['suno'],
  ingestionConfig: {
    chunk_size: 512,
    chunk_overlap: 50
  }
});
```

---

## 💰 Cost Optimization

### Recommended Models by Use Case

**Development/Testing:**
- LLM: `gemini/gemini-1.5-flash` (fastest, cheapest)
- Embeddings: `text-embedding-3-small`

**Production:**
- LLM: `gemini/gemini-1.5-pro` or `claude-3-sonnet`
- Embeddings: `text-embedding-3-large`

**Ultra-fast (low quality ok):**
- LLM: `groq/llama-3.1-8b`

---

## 🚀 Performance

### Latency
- **Health Check**: ~100ms
- **Search**: ~200-500ms
- **RAG Completion**: ~1-3s (depends on LLM)

### Throughput
- PostgreSQL: 1024 max connections
- Concurrent requests: High (containerized)

---

## 📝 Next Steps

1. **Index Suno API Documentation**
   ```bash
   npm run ingest
   ```

2. **Test RAG Queries**
   ```bash
   npm run cli ask "How does CAPTCHA solving work?"
   ```

3. **Start MCP Server**
   ```bash
   npm run dev
   ```

4. **Configure Claude Desktop**
   - Add MCP server to `claude_desktop_config.json`
   - Enjoy RAG-powered assistance!

---

**Last Updated**: 2024-11-14
**Server Status**: ✅ Operational
**Documentation**: https://r2r-docs.sciphi.ai/
