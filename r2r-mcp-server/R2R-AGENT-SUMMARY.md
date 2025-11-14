# R2R Intelligent Agent System

## Overview

The R2R Agent is an **autonomous intelligent system** that orchestrates all R2R RAG, GraphRAG, search, and memory tools to provide context-aware assistance for development tasks. Instead of manually calling individual tools, you interact with the agent using natural language, and it autonomously decides which tools to use, in what order, and how to combine their results.

## Key Features

### 🧠 **Autonomous Decision-Making**
- Pattern-based request analysis
- Intelligent tool selection with confidence scoring
- Automatic workflow planning with parallel execution
- Dynamic tool chaining based on results

### 👤 **5 Specialized Personas**
Each persona has unique behavior optimized for specific tasks:

#### 1. **Developer Assistant** (`developer`)
- **Focus**: Practical development tasks, code examples, implementation
- **Tools**: `search_code_examples`, `get_implementation_help`, `find_dependencies`, `debug_with_rag`
- **Search**: Precise with top_k=5
- **Learning**: Moderate (stores experiences with confidence ≥ 0.7)
- **Graph Analysis**: Enabled (depth 2)

#### 2. **Architecture Explorer** (`architect`)
- **Focus**: System architecture, design patterns, high-level structure
- **Tools**: `explore_architecture_graph`, `explain_architecture`, `query_code_relationships`, `find_dependencies`, `find_usages`
- **Search**: Comprehensive with top_k=10
- **Learning**: Aggressive (stores all experiences)
- **Graph Analysis**: Enabled (depth 3)

#### 3. **Debug Specialist** (`debugger`)
- **Focus**: Debugging, error analysis, troubleshooting
- **Tools**: `debug_with_rag`, `retrieve_similar_experiences`, `search_documentation`, `find_test_coverage`
- **Search**: Exploratory with top_k=8
- **Learning**: Aggressive (learns from all errors)
- **Graph Analysis**: Enabled (depth 2)

#### 4. **Learning Assistant** (`learner`)
- **Focus**: Understanding and explaining concepts, knowledge accumulation
- **Tools**: `ask_documentation`, `explain_architecture`, `search_documentation`, `reflect_on_patterns`
- **Search**: Exploratory with top_k=7
- **Learning**: Aggressive (continuous learning)
- **Graph Analysis**: Disabled (focuses on documentation)

#### 5. **Test Coverage Assistant** (`tester`)
- **Focus**: Testing, test coverage, quality assurance
- **Tools**: `find_test_examples`, `find_test_coverage`, `search_code_examples`, `get_implementation_help`
- **Search**: Precise with top_k=5
- **Learning**: Moderate
- **Graph Analysis**: Enabled (depth 1)

### 🎯 **3 Operational Modes**

1. **Interactive Mode** (default)
   - Agent waits for explicit commands
   - Provides detailed explanations
   - Step-by-step guidance

2. **Autonomous Mode**
   - Agent makes decisions independently
   - Automatically chains tools
   - Minimal user interaction

3. **Advisory Mode**
   - Agent suggests actions
   - Waits for user confirmation
   - Explains reasoning before execution

### 🧮 **Intelligent Context Management**
- **Working Memory**: Maintains last 20 conversation entries
- **Tool Statistics**: Tracks success rates, execution times, usage patterns
- **State Tracking**: Monitors tasks completed, experiences stored, reflection timing
- **Automatic Cleanup**: Removes old entries to maintain focus

### 📚 **Experience Accumulation & Learning**
- **Automatic Experience Storage**: Saves successful patterns and failed attempts
- **Similar Experience Retrieval**: Finds past solutions to similar problems
- **Pattern Reflection**: Analyzes accumulated experiences to identify best practices
- **Configurable Learning Rates**:
  - Conservative: Only store high-confidence successes (≥0.85)
  - Moderate: Store good successes (≥0.7)
  - Aggressive: Store all experiences for rapid learning

### 🔄 **Auto-Reflection System**
- Triggers automatically after N stored experiences
- Analyzes patterns across all accumulated knowledge
- Identifies common success/failure patterns
- Updates internal strategies based on learnings

## Usage

### CLI Interface

#### Basic Query
```bash
npm run agent -- ask "How does authentication work?"
```

