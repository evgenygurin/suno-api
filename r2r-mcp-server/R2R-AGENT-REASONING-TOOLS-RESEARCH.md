# R2R Agent Reasoning + Tools Research

**Date**: January 2025
**Source**: Context7 documentation research
**Libraries**: `/websites/r2r-docs_sciphi_ai`, `/sciphi-ai/r2r`

---

## 🎯 Executive Summary

R2R (RAG to Riches) provides a sophisticated **agentic RAG system** with two distinct operational modes and a rich toolkit for intelligent information retrieval and reasoning. The agent can operate in **RAG mode** (retrieval-focused) or **Research mode** (reasoning-focused), with extensive tool support and advanced features like extended thinking, multi-turn conversations, and streaming responses.

---

## 🤖 Agent Architecture

### Two Operational Modes

#### 1. RAG Mode (Retrieval-Augmented Generation)

**Purpose**: Fast, retrieval-focused responses grounded in ingested documents

**Key Characteristics**:
- Optimized for quick information retrieval
- Focuses on searching and retrieving relevant content
- Combines search results with LLM generation
- Supports streaming responses

**Available Tools**:
- `search_file_knowledge` - Semantic search through ingested documents
- `get_file_content` - Retrieve specific file content
- `web_search` - Search the web (requires Serper API key)
- `web_scrape` - Extract content from web pages

**Example Usage**:
```python
from r2r import R2RClient

client = R2RClient("http://localhost:7272")

response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "What does DeepSeek R1 imply for the future of AI?"
    },
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "extended_thinking": True,
        "thinking_budget": 4096,
        "temperature": 1,
        "max_tokens_to_sample": 16000,
        "stream": True
    },
    rag_tools=["search_file_knowledge", "get_file_content"],
    mode="rag"  # Explicitly set RAG mode
)
```

#### 2. Research Mode (Deep Reasoning)

**Purpose**: Complex reasoning and analysis with iterative research capabilities

**Key Characteristics**:
- Iterative research and reasoning
- Multi-step problem solving
- Code execution capabilities
- Self-critique and refinement

**Available Tools**:
- `rag` - Retrieval-augmented generation
- `reasoning` - Extended thinking and reasoning
- `critique` - Self-critique and analysis
- `python_executor` - Execute Python code for computations

**Example Usage**:
```python
# Research mode with all available tools
response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "Analyze the philosophical implications of DeepSeek R1 for the future of AI reasoning"
    },
    research_generation_config={
        "model": "anthropic/claude-3-opus-20240229",
        "extended_thinking": True,
        "thinking_budget": 8192,  # Higher budget for deep thinking
        "temperature": 0.2,
        "max_tokens_to_sample": 32000,
        "stream": True
    },
    research_tools=["rag", "reasoning", "critique", "python_executor"],
    mode="research"  # Research mode for complex reasoning
)
```

**Computational Focus Example**:
```python
# Research mode with computational focus
compute_response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "Calculate the factorial of 15 multiplied by 32. Show your work."
    },
    research_generation_config={
        "model": "anthropic/claude-3-opus-20240229",
        "max_tokens_to_sample": 1000,
        "stream": False
    },
    research_tools=["python_executor"],  # Only code execution
    mode="research"
)

print(f"Final answer: {compute_response.results.messages[-1].content}")
```

---

## 🛠️ Agent Tools Deep Dive

### Core Retrieval Tools (RAG Mode)

#### `search_file_knowledge`
- **Purpose**: Semantic search through ingested documents
- **Use Case**: Finding relevant information in document collections
- **Configuration**: Propagates search_settings from agent level

#### `get_file_content`
- **Purpose**: Retrieve specific file content
- **Use Case**: Accessing full document content after search
- **Integration**: Works with search results to get complete context

#### `web_search`
- **Purpose**: Search the web for external information
- **Requirements**: Serper API key configured
- **Configuration**: Enable with `use_web_search: True` in search_settings

#### `web_scrape`
- **Purpose**: Extract content from web pages
- **Use Case**: Retrieving information from specific URLs
- **Integration**: Complements web_search for detailed content

### Advanced Reasoning Tools (Research Mode)

#### `reasoning`
- **Purpose**: Extended thinking and reasoning capabilities
- **Features**:
  - Multi-step reasoning
  - Chain-of-thought processing
  - Thinking budget allocation
- **Configuration**: Controlled by `thinking_budget` parameter

