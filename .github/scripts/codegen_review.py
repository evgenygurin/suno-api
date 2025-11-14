#!/usr/bin/env python3
"""
Codegen AI Code Review Script
Implements PR review using Codegen Agent following official documentation patterns
"""

import os
import sys
import time
from typing import Optional, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from codegen import Agent  # type: ignore

try:
    from codegen import Agent  # type: ignore
except ImportError:
    print("Error: codegen package not installed. Run: pip install codegen")
    sys.exit(1)


def get_pr_info() -> Dict[str, Any]:
    """Extract PR information from GitHub Actions context"""
    pr_number = os.getenv("PR_NUMBER")
    pr_title = os.getenv("PR_TITLE", "")
    pr_body = os.getenv("PR_BODY", "")
    pr_author = os.getenv("PR_AUTHOR", "")
    base_ref = os.getenv("BASE_REF", "main")
    head_ref = os.getenv("HEAD_REF", "")

    if not pr_number:
        print("Error: PR_NUMBER environment variable not set")
        sys.exit(1)

    return {
        "number": pr_number,
        "title": pr_title,
        "body": pr_body,
        "author": pr_author,
        "base": base_ref,
        "head": head_ref,
    }


def should_skip_review(pr_info: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Determine if review should be skipped based on PR metadata
    Returns: (should_skip, reason)
    """
    # Skip Dependabot PRs
    if pr_info["author"] == "dependabot[bot]":
        return True, "Skipping Dependabot PR"

    # Skip draft PRs (would need to check via GitHub API in real implementation)
    # For now, check if title contains [DRAFT] or WIP
    title_lower = pr_info["title"].lower()
    if "[draft]" in title_lower or "wip" in title_lower or "[wip]" in title_lower:
        return True, "Skipping draft PR"

    # Skip if PR has 'skip-review' label (would need GitHub API check)
    # This is a placeholder - actual implementation would query GitHub API

    return False, None


def create_review_prompt(pr_info: Dict[str, Any]) -> str:
    """Create detailed review prompt for Codegen Agent"""
    return f"""
Please review this pull request thoroughly:

**PR #{pr_info['number']}: {pr_info['title']}**

Author: {pr_info['author']}
Base: {pr_info['base']} → Head: {pr_info['head']}

Description:
{pr_info['body'] or 'No description provided'}

---

Focus your review on:

1. **Code Quality & Best Practices**:
   - TypeScript/JavaScript best practices
   - Next.js App Router patterns (not Pages Router)
   - Proper async/await usage
   - Error handling completeness
   - Type safety (avoid `any` types)

2. **Security Concerns**:
   - API key/secret exposure
   - Input validation
   - XSS vulnerabilities
   - SQL injection risks (if applicable)
   - Proper authentication/authorization

3. **Performance Issues**:
   - Unnecessary re-renders
   - Memory leaks
   - Inefficient algorithms
   - Missing caching opportunities
   - Browser automation optimization

4. **Browser Automation (Playwright)**:
   - Proper waits and timeouts
   - Error recovery mechanisms
   - Anti-detection best practices
   - Resource cleanup

5. **Testing & Documentation**:
   - Missing test coverage
   - Unclear code comments
   - API documentation updates

6. **Project-Specific Patterns**:
   - Pino logging (not console.log)
   - Proper CAPTCHA handling with 2Captcha
   - Cookie management for Suno.ai
   - CORS headers in API routes

Please provide:
- Specific line-by-line feedback
- Security vulnerabilities (if any)
- Suggested improvements
- Approval status (APPROVE, REQUEST_CHANGES, COMMENT)
""".strip()


def run_codegen_review(
    agent: Agent,
    pr_info: Dict[str, Any],
    max_retries: int = 3,
    timeout: int = 300
) -> bool:
    """
    Run Codegen review with retry logic and timeout
    Returns: True if review successful, False otherwise
    """
    prompt = create_review_prompt(pr_info)

    for attempt in range(1, max_retries + 1):
        try:
            print(f"Attempt {attempt}/{max_retries}: Running Codegen review...")

            # Run the review with timeout
            start_time = time.time()
            response = agent.run(
                prompt,
                timeout=timeout,
            )

            elapsed = time.time() - start_time
            print(f"✓ Review completed in {elapsed:.2f}s")

            # Parse response and post to GitHub
            # Note: Actual GitHub comment posting would require GitHub API integration
            print("\n=== Codegen Review Results ===")
            print(response)
            print("=" * 50)

            return True

        except TimeoutError:
            print(f"✗ Attempt {attempt} timed out after {timeout}s")
            if attempt < max_retries:
                wait_time = 2 ** attempt  # Exponential backoff: 2s, 4s, 8s
                print(f"Retrying in {wait_time}s...")
                time.sleep(wait_time)

        except Exception as e:
            print(f"✗ Attempt {attempt} failed: {e}")
            if attempt < max_retries:
                wait_time = 2 ** attempt
                print(f"Retrying in {wait_time}s...")
                time.sleep(wait_time)

    print(f"✗ All {max_retries} attempts failed")
    return False


def main():
    """Main execution flow"""
    print("=== Codegen AI Code Review ===")

    # Get configuration from environment
    org_id = os.getenv("CODEGEN_ORG_ID")
    api_token = os.getenv("CODEGEN_API_TOKEN")

    if not org_id or not api_token:
        print("Error: CODEGEN_ORG_ID and CODEGEN_API_TOKEN must be set")
        sys.exit(1)

    # Get PR information
    pr_info = get_pr_info()
    print(f"PR #{pr_info['number']}: {pr_info['title']}")
    print(f"Author: {pr_info['author']}")

    # Check if review should be skipped
    should_skip, skip_reason = should_skip_review(pr_info)
    if should_skip:
        print(f"ℹ {skip_reason}")
        sys.exit(0)

    # Initialize Codegen Agent
    print("Initializing Codegen Agent...")
    try:
        agent = Agent(
            org_id=org_id,
            api_token=api_token,
        )
    except Exception as e:
        print(f"Error initializing Codegen Agent: {e}")
        sys.exit(1)

    # Run review
    success = run_codegen_review(agent, pr_info)

    if success:
        print("✓ Review completed successfully")
        sys.exit(0)
    else:
        print("✗ Review failed after all retries")
        sys.exit(1)


if __name__ == "__main__":
    main()
