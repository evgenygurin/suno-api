#!/bin/bash

# Vercel Deployment Script for Suno API
# This script will help you deploy the project to Vercel

set -e

echo "🚀 Suno API - Vercel Deployment Script"
echo "========================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

echo "✅ Vercel CLI installed"
echo ""

# Login to Vercel
echo "🔐 Logging into Vercel..."
echo "This will open a browser window for authentication."
echo ""
vercel login

echo ""
echo "✅ Logged in to Vercel"
echo ""

# Set environment variable
echo "🔑 Setting up environment variable..."
echo "Please enter your Suno API Key (get it from https://sunoapi.org/api-key):"
read -p "SUNO_API_KEY: " SUNO_API_KEY

if [ -z "$SUNO_API_KEY" ]; then
    echo "❌ Error: API key cannot be empty"
    exit 1
fi

echo "$SUNO_API_KEY" | vercel env add SUNO_API_KEY production

echo ""
echo "✅ Environment variable set"
echo ""

# Deploy to production
echo "🚀 Deploying to Vercel production..."
echo ""
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📚 Next steps:"
echo "1. Visit your Vercel dashboard to see the deployment"
echo "2. Test your API at /api/get_limit"
echo "3. View API docs at /docs"
echo ""
echo "🎉 Happy coding!"