#### `critique`
- **Purpose**: Self-critique and analysis
- **Features**:
  - Evaluate reasoning quality
  - Identify weaknesses
  - Refine responses iteratively

#### `python_executor`
- **Purpose**: Execute Python code for computations
- **Use Cases**:
  - Mathematical calculations
  - Data analysis
  - Algorithm verification
- **Security**: Runs in sandboxed environment

#### `rag`
- **Purpose**: Retrieval-augmented generation within research mode
- **Use Case**: Combining document retrieval with deep reasoning

---

## 📊 Streaming Events Architecture

R2R agent supports **streaming responses** with typed events for real-time feedback:

### Event Types

```python
from r2r import (
    ThinkingEvent,      # 🧠 AI reasoning process
    ToolCallEvent,      # 🔧 Tool invocation
    ToolResultEvent,    # 📊 Tool execution result
    CitationEvent,      # 📑 Source citation
    MessageEvent,       # 💬 Generated response
    FinalAnswerEvent,   # ✅ Complete answer with citations
)
```

### Event Processing Pattern

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "What does deepseek r1 imply for the future of AI?"},
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "extended_thinking": True,
        "thinking_budget": 4096,
        "stream": True  # Enable streaming
    },
    mode="research"
)

# Process streaming events
current_event_type = None
for event in response:
    event_type = type(event)

    # Print emoji header when event type changes
    if event_type != current_event_type:
        current_event_type = event_type
        print()  # New line

        if isinstance(event, ThinkingEvent):
            print("🧠 Thinking: ", end="", flush=True)
        elif isinstance(event, ToolCallEvent):
            print("🔧 Tool call: ", end="", flush=True)
        elif isinstance(event, ToolResultEvent):
            print("📊 Tool result: ", end="", flush=True)
        elif isinstance(event, CitationEvent):
            print("📑 Citation: ", end="", flush=True)
        elif isinstance(event, MessageEvent):
            print("💬 Message: ", end="", flush=True)
        elif isinstance(event, FinalAnswerEvent):
            print("✅ Final answer: ", end="", flush=True)

    # Print event content
    if isinstance(event, ThinkingEvent):
        print(event.data.delta.content[0].payload.value, end="", flush=True)
    elif isinstance(event, ToolCallEvent):
        print(f"{event.data.name}({event.data.arguments})")
    elif isinstance(event, ToolResultEvent):
        print(f"{event.data.content[:60]}...")
    elif isinstance(event, CitationEvent):
        print(event.data)
    elif isinstance(event, MessageEvent):
        print(event.data.delta.content[0].payload.value, end="", flush=True)
    elif isinstance(event, FinalAnswerEvent):
        print(f"{event.data.generated_answer[:100]}...")
        print(f"   Citations: {len(event.data.citations)} sources referenced")
```

---

## 💬 Multi-Turn Conversations

### Conversation Management

R2R supports **conversation context** across multiple turns using `conversation_id`:

```python
# Create a new conversation
conversation = client.conversations.create()
conversation_id = conversation.results.id

# First turn
first_response = client.retrieval.agent(
    message={"role": "user", "content": "What does DeepSeek R1 imply for the future of AI?"},
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "temperature": 0.7,
        "max_tokens_to_sample": 1000,
        "stream": False
    },
    conversation_id=conversation_id,  # Link to conversation
    mode="rag"
)
print(f"First response: {first_response.results.messages[-1].content[:100]}...")

# Follow-up query with context
follow_up_response = client.retrieval.agent(
    message={"role": "user", "content": "How does it compare to other reasoning models?"},
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "temperature": 0.7,
        "max_tokens_to_sample": 1000,
        "stream": False
    },
    conversation_id=conversation_id,  # Same conversation
    mode="rag"
)
print(f"Follow-up response: {follow_up_response.results.messages[-1].content[:100]}...")

# The agent maintains context - "it" refers to DeepSeek R1
```

### Adding System Messages

```python
# Inform agent about available context
client.conversations.add_message(
    conversation_id=conversation["id"],
    role="system",
    content="You have access to the following file: {document_info['title']}"
)

# Query with file context
response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "Summarize the main points of the document"
    },
    search_settings={"limit": 5, "filters": {}},
    conversation_id=conversation["id"]
)
```

---

## ⚙️ Configuration & Search Settings

### Agent Configuration (r2r.toml)

```toml
[agent]
rag_agent_static_prompt = "rag_agent"
tools = ["search_file_knowledge", "web_search"]  # Available tools

  [agent.generation_config]
  model = "openai/gpt-4.1"  # Default model
