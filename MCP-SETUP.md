# MCP (Model Context Protocol) Setup Guide

Complete guide for setting up MCP integrations for Claude Code, Cursor, Codegen.com, and other AI development tools.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Configuration](#detailed-configuration)
  - [Context7 - Documentation](#context7---documentation)
  - [GitHub MCP Server](#github-mcp-server)
  - [Codegen.com Integration](#codegencom-integration)
  - [R2R Agent - RAG Intelligence](#r2r-agent---rag-intelligence)
  - [Tavily - Web Search](#tavily---web-search)
- [IDE-Specific Setup](#ide-specific-setup)
  - [Claude Code (CLI)](#claude-code-cli)
  - [Cursor](#cursor)
  - [VS Code with Cline](#vs-code-with-cline)
  - [Windsurf](#windsurf)
  - [JetBrains IDEs](#jetbrains-ides)
- [GitHub Actions Integration](#github-actions-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🎯 Overview

This project uses **Model Context Protocol (MCP)** to integrate various AI-powered tools and services:

| MCP Server | Purpose | Required |
|------------|---------|----------|
| **Context7** | Up-to-date documentation for any library/framework | ✅ Recommended |
| **GitHub MCP** | Repository management, PR reviews, CI/CD | ✅ Required |
| **Codegen.com** | AI-powered code generation and analysis | ✅ Required |
| **R2R Agent** | RAG with GraphRAG and memory for codebase intelligence | ✅ Recommended |
| **Tavily** | Web search and content extraction | ⚪ Optional |

---

## 🔧 Prerequisites

### Required Software

```bash
# Node.js 18+ (for MCP servers)
node --version  # Should be 18.0.0 or higher

# Docker (for some MCP servers)
docker --version

# Git (for GitHub integration)
git --version
```

### Required API Keys

1. **GitHub Personal Access Token (PAT)**
   - Create at: https://github.com/settings/tokens
   - Required scopes: `repo`, `workflow`, `read:org`, `read:user`

2. **Codegen.com API Key**
   - Sign up at: https://codegen.com
   - Get keys from: https://codegen.com/settings/api-keys

3. **Gemini API Key** (for R2R Agent)
   - Get from: https://aistudio.google.com/app/apikey
   - Used for LLM operations in R2R

4. **Context7 API Key** (Optional - for higher rate limits)
   - Register at: https://context7.com

5. **Tavily API Key** (Optional - for web search)
   - Get from: https://tavily.com

---

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/evgenygurin/suno-api.git
cd suno-api

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Setup R2R Agent
cd r2r-mcp-server
./setup.sh
cd ..
```

### 2. Configure Environment Variables

Edit `.env` and add your API keys:

```bash
# GitHub MCP
GITHUB_MCP_PAT=ghp_your_github_personal_access_token

# Codegen.com
CODEGEN_API_KEY=your_codegen_api_key
CODEGEN_ORG_ID=your_organization_id
CODEGEN_REPO_ID=your_repository_id

# R2R Agent
GEMINI_API_KEY=your_gemini_api_key
R2R_API_URL=http://localhost:7272
R2R_API_KEY=your_r2r_api_key

# Optional
TAVILY_API_KEY=your_tavily_api_key
CONTEXT7_API_KEY=your_context7_api_key  # Optional
```

### 3. Verify MCP Configuration

The `.mcp.json` file is already configured. Verify it exists:

```bash
cat .mcp.json
```

---

## 🛠️ Detailed Configuration

### Context7 - Documentation

**What it does:** Provides up-to-date, version-specific documentation for any library directly in your AI prompts.

**Usage in prompts:**
```
use context7 to search for Next.js App Router examples
```

**Configuration in `.mcp.json`:**
```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp@latest"],
    "description": "Up-to-date documentation for libraries and frameworks"
  }
}
```

**No API key required** for basic usage (rate-limited). For higher limits, add to `.env`:
```bash
CONTEXT7_API_KEY=your_api_key
```

---

### GitHub MCP Server

**What it does:** Full GitHub integration - manage repos, issues, PRs, workflows, and CI/CD.

**Key Features:**
- 🔍 Search and manage repositories
- 📝 Create and update issues/PRs
- 🔄 Trigger and monitor workflows
- 📊 View CI/CD status and logs
- 🏷️ Manage labels, milestones, releases

**Configuration in `.mcp.json`:**
```json
{
  "github": {
    "transport": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${GITHUB_MCP_PAT}"
    },
    "description": "GitHub integration for repository management"
  }
}
```

**Usage examples:**
```
Create a new issue titled "Fix CAPTCHA timeout" with label "bug"
List all open PRs in this repository
Trigger the CI workflow for this branch
Show me the logs for the latest failed workflow run
```

---

### Codegen.com Integration

**What it does:** AI-powered code generation, review, and analysis integrated with your workflow.

**Key Features:**
- 🤖 AI-powered code generation
- 👀 Automated PR reviews
- 🔍 Semantic code search
- 📊 Code quality insights
- 🛠️ Refactoring suggestions

**Configuration in `.mcp.json`:**
```json
{
  "codegen-remote": {
    "transport": "http",
    "url": "https://mcp.codegen.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${CODEGEN_API_KEY}",
      "x-organization-id": "${CODEGEN_ORG_ID}",
      "x-repo-id": "${CODEGEN_REPO_ID}"
    },
    "description": "Codegen.com AI-powered code generation"
  }
}
```

**Get your credentials:**
1. Sign up at https://codegen.com
2. Go to Settings → API Keys
3. Create a new API key
4. Copy your Organization ID and Repository ID

**Usage in GitHub Actions:**
The CI workflow (`.github/workflows/ci.yml`) automatically uses Codegen for PR reviews.

---

### R2R Agent - RAG Intelligence

**What it does:** Retrieval-Augmented Generation with GraphRAG knowledge graph and memory system.

**Key Features:**
- 📚 Semantic search across docs and code
- 🕸️ Knowledge graph of code relationships
- 🧠 Persistent memory of successful patterns
- 🔍 Architecture exploration
- 🐛 Context-aware debugging help

**Configuration in `.mcp.json`:**
```json
{
  "r2r-agent": {
    "command": "npx",
    "args": ["--yes", "--prefix", "./r2r-mcp-server", "tsx", "./r2r-mcp-server/src/index.ts"],
    "env": {
      "R2R_API_URL": "${R2R_API_URL}",
      "R2R_API_KEY": "${R2R_API_KEY}",
      "GEMINI_API_KEY": "${GEMINI_API_KEY}"
    },
    "description": "R2R RAG Agent with GraphRAG and memory"
  }
}
```

**Available MCP Tools (16 instruments):**

#### Search & Documentation (7 tools)
- `search_documentation` - Semantic search across docs and code
- `search_code_examples` - Find code examples and patterns
- `find_test_examples` - Locate relevant tests
- `ask_documentation` - Ask questions with AI-generated answers
- `get_implementation_help` - Get help implementing features
- `debug_with_rag` - Debug assistance with context
- `explain_architecture` - Explain architectural aspects

#### Experience Memory (4 tools)
- `store_experience` - Save successful solutions and patterns
- `retrieve_similar_experiences` - Find similar past situations
- `reflect_on_patterns` - Analyze accumulated patterns
- `get_memory_stats` - View memory statistics

#### Knowledge Graph (5 tools)
- `query_code_relationships` - Explore code connections
- `find_dependencies` - Find module dependencies
- `find_usages` - Find where code is used
- `find_test_coverage` - Check test coverage
- `explore_architecture_graph` - Explore overall architecture

**Usage examples:**
```
search_documentation("How does CAPTCHA solving work?")
ask_documentation("What are best practices for error handling in this project?")
debug_with_rag("TimeoutError in browser.ts line 45")
store_experience({ task: "Fixed rate limiting", outcome: "success", learned_pattern: "Use exponential backoff" })
query_code_relationships("src/lib/captcha.ts")
```

**Setup:**
```bash
cd r2r-mcp-server
./setup.sh  # Installs dependencies and configures R2R
npm run ingest  # Index the documentation
npm run cli search "CAPTCHA"  # Test the agent
```

See `r2r-mcp-server/README.md` and `R2R-AGENT-SUMMARY.md` for complete documentation.

---

### Tavily - Web Search

**What it does:** Real-time web search and content extraction for up-to-date information.

**Configuration in `.mcp.json`:**
```json
{
  "tavily": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-tavily@latest"],
    "env": {
      "TAVILY_API_KEY": "${TAVILY_API_KEY}"
    },
    "description": "Web search and content extraction"
  }
}
```

**Usage:**
```
Search the web for "Next.js 14 streaming best practices"
```

---

## 💻 IDE-Specific Setup

### Claude Code (CLI)

The most straightforward setup - uses `.mcp.json` automatically.

```bash
# Verify Claude Code is installed
claude --version

# List configured MCP servers
claude mcp list

# Test MCP connection
claude mcp get context7

# Use in a conversation
claude "use context7 to find Next.js streaming examples"
```

**Adding servers manually:**
```bash
# Add GitHub MCP (using HTTP)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer $GITHUB_MCP_PAT"

# Add Context7
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

---

### Cursor

**Location:** `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project)

**Setup:**
```bash
# Copy project configuration
cp .mcp.json ~/.cursor/mcp.json

# Or use project-local (recommended)
# Cursor will automatically detect .mcp.json in project root
```

**Configuration format:**
```json
{
  "mcpServers": {
    "github": {
      "transport": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_PAT"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

**Usage in Cursor:**
- Open Command Palette (`Cmd/Ctrl + Shift + P`)
- Type "use context7" in chat
- MCP tools are automatically available

---

### VS Code with Cline

**Location:** `.vscode/settings.json` or User Settings

**Configuration:**
```json
{
  "cline.mcpServers": {
    "github": {
      "transport": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_MCP_PAT}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "codegen-remote": {
      "transport": "http",
      "url": "https://mcp.codegen.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${CODEGEN_API_KEY}",
        "x-organization-id": "${CODEGEN_ORG_ID}",
        "x-repo-id": "${CODEGEN_REPO_ID}"
      }
    }
  }
}
```

---

### Windsurf

**Location:** Settings → MCP Servers → Add New Server

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "serverUrl": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_PAT"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

**Note:** Windsurf only supports global scope, not per-project configuration.

---

### JetBrains IDEs

**Location:** Settings → MCP Servers

**Configuration file:** `.idea/mcp.json` (created by IDE)

```json
{
  "servers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    }
  }
}
```

---

## 🔄 GitHub Actions Integration

The project includes automated Codegen PR reviews via GitHub Actions.

### Workflow: `.github/workflows/ci.yml`

**What it does:**
1. **test** - Runs linting and build
2. **codegen-review** - AI-powered PR review (only on PRs)
3. **deploy** - Deploys to Vercel (only on main branch)

### Required GitHub Secrets

Go to repository Settings → Secrets and variables → Actions, and add:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `CODEGEN_ORG_ID` | Your Codegen organization ID | https://codegen.com/settings |
| `CODEGEN_API_TOKEN` | Codegen API token | https://codegen.com/settings/api-keys |
| `VERCEL_TOKEN` | Vercel deployment token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Project settings |
| `VERCEL_PROJECT_ID` | Vercel project ID | Project settings |

### Manual Workflow Trigger

```bash
# Trigger workflow via gh CLI
gh workflow run ci.yml

# Or via GitHub web interface
# Actions → CI/CD with Codegen → Run workflow
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "MCP server not found"

**Solution:**
```bash
# Verify MCP configuration
cat .mcp.json

# Check if npx can access MCP servers
npx -y @upstash/context7-mcp@latest --help

# Reinstall Node modules
rm -rf node_modules package-lock.json
npm install
```

#### 2. "Authentication failed" for GitHub MCP

**Solution:**
```bash
# Verify PAT has correct scopes
gh auth status

# Regenerate PAT with required scopes:
# repo, workflow, read:org, read:user

# Update .env file
echo "GITHUB_MCP_PAT=ghp_new_token" >> .env
```

#### 3. R2R Agent not responding

**Solution:**
```bash
# Check R2R server is running
cd r2r-mcp-server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:7272/health

# Re-index documentation if needed
npm run ingest
```

#### 4. Codegen API errors

**Solution:**
```bash
# Verify credentials
echo $CODEGEN_API_KEY
echo $CODEGEN_ORG_ID
echo $CODEGEN_REPO_ID

# Test API connection
curl -H "Authorization: Bearer $CODEGEN_API_KEY" \
     -H "x-organization-id: $CODEGEN_ORG_ID" \
     https://api.codegen.com/v1/status
```

### Enable Debug Logging

For Claude Code:
```bash
# Set debug environment variables
export CLAUDE_DEBUG=1
export MCP_DEBUG=1

# Run with verbose logging
claude --verbose "test MCP connection"
```

For R2R Agent:
```bash
# Edit r2r-mcp-server/r2r.toml
[logging]
level = "debug"  # Change from "info" to "debug"
```

---

## ✅ Best Practices

### 1. **Security**

- ✅ **Never commit `.env` or `.mcp.json.local`**
- ✅ Use environment variables for all secrets
- ✅ Use GitHub Secrets for CI/CD credentials
- ✅ Rotate API keys regularly
- ✅ Use least-privilege access (minimal required scopes)

### 2. **MCP Usage Patterns**

**When to use Context7:**
```
❌ BAD:  "What is Next.js?"
✅ GOOD: "use context7 to find Next.js 14 App Router streaming examples"
```

**When to use R2R Agent:**
```
❌ BAD:  "How do I write TypeScript?"
✅ GOOD: "search_documentation('How does CAPTCHA solving work in this project?')"
✅ GOOD: "debug_with_rag('TimeoutError in browser.ts line 45')"
```

**When to use GitHub MCP:**
```
❌ BAD:  "Create a TODO list"
✅ GOOD: "Create a GitHub issue for implementing rate limiting"
✅ GOOD: "Trigger the CI workflow for the current branch"
```

### 3. **R2R Agent Workflow**

**Recommended workflow for new features:**

1. **Search** for similar patterns:
   ```
   search_code_examples("API endpoint with rate limiting")
   ```

2. **Get implementation help**:
   ```
   get_implementation_help({
     feature_description: "Add rate limiting to /api/generate",
     context: { file_path: "src/app/api/generate/route.ts" }
   })
   ```

3. **Check dependencies**:
   ```
   find_dependencies("src/app/api/generate/route.ts")
   ```

4. **Implement** the feature

5. **Store experience**:
   ```
   store_experience({
     context: { task: "Added rate limiting to API" },
     action_taken: "Used upstash/ratelimit with Redis",
     outcome: "success",
     learned_pattern: "Rate limiting prevents abuse",
     tags: ["rate-limit", "api", "security"]
   })
   ```

### 4. **Performance Tips**

- 🚀 **Use Context7** for library docs instead of web search (faster, more accurate)
- 🚀 **Use R2R Agent** for project-specific knowledge (codebase-aware)
- 🚀 **Cache frequently used prompts** in R2R's memory
- 🚀 **Enable notification debouncing** in MCP servers to reduce network overhead

### 5. **Team Collaboration**

- 📝 Document custom MCP tool usage in PR descriptions
- 📝 Share successful patterns via R2R's `store_experience`
- 📝 Create team-specific prompts for common tasks
- 📝 Review Codegen feedback as part of PR review process

---

## 📚 Additional Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Context7 Documentation](https://context7.com/docs)
- [GitHub MCP Server Docs](https://github.com/github/github-mcp-server)
- [Codegen.com Documentation](https://docs.codegen.com)
- [R2R Agent Documentation](./r2r-mcp-server/README.md)
- [R2R Agent Quick Start](./r2r-mcp-server/QUICKSTART.md)
- [Project Guidelines for Claude](./CLAUDE.md)

---

## 🤝 Contributing

When contributing to this project:

1. ✅ Use MCP tools for research and implementation
2. ✅ Run Codegen review before submitting PRs
3. ✅ Store successful patterns in R2R memory
4. ✅ Update this documentation if adding new MCP servers
5. ✅ Test all MCP integrations before pushing

---

## 📄 License

This MCP configuration is part of the Suno API project (LGPL-3.0-or-later).

---

**Questions?** Open an issue or ask the R2R Agent:
```
ask_documentation("How do I configure [specific MCP feature]?")
```