#### With Specific Persona
```bash
npm run agent -- ask "What is the project architecture?" --persona architect
npm run agent -- ask "How to fix this error?" --persona debugger
npm run agent -- ask "Show me test examples" --persona tester
```

#### With Verbose Output
```bash
npm run agent -- ask "Explain the codebase structure" --persona learner --verbose
```

#### Interactive Session
```bash
npm run agent -- interactive --persona developer
> How do I add a new API endpoint?
> What dependencies does server.ts have?
> exit
```

#### Agent Management
```bash
# List all personas
npm run agent -- personas

# List all modes
npm run agent -- modes

# Check agent status
npm run agent -- status --persona developer

# Reset agent state
npm run agent -- reset --persona developer
```

### MCP Tool Interface

The agent is also exposed as 3 MCP tools that can be used by Claude Code or other MCP clients:

#### 1. `r2r_agent` - Main Agent Interface
```json
{
  "name": "r2r_agent",
  "arguments": {
    "request": "What tools are available for searching code?",
    "persona": "developer",
    "mode": "interactive"
  }
}
```

#### 2. `agent_status` - Get Agent Status
```json
{
  "name": "agent_status",
  "arguments": {
    "persona": "architect"
  }
}
```

#### 3. `agent_reset` - Reset Agent State
```json
{
  "name": "agent_reset",
  "arguments": {
    "persona": "developer"
  }
}
```

## How It Works

### Request Processing Flow

```bash
1. User Request
   ↓
2. Pattern Analysis
   - Matches request against 9 patterns
   - Assigns confidence scores
   - Selects 1-3 best tools
   ↓
3. Workflow Planning
   - Orders tool execution
   - Identifies parallel opportunities
   - Estimates duration
   ↓
4. Tool Execution
   - Runs tools sequentially or in parallel
   - Captures results and timing
   - Handles errors gracefully
   ↓
5. Answer Synthesis
   - Combines results from all tools
   - Extracts main answer from RAG results
   - Calculates confidence score
   ↓
6. Experience Storage (if appropriate)
   - Stores based on outcome and confidence
   - Tags with persona and context
   - Updates experience counter
   ↓
7. Auto-Reflection (if threshold reached)
   - Analyzes patterns across experiences
   - Updates agent strategies
   - Records reflection timestamp
```

### Pattern-Based Tool Selection

The agent uses 9 request patterns to match user intent:

| Pattern | Keywords | Selected Tool | Confidence |
|---------|----------|---------------|------------|
| Search | find, search, look for | `search_documentation` | 0.85 |
| Code Examples | example, how to, implement | `search_code_examples` | 0.80 |
| Implementation | implement, build, create, feature | `get_implementation_help` | 0.75 |
| Debug | error, bug, fail, broken | `debug_with_rag` | 0.85 |
| Architecture | architecture, structure, design | `explain_architecture` | 0.75 |
| Dependencies | depend, import, use | `find_dependencies` | 0.70 |
| Testing | test, coverage | `find_test_coverage` | 0.75 |
| Questions | what, how, why, explain | `ask_documentation` | 0.70 |
| Graph Exploration | explore, overview, connected | `explore_architecture_graph` | 0.70 |

### Confidence Scoring

Final confidence is calculated from:
- **Tool success rate**: Percentage of tools that succeeded
- **Decision confidence**: Average confidence of tool selections
- **Combined score**: `(success_rate + avg_confidence) / 2`

Interpretation:
- **0.85-1.0**: High confidence - reliable answer
- **0.70-0.84**: Good confidence - likely correct
- **0.40-0.69**: Moderate confidence - verify if critical
- **0.0-0.39**: Low confidence - answer may be incomplete

## Architecture

### File Structure
```text
r2r-mcp-server/src/agent/
├── config.ts        # Personas, modes, configuration
├── context.ts       # Working memory, state management
├── decision.ts      # Pattern matching, tool selection
├── core.ts          # Main orchestration engine
└── index.ts         # Public API exports

r2r-mcp-server/src/cli/
└── agent.ts         # CLI interface with 6 commands
```

### Key Classes

#### `R2RAgent` (core.ts)
Main orchestration engine that:
- Processes natural language requests
- Coordinates decision-making and execution
- Synthesizes answers from multiple tool results
- Manages experience storage and reflection

#### `DecisionMaker` (decision.ts)
Autonomous decision-making system that:
- Analyzes user requests with pattern matching
- Selects appropriate tools with confidence scores
- Creates workflow plans with parallelization
- Estimates execution duration