```

### Search Settings Propagation

Settings configured at agent level **propagate to all downstream searches**:

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "Summarize our Q1 financial results"},
    search_settings={
        "use_semantic_search": True,
        "filters": {"collection_ids": {"$overlap": ["e43864f5-..."]}},
        "limit": 25,  # Applies to all tool searches
        "use_web_search": True  # Enable web search
    },
    rag_tools=["search_file_knowledge", "get_file_content", "web_search"],
    mode="rag"
)
```

### Hybrid Search Configuration

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "What were the key findings about DeepSeek R1?"},
    search_settings={
        "use_hybrid_search": True,
        "hybrid_settings": {
            "full_text_weight": 1.0,      # Keyword search weight
            "semantic_weight": 5.0,        # Vector search weight
            "full_text_limit": 200,        # Max keyword results
            "rrf_k": 50                    # Reciprocal Rank Fusion param
        }
    },
    mode="rag"
)
```

### Knowledge Graph Integration

```python
# Search with knowledge graph context
response = client.retrieval.agent(
    message={"role": "user", "content": "Explain deep learning's relationship to ML"},
    search_settings={
        "graph_settings": {"enabled": True}  # Enable graph search
    },
    mode="rag"
)
```

---

## 🚀 Performance Optimization

### Fast Response Configuration

For **time-sensitive applications**:

```python
fast_response = client.retrieval.agent(
    message={"role": "user", "content": "Give me a quick overview of DeepSeek R1"},
    rag_generation_config={
        "model": "anthropic/claude-3-haiku-20240307",  # Faster model
        "max_tokens_to_sample": 200,                   # Limited output
        "stream": True                                 # Stream for perceived speed
    },
    rag_tools=["search_file_knowledge"],              # Minimal tools
    mode="rag"
)
```

### Model Selection Guidelines

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `claude-3-haiku` | ⚡ Fastest | ⭐ Good | Quick queries, summaries |
| `claude-3-7-sonnet` | ⚡⚡ Fast | ⭐⭐⭐ Excellent | General RAG, balanced |
| `claude-3-opus` | ⚡ Slower | ⭐⭐⭐⭐ Best | Complex reasoning, research |
| `gpt-4.1` | ⚡⚡ Fast | ⭐⭐⭐ Excellent | Alternative to Sonnet |
| `gpt-4.1-mini` | ⚡⚡⚡ Very Fast | ⭐⭐ Good | Budget-conscious, fast |

---

## 🔒 Rate Limits & Constraints

### API Rate Limits (SciPhi Cloud)

| Endpoint | Per-Minute Limit | Monthly Limit |
|----------|-----------------|---------------|
| `/v3/retrieval/agent` | 5 requests | 100 requests |
| `/v3/retrieval/search` | 10 requests | 3,000 requests |
| `/v3/retrieval/rag` | 5 requests | 200 requests |

### Custom Rate Limits (Self-Hosted)

```toml
[database.limits]
global_per_min = 300
monthly_limit = 10000

[database.route_limits]
"/v3/retrieval/search" = { route_per_min = 120 }
"/v3/retrieval/rag" = { route_per_min = 30 }
```

---

## 🛠️ Custom Tools Development

### Creating User-Defined Tools

R2R supports **custom tool creation** for specialized functionality:

```python
from core.base.agent.tools.base import Tool

class CustomAnalysisTool(Tool):
    """
    A custom tool for specialized analysis.
    """

    def __init__(self):
        super().__init__(
            name="custom_analysis",
            description="Performs specialized analysis on data using custom logic.",
            parameters={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "string",
                        "description": "Input data to analyze",
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["statistical", "semantic", "structural"],
                        "description": "Type of analysis to perform"
                    }
                },
                "required": ["data", "analysis_type"],
            },
            results_function=self.execute,
            llm_format_function=None,
        )

    async def execute(self, data: str, analysis_type: str, *args, **kwargs):
        """
        Execute the custom analysis.
        """
        # Custom analysis logic
        if analysis_type == "statistical":
            result = perform_statistical_analysis(data)
        elif analysis_type == "semantic":
            result = perform_semantic_analysis(data)
        else:
            result = perform_structural_analysis(data)

        # Create result object
        result = AggregateSearchResult(
            generic_tool_result=[result],
        )

        # Add to results collector if context provided
        if context and hasattr(context, "search_results_collector"):
            context.search_results_collector.add_aggregate_result(result)

        return result
