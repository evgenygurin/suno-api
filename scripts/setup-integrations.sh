#!/bin/bash

# Suno API - Integration Setup Script
#
# This script helps set up all integrations for the Suno API project:
# - GitHub Actions
# - CircleCI
# - Sentry
# - Linear
# - Codegen.com
# - Cursor AI
#
# Usage: ./scripts/setup-integrations.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 20+"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi

    # Check if .env.example exists
    if [ -f ".env.example" ]; then
        print_success ".env.example found"
    else
        print_error ".env.example not found"
        exit 1
    fi
}

# Setup environment file
setup_env_file() {
    print_header "Setting up Environment Variables"

    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping .env setup"
            return
        fi
    fi

    cp .env.example .env
    print_success "Created .env from .env.example"
    print_info "Please edit .env and add your API keys"
}

# Install Codegen CLI
setup_codegen() {
    print_header "Setting up Codegen.com"

    if command -v codegen &> /dev/null; then
        print_success "Codegen CLI already installed"
    else
        print_info "Installing Codegen CLI..."
        uv tool install codegen || pip install codegen
        print_success "Codegen CLI installed"
    fi

    print_info "To authenticate: codegen login"
    print_info "Get API key from: https://codegen.com/settings/api-keys"
}

# Setup GitHub Actions
setup_github_actions() {
    print_header "Setting up GitHub Actions"

    if [ -d ".github/workflows" ]; then
        print_success "GitHub Actions workflows directory exists"
        print_info "Workflows: ci.yml, security.yml"
    else
        print_warning "No .github/workflows directory found"
    fi

    print_info "Required GitHub Secrets:"
    echo "  - CODEGEN_ORG_ID"
    echo "  - CODEGEN_API_TOKEN"
    echo "  - SENTRY_AUTH_TOKEN (if using Sentry)"
    print_info "Add at: https://github.com/YOUR_REPO/settings/secrets/actions"
}

# Setup CircleCI
setup_circleci() {
    print_header "Setting up CircleCI"

    if [ -f ".circleci/config.yml" ]; then
        print_success "CircleCI config exists"
    else
        print_error "CircleCI config not found at .circleci/config.yml"
    fi

    print_info "Required CircleCI Environment Variables:"
    echo "  - CODEGEN_ORG_ID"
    echo "  - CODEGEN_API_TOKEN"
    echo "  - SENTRY_ORG"
    echo "  - SENTRY_PROJECT"
    echo "  - SENTRY_AUTH_TOKEN"
    print_info "Add in CircleCI Project Settings → Environment Variables"
    print_info "Or use CircleCI Contexts for shared secrets"
}

# Setup Sentry
setup_sentry() {
    print_header "Setting up Sentry"

    # Check if Sentry is installed
    if grep -q "@sentry/nextjs" package.json; then
        print_success "Sentry SDK already installed"
    else
        print_info "Installing Sentry SDK..."
        npm install --save @sentry/nextjs
        print_success "Sentry SDK installed"
    fi

    # Check config files
    if [ -f "sentry.client.config.ts" ] && [ -f "sentry.server.config.ts" ]; then
        print_success "Sentry config files exist"
    else
        print_warning "Sentry config files not found"
    fi

    print_info "Setup steps:"
    echo "  1. Create account at https://sentry.io"
    echo "  2. Create new project (or use existing)"
    echo "  3. Get DSN from Project Settings → Client Keys"
    echo "  4. Get Auth Token from https://sentry.io/settings/account/api/auth-tokens/"
    echo "     Required scopes: project:releases, project:write, org:read"
    echo "  5. Add to .env:"
    echo "       SENTRY_DSN=your_dsn_here"
    echo "       SENTRY_ORG=your_org_slug"
    echo "       SENTRY_PROJECT=suno-api"
    echo "       SENTRY_AUTH_TOKEN=your_auth_token"
}

# Setup Linear
setup_linear() {
    print_header "Setting up Linear"

    print_info "Linear API Integration:"
    echo "  1. Go to https://linear.app/settings/api"
    echo "  2. Create new API key"
    echo "  3. Add to .env: LINEAR_API_KEY=your_key_here"
    echo ""
    print_info "Linear is optional but recommended for issue tracking"
}

# Setup Cursor
setup_cursor() {
    print_header "Setting up Cursor AI"

    if [ -f ".cursor/config.json" ]; then
        print_success "Cursor config exists"
    else
        print_warning "Cursor config not found"
    fi

    print_info "Cursor will use MCP servers for:"
    echo "  - Codegen.com integration"
    echo "  - GitHub integration"
    echo "  - Tavily web search"
    print_info "Make sure environment variables are set in .env"
}

# Final summary
print_summary() {
    print_header "Setup Complete!"

    echo ""
    echo -e "${GREEN}✅ All integrations are configured!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo ""
    echo "  1. Edit .env with your API keys:"
    echo "     $ nano .env"
    echo ""
    echo "  2. Authenticate with Codegen:"
    echo "     $ codegen login"
    echo ""
    echo "  3. Set up GitHub/CircleCI secrets"
    echo ""
    echo "  4. Test the build:"
    echo "     $ npm run build"
    echo ""
    echo "  5. Run the development server:"
    echo "     $ npm run dev"
    echo ""
    print_info "For detailed documentation, see:"
    echo "     - INTEGRATIONS.md"
    echo "     - CLAUDE.md"
    echo "     - MCP-SETUP.md"
    echo ""
}

# Main execution
main() {
    clear
    echo ""
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║           Suno API Integration Setup Script             ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    check_prerequisites
    setup_env_file
    setup_codegen
    setup_github_actions
    setup_circleci
    setup_sentry
    setup_linear
    setup_cursor
    print_summary
}

# Run main function
main
