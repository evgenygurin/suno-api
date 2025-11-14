<div align="center">
  <h1 align="center">
      Suno AI API Client
  </h1>
  <p>Simple Node.js/TypeScript client for Suno API - Generate AI music easily and integrate it into your applications</p>
  <p>👉 Version 2.0 - Now using official Suno API from sunoapi.org</p>
</div>

<p align="center">
  <a target="_blank" href="./README.md">English</a> 
  | <a target="_blank" href="./README_CN.md">简体中文</a> 
  | <a target="_blank" href="./README_RU.md">русский</a> 
  | <a target="_blank" href="https://docs.sunoapi.org">API Docs</a>
</p>

![suno-api banner](https://github.com/gcui-art/suno-api/blob/main/public/suno-banner.png)

## 🎉 What's New in V2.0

**Major Update**: This project has been migrated to use the official Suno API from [sunoapi.org](https://sunoapi.org)!

### Key Changes

✅ **No More Cookie Management** - Uses API key authentication instead of cookies  
✅ **No CAPTCHA Solving** - No need for 2Captcha service  
✅ **No Browser Automation** - Removed Playwright and related dependencies  
✅ **Simpler Setup** - Just get your API key and start generating music  
✅ **More Stable** - Official API with better reliability  
✅ **Better Documentation** - Complete API docs at [docs.sunoapi.org](https://docs.sunoapi.org)

## Introduction

This is a Node.js/TypeScript client that wraps the official Suno API to make AI music generation simple and accessible. Perfect for integrating into chatbots, AI agents, or any application that needs AI-generated music.

## Features

- 🎵 **Music Generation** - Generate complete songs from text descriptions
- 🎤 **Lyrics Generation** - AI-powered lyrics creation  
- 🎼 **Custom Mode** - Fine control over style, title, and parameters
- 🔧 **Audio Processing** - Extend music, separate vocals, convert formats
- 🤖 **Easy Integration** - Simple API compatible with OpenAI format
- 📚 **TypeScript Support** - Full type definitions included

## Getting Started

### 1. Get Your API Key

1. Visit [sunoapi.org/api-key](https://sunoapi.org/api-key)
2. Sign up and get your API key
3. Add credits to your account

### 2. Installation

```bash
git clone https://github.com/gcui-art/suno-api.git
cd suno-api
npm install
```

### 3. Configure Environment

Create a `.env` file:

```bash
SUNO_API_KEY=your_api_key_here
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgcui-art%2Fsuno-api&env=SUNO_API_KEY&project-name=suno-api&repository-name=suno-api)

Add `SUNO_API_KEY` environment variable in Vercel dashboard.

### Docker

```bash
docker compose build && docker compose up
```

Make sure to set `SUNO_API_KEY` in your environment or `.env` file.

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate music from text prompt |
| `/api/custom_generate` | POST | Generate music with custom parameters |
| `/api/generate_lyrics` | POST | Generate lyrics from prompt |
| `/api/get` | GET | Get music information by IDs |
| `/api/get_limit` | GET | Get remaining credits |
| `/api/extend_audio` | POST | Extend audio length |
| `/api/generate_stems` | POST | Separate vocals/instruments |
| `/api/get_aligned_lyrics` | GET | Get timestamped lyrics |
| `/v1/chat/completions` | POST | OpenAI-compatible endpoint |

For complete API documentation, visit [docs.sunoapi.org](https://docs.sunoapi.org)

## Authentication

All requests require authentication via API key:

```bash
# Using Authorization header (recommended)
curl -X POST "http://localhost:3000/api/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A peaceful piano melody", "make_instrumental": false}'

# Or using environment variable SUNO_API_KEY
```

## Usage Examples

### Python

```python
import requests

base_url = 'http://localhost:3000'
headers = {'Authorization': 'Bearer YOUR_API_KEY'}

# Generate music
response = requests.post(
    f"{base_url}/api/generate",
    json={
        "prompt": "A relaxing jazz tune with smooth saxophone",
        "make_instrumental": False,
        "wait_audio": True
    },
    headers=headers
)

result = response.json()
print(f"Audio URL: {result[0]['audio_url']}")
```

### JavaScript

```javascript
const baseUrl = 'http://localhost:3000';
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};

// Generate music
const response = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    prompt: 'A relaxing jazz tune with smooth saxophone',
    make_instrumental: false,
    wait_audio: true
  })
});

