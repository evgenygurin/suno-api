# Batch Music Generation API

Generate multiple songs in parallel using Trigger.dev background tasks.

## Endpoint

```text
POST /api/v2/batch
```

## Request Format

```json
{
  "prompts": ["prompt 1", "prompt 2", ...],  // 1-50 prompts (required)
  "make_instrumental": boolean,              // required
  "model": "string",                         // optional, defaults to "chirp-v3-5"
  "wait_audio": boolean                      // optional, defaults to true
}
```

### Field Validation

- **prompts** (required): Array of 1-50 non-empty strings
- **make_instrumental** (required): Boolean flag
- **model** (optional): Model name (e.g., "chirp-v3-5")
- **wait_audio** (optional): Wait for audio generation (default: true)

## Response Format

### Success (202 Accepted)

```json
{
  "success": true,
  "jobId": "run_abc123...",
  "batchSize": 3,
  "status": "processing",
  "message": "Batch generation started for 3 prompts...",
  "checkStatusUrl": "/api/v2/jobs/run_abc123..."
}
```

### Validation Errors (400 Bad Request)

```json
{
  "error": "At least one prompt is required"
}
```

Common validation errors:

- `"Invalid 'prompts' field - must be an array"`
- `"At least one prompt is required"`
- `"Batch size limited to 50 prompts"`
- `"Invalid prompt at index X - must be a non-empty string"`
- `"Missing or invalid 'make_instrumental' field - must be a boolean"`

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Failed to start batch generation",
  "message": "Detailed error message"
}
```

## Examples

### Example 1: Generate 3 Songs

```bash
curl -X POST http://localhost:3000/api/v2/batch \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "upbeat happy electronic dance music",
      "calm peaceful piano melody",
      "energetic rock guitar riff"
    ],
    "make_instrumental": false,
    "wait_audio": true
  }'
```

**Response:**

```json
{
  "success": true,
  "jobId": "run_cmhyzgvlw00a52foff5maqwt6",
  "batchSize": 3,
  "status": "processing",
  "message": "Batch generation started for 3 prompts. Use /api/v2/jobs/{jobId} to check status.",
  "checkStatusUrl": "/api/v2/jobs/run_cmhyzgvlw00a52foff5maqwt6"
}
```

### Example 2: Instrumental Batch

```bash
curl -X POST http://localhost:3000/api/v2/batch \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "ambient atmospheric soundscape",
      "jazzy smooth saxophone"
    ],
    "make_instrumental": true
  }'
```

### Example 3: With API Key

```bash
curl -X POST http://localhost:3000/api/v2/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{
    "prompts": ["fast paced techno beat"],
    "make_instrumental": true,
    "wait_audio": false
  }'
```

## Checking Job Status

Use the `jobId` from the response to check status:

```bash
curl http://localhost:3000/api/v2/jobs/{jobId}
```

**Response:**

```json
{
  "id": "run_abc123...",
  "status": "COMPLETED",
  "output": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "pending": 0,
    "results": [
      {
        "prompt": "upbeat happy electronic dance music",
        "runId": "run_xyz...",
        "status": "COMPLETED",
        "output": {
          "success": true,
          "data": { /* song data */ }
        }
      },
      // ... more results
    ]
  }
}
```

## How It Works

1. **API validates** the request payload (prompts array, make_instrumental, etc.)
2. **Trigger.dev task** is triggered with validated payload
3. **Background processing** starts immediately
4. **API returns** 202 Accepted with jobId
5. **Batch task** triggers individual music generation tasks in parallel
6. **Client polls** `/api/v2/jobs/{jobId}` to check status
7. **Results** are aggregated when all tasks complete

## Benefits

- ✅ **No HTTP timeout** - long-running operations handled in background
- ✅ **Parallel processing** - multiple songs generated simultaneously
- ✅ **Automatic retries** - CAPTCHA failures and network issues handled
- ✅ **Status tracking** - monitor progress via job status endpoint
- ✅ **Concurrency control** - respects rate limits and system resources

## Limitations

- **Maximum 50 prompts** per batch request
- **Concurrency limit**: 5 concurrent music generations (configurable)
- **Rate limits**: Subject to Suno.ai and 2Captcha rate limits
- **CAPTCHA costs**: Each generation may require CAPTCHA solving

## Testing

Run the included test script:

```bash
./test-batch-generate.sh
```

Or test manually:

```bash
# Start development server
npm run dev

# Trigger batch generation
curl -X POST http://localhost:3000/api/v2/batch \
  -H "Content-Type: application/json" \
  -d '{"prompts": ["test song"], "make_instrumental": false}'

# Check status (use jobId from response)
curl http://localhost:3000/api/v2/jobs/{jobId}
```

## Error Handling

### Zod Validation Errors

If you trigger the task directly (without using the API endpoint), Zod validation will catch invalid payloads:

```text
TaskPayloadParsedError: Parsing payload with schema failed:
- prompts: Required (expected array, got undefined)
- make_instrumental: Required (expected boolean, got undefined)
```

**Solution**: Always use the API endpoint (`POST /api/v2/batch`) which validates requests before triggering tasks.

### API Validation Errors

The API endpoint performs additional validation before triggering tasks:

- Checks prompts array is not empty
- Validates array size (1-50)
- Ensures each prompt is a non-empty string
- Verifies make_instrumental is a boolean

### Task Execution Errors

If individual music generation tasks fail:

- Tasks are automatically retried (up to 3 attempts)
- Batch result includes per-song status
- Failed songs are reported with error messages

## Architecture

```text
Client Request
    ↓
POST /api/v2/batch (validates payload)
    ↓
Trigger.dev batchGenerateTask
    ↓
    ├─→ generateMusicTask (song 1)
    ├─→ generateMusicTask (song 2)
    └─→ generateMusicTask (song 3)
    ↓
Aggregate Results
    ↓
Return to Client via Status Check
```

## See Also

- [Single Generation API](./API_V2.md) - Generate one song at a time
- [Job Status API](./API_V2.md#job-status) - Check job status
- [Trigger.dev Integration](./TRIGGER_DEV_INTEGRATION.md) - Background task details
