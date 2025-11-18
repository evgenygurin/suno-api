# Fix: OpenTelemetry Threading Warning

## Problem

You may see this harmless error when exiting Python-based MCP servers:

```
Exception ignored in atexit callback: <function shutdown at 0x10574b740>
Traceback (most recent call last):
  File "/usr/lib/python3.12/logging/__init__.py", line 2271, in shutdown
    h.flush()
  File "/usr/lib/python3.12/site-packages/opentelemetry/sdk/_logs/_internal/__init__.py", line 676, in flush
    thread.start()
  File "/usr/lib/python3.12/threading.py", line 992, in start
    _start_new_thread(self._bootstrap, ())
RuntimeError: can't create new thread at interpreter shutdown
```

## What Causes This?

This error occurs when **OpenTelemetry's logging handler** tries to flush logs during Python's shutdown sequence. Python prevents new threads from being created during shutdown, causing this harmless error.

The error comes from the **MCP proxy** (`/usr/local/bin/mcp_proxy.py`) which is used by Codegen.com's MCP integration.

## Solutions

### Solution 1: Environment Variables (Recommended)

Add these to your `.env` file (already added to `.env.example`):

```bash
# Suppress harmless OpenTelemetry threading warnings
PYTHONWARNINGS=ignore::RuntimeError:threading

# Optionally disable OpenTelemetry entirely
# OTEL_SDK_DISABLED=true

# Prevent Python bytecode files
PYTHONDONTWRITEBYTECODE=1
```

Then reload your environment:

```bash
# Copy to .env if you haven't already
cp .env.example .env

# Source it in your current shell
source .env

# Or export individually
export PYTHONWARNINGS="ignore::RuntimeError:threading"
```

### Solution 2: Shell Profile (Permanent)

Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
# Suppress OpenTelemetry shutdown warnings
export PYTHONWARNINGS="ignore::RuntimeError:threading"
export PYTHONDONTWRITEBYTECODE=1
```

Then reload:

```bash
source ~/.bashrc  # or ~/.zshrc
```

### Solution 3: Use the Helper Script

Before running commands that use MCP:

```bash
source scripts/suppress-otel-warnings.sh
codegen claude "your prompt"
```

### Solution 4: One-Time Per Command

Prefix any command with the environment variable:

```bash
PYTHONWARNINGS="ignore::RuntimeError:threading" codegen claude "your task"
PYTHONWARNINGS="ignore::RuntimeError:threading" npm run dev
```

## Verification

After applying any solution, you should no longer see the error:

```bash
# Test it
codegen --version

# Should exit cleanly without errors
```

## Technical Details

**Why is this harmless?**
- The error occurs **after** all work is complete
- It's during the cleanup/shutdown phase
- It doesn't affect functionality
- Logs are still written successfully

**Why does it happen?**
- OpenTelemetry uses async logging with worker threads
- During Python shutdown, `atexit` handlers run sequentially
- By the time logging cleanup runs, threading is disabled
- This is a [known issue](https://github.com/open-telemetry/opentelemetry-python/issues/2606) in OpenTelemetry

**Alternative: Disable OpenTelemetry**

If you don't need telemetry, disable it entirely:

```bash
export OTEL_SDK_DISABLED=true
```

## Files Modified

- `.env.example` - Added Python warning suppression variables
- `scripts/suppress-otel-warnings.sh` - Helper script to source
- `MCP-PYTHON-FIX.md` - This documentation

## Related Issues

- [OpenTelemetry Python #2606](https://github.com/open-telemetry/opentelemetry-python/issues/2606)
- [Python threading.py documentation](https://docs.python.org/3/library/threading.html#threading.Thread.start)

## Still Having Issues?

If you still see the error after applying these fixes:

1. **Check your environment**: `echo $PYTHONWARNINGS`
2. **Restart your shell**: New environment variables may not be loaded
3. **Check for multiple Python versions**: `which python3 && python3 --version`
4. **Contact support**: This should not affect functionality, but we're here to help!