const result = await response.json();
console.log('Audio URL:', result[0].audio_url);
```

### cURL

```bash
# Generate music
curl -X POST "http://localhost:3000/api/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A relaxing jazz tune with smooth saxophone",
    "make_instrumental": false,
    "wait_audio": true
  }'

# Check remaining credits
curl -X GET "http://localhost:3000/api/get_limit" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Model Versions

Choose from multiple model versions:

- **V3_5** (`chirp-v3-5`) - Balanced, creative diversity, up to 4 minutes
- **V4** (`chirp-v4`) - Best audio quality, refined structure, up to 4 minutes  
- **V4_5** (`chirp-v4-5`) - Advanced features, superior blending, up to 8 minutes
- **V4_5PLUS** (`chirp-v4-5-plus`) - Richer sound, new creative ways, up to 8 minutes
- **V5** (`chirp-v5`) - Superior musicality, faster generation, up to 8 minutes

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUNO_API_KEY` | Your Suno API key from sunoapi.org | Yes |

## API Response Format

### Success Response

```json
{
  "id": "task_abc123",
  "title": "Generated Song",
  "audio_url": "https://example.com/audio.mp3",
  "image_url": "https://example.com/cover.jpg",
  "lyric": "Song lyrics...",
  "tags": "jazz, relaxing",
  "status": "complete",
  "model_name": "V4",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

## Migrating from V1.x

If you're upgrading from version 1.x, here are the main changes:

1. **Environment Variables**:
   - Remove: `SUNO_COOKIE`, `TWOCAPTCHA_KEY`, `BROWSER_*` variables
   - Add: `SUNO_API_KEY`

2. **Dependencies**:
   - No longer need: `@2captcha/captcha-solver`, `rebrowser-playwright-core`, `ghost-cursor-playwright`
   - Cleaner `package.json` with fewer dependencies

3. **API Behavior**:
   - Responses now include task IDs instead of direct audio URLs when `wait_audio` is false
   - Use task IDs with `/api/get` endpoint to check status and get audio URLs
   - Some endpoints may have slightly different response formats

4. **Removed Features**:
   - Concatenation endpoint (`/api/concat`) - Not supported in new API
   - Cookie-based authentication - Now uses API keys
   - CAPTCHA solving - No longer needed

## Limitations

- **Audio Extension**: The `/api/extend_audio` endpoint requires audio file upload via the new API's upload endpoints
- **Persona Pagination**: Use `personaId` parameter during generation instead of separate pagination endpoint
- **Getting All Music**: The `/api/get` endpoint now requires specific task IDs

## Contributing

We welcome contributions! Here are ways you can help:

1. 🐛 **Report Bugs** - Open an issue describing the problem
2. 💡 **Suggest Features** - Share your ideas for improvements
3. 🔧 **Submit PRs** - Help fix bugs or add features
4. 📖 **Improve Docs** - Help translate or enhance documentation
5. ⭐ **Star the Repo** - Show your support!

## Credits & Pricing

Music generation consumes credits from your Suno API account. Check your balance:

```bash
GET /api/get_limit
```

Purchase additional credits at [sunoapi.org](https://sunoapi.org)

## License

This project is licensed under LGPL-3.0-or-later. See [LICENSE](LICENSE) for details.

## Links

- **API Documentation**: [docs.sunoapi.org](https://docs.sunoapi.org)
- **Get API Key**: [sunoapi.org/api-key](https://sunoapi.org/api-key)
- **Official Suno**: [suno.ai](https://suno.ai)
- **Project Repository**: [github.com/gcui-art/suno-api](https://github.com/gcui-art/suno-api)

## Disclaimer

This is an unofficial client for the Suno API service. This project is not affiliated with or endorsed by Suno AI. Use responsibly and in accordance with Suno's terms of service.

## Support

- 📧 **Issues**: [GitHub Issues](https://github.com/gcui-art/suno-api/issues)
- 📚 **Documentation**: [docs.sunoapi.org](https://docs.sunoapi.org)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/gcui-art/suno-api/discussions)

---

Made with ❤️ by [gcui.ai](https://github.com/gcui-art)
