# Suno API - Agent Guidelines

## Project Overview

Suno API is an open-source TypeScript/Next.js project that provides an unofficial API wrapper for Suno.ai's music generation service. The project uses Playwright for browser automation and 2Captcha for solving hCaptcha challenges.

**Key Technologies:**
- Next.js 14.1.4 (App Router)
- TypeScript
- Playwright (with rebrowser-patches)
- React 18
- Tailwind CSS
- Pino (logging)
- Swagger/OpenAPI

## Quick Start Commands

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Setup
Required environment variables in `.env`:
```bash
SUNO_COOKIE=<your_suno_cookie>
TWOCAPTCHA_KEY=<your_2captcha_api_key>
BROWSER=chromium  # or firefox
BROWSER_GHOST_CURSOR=false
BROWSER_LOCALE=en
BROWSER_HEADLESS=true
```

## Project Structure

```
suno-api/
├── src/
│   ├── app/           # Next.js App Router pages and API routes
│   └── lib/           # Utility functions and shared code
├── public/            # Static assets
├── .env.example       # Environment variable template
└── package.json       # Dependencies and scripts
```

## Code Style & Conventions

### TypeScript
- **Strict mode enabled**: Always use proper typing
- Avoid `any` type - use `unknown` or proper interfaces
- Use TypeScript interfaces for API responses and requests
- Prefer functional components with hooks in React

### File Naming
- API routes: lowercase with underscores (e.g., `get_limit.ts`, `custom_generate.ts`)
- Components: PascalCase (e.g., `MusicPlayer.tsx`)
- Utilities: camelCase (e.g., `apiHelpers.ts`)

### Code Organization
- Keep API route handlers in `src/app/api/`
- Place shared utilities in `src/lib/`
- Use Next.js App Router conventions (not Pages Router)

### Logging
- Use Pino logger for all logging
- Log levels: `error`, `warn`, `info`, `debug`
- Include context in logs (request IDs, user info, etc.)

### Error Handling
- Always catch and handle errors gracefully
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors with full context

## API Development Guidelines

### API Routes
All API routes follow the pattern: `/api/<endpoint>`

**Main Endpoints:**
- `/api/generate` - Generate music from prompt
- `/api/custom_generate` - Custom music generation (lyrics, style, title)
- `/api/generate_lyrics` - Generate lyrics from prompt
- `/api/get` - Get music information by ID(s)
- `/api/get_limit` - Get account quota information
- `/api/extend_audio` - Extend audio length
- `/api/generate_stems` - Separate audio and music tracks
- `/api/get_aligned_lyrics` - Get lyrics timestamps
- `/api/clip` - Get clip information
- `/api/concat` - Generate full song from extensions
- `/v1/chat/completions` - OpenAI-compatible endpoint

### Request/Response Format
- Use JSON for all requests and responses
- Support optional `Cookie` header to override default cookie
- Return consistent error format:
```typescript
{
  error: string;
  message: string;
  status: number;
}
```

### Authentication
- Cookie-based authentication with Suno.ai
- Support per-request cookie override via headers
- Handle cookie refresh and expiration

## Browser Automation (Playwright)

### Guidelines
- Use rebrowser-playwright-core for anti-detection
- Support both Chromium and Firefox browsers
- Handle hCaptcha solving via 2Captcha
- Implement proper error handling and retries
- Use ghost-cursor for human-like mouse movements (optional)
- Set appropriate browser locale and headless mode

### CAPTCHA Handling
- Automatically solve hCaptcha using 2Captcha service
- Retry on CAPTCHA failure with exponential backoff
- Log all CAPTCHA attempts for debugging
- Minimize CAPTCHA triggers (use macOS when possible)

## Testing

### Manual Testing
1. Test all API endpoints after changes
2. Verify CAPTCHA solving works correctly
3. Test with both valid and invalid cookies
4. Check error handling and edge cases
5. Test quota limits and rate limiting

### API Testing
- Use `curl`, Postman, or similar tools
- Test endpoint: `GET /api/get_limit`
- Expected response: JSON with credits and limits

## Security Considerations

