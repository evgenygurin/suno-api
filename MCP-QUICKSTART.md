# MCP Quick Start Guide ⚡

**5-minute setup for Model Context Protocol integrations**

## 📦 What You Get

- 📚 **Context7**: Up-to-date docs for any library
- 🐙 **GitHub MCP**: Full GitHub integration (repos, PRs, CI/CD)
- 🤖 **Codegen.com**: AI-powered code review and generation  
- 🧠 **R2R Agent**: RAG with knowledge graph and memory
- 🔍 **Tavily**: Web search and content extraction

---

## 🚀 Setup in 3 Steps

### 1️⃣ Get API Keys (2 minutes)

```bash
# GitHub PAT (required scopes: repo, workflow, read:org, read:user)
https://github.com/settings/tokens

# Codegen.com (sign up first)
https://codegen.com/settings/api-keys

# Gemini API (for R2R Agent)
https://aistudio.google.com/app/apikey

# Optional: Context7 (higher rate limits)
https://context7.com

# Optional: Tavily (web search)
https://tavily.com
```

### 2️⃣ Configure Environment (1 minute)

```bash
# Copy template
cp .env.example .env

# Edit .env and add your keys:
nano .env
```

**Minimum required:**
```bash
GITHUB_MCP_PAT=ghp_your_token
CODEGEN_API_KEY=your_codegen_key
CODEGEN_ORG_ID=your_org_id
CODEGEN_REPO_ID=your_repo_id
GEMINI_API_KEY=your_gemini_key
```

### 3️⃣ Verify Setup (1 minute)

```bash
# Install dependencies
npm install

# Setup R2R Agent
cd r2r-mcp-server && ./setup.sh && cd ..

# Test MCP configuration
cat .mcp.json  # Should show all configured servers
```

---

## 💻 IDE Setup

### Claude Code (Recommended) ✅

**Already configured!** Just verify:

```bash
claude mcp list
# Should show: context7, github, codegen-remote, r2r-agent, tavily
```

**Usage:**
```bash
claude "use context7 to find Next.js 14 streaming examples"
claude "create a GitHub issue for implementing rate limiting"
claude "use the r2r agent to search_documentation('CAPTCHA solving')"
```

### Cursor

**Already configured!** Cursor automatically detects `.mcp.json`.

**Usage in chat:**
```
use context7 to search for Playwright best practices
create a GitHub issue titled "Fix timeout bug"
```

### VS Code with Cline / Windsurf / JetBrains

Copy `.mcp.json` to IDE-specific location. See [MCP-SETUP.md](./MCP-SETUP.md#ide-specific-setup) for details.

---

## 📝 Quick Usage Examples

### Search Documentation
```
use context7 to find TypeScript decorators examples
```

### GitHub Operations
```
List all open PRs
Create an issue "Add rate limiting" with label "enhancement"
Trigger the CI workflow
Show logs for the latest failed workflow run
```

### Code Analysis with Codegen
```
Review this pull request
Suggest improvements for the error handling in this file
Generate tests for the authentication module
```

### R2R Agent (Codebase Intelligence)
```
search_documentation("How does CAPTCHA solving work?")
debug_with_rag("TimeoutError in browser.ts line 45")
get_implementation_help({ feature_description: "Add caching to API" })
store_experience({ task: "Fixed rate limit", outcome: "success" })
```

---

## 🔧 GitHub Actions Setup (Optional)

**For automated PR reviews:**

1. Go to repo Settings → Secrets → Actions
2. Add these secrets:
   - `CODEGEN_ORG_ID`
   - `CODEGEN_API_TOKEN`

**That's it!** CI will now automatically review all PRs.

---

## ❓ Troubleshooting

### "MCP server not found"
```bash
# Reinstall dependencies
rm -rf node_modules && npm install
```

### "Authentication failed"
```bash
# Verify keys are in .env
cat .env | grep -E "GITHUB_MCP_PAT|CODEGEN_API_KEY|GEMINI_API_KEY"

# Make sure .env is not in .gitignore (it should be!)
cat .gitignore | grep ".env"
```

### R2R Agent not working
```bash
cd r2r-mcp-server
npm run dev  # Start R2R server
npm run ingest  # Index documentation
npm run cli search "test"  # Test the agent
```

---

## 📚 Next Steps

- **Full documentation:** [MCP-SETUP.md](./MCP-SETUP.md)
- **R2R Agent guide:** [r2r-mcp-server/README.md](./r2r-mcp-server/README.md)
- **Project guidelines:** [CLAUDE.md](./CLAUDE.md)

---

## 🎯 Best Practices

✅ **DO:**
- Use Context7 for library docs (faster than web search)
- Use R2R Agent for project-specific questions
- Store successful patterns in R2R memory
- Review Codegen feedback on PRs

❌ **DON'T:**
- Commit `.env` or secrets
- Use generic queries (be specific!)
- Skip R2R Agent for debugging (it has context!)

---

**🚀 You're all set!** Start using MCP tools in your IDE now.

**Questions?** Open an issue or check [MCP-SETUP.md](./MCP-SETUP.md).
