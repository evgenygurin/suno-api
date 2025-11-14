# R2R Agent Quick Reference

## 🚀 Basic Commands

```bash
# Ask agent a question (default: developer persona)
npm run agent -- ask "your question here"

# Use specific persona
npm run agent -- ask "your question" --persona architect
npm run agent -- ask "your question" --persona debugger
npm run agent -- ask "your question" --persona learner
npm run agent -- ask "your question" --persona tester

# Verbose output (shows reasoning and tool calls)
npm run agent -- ask "your question" --verbose

# Interactive REPL session
npm run agent -- interactive --persona developer
```

## 👤 5 Personas (When to Use)

| Persona | Use For | Tools | Learning |
|---------|---------|-------|----------|
| **developer** | Writing code, finding examples | code examples, dependencies | Moderate |
| **architect** | Understanding structure, design | graph analysis, relationships | Aggressive |
| **debugger** | Fixing errors, troubleshooting | debug, past experiences | Aggressive |
| **learner** | Learning concepts, explanations | documentation, reflection | Aggressive |
| **tester** | Testing, coverage analysis | test examples, coverage | Moderate |

## ⚙️ 3 Modes (How Agent Behaves)

- **interactive** (default) - Detailed explanations, step-by-step
- **autonomous** - Fast execution, minimal interaction
- **advisory** - Suggests actions, waits for confirmation

## 📊 Agent Management

```bash
# List all personas
npm run agent -- personas

# List all modes
npm run agent -- modes

# Check agent status and stats
npm run agent -- status --persona developer

# Reset agent state (clear memory)
npm run agent -- reset --persona developer
```

## 🎯 Example Queries by Task

### Development
```bash
npm run agent -- ask "How do I add pagination to search results?"
npm run agent -- ask "Show me error handling examples"
npm run agent -- ask "What dependencies does server.ts have?"
```

### Architecture
```bash
npm run agent -- ask "Explain the project architecture" --persona architect
npm run agent -- ask "How are modules connected?" --persona architect
npm run agent -- ask "Show dependency graph" --persona architect
```

### Debugging
```bash
npm run agent -- ask "Why am I getting timeout errors?" --persona debugger
npm run agent -- ask "Find similar past errors" --persona debugger
npm run agent -- ask "Debug authentication failure" --persona debugger
```

### Learning
```bash
npm run agent -- ask "Explain how RAG works in this project" --persona learner
npm run agent -- ask "What is GraphRAG?" --persona learner
npm run agent -- ask "How does MCP integration work?" --persona learner
```

### Testing
```bash
npm run agent -- ask "What tests cover authentication?" --persona tester
npm run agent -- ask "Show test examples for API endpoints" --persona tester
npm run agent -- ask "Find untested code" --persona tester
```

## 🧠 Pattern Recognition

The agent automatically selects tools based on your query keywords:

| Keywords | Tool Selected |
|----------|---------------|
| find, search, look for | search_documentation |
| example, how to, implement | search_code_examples |
| build, create, feature | get_implementation_help |
| error, bug, fail, broken | debug_with_rag |
| architecture, structure, design | explain_architecture |
| depend, import, use | find_dependencies |
| test, coverage | find_test_coverage |
| what, why, how, explain | ask_documentation |
| explore, overview, connected | explore_architecture_graph |

## 📈 Confidence Scores

- **85-100%** ✅ High confidence - reliable answer
- **70-84%** ✅ Good confidence - likely correct
- **40-69%** ⚠️ Moderate - verify if critical
- **0-39%** ❌ Low - answer may be incomplete

## 🔧 Tips for Better Results

### ✅ DO:
- Be specific: "How to add JWT authentication?"
- Provide context: "Debug CAPTCHA timeout in browser.ts"
- Use right persona: architect for structure, debugger for errors
- Check confidence scores

### ❌ DON'T:
- Be too vague: "help", "fix it"
- Mix multiple unrelated questions
- Ignore low confidence scores
- Forget to check verbose output if unclear

## 🚨 Troubleshooting

**"I was unable to find relevant information"**
- Check if documentation is ingested: `npm run ingest`
- Make query more specific
- Try different persona (learner for docs)

**Low confidence scores (<40%)**
- Add more context to query
- Use `--verbose` to see reasoning
- Try breaking into smaller questions

**Agent is slow**
- Normal: 3-8 seconds for complex queries
- Check R2R server connection
- Consider using autonomous mode

## 📝 MCP Integration

When using with Claude Code, the agent is available as tools:

```json
{
  "tool": "r2r_agent",
  "arguments": {
    "request": "What tools are available?",
    "persona": "developer",
    "mode": "interactive"
  }
}
```

Agent status and reset also available as separate tools.

## 💡 Pro Tips

1. **Use interactive mode when learning** - You'll get detailed explanations
2. **Use autonomous mode for repetitive tasks** - Faster execution
3. **Check agent status** to see accumulated experiences
4. **Verbose mode** shows exactly what tools were used and why
5. **Multiple personas** for different perspectives on same question

## 📚 More Information

- **Detailed Guide**: [R2R-AGENT-SUMMARY.md](./R2R-AGENT-SUMMARY.md)
- **MCP Tools**: [README.md](./README.md)
- **Architecture**: See agent section in README

---

**Quick Start**: `npm run agent -- ask "What can you help me with?" --verbose`
