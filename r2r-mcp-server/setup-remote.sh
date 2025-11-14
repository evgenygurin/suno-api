#!/bin/bash
# Setup for connecting to remote R2R server
# Use this instead of setup.sh when you have R2R deployed elsewhere

set -e

echo "🌐 R2R MCP Agent - Remote Server Setup"
echo "======================================="
echo ""
echo "Connecting to remote R2R at: http://136.119.36.216:7272"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Create .env for remote R2R
echo "📝 Creating .env for remote R2R server..."
cat > .env << 'EOF'
# Remote R2R Server Configuration
R2R_BASE_URL=http://136.119.36.216:7272
R2R_API_KEY=your_r2r_api_key_here

# OpenAI for embeddings (if needed locally)
OPENAI_API_KEY=your_openai_api_key_here

# MCP Server Configuration
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost

# Logging
LOG_LEVEL=info
NODE_ENV=development

# Project paths (for ingestion)
PROJECT_ROOT=../
DOCS_PATH=../
CODE_PATH=../src

# Memory settings
MEMORY_RETENTION_DAYS=90
MAX_MEMORY_ITEMS=10000

# RAG settings
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.7
RAG_CHUNK_SIZE=512
RAG_CHUNK_OVERLAP=50
EOF

echo "✅ .env file created"
echo ""
echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
echo "   - R2R_API_KEY (if your R2R server requires it)"
echo "   - OPENAI_API_KEY (for embeddings)"
echo ""
read -p "Press Enter when you've configured .env (or press Ctrl+C to exit)..."

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Test connection to remote R2R
echo ""
echo "🔌 Testing connection to remote R2R server..."
HEALTH_CHECK=$(curl -sf http://136.119.36.216:7272/v3/health 2>&1)
if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo "✅ Remote R2R server is accessible! (API v3)"
    echo "   Response: $HEALTH_CHECK"
else
    echo "❌ Cannot connect to remote R2R server."
    echo "   Please check:"
    echo "   - Server is running at http://136.119.36.216:7272"
    echo "   - Firewall allows connections"
    echo "   - Network connectivity"
    echo "   Response: $HEALTH_CHECK"
    exit 1
fi
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Health check
echo ""
echo "🏥 Running health check..."
npm run cli health

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Connected to remote R2R: http://136.119.36.216:7272"
echo ""
echo "Next steps:"
echo ""
echo "  1. Index your documentation to remote R2R:"
echo "     npm run ingest"
echo ""
echo "  2. Test the agent:"
echo "     npm run cli search 'playwright automation'"
echo "     npm run cli ask 'How does CAPTCHA solving work?'"
echo ""
echo "  3. Start MCP server:"
echo "     npm run dev"
echo ""
echo "  4. Configure Claude Desktop:"
echo "     Add this server to ~/.claude/claude_desktop_config.json"
echo "     (see README.md for details)"
echo ""
echo "For more information, see README.md"
