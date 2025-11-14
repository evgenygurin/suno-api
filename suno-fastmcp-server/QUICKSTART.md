# Suno FastMCP Server - Quick Start Guide

Get started with the Suno AI music generation MCP server in 5 minutes!

## 🚀 Quick Setup

### Prerequisites

Before starting, ensure you have:
- **Node.js v18 or higher** installed
- A **Suno API key** from [sunoapi.org](https://sunoapi.org/api-key)

Check your Node.js version:

```bash
node --version  # Should output v18.0.0 or higher
```

### 1. Install Dependencies
```bash
cd suno-fastmcp-server
npm install
```

> **Note**: This creates `package-lock.json` for reproducible builds. This file is committed to ensure consistent dependency versions across all environments.

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your API key
# Get your key from: https://sunoapi.org/api-key
nano .env  # or use your favorite editor
```

Your `.env` should look like:
```text
SUNO_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LOG_LEVEL=info
```

### 3. Build the Server
```bash
npm run build
```

### 4. Test the Server (Optional)
```bash
# Run in development mode
npm run dev
# Press Ctrl+C to stop
```

## 🔌 Add to Claude Desktop

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "suno-music": {
      "command": "node",
      "args": ["/FULL/PATH/TO/suno-fastmcp-server/dist/index.js"],
      "env": {
        "SUNO_API_KEY": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "suno-music": {
      "command": "node",
      "args": ["C:\\FULL\\PATH\\TO\\suno-fastmcp-server\\dist\\index.js"],
      "env": {
        "SUNO_API_KEY": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Linux
Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "suno-music": {
      "command": "node",
      "args": ["/full/path/to/suno-fastmcp-server/dist/index.js"],
      "env": {
        "SUNO_API_KEY": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/FULL/PATH/TO/` with your actual path
- Use `pwd` in the server directory to get the full path
- Use **absolute paths**, not relative paths like `~/` or `./`
- On Windows, use double backslashes (`\\`) in paths

### 5. Restart Claude Desktop

Completely quit and restart Claude Desktop for the MCP server to load.

## ✅ Verify Installation

In Claude Desktop, try asking:

```text
Generate an upbeat pop song about summer
```

or

```text
List available Suno AI models
```

You should see Claude using the Suno tools!

## 🎵 First Music Generation

Try this prompt in Claude:

```text
Generate a custom song with these details:
- Style: electronic, synthwave, 80s
- Title: "Neon Nights"
- Lyrics: A song about driving through a neon-lit city at night
- Use the V4 model
```

Claude will use the `generate_custom_music` tool and return a task ID.

## 📊 Check Status

After generating music, check the status:

```text
Check the status of task ID: [paste the task ID from previous generation]
```

Claude will use `get_audio_info` to check if your music is ready.

## 💡 Common Use Cases

### Generate Quick Music
```bash
Generate instrumental electronic music for a video background
```

### Create Custom Song
```sql
Create a jazz song called "Midnight Blues" with saxophone and slow tempo
```

### Generate Lyrics First
```bash
Generate lyrics for a motivational rock song about overcoming challenges
```

Then use those lyrics:
```bash
Now create music for those lyrics with style: rock, electric guitar, powerful vocals
```

### Separate Vocals
```text
Separate the vocals and instruments from task ID: [task_id]
```

## 🐛 Troubleshooting

### Tools Not Appearing

1. **Check config file exists:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Check for JSON errors:**
   - No trailing commas
   - All quotes matched
   - Valid JSON syntax

3. **Verify absolute path:**
   ```bash
   cd suno-fastmcp-server
   pwd  # Copy this path
   ```

4. **Check Node.js:**
   ```bash
   node --version  # Should be v18 or higher
   ```

5. **Restart Claude Desktop completely:**
   - Quit Claude Desktop (Cmd+Q on macOS)
   - Wait 5 seconds
   - Open Claude Desktop again

### API Key Issues

**Problem:** "API key valid: false"

**Solution:**
1. Check your API key has credits: https://sunoapi.org
2. Verify no extra spaces in `.env` file
3. Use the `get_api_status` tool to verify

### Server Won't Start

**Problem:** "SUNO_API_KEY environment variable is required"

**Solution:**
1. Check `.env` file exists in server directory
2. Verify API key is correct format: `SUNO_API_KEY=sk-...`
3. Rebuild: `npm run build`

## 📚 Next Steps

- Read the full [README.md](./README.md) for all features
- Check available models with `list_models` tool
- Monitor your credits with `get_credits` tool
- Explore audio processing with `generate_stems` tool

## 🔗 Resources

- **Suno API Docs**: https://docs.sunoapi.org
- **FastMCP Docs**: https://gofastmcp.com
- **Get API Key**: https://sunoapi.org/api-key
- **MCP Protocol**: https://modelcontextprotocol.io

## 💬 Need Help?

If you encounter issues:
1. Check the logs with `LOG_LEVEL=debug npm start`
2. Review the full README.md documentation
3. Verify API key has credits
4. Test the server independently with `npm run dev`

---

**Happy Music Making! 🎶**