#### `AgentContext` (context.ts)
Working memory system that:
- Maintains conversation history (last 20 entries)
- Tracks tool usage statistics
- Provides context summaries
- Calculates performance metrics

#### `StateManager` (context.ts)
State tracking system that:
- Monitors task completion
- Counts stored experiences
- Tracks reflection triggers
- Maintains session metadata

## Example Interactions

### Example 1: Development Task
```bash
$ npm run agent -- ask "How do I add pagination to search results?" --persona developer

🤖 Agent thinking...

[Agent selects: search_code_examples, get_implementation_help]
[Executes both tools in parallel]
[Synthesizes answer from results]

📝 Answer (confidence: 82.5%)

To add pagination to search results in this project:

1. Use the offset and limit parameters in your search query
2. Implement page calculation logic: page * limit = offset
3. Return total_entries in metadata for pagination UI

Example from existing code:
```typescript
const results = await r2r.retrieval.search({
  query: "your search",
  limit: 20,
  offset: 0
});
```

📚 Sources: 3 documents
⏱️  Executed in 2340ms
```bash

### Example 2: Architecture Understanding
```bash
$ npm run agent -- ask "Explain how the MCP server works" --persona architect --verbose

🤖 Agent thinking...

[Agent selects: explain_architecture, explore_architecture_graph]
[Executes workflow with graph depth 3]

📝 Answer (confidence: 78.3%)

The MCP server architecture consists of:

**Core Components:**
1. Server (src/server.ts) - MCP protocol handler
2. Tools (src/tools/) - 16 specialized R2R operations
3. SDK Client (src/sdk/) - R2R v3 SDK integration
4. Agent (src/agent/) - Autonomous orchestration layer

**Tool Categories:**
- Search Tools (3): documentation, code examples, tests
- RAG Tools (4): Q&A, implementation help, debugging, architecture
- Memory Tools (4): experiences, retrieval, reflection, stats
- Graph Tools (5): relationships, dependencies, coverage, exploration

💭 Reasoning:
1. User wants to understand architecture
2. User wants to explore code relationships

🔧 Tool Calls:
✓ explain_architecture (2156ms)
✓ explore_architecture_graph (3421ms)

📚 Sources: 8 documents
⏱️  Executed in 5832ms
```

### Example 3: Debugging
```bash
$ npm run agent -- ask "Why am I getting 'Connection timeout' error?" --persona debugger

🤖 Agent thinking...

[Agent selects: debug_with_rag, retrieve_similar_experiences]
[Searches past solutions, provides context-aware help]

📝 Answer (confidence: 71.2%)

Based on similar past issues, connection timeout errors typically occur when:

1. The R2R server is not running (check R2R_BASE_URL)
2. Network connectivity issues
3. Server is overloaded

**Previous Solution:**
This exact error was solved by:
- Verifying server is running: `curl $R2R_BASE_URL/v3/health`
- Increasing timeout in SDK config
- Checking firewall rules

Try these steps first, then check the logs.

📚 Sources: 2 documents, 1 past experience
⏱️  Executed in 1876ms
```

## Best Practices

### Choosing the Right Persona

- **Development Tasks** → Use `developer` persona
  - Writing code, implementing features, finding examples

- **Architecture Reviews** → Use `architect` persona
  - Understanding structure, design patterns, dependencies

- **Debugging Issues** → Use `debugger` persona
  - Error analysis, troubleshooting, root cause investigation

- **Learning/Documentation** → Use `learner` persona
  - Concept explanation, knowledge building, tutorials

- **Testing/QA** → Use `tester` persona
  - Test coverage, test examples, quality checks

### Choosing the Right Mode

- **Interactive** (default) - Best for:
  - Learning and exploration
  - When you want detailed explanations
  - Step-by-step guidance

- **Autonomous** - Best for:
  - Repetitive tasks
  - When you trust the agent
  - Fast execution without interruption

- **Advisory** - Best for:
  - Critical operations
  - When you want control
  - Learning agent's reasoning

### Writing Effective Requests

**Good Requests:**
- ✅ "How do I add authentication to the API?"
- ✅ "Find examples of error handling in this codebase"
- ✅ "What tests cover the search functionality?"
- ✅ "Explain the dependency graph of server.ts"

