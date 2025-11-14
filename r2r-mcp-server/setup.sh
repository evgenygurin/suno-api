#!/bin/bash
# Quick setup script for R2R MCP Agent

set -e

echo "🚀 R2R MCP Agent Setup"
echo "====================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Check .env
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    echo "   nano .env"
    echo ""
    read -p "Press Enter when you've configured .env..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start R2R with Docker
echo "🐳 Starting R2R with Docker Compose..."
docker-compose up -d

# Wait for R2R to be ready
echo "⏳ Waiting for R2R to be ready..."
for i in {1..30}; do
    if curl -sf http://localhost:7272/v2/health > /dev/null 2>&1; then
        echo "✅ R2R is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ R2R failed to start. Check logs: docker-compose logs r2r"
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Health check
echo "🏥 Running health check..."
npm run cli health

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Index your documentation:"
echo "     npm run ingest"
echo ""
echo "  2. Test the agent:"
echo "     npm run cli search 'playwright automation'"
echo "     npm run cli ask 'How does CAPTCHA solving work?'"
echo ""
echo "  3. Start MCP server:"
echo "     npm run dev"
echo ""
echo "  4. Configure Claude Desktop (see README.md for details)"
echo ""
echo "For more information, see README.md"
