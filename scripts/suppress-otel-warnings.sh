#!/usr/bin/env bash
# Suppress OpenTelemetry threading warnings during Python interpreter shutdown
# This is a harmless error that occurs when OpenTelemetry tries to flush logs
# during Python's atexit handler sequence.

# Usage: source this file before running commands that use MCP servers
#   source scripts/suppress-otel-warnings.sh
#   codegen claude "your prompt"

export PYTHONWARNINGS="ignore::RuntimeError:threading"
export OTEL_SDK_DISABLED=true  # Optionally disable OpenTelemetry entirely
export PYTHONDONTWRITEBYTECODE=1  # Prevent .pyc files

echo "✅ OpenTelemetry warnings suppressed"
echo "   PYTHONWARNINGS=$PYTHONWARNINGS"
echo "   OTEL_SDK_DISABLED=$OTEL_SDK_DISABLED"