```

### Tool Registration

Custom tools are placed in `docker/user_tools/` directory and automatically loaded by R2R.

---

## 📋 API Reference

### Main Agent Endpoint

**Endpoint**: `POST /v3/retrieval/agent`

**Request Body**:
```json
{
  "message": {
    "role": "user",
    "content": "Your question here",
    "name": "User"
  },
  "search_mode": "advanced",
  "search_settings": {
    "use_semantic_search": true,
    "use_fulltext_search": true,
    "filters": {},
    "limit": 10,
    "use_web_search": false
  },
  "rag_generation_config": {
    "model": "anthropic/claude-3-7-sonnet-20250219",
    "extended_thinking": true,
    "thinking_budget": 4096,
    "temperature": 0.7,
    "max_tokens_to_sample": 2000,
    "stream": true
  },
  "rag_tools": ["search_file_knowledge", "get_file_content"],
  "research_tools": ["rag", "reasoning", "critique"],
  "mode": "rag",
  "conversation_id": "optional_conversation_id",
  "branch_id": "optional_branch_id"
}
```

**Response (Streaming)**:
```python
# Events streamed in sequence:
ThinkingEvent       # AI reasoning process
ToolCallEvent       # Tool being called
ToolResultEvent     # Tool execution result
CitationEvent       # Source citation
MessageEvent        # Generated response chunks
FinalAnswerEvent    # Complete answer with all citations
```

**Response (Non-Streaming)**:
```json
{
  "results": {
    "messages": [
      {
        "role": "assistant",
        "content": "Generated response here...",
        "conversation_id": "conversation_id",
        "branch_id": "branch_id"
      }
    ]
  }
}
```

---

## 🎯 Use Cases & Patterns

### Use Case 1: Document Q&A with Citations

```python
response = client.retrieval.agent(
    message={"role": "user", "content": "What are the key findings in the research?"},
    search_settings={
        "limit": 10,
        "filters": {"document_type": {"$eq": "pdf"}}
    },
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "temperature": 0.3,  # Low temp for factual accuracy
        "stream": False
    },
    mode="rag"
)

# Response includes citations
for citation in response.results.citations:
    print(f"Source: {citation.payload.metadata.get('title')}")
    print(f"Score: {citation.payload.score}")
```

### Use Case 2: Complex Multi-Step Analysis

```python
response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "Analyze the architectural patterns in this codebase and suggest improvements"
    },
    research_generation_config={
        "model": "anthropic/claude-3-opus-20240229",
        "extended_thinking": True,
        "thinking_budget": 8192,  # High budget for complex reasoning
        "temperature": 0.5,
        "stream": True
    },
    research_tools=["rag", "reasoning", "critique", "python_executor"],
    mode="research"
)

# Process streaming events
for event in response:
    if isinstance(event, ThinkingEvent):
        print(f"Thinking: {event.data.delta.content[0].payload.value}")
    elif isinstance(event, ToolCallEvent):
        print(f"Using tool: {event.data.name}")
```

### Use Case 3: Web-Enhanced Research

```python
response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "Compare our documentation with industry best practices"
    },
    search_settings={
        "limit": 10,
        "use_web_search": True  # Enable web search
    },
    rag_generation_config={
        "model": "anthropic/claude-3-7-sonnet-20250219",
        "stream": False
    },
    rag_tools=["search_file_knowledge", "web_search", "web_scrape"],
    mode="rag"
)
```

### Use Case 4: Code Execution & Analysis

```python
response = client.retrieval.agent(
    message={
        "role": "user",
        "content": "Calculate the time complexity of this algorithm and verify with test data"
    },
    research_generation_config={
        "model": "anthropic/claude-3-opus-20240229",
        "stream": False
    },
    research_tools=["python_executor", "reasoning"],
    mode="research"
)
```

---

## 🔗 Integration with Our MCP Server

### Current R2R MCP Server Capabilities

Our existing `r2r-mcp-server` implements:
- ✅ Document search (semantic + full-text)
- ✅ RAG queries with citations
- ✅ Knowledge graph queries
- ✅ Multi-turn conversations
- ⚠️ **Missing**: Agent-specific tools (no agentic RAG yet)

### Potential Agent Integration

**Option 1: Add Agent MCP Tool**

```typescript
// r2r-mcp-server/src/index.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'r2r_agent_query') {
    const response = await client.retrieval.agent({
      message: { role: 'user', content: args.query },
      mode: args.mode || 'rag',
      rag_generation_config: {
        model: args.model || 'anthropic/claude-3-7-sonnet-20250219',
        stream: false
      },
      rag_tools: args.tools || ['search_file_knowledge', 'get_file_content']
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.results, null, 2)
      }]
    };
  }
});
```

**Option 2: Streaming Agent Tool**

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'r2r_agent_stream') {
    const response = await client.retrieval.agent({
      message: { role: 'user', content: request.params.arguments.query },
      mode: 'research',
      research_generation_config: {
        model: 'anthropic/claude-3-opus-20240229',
        extended_thinking: true,
        thinking_budget: 4096,
        stream: true
      }
    });

    let fullResponse = '';
    for await (const event of response) {
      if (event instanceof MessageEvent) {
        fullResponse += event.data.delta.content[0].payload.value;
      }
    }

    return { content: [{ type: 'text', text: fullResponse }] };
  }
});
```