### Critical Security Rules
- **NEVER commit** `.env` file or expose API keys
- **NEVER log** sensitive data (cookies, API keys, user data)
- Sanitize all user inputs to prevent injection attacks
- Use environment variables for all secrets
- Validate and sanitize all API inputs
- Implement rate limiting to prevent abuse

### Environment Variables
- Use `.env.example` as template
- Add new secrets to `.env.example` (with placeholder values)
- Document all environment variables in README

## Docker Support

### Docker Commands
```bash
# Build and run with Docker Compose
docker compose build && docker compose up
```

### Docker Notes
- GPU acceleration is disabled in Docker
- Use local deployment for better performance with slow CPUs
- Playwright browsers are included in the Docker image

## Deployment

### Vercel Deployment
- One-click deploy via Vercel button in README
- Configure environment variables in Vercel dashboard
- Test deployed API via `https://<domain>/api/get_limit`

### Local Deployment
- Clone repository
- Install dependencies with `npm install`
- Configure `.env` file
- Run `npm run dev` for development
- Run `npm run build && npm start` for production

## Documentation

### Swagger/OpenAPI
- API documentation available at `/docs` endpoint
- Auto-generated from code using next-swagger-doc
- Keep OpenAPI specs up to date with API changes

### README Maintenance
- Keep README.md synchronized with changes
- Update API examples when endpoints change
- Document all new features and breaking changes
- Maintain translations (EN, CN, RU)

## Common Tasks

### Adding New API Endpoint
1. Create new route file in `src/app/api/<endpoint>/route.ts`
2. Implement handler with proper typing
3. Add error handling and logging
4. Update Swagger documentation
5. Test endpoint manually
6. Update README with new endpoint

### Updating Dependencies
1. Check for security vulnerabilities: `npm audit`
2. Update packages: `npm update`
3. Test all functionality after updates
4. Update package-lock.json
5. Document breaking changes

### Debugging
- Enable verbose logging by setting appropriate log level
- Check browser console for client-side errors
- Use Playwright inspector for browser automation issues
- Monitor 2Captcha balance and solving success rate
- Check Suno.ai cookie validity

## Git Workflow

### Commit Messages
Use conventional commits format:
```
feat(api): add new endpoint for lyrics generation
fix(captcha): improve error handling for failed solves
docs(readme): update API examples
chore(deps): update playwright to latest version
```

### Branch Strategy
- `main` - production-ready code
- `feat/<feature-name>` - new features
- `fix/<bug-name>` - bug fixes
- `docs/<doc-update>` - documentation updates

### Pull Requests
- Link related issues
- Provide clear description of changes
- Include testing steps
- Update documentation if needed
- Ensure all checks pass before merging

## Performance Optimization

### Best Practices
- Use Next.js App Router for optimal performance
- Implement proper caching strategies
- Optimize image assets
- Minimize API response sizes
- Use streaming responses for large data
- Monitor and log API response times

### Monitoring
- Log all API requests with timing
- Track CAPTCHA solving success rate
- Monitor 2Captcha API balance
- Track Suno.ai rate limits

## Known Issues & Limitations

### CAPTCHA Rate
- Windows and Linux may receive more CAPTCHAs than macOS
- Use macOS for minimal CAPTCHA challenges
- Monitor 2Captcha costs carefully

### Rate Limits
- Suno.ai has daily/monthly usage limits
- Free accounts have lower limits
- Implement proper rate limiting on your API

### Browser Automation
- GPU acceleration disabled in Docker
- Headless mode may trigger more CAPTCHAs
- Some browsers may be detected as automation

## Support & Resources

- **Documentation**: https://suno.gcui.ai/docs
- **Demo**: https://suno.gcui.ai
- **Issues**: https://github.com/gcui-art/suno-api/issues
- **2Captcha Docs**: https://2captcha.com/2captcha-api
- **Playwright Docs**: https://playwright.dev

## License

LGPL-3.0-or-later - See LICENSE file for details

---

**Important Notes for AI Agents:**
- This project uses Playwright for browser automation - be careful with timing and async operations
- Always test CAPTCHA solving functionality after browser automation changes
- Respect rate limits to avoid account suspension
- Keep 2Captcha API key secure and monitor balance
- Test all API changes with real Suno.ai account before deploying
