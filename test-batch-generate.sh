#!/bin/bash

# Test script for batch music generation endpoint
# Usage: ./test-batch-generate.sh

BASE_URL="http://localhost:3000"

echo "🎵 Testing Batch Music Generation API"
echo "======================================"
echo ""

# Test 1: Valid batch request
echo "📝 Test 1: Valid batch request (3 prompts)"
curl -X POST "${BASE_URL}/api/v2/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "upbeat happy electronic dance music",
      "calm peaceful piano melody",
      "energetic rock guitar riff"
    ],
    "make_instrumental": false,
    "wait_audio": true
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 2: Instrumental batch
echo "📝 Test 2: Instrumental batch (2 prompts)"
curl -X POST "${BASE_URL}/api/v2/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "ambient atmospheric soundscape",
      "jazzy smooth saxophone"
    ],
    "make_instrumental": true,
    "wait_audio": false
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 3: Invalid - empty prompts array
echo "📝 Test 3: Invalid request - empty prompts"
curl -X POST "${BASE_URL}/api/v2/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [],
    "make_instrumental": false
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 4: Invalid - missing make_instrumental
echo "📝 Test 4: Invalid request - missing make_instrumental"
curl -X POST "${BASE_URL}/api/v2/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": ["test song"]
  }' | jq '.'

echo ""
echo "======================================"
echo "✅ Testing complete!"
echo ""
echo "💡 Tip: Use the jobId from successful responses to check status:"
echo "   curl ${BASE_URL}/api/v2/jobs/{jobId} | jq '.'"
