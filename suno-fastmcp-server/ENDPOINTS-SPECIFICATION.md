# Suno API - Missing Endpoints Specification

> Detailed technical specification for implementing 11 missing Suno API endpoints

## Table of Contents

1. [Music Extension & Modification](#music-extension--modification)
2. [Vocal & Instrumental Addition](#vocal--instrumental-addition)
3. [Audio Processing](#audio-processing)
4. [Video Generation](#video-generation)
5. [Status & Monitoring](#status--monitoring)

---

## Music Extension & Modification

### 1. Extend Music

**Priority:** 🔥 Critical

**Description:** AI-powered extension of existing music tracks while maintaining musical coherence and style.

**Use Cases:**
- Extend 2-minute track to 4 minutes
- Create longer versions for production
- Develop complete compositions from short ideas

**API Endpoint:** `POST /api/v1/generate/extend`

**Request Parameters:**

```typescript
interface ExtendMusicRequest {
  taskId: string;           // Required: Original song ID
  audioId: string;          // Required: Original audio ID (usually same as taskId)
  prompt?: string;          // Optional: Guidance for extension
  continueAt?: number;      // Optional: Timestamp to extend from (seconds)
  model?: string;           // Optional: V3_5, V4, V4_5, V4_5PLUS, V5
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;  // New task ID for extended version
  }
}
```

**Implementation Details:**
- Default `continueAt`: Auto-detect (usually last 10 seconds)
- Model defaults to original track's model
- Typical generation time: 60-180 seconds
- Credits cost: 15-25 per extension

**Error Handling:**
- Original track must be SUCCESS status
- Cannot extend instrumental if original had vocals
- Maximum extension length: 8 minutes total

---

### 2. Upload and Cover Audio

**Priority:** ⚡ Important

**Description:** Upload audio file and transform it into a different musical style.

**Use Cases:**
- Convert rock song to jazz
- Reinterpret classical piece as electronic
- Create style variations for A/B testing

**API Endpoint:** `POST /api/v1/generate/upload-cover`

**Request Parameters:**

```typescript
interface UploadCoverRequest {
  uploadUrl: string;        // Required: URL of audio file to upload
  prompt?: string;          // Optional: Description of desired output
  style: string;            // Required: Target style/genre
  title: string;            // Required: Title for new version
  customMode?: boolean;     // Optional: Use custom generation
  instrumental?: boolean;   // Optional: Generate instrumental only
  model?: string;           // Optional: Model version
  negativeTags?: string;    // Optional: Styles to avoid
  vocalGender?: 'm' | 'f';  // Optional: Vocal gender
  styleWeight?: number;     // Optional: 0.0-1.0, style influence
  weirdnessConstraint?: number;  // Optional: 0.0-1.0
  audioWeight?: number;     // Optional: 0.0-1.0, original audio influence
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- Supported formats: MP3, WAV, FLAC, OGG
- Max file size: 10 MB
- Upload timeout: 60 seconds
- Generation time: 90-240 seconds
- Credits cost: 20-30

**Audio Weight Parameter:**
- 0.0: Completely new composition in target style
- 0.5: Balanced blend of original and new style
- 1.0: Maximum preservation of original melody

---

### 3. Upload and Extend Audio

**Priority:** 💡 Useful

**Description:** Upload audio and extend it with AI-generated continuation.

**Use Cases:**
- Add ending to existing track
- Extend user-uploaded stems
- Complete unfinished compositions

**API Endpoint:** `POST /api/v1/generate/upload-extend`

**Request Parameters:**

```typescript
interface UploadExtendRequest {
  uploadUrl: string;        // Required: Audio file URL
  defaultParamFlag?: boolean;  // Optional: Use default parameters
  instrumental?: boolean;   // Optional: Generate instrumental extension
  prompt?: string;          // Optional: Extension guidance
  style?: string;           // Optional: Musical style
  title?: string;           // Optional: Track title
  continueAt?: number;      // Optional: Extension start point (seconds)
  personaId?: string;       // Optional: Persona ID for consistency
  model?: string;           // Optional: Model version
  negativeTags?: string;    // Optional: Avoid these styles
  vocalGender?: 'm' | 'f';  // Optional: Vocal gender
  styleWeight?: number;     // Optional: 0.0-1.0
  weirdnessConstraint?: number;  // Optional: 0.0-1.0
  audioWeight?: number;     // Optional: 0.0-1.0
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- If `defaultParamFlag: true`, minimal parameters needed
- Auto-detects extension point if not specified
- Credits cost: 15-25

---

### 4. Cover Music

**Priority:** ⚡ Important

**Description:** Create a cover version of an existing Suno-generated track.

**Use Cases:**
- Reinterpret in different style
- Create variations for content
- Generate remixes

**API Endpoint:** `POST /api/v1/generate/cover`

**Request Parameters:**

```typescript
interface CoverMusicRequest {
  taskId: string;           // Required: Original song task ID
  audioId: string;          // Required: Original audio ID
  prompt?: string;          // Optional: Cover description
  style?: string;           // Optional: New style
  title?: string;           // Optional: Cover title
  model?: string;           // Optional: Model version
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- Original track must be SUCCESS
- Preserves core melody
- Generation time: 90-180 seconds
- Credits cost: 15-20

---

## Vocal & Instrumental Addition

### 5. Add Vocals

**Priority:** 🔥 Critical

**Description:** Add AI-generated vocals to instrumental track.

**Use Cases:**
- Convert instrumental to full song
- Add vocals to beats
- Create complete tracks from instrumentals

**API Endpoint:** `POST /api/v1/generate/add-vocals`

**Request Parameters:**

```typescript
interface AddVocalsRequest {
  taskId?: string;          // Optional: Existing track ID
  audioId?: string;         // Optional: Existing audio ID
  uploadUrl?: string;       // Optional: Upload new instrumental
  prompt: string;           // Required: Vocal/lyrical concept
  style?: string;           // Optional: Vocal style
  title?: string;           // Optional: Track title
  vocalGender?: 'm' | 'f';  // Optional: Vocal gender
  model?: string;           // Optional: Model version
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- Either `taskId` OR `uploadUrl` required
- If using `taskId`, original must be instrumental
- Auto-generates lyrics from prompt
- Generation time: 90-180 seconds
- Credits cost: 20-30

---

### 6. Add Instrumental

**Priority:** 🔥 Critical

**Description:** Generate instrumental accompaniment for vocals/acapella.

**Use Cases:**
- Add music to acapella
- Create backing tracks
- Flesh out vocal melodies

**API Endpoint:** `POST /api/v1/generate/add-instrumental`

**Request Parameters:**

```typescript
interface AddInstrumentalRequest {
  taskId?: string;          // Optional: Existing track ID
  audioId?: string;         // Optional: Existing audio ID
  uploadUrl?: string;       // Optional: Upload vocal track
  prompt?: string;          // Optional: Instrumental description
  style: string;            // Required: Musical style/genre
  title?: string;           // Optional: Track title
  model?: string;           // Optional: Model version
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- Either `taskId` OR `uploadUrl` required
- If using `taskId`, original should have vocals
- Generation time: 90-180 seconds
- Credits cost: 20-30

---

## Audio Processing

### 7. Convert to WAV Format

**Priority:** 🔥 Critical

**Description:** Convert MP3 to high-quality WAV format.

**Use Cases:**
- Professional audio editing
- Lossless archive
- Mastering preparation

**API Endpoint:** `POST /api/v1/generate/convert-to-wav`

**Request Parameters:**

```typescript
interface ConvertToWAVRequest {
  taskId: string;           // Required: Song task ID
  audioId: string;          // Required: Audio ID
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;  // Conversion task ID
  }
}
```

**Implementation Details:**
- Original must be SUCCESS
- Output: 44.1kHz, 16-bit, Stereo WAV
- Conversion time: 10-30 seconds
- Credits cost: 2-5
- File size: ~10x larger than MP3

---

### 8. Boost Music Style

**Priority:** 💡 Useful

**Description:** AI enhances and amplifies specific genre characteristics.

**Use Cases:**
- Make jazz more swingy
- Enhance rock energy
- Emphasize genre traits

**API Endpoint:** `POST /api/v1/generate/boost-style`

**Request Parameters:**

```typescript
interface BoostStyleRequest {
  taskId: string;           // Required: Song task ID
  audioId: string;          // Required: Audio ID
  style: string;            // Required: Style to boost
  intensity?: number;       // Optional: 0.0-1.0 (default 0.5)
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- Original must be SUCCESS
- Intensity: 0.0 (subtle) to 1.0 (extreme)
- Generation time: 60-120 seconds
- Credits cost: 10-15

---

## Video Generation

### 9. Create Music Video

**Priority:** 💡 Useful

**Description:** Generate AI-powered music video from audio track.

**Use Cases:**
- Auto-generate lyric videos
- Create visual content
- Social media posts

**API Endpoint:** `POST /api/v1/generate/music-video`

**Request Parameters:**

```typescript
interface CreateMusicVideoRequest {
  taskId: string;           // Required: Song task ID
  audioId: string;          // Required: Audio ID
  videoStyle?: string;      // Optional: Visual style
  includeL yrics?: boolean; // Optional: Show lyrics
  callBackUrl?: string;     // Optional: Webhook URL
}
```

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    taskId: string;
  }
}
```

**Implementation Details:**
- Original must be SUCCESS
- Output: MP4, 1080p, 30fps
- Generation time: 120-300 seconds
- Credits cost: 15-25
- Video length = audio length

---

## Status & Monitoring

### 10. Get WAV Conversion Details

**Priority:** ⚡ Important

**Description:** Check WAV conversion progress and get download URL.

**API Endpoint:** `GET /api/v1/generate/wav-conversion-info?taskId={taskId}`

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    status: 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED';
    taskId: string;
    wavUrl?: string;          // Available when SUCCESS
    fileSize?: number;        // Bytes
    duration?: string;        // Seconds
    errorMessage?: string;    // Available when FAILED
  }
}
```

**Polling Strategy:**
- First 10s: Poll every 2 seconds
- After 10s: Poll every 5 seconds
- Timeout: 60 seconds

---

### 11. Get Music Video Details

**Priority:** 💡 Useful

**Description:** Monitor video generation progress.

**API Endpoint:** `GET /api/v1/generate/music-video-info?taskId={taskId}`

**Response Format:**

```typescript
{
  code: 200,
  msg: 'success',
  data: {
    status: 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED';
    taskId: string;
    videoUrl?: string;        // Available when SUCCESS
    thumbnailUrl?: string;    // Video thumbnail
    duration?: string;        // Seconds
    resolution?: string;      // e.g., "1920x1080"
    fileSize?: number;        // Bytes
    errorMessage?: string;    // Available when FAILED
  }
}
```

**Polling Strategy:**
- First 30s: Poll every 5 seconds
- 30-120s: Poll every 10 seconds
- After 120s: Poll every 15 seconds
- Timeout: 300 seconds (5 minutes)

---

## Implementation Priority Matrix

| Priority | Endpoint | Complexity | User Impact | Credits/Use |
|----------|----------|------------|-------------|-------------|
| 🔥 | Extend Music | Medium | High | 15-25 |
| 🔥 | Convert to WAV | Low | High | 2-5 |
| 🔥 | Add Vocals | Medium | High | 20-30 |
| 🔥 | Add Instrumental | Medium | High | 20-30 |
| ⚡ | Upload and Cover | High | Medium | 20-30 |
| ⚡ | Cover Music | Medium | Medium | 15-20 |
| ⚡ | Get WAV Details | Low | Medium | 0 |
| 💡 | Upload and Extend | High | Medium | 15-25 |
| 💡 | Boost Style | Medium | Low | 10-15 |
| 💡 | Create Video | High | Low | 15-25 |
| 💡 | Get Video Details | Low | Low | 0 |

---

## Common Patterns

### Error Handling

All endpoints should handle:

```typescript
try {
  const response = await this.client.post(endpoint, payload);

  if (response.data.code !== 200) {
    throw new Error(`API Error: ${response.data.msg}`);
  }

  return response.data.data.taskId;
} catch (error: any) {
  logger.error({ error: error.response?.data || error.message }, `Error in ${endpointName}`);
  throw error;
}
```

### Async Task Pattern

```typescript
// Start task
const taskId = await client.startTask();

// Poll status (in MCP tool or separate method)
const result = await client.pollTaskStatus(taskId);
```

### Parameter Validation

```typescript
// Required fields
if (!taskId || !audioId) {
  throw new Error('taskId and audioId are required');
}

// Range validation
if (intensity < 0 || intensity > 1) {
  throw new Error('intensity must be between 0.0 and 1.0');
}

// File format validation
if (!uploadUrl.match(/\.(mp3|wav|flac|ogg)$/i)) {
  throw new Error('Unsupported audio format');
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ExtendMusic', () => {
  it('should extend track successfully', async () => {
    const result = await client.extendMusic('song_123', 'song_123');
    expect(result).toHaveProperty('id');
  });

  it('should throw error for invalid song', async () => {
    await expect(
      client.extendMusic('invalid', 'invalid')
    ).rejects.toThrow();
  });
});
```

### Integration Tests

- Test with real API (if possible)
- Mock API responses for CI/CD
- Validate response formats
- Test error scenarios

---

## Documentation Requirements

Each endpoint needs:

1. **Detailed description** - What it does, why use it
2. **Use case examples** - Real-world scenarios
3. **Code samples** - TypeScript/JavaScript examples
4. **Parameter reference** - Every parameter explained
5. **Response format** - Complete schema
6. **Error handling** - Common errors and solutions
7. **Best practices** - Tips for optimal use
8. **Credit costs** - Pricing information

---

## Next Steps

1. ✅ **Specification Complete** - This document
2. ⏭️ **Implement Critical** - Extend, WAV, Add Vocals/Instrumental
3. ⏭️ **Implement Important** - Upload Cover, Cover, WAV Details
4. ⏭️ **Implement Useful** - Upload Extend, Boost, Video, Video Details
5. ⏭️ **Update Documentation** - README, SUNO-MCP-TOOLS-DETAILED.md
6. ⏭️ **Testing** - Unit and integration tests
7. ⏭️ **Release** - Version bump, changelog

---

**Version:** 1.0.0
**Created:** 2025-01-15
**Status:** Ready for Implementation
