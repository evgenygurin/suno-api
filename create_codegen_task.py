#!/usr/bin/env python3
"""
Create Codegen Agent Task for Integration Setup
"""
import os
from codegen import Agent

# Configuration
ORG_ID = "4138"
REPO_ID = 9
API_TOKEN = "sk-20183fe5-c7d7-42d6-ba99-896e70f175f5"

# Detailed prompt
PROMPT = """
# Comprehensive Integration Setup Task

Please review and implement the integration setup described in `.codegen/tasks/setup-integrations.md`.

## Objective
Configure complete integration ecosystem for Suno API project, connecting:
- Claude Code with MCP integration
- Codegen.com platform
- Cursor IDE with MCP server
- Linear workspace automation
- CircleCI with auto-wake for failed checks
- GitHub Actions for automated PR reviews
- Sentry for error tracking and analysis

## Key Deliverables

### 1. GitHub Actions Workflow
Create `.github/workflows/codegen-review.yml` with:
- Automated PR code reviews using Codegen SDK
- Integration with CircleCI status
- Comment posting on PRs
- Environment variables configuration

### 2. CircleCI Integration
- Connect CircleCI to Codegen platform
- Enable automatic wake-up for failed checks
- Configure read-only monitoring permissions

### 3. Linear Workspace Connection
- Authorize Codegen app in Linear
- Set up multi-agent workflow patterns
- Configure Linear API in environment

### 4. Sentry Integration
- Connect Sentry organization to Codegen
- Enable error trace analysis
- Set up automatic issue creation workflow

### 5. Cursor IDE Configuration
Create `.cursor/config.json` with:
- MCP server configuration
- Documentation indexing
- Codegen tools integration

### 6. Claude Code MCP Setup
- Configure remote MCP server
- Set up authentication headers
- Test integration

## Implementation Instructions

All detailed specifications, API endpoints, configuration examples, and integration patterns are documented in:
`.codegen/tasks/setup-integrations.md`

Please:
1. Read the complete task specification
2. Implement each integration systematically
3. Create necessary configuration files
4. Verify each integration with health checks
5. Document any issues or blockers

## Technical Context

- **Project:** Suno API v2.0 (TypeScript/Next.js)
- **Architecture:** API-based music generation (no browser automation)
- **Current Integrations:** Partial (Codegen, GitHub, Sentry basic setup)
- **Target State:** Full integration ecosystem with automated workflows

## Success Criteria
- GitHub Actions workflow running PR reviews
- CircleCI connected and monitoring builds
- Linear workspace responding to @mentions
- Sentry errors triggering agent analysis
- Cursor MCP server functional
- Claude Code connected via MCP
- All integration health checks passing

Estimated time: 4-6 hours
Priority: High

Please start with GitHub Actions workflow as it's the most critical integration.
"""

def main():
    """Create Codegen agent task"""
    print("🤖 Creating Codegen Agent Task...")
    print(f"Organization ID: {ORG_ID}")
    print(f"Repository ID: {REPO_ID}")
    print()

    try:
        # Initialize agent
        agent = Agent(org_id=ORG_ID, token=API_TOKEN)

        # Create task (run only takes prompt parameter)
        print("📤 Sending task to Codegen...")
        task = agent.run(prompt=PROMPT)

        # Print result
        print("✅ Task created successfully!")
        print(f"Status: {task.status}")

        if hasattr(task, 'id'):
            print(f"Task ID: {task.id}")

        if hasattr(task, 'web_url'):
            print(f"View at: {task.web_url}")
        elif hasattr(task, 'url'):
            print(f"View at: {task.url}")

        # Wait a bit and refresh to get URL
        import time
        time.sleep(2)
        task.refresh()

        print(f"\nUpdated status: {task.status}")

        if hasattr(task, 'web_url'):
            print(f"Track progress: {task.web_url}")

        print("\n✨ Agent is now working on the integration setup!")
        print("Check the Codegen dashboard for progress updates.")

        return task

    except Exception as e:
        print(f"❌ Error creating task: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    main()
