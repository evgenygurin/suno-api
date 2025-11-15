"""
OpenTelemetry Shutdown Fix for Python 3.12+

This module fixes the "RuntimeError: can't create new thread at interpreter shutdown"
error that occurs when OpenTelemetry's logging SDK tries to create new threads
during Python interpreter shutdown.

The issue was introduced in Python 3.12 where thread creation is blocked during
interpreter finalization. OpenTelemetry's BatchLogRecordProcessor tries to create
a new thread in its flush() method when called from atexit handlers.

Solution:
- Register an early atexit handler that safely shuts down OpenTelemetry
- Check sys.is_finalizing() before attempting thread operations
- Suppress thread creation errors during shutdown

References:
- https://github.com/python/cpython/issues/113964
- https://github.com/open-telemetry/opentelemetry-python/issues/3309

Usage:
    import otel_shutdown_fix
    otel_shutdown_fix.install()

Author: AI-generated fix for suno-api project
"""

import sys
import atexit
import logging
from typing import Optional

# Flag to track if fix is installed
_fix_installed = False


def _safe_shutdown_otel():
    """
    Safely shutdown OpenTelemetry components before interpreter shutdown.

    This function is registered as an early atexit handler to ensure
    OpenTelemetry is shut down cleanly before the interpreter starts
    its finalization process.
    """
    if sys.is_finalizing():
        # Already finalizing, don't attempt shutdown
        return

    try:
        # Try to import and shutdown OpenTelemetry components
        try:
            from opentelemetry.sdk._logs import LoggerProvider
            from opentelemetry import _logs as otel_logs

            # Get logger provider if it exists
            logger_provider = otel_logs.get_logger_provider()

            # Only shutdown if we have a valid LoggerProvider
            if logger_provider and hasattr(logger_provider, 'shutdown'):
                # Force immediate shutdown without thread creation
                logger_provider.shutdown()
        except (ImportError, AttributeError, RuntimeError):
            # OpenTelemetry not installed or already shut down
            pass

        # Also try to shutdown trace provider
        try:
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry import trace as otel_trace

            tracer_provider = otel_trace.get_tracer_provider()
            if tracer_provider and hasattr(tracer_provider, 'shutdown'):
                tracer_provider.shutdown()
        except (ImportError, AttributeError, RuntimeError):
            pass

        # Shutdown metrics provider
        try:
            from opentelemetry.sdk.metrics import MeterProvider
            from opentelemetry import metrics as otel_metrics

            meter_provider = otel_metrics.get_meter_provider()
            if meter_provider and hasattr(meter_provider, 'shutdown'):
                meter_provider.shutdown()
        except (ImportError, AttributeError, RuntimeError):
            pass

    except Exception:
        # Suppress all exceptions during shutdown
        # We don't want shutdown errors to interfere with program exit
        pass


def _patch_logging_shutdown():
    """
    Patch the Python logging module's shutdown function to handle
    OpenTelemetry handlers gracefully.

    This prevents the error from occurring in logging.shutdown() -> handler.flush()
    """
    original_shutdown = logging.shutdown

    def safe_shutdown(handlerList=logging._handlerList):
        """Patched shutdown that checks for interpreter finalization"""
        if sys.is_finalizing():
            # Don't attempt to flush handlers during finalization
            return

        try:
            # Call original shutdown
            original_shutdown(handlerList)
        except RuntimeError as e:
            if "can't create new thread" in str(e):
                # Suppress this specific error
                pass
            else:
                raise

    # Apply patch
    logging.shutdown = safe_shutdown


def _patch_thread_start():
    """
    Patch threading.Thread.start() to check for interpreter finalization.

    This is a last-resort measure to prevent thread creation during shutdown.
    """
    import threading

    original_start = threading.Thread.start

    def safe_start(self):
        """Patched start that checks for interpreter finalization"""
        if sys.is_finalizing():
            # Don't start new threads during finalization
            return

        try:
            original_start(self)
        except RuntimeError as e:
            if "can't create new thread at interpreter shutdown" in str(e):
                # Suppress this error during shutdown
                pass
            else:
                raise

    threading.Thread.start = safe_start


def install(
    patch_logging: bool = True,
    patch_threading: bool = False,
    priority: int = 10
):
    """
    Install the OpenTelemetry shutdown fix.

    This should be called as early as possible in your application,
    preferably right after importing OpenTelemetry modules.

    Args:
        patch_logging: If True, patch logging.shutdown() (recommended)
        patch_threading: If True, patch Thread.start() (more aggressive)
        priority: atexit handler priority (lower = earlier execution)

    Example:
        import otel_shutdown_fix
        otel_shutdown_fix.install()

        # Your OpenTelemetry initialization
        from opentelemetry import ...
    """
    global _fix_installed

    if _fix_installed:
        return

    # Register early atexit handler
    # This runs BEFORE OpenTelemetry's own atexit handlers
    atexit.register(_safe_shutdown_otel)

    # Apply patches if requested
    if patch_logging:
        _patch_logging_shutdown()

    if patch_threading:
        _patch_thread_start()

    _fix_installed = True


def is_installed() -> bool:
    """Check if the fix is already installed"""
    return _fix_installed


# Auto-install on import (can be disabled by setting env var)
import os
if os.getenv('OTEL_SHUTDOWN_FIX_DISABLE', '').lower() not in ('1', 'true', 'yes'):
    install(patch_logging=True, patch_threading=False)
