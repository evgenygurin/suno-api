# FastMCP Completion Handler Patch

## Issue

The FastMCP library (v3.23.0) unconditionally sets up completion request handlers during server initialization, even when the MCP client doesn't support the completions capability. This causes the server to crash when connecting to clients like Claude that don't advertise completion support.

### Error Message

```bash
Error: Server does not support completions (required for completion/complete)
    at Server.assertRequestHandlerCapability
    at Server.setRequestHandler
    at FastMCPSession.setupCompleteHandlers
```

## Root Cause

In `FastMCP.js`, the `setupCompleteHandlers()` method is called unconditionally in the constructor:

```javascript
// line 401
this.setupCompleteHandlers();

// line 663-664
setupCompleteHandlers() {
  this.#server.setRequestHandler(CompleteRequestSchema, async (request) => {
    // ... handler code
  });
}
```

The MCP SDK's `setRequestHandler` method checks if the client supports the required capability. Since Claude's MCP client sends an empty capabilities object:

```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},  // Empty!
    "clientInfo": {"name": "claude-ai", "version": "0.1.0"}
  }
}
```

The server crashes because completions are not in the client's capabilities.

## Solution

We patched FastMCP to gracefully handle clients that don't support completions by wrapping the `setRequestHandler` call in a try-catch block:

```javascript
setupCompleteHandlers() {
  // Skip setting up completion handlers if client doesn't support completions
  // This prevents errors with clients like Claude that don't advertise completion capability
  try {
    this.#server.setRequestHandler(CompleteRequestSchema, async (request) => {
      // ... existing handler code
    });
  } catch (error) {
    // Client doesn't support completions - this is fine, just skip
    if (error?.message?.includes('does not support completions')) {
      console.error('[FastMCP] Client does not support completions capability, skipping completion handlers');
      return;
    }
    throw error;
  }
}
```

## Patch Application

The patch is automatically applied after `npm install` via the `postinstall` script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

The patch file is stored in `patches/fastmcp+3.23.0.patch` and managed by `patch-package`.

## Testing

After applying the patch, the server starts successfully:

```bash
$ node dist/index.js
Suno client initialized successfully
Initializing Suno FastMCP Server
Starting Suno FastMCP Server...
[FastMCP] Client does not support completions capability, skipping completion handlers
Suno FastMCP Server is running on stdio
```

## Future

This is a temporary workaround. We should:

1. ✅ Report this issue to the FastMCP maintainers
2. ⏳ Monitor for an official fix in future FastMCP versions
3. ⏳ Remove this patch when FastMCP properly handles missing capabilities

## References

- FastMCP GitHub: https://github.com/punkpeye/fastmcp
- MCP Specification: https://modelcontextprotocol.io/
- Issue filed: [To be added]

## Generating the Patch

If you need to regenerate the patch (e.g., after updating FastMCP):

```bash
# 1. Make your changes to node_modules/fastmcp/dist/FastMCP.js
# 2. Generate the patch
npx patch-package fastmcp

# 3. The patch will be saved to patches/fastmcp+3.23.0.patch
```

## Troubleshooting

If the server still fails to connect:

1. **Verify patch is applied**:
   ```bash
   grep -A 5 "Client does not support completions" node_modules/fastmcp/dist/FastMCP.js
   ```

2. **Manually apply patch**:
   ```bash
   npx patch-package
   ```

3. **Check logs**:
   ```bash
   tail -f ~/.config/Claude/logs/mcp-server-suno-music.log
   # Or on macOS:
   tail -f ~/Library/Logs/Claude/mcp-server-suno-music.log
   ```

4. **Rebuild server**:
   ```bash
   npm run build
   ```

## Related Files

- `patches/fastmcp+3.23.0.patch` - The patch file
- `package.json` - Contains postinstall script
- `node_modules/fastmcp/dist/FastMCP.js` - Patched file (regenerated on install)