**Avoid:**
- ❌ "Help" (too vague)
- ❌ "Fix it" (no context)
- ❌ "Code" (no specific request)

## Performance

### Typical Execution Times
- **Simple query** (1 tool): 1-3 seconds
- **Complex query** (2-3 tools): 3-8 seconds
- **Parallel execution**: ~40% faster than sequential
- **With reflection**: +2-3 seconds every 10th query

### Resource Usage
- **Memory**: ~50MB per agent instance
- **Context size**: Max 20 entries (auto-pruned)
- **Experience storage**: Handled by R2R server
- **Graph analysis**: Configurable depth (1-3 levels)

## Troubleshooting

### Agent Not Finding Information
**Cause**: Documentation not ingested or query too vague
**Solution**:
1. Check ingestion: `npm run ingest`
2. Verify R2R server connection
3. Make request more specific
4. Try different persona (e.g., `learner` for docs)

### Low Confidence Scores
**Cause**: Ambiguous request or limited context
**Solution**:
1. Provide more context in request
2. Use `--verbose` to see reasoning
3. Try multiple personas
4. Check if documentation exists on topic

### Experience Storage Failing
**Cause**: R2R server connectivity issues
**Solution**:
1. Check R2R_BASE_URL in .env
2. Verify server is running
3. Check server logs for errors
4. Non-critical: agent continues without storage

## Integration with MCP

The agent integrates seamlessly with Claude Code via MCP:

### In Claude Code
When you have the MCP server running, you can use the agent directly:

```text
Claude: What is the architecture of this project?
[Uses r2r_agent tool automatically]
[Agent analyzes, selects tools, executes, responds]

Claude: Can you show me test examples?
[Agent switches to tester persona automatically based on context]
```

### Agent Status in MCP
```json
{
  "tool": "agent_status",
  "result": {
    "persona": "Developer Assistant",
    "mode": "interactive",
    "context": {
      "total_entries": 12,
      "time_span_minutes": 45
    },
    "tool_stats": {
      "tool_calls": 28,
      "success_rate": 0.892,
      "avg_execution_time_ms": 1834
    },
    "state": {
      "tasks_completed": 8,
      "experiences_stored": 6,
      "last_reflection": "2025-01-14T15:30:22Z"
    }
  }
}
```

## Future Enhancements

### Planned Features
- [ ] Multi-turn conversations with context preservation
- [ ] Tool result caching for faster repeat queries
- [ ] Custom persona creation via configuration
- [ ] Advanced graph traversal strategies
- [ ] Learning from user feedback
- [ ] Tool execution visualization
- [ ] Performance optimization for large codebases
- [ ] Integration with additional MCP tools

### Experimental Ideas
- Collaborative multi-agent problem solving
- Predictive tool selection based on patterns
- Adaptive confidence thresholds
- Cross-project knowledge transfer

## Technical Details

### Dependencies
- `r2r-js`: Official R2R v3 SDK
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `pino`: Structured logging
- `commander`: CLI framework
- `zod`: Schema validation

### Configuration
All configuration is in `src/agent/config.ts`:
- Persona definitions
- Mode definitions
- Default settings
- Tool execution preferences

### Logging
The agent uses structured logging with Pino:
- Module-specific loggers
- Request/response tracking
- Tool execution metrics
- Error details with context

## Conclusion

The R2R Agent transforms how you interact with your codebase documentation. Instead of manually searching, querying, and analyzing, you describe what you need in natural language, and the agent orchestrates the best approach using its knowledge of 16 specialized tools, accumulated experiences, and intelligent decision-making.

**Key Benefits:**
- 🚀 **Faster**: Parallel tool execution, cached experiences
- 🎯 **Smarter**: Pattern-based tool selection, confidence scoring
- 📚 **Learning**: Accumulates and applies past experiences
- 🔧 **Flexible**: 5 personas × 3 modes = 15 behavioral profiles
- 🤖 **Autonomous**: Makes intelligent decisions without micro-management

**Get Started:**
```bash
# Quick test
npm run agent -- ask "What can you help me with?" --persona developer

# Interactive session
npm run agent -- interactive --persona architect

# View all capabilities
npm run agent -- personas
npm run agent -- modes
```

**Questions or Issues?**
Check the logs, use `--verbose` mode, or try different personas to see how the agent approaches your problem from different angles.