---

## 📊 Comparison: Current vs Agent-Enhanced MCP

| Feature | Current MCP Server | With Agent Integration |
|---------|-------------------|----------------------|
| **Search** | ✅ Semantic + Full-text | ✅ Same + Web search |
| **RAG** | ✅ Basic RAG | ✅ Multi-step reasoning |
| **Tools** | ❌ No tool system | ✅ 8+ built-in tools |
| **Thinking** | ❌ No extended thinking | ✅ Extended thinking budget |
| **Streaming** | ⚠️ Limited | ✅ Full event streaming |
| **Code Execution** | ❌ Not supported | ✅ Python executor |
| **Multi-turn** | ✅ Conversations | ✅ Enhanced with tools |
| **Critique** | ❌ No self-critique | ✅ Self-critique tool |

---

## 🎓 Key Learnings

### Agent Design Principles

1. **Two Modes for Two Use Cases**: RAG for fast retrieval, Research for deep reasoning
2. **Tool Composability**: Tools can be mixed and matched based on task
3. **Streaming First**: Real-time feedback improves UX for long-running tasks
4. **Context Propagation**: Search settings propagate to all tool invocations
5. **Extended Thinking**: Thinking budget allows controlled reasoning depth

### Best Practices

✅ **Do's**:
- Use RAG mode for document Q&A and information retrieval
- Use Research mode for complex analysis and multi-step reasoning
- Enable streaming for tasks >5 seconds
- Set thinking_budget based on task complexity
- Use conversation_id for multi-turn interactions
- Filter results with `filters` to reduce search space

❌ **Don'ts**:
- Don't use Research mode for simple queries (wasteful)
- Don't disable streaming for long-running tasks
- Don't set thinking_budget too low for complex reasoning
- Don't ignore rate limits in production
- Don't forget to handle all event types in streaming

---

## 🚀 Recommended Next Steps

### For Our MCP Server

1. **Immediate (1-2 days)**:
   - Add `r2r_agent_query` tool with basic agent support
   - Support RAG and Research modes
   - Implement streaming event handling

2. **Short-term (1 week)**:
   - Add all standard tools (web_search, python_executor, etc.)
   - Implement extended thinking support
   - Add tool selection configuration

3. **Medium-term (2-4 weeks)**:
   - Support custom tool creation
   - Add tool result caching
   - Implement advanced conversation branching

### Testing Plan

```bash
# Test basic agent query
npm run agent -- ask "What is GraphRAG?" --mode=rag

# Test research mode
npm run agent -- ask "Analyze the R2R architecture" --mode=research --thinking-budget=4096

# Test streaming
npm run agent -- ask "Explain knowledge graphs" --stream
```

---

## 📚 References

- **R2R Documentation**: https://r2r-docs.sciphi.ai/documentation/retrieval/agentic-rag
- **R2R GitHub**: https://github.com/sciphi-ai/r2r
- **Agent API Reference**: https://r2r-docs.sciphi.ai/documentation/quickstart
- **Tool Development**: https://github.com/sciphi-ai/r2r/blob/main/docker/user_tools/README.md

---

## ✅ Summary

R2R's agent system provides:
- **Dual-mode operation** (RAG + Research)
- **8+ built-in tools** for various tasks
- **Extended thinking** with configurable budgets
- **Streaming architecture** for real-time feedback
- **Multi-turn conversations** with context
- **Custom tool support** for extensibility

**Integration Potential**: High - Our MCP server can be enhanced with agentic capabilities for more intelligent, multi-step reasoning over documents.

**Estimated Effort**: 1-2 weeks for basic agent support, 4 weeks for full feature parity.
