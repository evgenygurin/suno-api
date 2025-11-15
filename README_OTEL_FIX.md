# OpenTelemetry Shutdown Fix

## Problem

When running Python scripts with OpenTelemetry SDK on Python 3.12+, you may encounter this error at program exit:

```bash
Exception ignored in atexit callback: <function shutdown at 0x...>
Traceback (most recent call last):
  File ".../python3.12/logging/__init__.py", line 2271, in shutdown
    h.flush()
  File ".../opentelemetry/sdk/_logs/_internal/__init__.py", line 676, in flush
    thread.start()
  File ".../python3.12/threading.py", line 992, in start
    _start_new_thread(self._bootstrap, ())
RuntimeError: can't create new thread at interpreter shutdown
```

## Root Cause

This is a **known issue with Python 3.12+** where thread creation is blocked during interpreter shutdown. OpenTelemetry's `BatchLogRecordProcessor` attempts to create a new thread in its `flush()` method when called from `atexit` handlers, which fails.

**References:**
- [Python Issue #113964](https://github.com/python/cpython/issues/113964)
- [OpenTelemetry Python Issue #3309](https://github.com/open-telemetry/opentelemetry-python/issues/3309)

## Solution

This project includes `otel_shutdown_fix.py`, a Python module that safely handles OpenTelemetry shutdown:

### How It Works

1. **Early atexit handler**: Registers a shutdown handler that runs BEFORE OpenTelemetry's own handlers
2. **Safe shutdown**: Properly shuts down all OpenTelemetry components (logs, traces, metrics)
3. **Finalization check**: Uses `sys.is_finalizing()` to avoid operations during interpreter finalization
4. **Logging patch**: Patches `logging.shutdown()` to suppress thread creation errors
5. **Auto-installation**: Automatically installs on import (can be disabled)

### Usage

The fix is **automatically applied** when you import any Python script in this project:

```python
# At the top of your script
import otel_shutdown_fix  # noqa: F401
```

The fix is already integrated in:
- `generate_hard_trap.py`
- `generate_trap_polling.py`
- `generate_drill_chastushka.py`
- `r2r.py` (if using OpenTelemetry)

### Manual Installation

If you need to use it in other Python files:

```python
import otel_shutdown_fix

# Optional: explicit installation with custom settings
otel_shutdown_fix.install(
    patch_logging=True,    # Patch logging.shutdown() (recommended)
    patch_threading=False  # Patch Thread.start() (more aggressive)
)
```

### Disabling the Fix

If you need to disable the auto-install behavior:

```bash
export OTEL_SHUTDOWN_FIX_DISABLE=1
python your_script.py
```

## Testing

To verify the fix is working:

```bash
# Run a script that uses OpenTelemetry
python generate_hard_trap.py

# You should NOT see the "can't create new thread" error
# The script should exit cleanly without exceptions
```

## Alternative Solutions

If this fix doesn't work for your use case:

1. **Downgrade Python**: Use Python 3.11.x instead of 3.12+
   ```bash
   pyenv install 3.11.7
   pyenv local 3.11.7
   ```

2. **Update OpenTelemetry**: Ensure you have the latest version
   ```bash
   pip install --upgrade opentelemetry-api opentelemetry-sdk
   ```

3. **Disable OpenTelemetry**: If not needed
   ```bash
   export OTEL_SDK_DISABLED=true
   ```

## Technical Details

### What Gets Patched

- **`logging.shutdown()`**: Wrapped to check `sys.is_finalizing()` before flushing handlers
- **Early atexit handler**: Registered to shutdown OpenTelemetry providers before logging shutdown
- **Exception suppression**: RuntimeError for thread creation is caught and suppressed during shutdown

### What Doesn't Get Patched

- **Thread.start()**: By default, we don't patch this (can be enabled with `patch_threading=True`)
- **OpenTelemetry source code**: No modifications to OpenTelemetry itself
- **Python interpreter**: No changes to Python's behavior

### Safety

- ✅ **Safe to use**: The fix only affects shutdown behavior
- ✅ **No performance impact**: Only runs during program exit
- ✅ **No side effects**: Doesn't interfere with normal OpenTelemetry operation
- ✅ **Graceful degradation**: Silently does nothing if OpenTelemetry is not installed

## Contributing

If you encounter issues with this fix:

1. Check Python version: `python --version` (should be 3.12+)
2. Check OpenTelemetry version: `pip show opentelemetry-sdk`
3. Try explicit installation: `otel_shutdown_fix.install(patch_threading=True)`
4. Report issue with full traceback

## License

This fix is part of the suno-api project and follows the same license.

---

**Last Updated**: 2025-01-15
**Python Versions**: 3.12, 3.13, 3.14+
**OpenTelemetry SDK**: 1.20.0+
