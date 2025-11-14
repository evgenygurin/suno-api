# Suno AI FastMCP Server

> **FastMCP server for Suno AI music generation** - Generate music, lyrics, and process audio through the Model Context Protocol (MCP)

A powerful MCP server that exposes Suno AI's music generation capabilities to any MCP-compatible client (Claude Desktop, Cline, etc.). Generate professional-quality music from text descriptions, create custom songs with detailed parameters, generate lyrics, and process audio.

## 🎵 Features

- **🎼 Music Generation**: Create music from simple text prompts
- **🎨 Custom Generation**: Fine-tune music with style, title, and tags
- **✍️ Lyrics Generation**: Generate song lyrics from descriptions
- **🎤 Stem Separation**: Extract vocals and instrumentals
- **⏱️ Timestamped Lyrics**: Get karaoke-ready lyrics with timing
- **📊 Credit Management**: Monitor API usage and quotas
- **🚀 Fast & Type-Safe**: Built with TypeScript and Zod validation
- **🔄 Async Support**: Handle long-running generations efficiently

## 📋 Prerequisites

- **Node.js** 18 or higher
- **Suno API Key** from [sunoapi.org](https://sunoapi.org/api-key)
- **MCP Client** (Claude Desktop, Cline, or any MCP-compatible application)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or navigate to the server directory
cd suno-fastmcp-server

# Install dependencies
npm install

# Build the server
npm run build
```

### 2. Configuration

Create a `.env` file in the server directory:

```bash
# Required
SUNO_API_KEY=your_api_key_here

# Optional
LOG_LEVEL=info
NODE_ENV=production
```

### 3. Test the Server

```bash
# Run in development mode
npm run dev

# Or run the built version
npm start
```

### 4. Configure MCP Client

Add to your MCP client configuration (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "suno-music": {
      "command": "node",
      "args": ["/absolute/path/to/suno-fastmcp-server/dist/index.js"],
      "env": {
        "SUNO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Important**: Use absolute paths! Replace `/absolute/path/to/` with your actual path.

## 🛠️ Available Tools

### Music Generation

#### `generate_music`
Generate music from a text prompt.

**Parameters:**
- `prompt` (string, required): Text description of the music (max 5000 chars)
- `make_instrumental` (boolean, optional): Generate without vocals (default: false)
- `model` (string, optional): Model version - V3_5, V4, V4_5, V4_5PLUS, V5 (default: V3_5)
- `wait_audio` (boolean, optional): Wait for completion (default: false, may take 2-4 minutes)

**Example:**
```typescript
{
  "prompt": "upbeat electronic dance music with synthesizers",
  "make_instrumental": false,
  "model": "V4",
  "wait_audio": false
}
```

#### `generate_custom_music`
Generate music with detailed customization.

**Parameters:**
- `prompt` (string, required): Lyrics or description (max 5000 chars)
- `style` (string, required): Music style/genre (max 1000 chars)
- `title` (string, required): Song title (max 80 chars)
- `make_instrumental` (boolean, optional): Generate without vocals
- `model` (string, optional): Model version
- `wait_audio` (boolean, optional): Wait for completion
- `negative_tags` (string, optional): Styles to avoid

**Example:**
```typescript
{
  "prompt": "Verse 1: Walking down the street...",
  "style": "indie folk, acoustic guitar, male vocals",
  "title": "Summer Days",
  "make_instrumental": false,
  "model": "V4_5",
  "negative_tags": "electronic, heavy metal"
}
```

### Information & Status

#### `get_audio_info`
Get status and details for audio generation tasks.

**Parameters:**
- `task_ids` (array of strings, required): Task IDs from generation

**Example:**
```typescript
{
  "task_ids": ["task_abc123", "task_def456"]
}
```

#### `get_credits`
Check remaining API credits.

**Parameters:** None

### Lyrics Tools

#### `generate_lyrics`
Generate song lyrics from a prompt.

**Parameters:**
- `prompt` (string, required): Theme or topic for lyrics

**Example:**
```typescript
{
  "prompt": "a love song about the ocean at sunset"
}
```

#### `get_timestamped_lyrics`
Get lyrics with timestamps for karaoke.

**Parameters:**
- `song_id` (string, required): Task/song ID from completed generation

### Audio Processing

#### `generate_stems`
Separate vocals and instruments (vocal removal).

**Parameters:**
- `song_id` (string, required): Task/song ID from completed generation

### Utility Tools

#### `list_models`
List available Suno AI models and their capabilities.

**Parameters:** None

#### `get_api_status`
Check API health and configuration.

**Parameters:** None

## 🎯 Usage Examples

### Example 1: Quick Music Generation

```
User: Generate an upbeat pop song about summer
Claude: [Uses generate_music tool]
Result: Task ID returned, use get_audio_info to check status
```

### Example 2: Custom Song with Lyrics

```
User: Create a jazz song called "Midnight Blues" with saxophone
Claude: [Uses generate_custom_music tool]
Parameters:
  - prompt: "Smooth jazz vocals about city nights"
  - style: "jazz, saxophone, slow tempo, female vocals"
  - title: "Midnight Blues"
  - model: "V4_5"
```

### Example 3: Workflow - Generate Lyrics First

```
1. Use generate_lyrics:
   - prompt: "a motivational song about overcoming challenges"

2. Use generate_custom_music with generated lyrics:
   - prompt: [lyrics from step 1]
   - style: "rock, electric guitar, powerful vocals"
   - title: "Rise Up"
```

### Example 4: Check Status and Extract Stems

```
1. Use get_audio_info:
   - task_ids: ["task_abc123"]
   - Check status is "SUCCESS"

2. Use generate_stems:
   - song_id: "task_abc123"
   - Extract vocals and instrumentals
```

## 📚 Model Comparison

| Model | Max Duration | Features |
|-------|-------------|----------|
| **V3_5** | 4 minutes | Balanced, creative diversity |
| **V4** | 4 minutes | Best audio quality, refined structure |
| **V4_5** | 8 minutes | Advanced features, superior blending |
| **V4_5PLUS** | 8 minutes | Richer sound, new creative ways |
| **V5** | 8 minutes | Superior musicality, faster generation |

## 🔍 Understanding Task Flow

Music generation is **asynchronous**:

1. **Start Generation** → Returns task ID immediately
2. **Poll Status** → Use `get_audio_info` to check progress
3. **Get Results** → When status is "SUCCESS", audio URLs are available

**Status Values:**
- `PENDING` - Task queued
- `GENERATING` - Currently generating
- `SUCCESS` - Completed successfully (audio_url available)
- `FAILED` - Generation failed (error_message available)

**Alternative:** Set `wait_audio: true` to automatically wait for completion (2-4 minutes).

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUNO_API_KEY` | Yes | - | API key from sunoapi.org |
| `LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |
| `NODE_ENV` | No | - | Environment (development, production) |

### MCP Client Configuration

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "suno-music": {
      "command": "node",
      "args": ["/Users/username/suno-fastmcp-server/dist/index.js"],
      "env": {
        "SUNO_API_KEY": "sk-..."
      }
    }
  }
}
```

**Cline VSCode Extension** (Settings → MCP Servers):
```json
{
  "suno-music": {
    "command": "node",
    "args": ["/absolute/path/to/suno-fastmcp-server/dist/index.js"],
    "env": {
      "SUNO_API_KEY": "sk-..."
    }
  }
}
```

## 🐛 Troubleshooting

### Server Won't Start

**Problem:** "SUNO_API_KEY environment variable is required"
```bash
# Check .env file exists
cat .env

# Or set environment variable directly
export SUNO_API_KEY=your_key_here
npm start
```

### API Key Invalid

**Problem:** "API key valid: false"
```bash
# Test API key manually
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.sunoapi.org/api/v1/generate/credit

# Get new key from: https://sunoapi.org/api-key
```

### Generation Timeout

**Problem:** Task times out or stays in GENERATING
- **Cause:** API overload or complex generation
- **Solution:**
  - Check status with `get_audio_info` periodically
  - Try simpler prompts or different model
  - Contact Suno API support if persistent

### No Audio URL

**Problem:** Status is SUCCESS but no audio_url
- **Cause:** Audio still processing
- **Solution:** Wait a few more seconds and check again

### MCP Client Can't Find Server

**Problem:** Tools not appearing in client
```bash
# Check server runs independently
npm start

# Check logs for errors
LOG_LEVEL=debug npm start

# Verify absolute paths in client config
# Use pwd to get current directory
pwd
```

## 📖 API Reference

### Response Format

All tools return JSON with this structure:

**Success:**
```json
{
  "success": true,
  "data": { /* tool-specific data */ },
  "message": "Operation description"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### AudioInfo Object

Returned by generation and status tools:

```typescript
{
  id: string;              // Task/audio ID
  title?: string;          // Song title
  image_url?: string;      // Cover art URL
  lyric?: string;          // Lyrics text
  audio_url?: string;      // Audio file URL (when ready)
  video_url?: string;      // Video file URL (when ready)
  created_at: string;      // ISO timestamp
  model_name: string;      // Model used
  status: string;          // GENERATING | SUCCESS | FAILED | PENDING
  duration?: string;       // Audio duration
  tags?: string;           // Style tags
  error_message?: string;  // Error details (if failed)
}
```

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** periodically
4. **Monitor credit usage** to detect abuse
5. **Set appropriate LOG_LEVEL** (info or warn in production)

## 🚢 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t suno-fastmcp .
docker run -e SUNO_API_KEY=your_key suno-fastmcp
```

## 📝 Development

### Project Structure
```
suno-fastmcp-server/
├── src/
│   ├── index.ts          # Main server and tools
│   ├── suno-client.ts    # Suno API client
│   ├── types.ts          # TypeScript types
│   └── logger.ts         # Logging configuration
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env                  # Environment variables (not committed)
└── README.md
```

### Building
```bash
# Type check
npm run type-check

# Build
npm run build

# Development with auto-reload
npm run dev
```

### Testing Tools

Test individual tools using the MCP client or by invoking the server directly.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript best practices
4. Add tests for new features
5. Update documentation
6. Submit a pull request

## 📄 License

LGPL-3.0-or-later - See parent project for full license details.

## 🔗 Links

- **Suno API Documentation**: https://docs.sunoapi.org
- **FastMCP Framework**: https://gofastmcp.com
- **Model Context Protocol**: https://modelcontextprotocol.io
- **Parent Project**: [Suno API GitHub](https://github.com/gcui-art/suno-api)

## 💬 Support

- **Issues**: Report bugs or request features in the parent repository
- **API Support**: Contact [Suno API support](https://sunoapi.org)
- **MCP Protocol**: See [MCP documentation](https://modelcontextprotocol.io)

## ✨ Acknowledgments

Built with:
- [FastMCP](https://gofastmcp.com) - TypeScript MCP framework
- [Suno API](https://sunoapi.org) - Official Suno AI API
- [Zod](https://zod.dev) - TypeScript-first schema validation

---

**Happy Music Making! 🎶**
