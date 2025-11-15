Fast MCP Server for Suno API
---------------------------------
- A lightweight MCP server focused on low-latency responses
- Exposes a minimal toolset: fast_suno_docs_summary and fast_echo
- Run via: npm run fastmcp (from the r2r-mcp-server package)
- Transport: stdio (stdout/stdin) by default; extendable to HTTP in future

Usage example:
- Start: npm run fastmcp
- Tools:
  - List tools: Send ListToolsRequest to the server
  - Call tool: Send CallToolRequest with { name: 'fast_echo', input: { prompt: 'hello' } }

