# Suno AI MCP Server - Complete Tools Reference

> **Comprehensive documentation for all 17 MCP tools in the Suno AI FastMCP server**

This document provides exhaustive details about every tool available in the Suno MCP server, including parameters, use cases, examples, response formats, error handling, and advanced workflows.

## 📚 Table of Contents

- [Overview](#overview)
- [Music Generation Tools](#music-generation-tools)
  - [generate_music](#1-generate_music)
  - [generate_custom_music](#2-generate_custom_music)
  - [extend_music](#3-extend_music) 🆕
  - [cover_music](#4-cover_music) 🆕
  - [upload_cover](#5-upload_cover) 🆕
  - [add_vocals](#6-add_vocals) 🆕
  - [add_instrumental](#7-add_instrumental) 🆕
- [Information & Status Tools](#information--status-tools)
  - [get_audio_info](#8-get_audio_info)
  - [get_credits](#9-get_credits)
- [Lyrics Tools](#lyrics-tools)
  - [generate_lyrics](#10-generate_lyrics)
  - [get_timestamped_lyrics](#11-get_timestamped_lyrics)
- [Audio Processing Tools](#audio-processing-tools)
  - [generate_stems](#12-generate_stems)
  - [convert_to_wav](#13-convert_to_wav) 🆕
  - [get_wav_details](#14-get_wav_details) 🆕
  - [upload_file_from_url](#15-upload_file_from_url) 🆕
- [Utility Tools](#utility-tools)
  - [list_models](#16-list_models)
  - [get_api_status](#17-get_api_status)
- [Advanced Workflows](#advanced-workflows)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

The Suno AI MCP server exposes **17 powerful tools** through the Model Context Protocol (MCP). These tools enable AI assistants to:

- 🎵 Generate music from text descriptions
- 🎨 Create custom songs with fine-grained control
- 🎸 Extend, cover, and transform existing tracks 🆕
- 🎤 Add vocals or instrumentals to audio 🆕
- 📊 Monitor generation status and API credits
- ✍️ Generate and manage lyrics
- 🎧 Separate vocals from instrumentals
- 💿 Convert to WAV format for professional use 🆕
- ⚙️ Check system status and model availability

**Server Information:**
- **Name:** `suno-music-generator`
- **Version:** `1.0.0`
- **Transport:** stdio
- **Base API:** `https://api.sunoapi.org/api/v1`
- **Framework:** FastMCP v3.23.0 (with compatibility patch)

---

## Music Generation Tools

### 1. `generate_music`

**Generate music from a simple text prompt** - the fastest way to create music.

#### Description

Creates music based on a natural language description. This tool provides a streamlined interface for quick music generation without requiring detailed customization. Returns a task ID immediately or waits for the complete audio (2-4 minutes).

#### Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `prompt` | string | ✅ Yes | - | 1-5000 chars | Text description of the music (e.g., "upbeat pop song about summer") |
| `make_instrumental` | boolean | ❌ No | `false` | - | Generate instrumental-only music without vocals |
| `model` | enum | ❌ No | `V3_5` | See models table | Model version for generation |
| `wait_audio` | boolean | ❌ No | `false` | - | Wait for audio completion (may take 2-4 minutes) |

**Accepted Model Values:**
- `V3_5`, `V4`, `V4_5`, `V4_5PLUS`, `V5` (new format)
- `chirp-v3-5`, `chirp-v4`, `chirp-v4-5`, `chirp-v4-5-plus`, `chirp-v5` (legacy format - auto-converted)

#### Use Cases

1. **Quick Music Sketching**
   - Generate ideas rapidly
   - Explore different moods and styles
   - Create background music

2. **AI-Generated Vocals**
   - Auto-generated lyrics from prompt
   - Mood-based vocal generation
   - Genre-appropriate singing style

3. **Instrumental Tracks**
   - Background music for videos
   - Ambient soundscapes
   - Focus/study music

#### Examples

##### Example 1: Simple Pop Song (Async)
```typescript
{
  "prompt": "upbeat pop song about summer vacation at the beach",
  "make_instrumental": false,
  "model": "V4",
  "wait_audio": false
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_abc123def456",
      "status": "GENERATING",
      "created_at": "2025-01-15T10:30:00.000Z",
      "model_name": "V4"
    }
  ],
  "message": "Music generation started. Use get_audio_info to check status."
}
```

##### Example 2: Instrumental Track (Wait for Completion)
```typescript
{
  "prompt": "calm ambient electronic music with soft synth pads",
  "make_instrumental": true,
  "model": "V4_5",
  "wait_audio": true
}
```

**Response (after 2-3 minutes):**
```json
{
  "success": true,
  "data": [
    {
      "id": "8551abcd662c",
      "title": "Ambient Synth Dreams",
      "audio_url": "https://cdn.sunoapi.org/audio/8551abcd662c.mp3",
      "stream_audio_url": "https://cdn.sunoapi.org/stream/8551abcd662c",
      "image_url": "https://cdn.sunoapi.org/images/8551abcd662c.jpeg",
      "lyric": null,
      "status": "SUCCESS",
      "model_name": "chirp-v4-5",
      "created_at": "2025-01-15T10:30:00.000Z",
      "duration": "198.44",
      "tags": "ambient, electronic, synth, calm"
    }
  ],
  "message": "Music generated successfully"
}
```

##### Example 3: High-Quality Audio with V5
```typescript
{
  "prompt": "energetic rock song with electric guitars and drums",
  "make_instrumental": false,
  "model": "V5",
  "wait_audio": false
}
```

#### Response Structure

**Immediate Response (wait_audio = false):**
```typescript
{
  success: boolean;
  data: AudioInfo[];  // Array with task ID and status
  message: string;
}
```

**Complete Response (wait_audio = true):**
```typescript
{
  success: boolean;
  data: AudioInfo[];  // Array with full audio details
  message: string;
}
```

**AudioInfo Object:**
```typescript
{
  id: string;              // Task/audio ID
  title?: string;          // Generated title
  audio_url?: string;      // MP3 file URL (when ready)
  stream_audio_url?: string; // Streaming URL
  image_url?: string;      // Cover art URL
  lyric?: string;          // Auto-generated lyrics
  video_url?: string;      // Video URL (if available)
  status: string;          // "GENERATING" | "SUCCESS" | "FAILED"
  model_name: string;      // Model used
  created_at: string;      // ISO timestamp
  duration?: string;       // Audio duration in seconds
  tags?: string;           // Style tags
  error_message?: string;  // Error details (if failed)
}
```

#### Error Responses

```json
{
  "success": false,
  "error": "API Error: Insufficient credits"
}
```

```json
{
  "success": false,
  "error": "Task timeout: Generation took too long"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:51-84`

**API Endpoint:** `POST /generate`

**Payload Structure:**
```json
{
  "prompt": "...",
  "customMode": false,
  "instrumental": false,
  "model": "V3_5"
}
```

**Timeout Behavior:**
- If `wait_audio = true`, max wait time is **5 minutes** (300 seconds)
- Polls every **5 seconds** for status updates
- Throws timeout error after max wait time

---

### 2. `generate_custom_music`

**Generate music with detailed customization** - for precise creative control.

#### Description

Creates music with granular control over style, title, lyrics, and negative constraints. This tool is ideal when you need specific musical characteristics or want to avoid certain styles.

#### Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `prompt` | string | ✅ Yes | - | 1-5000 chars | Lyrics or song description |
| `style` | string | ✅ Yes | - | 1-1000 chars | Music style/genre (e.g., "electronic, synthwave, 80s") |
| `title` | string | ✅ Yes | - | 1-80 chars | Song title |
| `make_instrumental` | boolean | ❌ No | `false` | - | Generate instrumental-only |
| `model` | enum | ❌ No | `V3_5` | V3_5, V4, V4_5, V4_5PLUS, V5 | Model version |
| `wait_audio` | boolean | ❌ No | `false` | - | Wait for completion |
| `negative_tags` | string | ❌ No | - | - | Styles to avoid (e.g., "jazz, classical") |

#### Use Cases

1. **Branded Content Creation**
   - Specific musical identity
   - Consistent style across tracks
   - Brand-appropriate mood

2. **Lyric-First Composition**
   - Use pre-written lyrics
   - Match music to existing text
   - Storytelling through song

3. **Genre Blending**
   - Combine multiple styles
   - Create unique fusions
   - Experiment with hybrid genres

4. **Negative Constraints**
   - Avoid unwanted elements
   - Fine-tune sonic characteristics
   - Prevent style conflicts

#### Examples

##### Example 1: Custom Song with Lyrics
```typescript
{
  "prompt": "[Verse 1]\nWalking down the neon streets\nCity lights beneath my feet\n[Chorus]\nDreaming in electric blue\nMidnight thoughts of me and you",
  "style": "synthwave, 80s, electronic, dreamy, female vocals",
  "title": "Electric Dreams",
  "make_instrumental": false,
  "model": "V4_5",
  "wait_audio": false,
  "negative_tags": "heavy metal, aggressive, fast tempo"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_xyz789abc012",
      "title": "Electric Dreams",
      "tags": "synthwave, 80s, electronic, dreamy, female vocals",
      "negative_tags": "heavy metal, aggressive, fast tempo",
      "status": "GENERATING",
      "created_at": "2025-01-15T11:00:00.000Z",
      "model_name": "V4_5"
    }
  ],
  "message": "Custom music generation started."
}
```

##### Example 2: Instrumental with Negative Constraints
```typescript
{
  "prompt": "Calm piano meditation",
  "style": "classical piano, slow tempo, peaceful, minimalist",
  "title": "Quiet Moments",
  "make_instrumental": true,
  "model": "V4_5PLUS",
  "wait_audio": false,
  "negative_tags": "drums, electronic, synth, vocals"
}
```

##### Example 3: Genre Fusion
```typescript
{
  "prompt": "[Verse]\nAncient melodies meet modern beats\n[Chorus]\nTradition and future in harmony",
  "style": "traditional japanese instruments, electronic beats, fusion, experimental",
  "title": "East Meets Digital",
  "make_instrumental": false,
  "model": "V5",
  "wait_audio": true
}
```

#### Parameter Details

**Style Parameter - Best Practices:**
- Use comma-separated tags
- Be specific (e.g., "acoustic guitar" not just "guitar")
- Include tempo hints (e.g., "slow tempo", "upbeat")
- Specify vocal characteristics (e.g., "male vocals", "harmonies")
- Limit to 5-7 main descriptors for best results

**Prompt Parameter - Formatting:**
- Use `[Verse]`, `[Chorus]`, `[Bridge]` markers
- Line breaks are preserved
- Total length limit: 5000 characters
- Not required for instrumental tracks

**Negative Tags - Strategy:**
- List styles to explicitly avoid
- Useful for preventing unwanted instruments
- Helps refine ambiguous style requests
- Examples: "no drums", "no vocals", "no electronic elements"

#### Response Structure

Same as `generate_music`, with additional fields:
- `title`: User-provided title
- `tags`: Style tags
- `negative_tags`: Exclusion tags (if provided)

#### Error Responses

```json
{
  "success": false,
  "error": "Title exceeds maximum length of 80 characters"
}
```

```json
{
  "success": false,
  "error": "Style parameter is required for custom generation"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:89-128`, `src/suno-client.ts:136-190`

**API Endpoint:** `POST /generate`

**Payload Structure:**
```json
{
  "customMode": true,
  "style": "...",
  "title": "...",
  "prompt": "...",  // Omitted if instrumental
  "instrumental": false,
  "model": "V3_5",
  "negativeTags": "..."  // Optional
}
```

---

## Information & Status Tools

### 3. `get_audio_info`

**Get detailed information and status for audio generation tasks**.

#### Description

Retrieves comprehensive information about one or more audio generation tasks, including status, audio URLs, metadata, and error messages. Essential for async workflow when `wait_audio` is false.

#### Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `task_ids` | array[string] | ✅ Yes | Min 1 item | Array of task IDs from generation |

#### Use Cases

1. **Polling for Completion**
   - Check if generation is done
   - Monitor multiple tasks
   - Implement progress indicators

2. **Metadata Retrieval**
   - Get audio URLs for playback
   - Retrieve cover art
   - Access generated lyrics

3. **Error Debugging**
   - Check failure reasons
   - Identify stuck tasks
   - Troubleshoot issues

#### Examples

##### Example 1: Check Single Task
```typescript
{
  "task_ids": ["task_abc123def456"]
}
```

**Response (In Progress):**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_abc123def456",
      "status": "GENERATING",
      "created_at": "2025-01-15T10:30:00.000Z",
      "model_name": ""
    }
  ],
  "message": "Retrieved information for 1 task(s)"
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": [
    {
      "id": "8551abcd662c",
      "title": "Summer Vibes",
      "audio_url": "https://cdn.sunoapi.org/audio/8551abcd662c.mp3",
      "stream_audio_url": "https://cdn.sunoapi.org/stream/8551abcd662c",
      "image_url": "https://cdn.sunoapi.org/images/8551abcd662c.jpeg",
      "lyric": "[Verse 1]\nSunshine on my face...",
      "video_url": "https://cdn.sunoapi.org/video/8551abcd662c.mp4",
      "status": "SUCCESS",
      "model_name": "chirp-v4",
      "created_at": "2025-01-15T10:30:00.000Z",
      "duration": "215.67",
      "tags": "pop, upbeat, summer, feel-good"
    }
  ],
  "message": "Retrieved information for 1 task(s)"
}
```

##### Example 2: Check Multiple Tasks
```typescript
{
  "task_ids": [
    "task_abc123",
    "task_def456",
    "task_ghi789"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audio_001",
      "title": "Track 1",
      "status": "SUCCESS",
      "audio_url": "https://cdn.sunoapi.org/audio/audio_001.mp3",
      "duration": "180.5",
      "model_name": "chirp-v4-5"
    },
    {
      "id": "task_def456",
      "status": "GENERATING",
      "created_at": "2025-01-15T10:35:00.000Z",
      "model_name": ""
    },
    {
      "id": "task_ghi789",
      "status": "FAILED",
      "error_message": "Rate limit exceeded",
      "created_at": "2025-01-15T10:40:00.000Z",
      "model_name": ""
    }
  ],
  "message": "Retrieved information for 3 task(s)"
}
```

#### Status Values

| Status | Description | Next Action |
|--------|-------------|-------------|
| `PENDING` | Task queued, not started | Wait and poll again |
| `GENERATING` | Currently generating | Wait and poll again (5-30 seconds) |
| `SUCCESS` | Completed successfully | Access audio_url and metadata |
| `FAILED` | Generation failed | Check error_message |

#### Polling Strategy

**Recommended Polling Intervals:**
- First 30 seconds: Poll every **5 seconds**
- 30-120 seconds: Poll every **10 seconds**
- After 2 minutes: Poll every **15-30 seconds**
- Timeout after: **5 minutes**

**Example Polling Loop (Pseudocode):**
```python
async def wait_for_completion(task_id):
    start_time = time.now()
    max_wait = 300  # 5 minutes

    while time.now() - start_time < max_wait:
        result = await get_audio_info([task_id])

        if result.data[0].status == "SUCCESS":
            return result.data[0]
        elif result.data[0].status == "FAILED":
            raise Exception(result.data[0].error_message)

        # Dynamic polling interval
        elapsed = time.now() - start_time
        if elapsed < 30:
            await sleep(5)
        elif elapsed < 120:
            await sleep(10)
        else:
            await sleep(15)

    raise TimeoutError("Generation took too long")
```

#### Error Responses

```json
{
  "success": false,
  "error": "Please provide at least one task ID"
}
```

```json
{
  "success": false,
  "error": "Task not found: task_xyz789"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:137-162`, `src/suno-client.ts:195-226`

**API Endpoint:** `GET /generate/record-info?taskId={taskId}`

**Behavior:**
- Queries each task ID sequentially
- Returns all results in a single array
- Includes partial results even if some tasks fail
- Empty results for non-existent task IDs

---

### 4. `get_credits`

**Check remaining API credits/quota for the current API key**.

#### Description

Returns the number of credits remaining in your Suno API account. Essential for budget management and preventing mid-workflow failures due to insufficient credits.

#### Parameters

No parameters required.

#### Use Cases

1. **Budget Management**
   - Monitor credit usage
   - Alert before depletion
   - Track costs over time

2. **Workflow Planning**
   - Check credits before batch operations
   - Calculate remaining capacity
   - Prevent failed operations

3. **Account Health Check**
   - Verify API key validity
   - Confirm account status
   - Troubleshoot auth issues

#### Examples

##### Example 1: Check Credits
```typescript
{}  // No parameters
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credits_left": 450
  },
  "message": "You have 450 credits remaining"
}
```

##### Example 2: Low Credits Warning
```typescript
{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credits_left": 15
  },
  "message": "You have 15 credits remaining"
}
```

#### Credit Costs

**Estimated Credit Usage:**
- Basic generation: **10-20 credits** per track
- Custom generation: **15-25 credits** per track
- Stem separation: **5-10 credits** per track
- Lyrics generation: **2-5 credits** per request
- Extended tracks (V4_5+): **20-30 credits** per track

**Note:** Actual costs may vary based on model version, track length, and features used.

#### Best Practices

**Before Batch Operations:**
```python
# Check credits before generating multiple tracks
credits = await get_credits()
tracks_to_generate = 10
estimated_cost = tracks_to_generate * 20  # Assume 20 credits per track

if credits.data.credits_left < estimated_cost:
    print(f"Insufficient credits: {credits.data.credits_left} < {estimated_cost}")
    print("Please purchase more credits at https://sunoapi.org/pricing")
    return

# Proceed with batch generation
for i in range(tracks_to_generate):
    await generate_music(...)
```

**Set Up Credit Alerts:**
```python
async def check_credit_health():
    credits = await get_credits()
    remaining = credits.data.credits_left

    if remaining < 50:
        alert("CRITICAL: Less than 50 credits remaining")
    elif remaining < 200:
        warn("WARNING: Less than 200 credits remaining")

    return remaining
```

#### Error Responses

```json
{
  "success": false,
  "error": "API Error: Invalid API key"
}
```

```json
{
  "success": false,
  "error": "API Error: Account suspended"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:167-190`, `src/suno-client.ts:231-246`

**API Endpoint:** `GET /generate/credit`

**Response Format:**
```json
{
  "code": 200,
  "msg": "success",
  "data": 450  // Credit count
}
```

---

## Lyrics Tools

### 5. `generate_lyrics`

**Generate song lyrics from a text prompt**.

#### Description

Creates song lyrics based on a theme, topic, or style description. Perfect for lyric-first workflows where you want to review and approve lyrics before generating music.

#### Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `prompt` | string | ✅ Yes | 1-5000 chars | Theme or topic for lyrics (e.g., "a love song about the ocean") |

#### Use Cases

1. **Lyric-First Composition**
   - Review lyrics before music generation
   - Edit AI-generated lyrics
   - Collaborate on songwriting

2. **Content Planning**
   - Generate multiple lyric variants
   - Compare different themes
   - A/B test song concepts

3. **Lyric Inspiration**
   - Overcome writer's block
   - Explore new themes
   - Generate ideas for refinement

#### Examples

##### Example 1: Love Song Lyrics
```typescript
{
  "prompt": "a romantic love song about meeting someone at a coffee shop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lyrics": "[Verse 1]\nMorning light through the window pane\nCoffee steam and gentle rain\nThen you walked in with that smile\nMade me forget the world for a while\n\n[Chorus]\nCoffee shop romance, unexpected chance\nTwo strangers sharing glances\nIn this moment, time stands still\nMaybe fate, maybe free will\n\n[Verse 2]\nYour latte art, my cappuccino\nConversations flow like a gentle meadow\nHours pass like minutes do\nWhen I'm sitting here with you\n\n[Chorus]\nCoffee shop romance, unexpected chance\nTwo strangers sharing glances\nIn this moment, time stands still\nMaybe fate, maybe free will\n\n[Bridge]\nWill you be here tomorrow?\nSame time, same seat, same sorrow\nOf leaving you behind\nBut hope that you'll be mine\n\n[Outro]\nPhone numbers on a napkin thin\nThis is where our story begins"
  },
  "message": "Lyrics generated successfully"
}
```

##### Example 2: Upbeat Party Song
```typescript
{
  "prompt": "energetic dance song about celebrating life and having fun with friends"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lyrics": "[Verse 1]\nLights are flashing, bass is pumping\nFeet are moving, hearts are jumping\nFriends around me, feeling right\nGonna dance until the morning light\n\n[Pre-Chorus]\nRaise your hands up to the sky\nLet the music take you high\n\n[Chorus]\nThis is our night, our time to shine\nLiving life like it's by design\nDance, dance, dance till we can't stand\nLife is good with friends in hand\n\n[Verse 2]\nWorries fade when the beat drops low\nEvery moment, letting go\nSmiling faces all around\nLost in this electric sound\n\n[Pre-Chorus]\nRaise your hands up to the sky\nLet the music take you high\n\n[Chorus]\nThis is our night, our time to shine\nLiving life like it's by design\nDance, dance, dance till we can't stand\nLife is good with friends in hand\n\n[Bridge]\nMemories we're making now\nWill last forever, somehow\n\n[Chorus]\nThis is our night, our time to shine\nLiving life like it's by design\nDance, dance, dance till we can't stand\nLife is good with friends in hand"
  },
  "message": "Lyrics generated successfully"
}
```

##### Example 3: Storytelling Ballad
```typescript
{
  "prompt": "a sad ballad about a sailor who never returned home from the sea"
}
```

#### Typical Lyric Structure

Generated lyrics typically include:
- **[Verse 1]** - Sets the scene (4-8 lines)
- **[Chorus]** - Main hook/message (4-6 lines)
- **[Verse 2]** - Develops the story (4-8 lines)
- **[Chorus]** - Repeated (same or variation)
- **[Bridge]** - Contrast/twist (2-4 lines)
- **[Chorus]** or **[Outro]** - Resolution

#### Prompt Engineering Tips

**Effective Prompts Include:**
1. **Emotion/Mood**: "sad", "joyful", "nostalgic", "energetic"
2. **Theme/Topic**: "love", "adventure", "loss", "celebration"
3. **Perspective**: "first-person reflection", "storytelling", "addressing someone"
4. **Context**: "coffee shop", "at sea", "in the city", "childhood memories"

**Example Prompts:**
- ✅ "a melancholic indie folk song about leaving your hometown"
- ✅ "upbeat hip-hop about overcoming challenges and success"
- ✅ "a gentle lullaby about stars and dreams for a child"
- ❌ "song" (too vague)
- ❌ "music with words" (no direction)

#### Post-Processing Workflow

```python
async def generate_and_refine_lyrics(prompt):
    # 1. Generate initial lyrics
    result = await generate_lyrics(prompt)
    lyrics = result.data.lyrics

    # 2. Present to user for review
    print("Generated Lyrics:")
    print(lyrics)
    print("\nWould you like to:")
    print("1. Use as-is")
    print("2. Generate new variant")
    print("3. Edit manually")

    choice = input("Your choice: ")

    if choice == "1":
        return lyrics
    elif choice == "2":
        # Generate alternative
        return await generate_lyrics(prompt)
    else:
        # Manual editing
        edited = input("Paste edited lyrics:\n")
        return edited
```

#### Error Responses

```json
{
  "success": false,
  "error": "Lyrics generation timeout"
}
```

```json
{
  "success": false,
  "error": "API Error: Inappropriate content detected"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:199-224`, `src/suno-client.ts:251-287`

**API Endpoint:** `POST /lyrics`

**Generation Time:** 10-60 seconds (auto-waits for completion)

**Polling:** Every **3 seconds** with **60 second** timeout

---

### 6. `get_timestamped_lyrics`

**Get lyrics with timestamps for a generated song** - perfect for karaoke and subtitles.

#### Description

Retrieves synchronized lyrics with precise timestamps for each line or word. Essential for creating karaoke videos, lyric videos, or real-time lyric display.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `song_id` | string | ✅ Yes | Song/task ID from a completed generation |

#### Use Cases

1. **Karaoke Creation**
   - Sync lyrics to music
   - Create karaoke videos
   - Build karaoke apps

2. **Lyric Videos**
   - Animated text overlays
   - Word-by-word highlighting
   - Professional music videos

3. **Accessibility**
   - Closed captions
   - Real-time subtitles
   - Assisted listening

4. **Music Analysis**
   - Study vocal timing
   - Analyze song structure
   - Educational purposes

#### Examples

##### Example 1: Get Timestamped Lyrics
```typescript
{
  "song_id": "8551abcd662c"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lyrics": [
      {
        "timestamp": 0.0,
        "text": "[Intro]",
        "duration": 3.5
      },
      {
        "timestamp": 3.5,
        "text": "Verse 1",
        "duration": 0.8
      },
      {
        "timestamp": 4.3,
        "text": "Walking down the neon streets",
        "duration": 3.2,
        "words": [
          {"word": "Walking", "start": 4.3, "end": 4.8},
          {"word": "down", "start": 4.8, "end": 5.0},
          {"word": "the", "start": 5.0, "end": 5.1},
          {"word": "neon", "start": 5.1, "end": 5.6},
          {"word": "streets", "start": 5.6, "end": 6.5}
        ]
      },
      {
        "timestamp": 7.5,
        "text": "City lights beneath my feet",
        "duration": 3.0,
        "words": [
          {"word": "City", "start": 7.5, "end": 7.9},
          {"word": "lights", "start": 7.9, "end": 8.4},
          {"word": "beneath", "start": 8.4, "end": 8.9},
          {"word": "my", "start": 8.9, "end": 9.1},
          {"word": "feet", "start": 9.1, "end": 9.5}
        ]
      },
      {
        "timestamp": 10.5,
        "text": "[Chorus]",
        "duration": 1.0
      },
      {
        "timestamp": 11.5,
        "text": "Dreaming in electric blue",
        "duration": 3.5,
        "words": [
          {"word": "Dreaming", "start": 11.5, "end": 12.1},
          {"word": "in", "start": 12.1, "end": 12.3},
          {"word": "electric", "start": 12.3, "end": 13.0},
          {"word": "blue", "start": 13.0, "end": 14.0}
        ]
      }
    ],
    "total_duration": 215.67,
    "song_id": "8551abcd662c"
  },
  "message": "Retrieved timestamped lyrics"
}
```

#### Data Structure

**Timestamp Object:**
```typescript
{
  timestamp: number;      // Start time in seconds
  text: string;          // Lyric line text
  duration: number;      // Duration of this line
  words?: Array<{        // Optional word-level timestamps
    word: string;
    start: number;       // Word start time
    end: number;         // Word end time
  }>;
}
```

#### Usage Example: Karaoke Display

```python
async def display_karaoke(song_id, audio_url):
    # Get timestamped lyrics
    result = await get_timestamped_lyrics(song_id)
    lyrics_data = result.data.lyrics

    # Start audio playback
    audio = play_audio(audio_url)
    start_time = time.now()

    # Display lyrics in real-time
    for lyric in lyrics_data:
        # Wait until this line's timestamp
        while (time.now() - start_time) < lyric.timestamp:
            await sleep(0.1)

        # Display the line
        if lyric.words:
            # Word-by-word display
            for word in lyric.words:
                while (time.now() - start_time) < word.start:
                    await sleep(0.05)
                display_word(word.word, highlighted=True)
        else:
            # Line-by-line display
            display_line(lyric.text, highlighted=True)
```

#### Subtitle File Formats

**SRT (SubRip) Format:**
```python
def export_srt(lyrics_data):
    srt_content = ""
    for i, lyric in enumerate(lyrics_data.lyrics):
        srt_content += f"{i + 1}\n"

        start_time = format_timestamp(lyric.timestamp)
        end_time = format_timestamp(lyric.timestamp + lyric.duration)

        srt_content += f"{start_time} --> {end_time}\n"
        srt_content += f"{lyric.text}\n\n"

    return srt_content

def format_timestamp(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
```

**LRC (Lyric) Format:**
```python
def export_lrc(lyrics_data):
    lrc_content = "[ti:Song Title]\n[ar:Artist Name]\n[al:Album Name]\n\n"

    for lyric in lyrics_data.lyrics:
        timestamp = format_lrc_timestamp(lyric.timestamp)
        lrc_content += f"{timestamp}{lyric.text}\n"

    return lrc_content

def format_lrc_timestamp(seconds):
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"[{minutes:02d}:{secs:05.2f}]"
```

#### Error Responses

```json
{
  "success": false,
  "error": "API Error: Lyrics not available for instrumental tracks"
}
```

```json
{
  "success": false,
  "error": "Song not found or still generating"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:229-254`, `src/suno-client.ts:321-334`

**API Endpoint:** `GET /get-timestamped-lyrics?taskId={songId}&audioId={songId}`

**Availability:** Only for songs with vocals (not instrumental)

---

## Audio Processing Tools

### 7. `generate_stems`

**Separate vocals and instruments from a song** - extract isolated vocal and instrumental tracks.

#### Description

Creates isolated vocal and instrumental tracks from a generated song. Uses AI-powered source separation to extract clean stems suitable for remixing, karaoke, or audio analysis.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `song_id` | string | ✅ Yes | Song/task ID from a completed generation |

#### Use Cases

1. **Remixing & Production**
   - Extract vocals for remixes
   - Isolate instrumentals for DJ sets
   - Create mashups and edits

2. **Karaoke Creation**
   - Remove vocals for backing tracks
   - Create karaoke versions
   - Instrumental practice tracks

3. **Music Education**
   - Study individual elements
   - Vocal technique analysis
   - Instrumental arrangement study

4. **Content Creation**
   - Acapella clips for videos
   - Instrumental backgrounds
   - Podcast intro/outro music

#### Examples

##### Example 1: Extract Stems for Remix
```typescript
{
  "song_id": "8551abcd662c"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "stem_task_xyz789",
      "status": "GENERATING",
      "created_at": "2025-01-15T12:00:00.000Z",
      "model_name": ""
    }
  ],
  "message": "Stem separation started. Use get_audio_info to check status."
}
```

**Then check with get_audio_info:**
```typescript
{
  "task_ids": ["stem_task_xyz789"]
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": [
    {
      "id": "stem_task_xyz789",
      "status": "SUCCESS",
      "stems": {
        "vocals": {
          "url": "https://cdn.sunoapi.org/stems/8551abcd662c_vocals.mp3",
          "duration": "215.67",
          "format": "mp3",
          "bitrate": "320kbps"
        },
        "instrumental": {
          "url": "https://cdn.sunoapi.org/stems/8551abcd662c_instrumental.mp3",
          "duration": "215.67",
          "format": "mp3",
          "bitrate": "320kbps"
        }
      },
      "original_song_id": "8551abcd662c",
      "created_at": "2025-01-15T12:00:00.000Z",
      "completed_at": "2025-01-15T12:02:30.000Z"
    }
  ],
  "message": "Retrieved information for 1 task(s)"
}
```

#### Stem Quality

**Separation Quality Factors:**
- **Model Used**: V4+ generally has better separation
- **Original Mix**: Clean mixes separate better
- **Frequency Overlap**: Less overlap = cleaner separation
- **Vocal Clarity**: Clear vocals separate more effectively

**Typical Quality Metrics:**
- **SDR (Signal-to-Distortion Ratio)**: 8-12 dB
- **SIR (Signal-to-Interference Ratio)**: 12-18 dB
- **SAR (Signal-to-Artifacts Ratio)**: 10-15 dB

#### Workflow Examples

**Example 1: Create Karaoke Version**
```python
async def create_karaoke(song_id):
    # 1. Generate stems
    stem_task = await generate_stems(song_id)
    stem_task_id = stem_task.data[0].id

    # 2. Wait for completion
    while True:
        result = await get_audio_info([stem_task_id])
        if result.data[0].status == "SUCCESS":
            break
        await sleep(10)

    # 3. Download instrumental
    instrumental_url = result.data[0].stems.instrumental.url
    download_audio(instrumental_url, "karaoke_track.mp3")

    # 4. Get timestamped lyrics
    lyrics = await get_timestamped_lyrics(song_id)

    # 5. Combine into karaoke video
    create_karaoke_video(
        audio="karaoke_track.mp3",
        lyrics=lyrics.data
    )
```

**Example 2: Vocal Analysis**
```python
async def analyze_vocals(song_id):
    # Extract vocal stem
    stem_task = await generate_stems(song_id)

    # Wait and retrieve
    vocal_url = await wait_for_stem(stem_task.data[0].id)

    # Download and analyze
    vocal_audio = download_audio(vocal_url)

    # Analyze pitch, timing, dynamics
    pitch_data = analyze_pitch(vocal_audio)
    timing_data = analyze_timing(vocal_audio)
    dynamics_data = analyze_dynamics(vocal_audio)

    return {
        "pitch": pitch_data,
        "timing": timing_data,
        "dynamics": dynamics_data
    }
```

#### Processing Time

**Typical Stem Separation Times:**
- 2-minute track: **20-40 seconds**
- 4-minute track: **40-80 seconds**
- 8-minute track: **80-160 seconds**

**Factors Affecting Speed:**
- Track length (proportional)
- API load (varies)
- Model complexity (V5 may be faster)

#### Error Responses

```json
{
  "success": false,
  "error": "Cannot generate stems for instrumental tracks"
}
```

```json
{
  "success": false,
  "error": "Song must be completed before stem separation"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:263-288`, `src/suno-client.ts:292-316`

**API Endpoint:** `POST /vocal-removal/generate`

**Payload:**
```json
{
  "taskId": "8551abcd662c",
  "audioId": "8551abcd662c"
}
```

**Output Formats:**
- MP3 (320kbps) - Default
- Stereo, 44.1kHz sample rate

---

### 15. `upload_file_from_url`

**Upload audio file from a public URL to Suno API storage**. 🆕

#### Description

Downloads an audio file from a publicly accessible URL and stores it in the Suno API system for use in other operations. This is essential for importing external audio files into Suno workflows, enabling style transformation, vocal addition, and instrumental generation on user-provided audio.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_url` | string (URL) | Yes | Public URL of audio file to upload. Must be publicly accessible without authentication. Supported formats: MP3, WAV, FLAC, OGG. Maximum size: 10MB. |

#### Use Cases

1. **Prepare External Audio for Style Transformation**
   - Upload audio from external source
   - Use stored URL with `upload_cover` for style transformation
   - Perfect for genre experiments and remixes

2. **Import Audio for Vocal Addition**
   - Upload instrumental track from URL
   - Use with `add_vocals` to add AI-generated vocals
   - Create vocal versions of instrumental tracks

3. **Batch Processing from External Sources**
   - Upload multiple audio files from content repositories
   - Convert external URLs to Suno-compatible references
   - Automate audio import workflows

4. **Convert External URLs to Suno References**
   - Transform any public audio URL into Suno storage
   - Enable use in other Suno API operations
   - Simplify workflow integration

#### Example Usage

**Basic Upload:**
```json
{
  "file_url": "https://example.com/audio/track.mp3"
}
```

**Upload for Style Transformation:**
```json
{
  "file_url": "https://mysite.com/original-instrumental.wav"
}
```

#### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "storedUrl": "https://cdn.suno.ai/...",
    "fileName": "track.mp3",
    "fileSize": 4523167,
    "duration": "3:45",
    "format": "mp3"
  },
  "message": "File uploaded successfully from URL"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to download file from URL: Network timeout"
}
```

#### Common Errors

- **URL Not Accessible**: File URL requires authentication or is not publicly accessible
- **File Too Large**: Audio file exceeds 10MB maximum size
- **Unsupported Format**: File format is not MP3, WAV, FLAC, or OGG
- **Network Error**: Failed to download file from the provided URL
- **Invalid URL**: Malformed or invalid URL provided

#### Requirements

- ✅ URL must be publicly accessible (no authentication)
- ✅ Supported formats: MP3, WAV, FLAC, OGG
- ✅ Maximum file size: 10MB
- ✅ URL must return valid audio content
- ✅ Stable internet connection for download

#### Workflow Integration

**Example: Upload and Transform Workflow**
```text
1. upload_file_from_url
   └─> Get stored URL

2. upload_cover (using stored URL)
   └─> Transform to new style

3. get_audio_info
   └─> Check transformation status
```

**Example: Upload and Add Vocals Workflow**
```text
1. upload_file_from_url (instrumental track)
   └─> Get stored URL

2. add_vocals (using stored URL)
   └─> Add AI-generated vocals

3. get_audio_info
   └─> Check generation status
```

#### Best Practices

1. **Verify URL Accessibility**: Ensure URL is publicly accessible before calling
2. **Check File Size**: Verify file is under 10MB limit
3. **Use Supported Formats**: Convert to MP3/WAV/FLAC/OGG if needed
4. **Handle Errors Gracefully**: Implement retry logic for network errors
5. **Store Result**: Save the stored URL for use in subsequent operations

#### Performance

- **Upload Time**: 5-30 seconds (depending on file size and network speed)
- **Storage**: Files are stored temporarily for use in API operations
- **Credits**: No credits consumed for file upload (credits used in subsequent operations)

#### Notes

- Files are stored temporarily and may be cleaned up after processing
- The stored URL returned can be used immediately in other API calls
- This is a prerequisite step for using external audio in Suno workflows
- Does not perform any audio transformation - only storage

---

## Utility Tools

### 16. `list_models`

**Get information about available Suno AI music generation models and their capabilities**.

#### Description

Returns a comprehensive list of all available Suno AI models with details about their features, limitations, and recommended use cases. Essential for model selection and understanding capabilities.

#### Parameters

No parameters required.

#### Use Cases

1. **Model Selection**
   - Choose appropriate model for task
   - Compare model capabilities
   - Understand quality trade-offs

2. **Documentation & Help**
   - Provide users with model info
   - Build model selection UIs
   - Educational resources

3. **Feature Discovery**
   - Learn about new models
   - Understand version differences
   - Stay updated on capabilities

#### Examples

##### Example 1: List All Models
```typescript
{}  // No parameters
```

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "V3_5",
        "name": "Chirp v3.5",
        "max_duration": "4 minutes",
        "description": "Balanced model with creative diversity"
      },
      {
        "id": "V4",
        "name": "Chirp v4",
        "max_duration": "4 minutes",
        "description": "Best audio quality with refined structure"
      },
      {
        "id": "V4_5",
        "name": "Chirp v4.5",
        "max_duration": "8 minutes",
        "description": "Advanced features with superior audio blending"
      },
      {
        "id": "V4_5PLUS",
        "name": "Chirp v4.5 Plus",
        "max_duration": "8 minutes",
        "description": "Richer sound with new creative capabilities"
      },
      {
        "id": "V5",
        "name": "Chirp v5",
        "max_duration": "8 minutes",
        "description": "Superior musicality with faster generation"
      }
    ],
    "default": "V3_5"
  },
  "message": "5 models available"
}
```

#### Model Comparison

| Model | Max Duration | Quality | Speed | Credits | Best For |
|-------|--------------|---------|-------|---------|----------|
| **V3_5** | 4 min | Good | Fast | 10-15 | Quick drafts, exploration |
| **V4** | 4 min | Excellent | Medium | 15-20 | High-quality short tracks |
| **V4_5** | 8 min | Excellent | Medium | 20-25 | Long-form, complex arrangements |
| **V4_5PLUS** | 8 min | Superior | Slow | 25-30 | Professional production |
| **V5** | 8 min | Superior | Fast | 15-25 | Best balance of quality & speed |

#### Detailed Model Features

**V3_5 (Chirp v3.5)**
- ✅ Fast generation (~60-90 seconds)
- ✅ Creative and diverse outputs
- ✅ Low credit cost
- ⚠️ 4-minute limit
- ⚠️ Less control over structure
- **Use for**: Rapid prototyping, idea generation

**V4 (Chirp v4)**
- ✅ Excellent audio fidelity
- ✅ Better structure and coherence
- ✅ Improved vocal quality
- ⚠️ 4-minute limit
- ⚠️ Moderate generation time
- **Use for**: Professional short tracks, singles

**V4_5 (Chirp v4.5)**
- ✅ 8-minute tracks
- ✅ Superior audio blending
- ✅ Advanced arrangement features
- ✅ Better genre adherence
- ⚠️ Higher credit cost
- **Use for**: Long-form compositions, complex arrangements

**V4_5PLUS (Chirp v4.5 Plus)**
- ✅ Richest sound quality
- ✅ Most creative capabilities
- ✅ 8-minute tracks
- ✅ Best for experimental genres
- ⚠️ Highest credit cost
- ⚠️ Slower generation
- **Use for**: Experimental music, artistic projects

**V5 (Chirp v5) - Latest**
- ✅ Superior musicality
- ✅ Fastest long-form generation
- ✅ Best balance of quality and speed
- ✅ 8-minute tracks
- ✅ Improved prompt understanding
- **Use for**: Production-ready tracks, professional use

#### Model Selection Guide

**Decision Tree:**
```text
Need quick results?
├─ Yes → V3_5 or V5
└─ No → Continue

Need 8-minute tracks?
├─ Yes → V4_5, V4_5PLUS, or V5
└─ No → V3_5 or V4

Maximum quality required?
├─ Yes → V4_5PLUS or V5
└─ No → V4 or V4_5

Budget conscious?
├─ Yes → V3_5 or V5
└─ No → Any model

Experimental/artistic?
├─ Yes → V4_5PLUS
└─ No → V5 (best all-around)
```

#### Best Practices

**For Production:**
1. Start with V3_5 for drafts and concepts
2. Refine with V5 for final tracks
3. Use V4_5PLUS for experimental pieces

**For Content Creation:**
1. V3_5 for rapid content generation
2. V5 for higher-quality final exports

**For Budget Management:**
1. Test prompts with V3_5
2. Generate finals with V4 or V5
3. Reserve V4_5PLUS for special projects

#### Error Responses

This tool always succeeds (returns hardcoded model list).

#### Implementation Details

**Source Code Reference:** `src/index.ts:297-343`

**Data Source:** Hardcoded in server (models don't change frequently)

**Legacy Model Names:**
- Server automatically maps `chirp-v3-5` → `V3_5`, etc.
- Both formats accepted in generation tools

---

### 17. `get_api_status`

**Check if the Suno API is accessible and get current configuration**.

#### Description

Performs a comprehensive health check of the Suno API connection, validates the API key, and returns system status information. Essential for troubleshooting and monitoring.

#### Parameters

No parameters required.

#### Use Cases

1. **Health Monitoring**
   - Verify API availability
   - Check service status
   - Monitor uptime

2. **API Key Validation**
   - Confirm key is valid
   - Test new API keys
   - Troubleshoot auth issues

3. **Troubleshooting**
   - Diagnose connection problems
   - Verify configuration
   - Debug failed requests

4. **Setup Verification**
   - Confirm proper setup
   - Validate environment
   - Test before batch operations

#### Examples

##### Example 1: Check API Status (Healthy)
```typescript
{}  // No parameters
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "api_key_valid": true,
    "credits_remaining": 450,
    "base_url": "https://api.sunoapi.org/api/v1"
  },
  "message": "API is operational"
}
```

##### Example 2: Check API Status (Invalid Key)
```typescript
{}
```

**Response:**
```json
{
  "success": false,
  "data": {
    "status": "error",
    "api_key_valid": false
  },
  "error": "API Error: Invalid API key"
}
```

##### Example 3: Check API Status (Network Issue)
```typescript
{}
```

**Response:**
```json
{
  "success": false,
  "data": {
    "status": "error",
    "api_key_valid": false
  },
  "error": "Network error: ECONNREFUSED"
}
```

#### Status Codes

| Status | API Key Valid | Credits | Meaning |
|--------|---------------|---------|---------|
| `operational` | ✅ `true` | Number | All systems go |
| `error` | ❌ `false` | - | API key invalid or network error |
| `degraded` | ✅ `true` | 0 | Valid key but no credits |

#### Health Check Mechanism

The tool performs the following checks:
1. **Network Connectivity**: Can reach API endpoint
2. **Authentication**: API key is valid
3. **Authorization**: Key has permissions
4. **Service Availability**: API returns expected responses
5. **Account Status**: Credits remaining

**Implementation:**
```typescript
// Internally calls get_credits as a comprehensive health check
const credits = await sunoClient.getCredits();

// If successful:
return {
  status: "operational",
  api_key_valid: true,
  credits_remaining: credits.credits_left
}

// If failed:
return {
  status: "error",
  api_key_valid: false,
  error: error.message
}
```

#### Monitoring Integration

**Example: Status Dashboard**
```python
async def monitor_api_health():
    try:
        status = await get_api_status()

        if status.success:
            log_metric("suno_api_status", 1)  # Healthy
            log_metric("suno_credits", status.data.credits_remaining)

            if status.data.credits_remaining < 100:
                send_alert("Low credits warning", "critical")
        else:
            log_metric("suno_api_status", 0)  # Unhealthy
            send_alert(f"API Error: {status.error}", "critical")

    except Exception as e:
        log_metric("suno_api_status", 0)
        send_alert(f"Health check failed: {e}", "critical")

# Run every 5 minutes
schedule.every(5).minutes.do(monitor_api_health)
```

**Example: Startup Validation**
```python
async def startup_check():
    print("Validating Suno API configuration...")

    status = await get_api_status()

    if not status.success:
        print(f"❌ API check failed: {status.error}")
        print("Please verify your SUNO_API_KEY environment variable")
        sys.exit(1)

    if status.data.credits_remaining < 10:
        print(f"⚠️  Warning: Only {status.data.credits_remaining} credits remaining")
        print("Consider purchasing more at https://sunoapi.org/pricing")

    print(f"✅ API operational - {status.data.credits_remaining} credits available")

# Call before starting main application
await startup_check()
```

#### Troubleshooting Guide

**Issue: API Key Invalid**
```bash
Error: "API Error: Invalid API key"

Solutions:
1. Verify SUNO_API_KEY in .env file
2. Get new key from https://sunoapi.org/api-key
3. Check for trailing spaces or quotes
4. Ensure key starts with correct prefix
```

**Issue: Network Error**
```bash
Error: "Network error: ECONNREFUSED"

Solutions:
1. Check internet connection
2. Verify firewall settings
3. Test with: curl https://api.sunoapi.org/api/v1/generate/credit
4. Check if API is down: https://status.sunoapi.org
```

**Issue: Timeout**
```bash
Error: "Request timeout after 30000ms"

Solutions:
1. Check network speed
2. Try again (may be temporary)
3. Increase timeout in client configuration
4. Contact Suno API support
```

#### Error Responses

```json
{
  "success": false,
  "data": {
    "status": "error",
    "api_key_valid": false
  },
  "error": "API Error: Unauthorized - Invalid API key format"
}
```

```json
{
  "success": false,
  "data": {
    "status": "error",
    "api_key_valid": false
  },
  "error": "Network error: getaddrinfo ENOTFOUND api.sunoapi.org"
}
```

#### Implementation Details

**Source Code Reference:** `src/index.ts:348-380`

**Health Check Method:** Calls `getCredits()` API

**Timeout:** 30 seconds

**Best Practice:** Call this tool before starting batch operations or during server startup

---

## Advanced Workflows

### Workflow 1: Full Music Production Pipeline

**Scenario:** Create a professional track from concept to final export

```python
async def full_production_pipeline(concept):
    # Step 1: Check API health and credits
    print("Checking API status...")
    status = await get_api_status()
    if not status.success or status.data.credits_remaining < 50:
        raise Exception("Insufficient credits or API unavailable")

    # Step 2: Generate initial lyrics
    print("Generating lyrics...")
    lyrics_result = await generate_lyrics(
        prompt=f"{concept} - emotional, storytelling style"
    )
    lyrics = lyrics_result.data.lyrics

    # Step 3: Review and optionally edit lyrics
    print(f"Generated Lyrics:\n{lyrics}\n")
    if input("Edit lyrics? (y/n): ") == "y":
        lyrics = input("Paste edited lyrics:\n")

    # Step 4: Generate music with custom parameters
    print("Generating music (V5 model)...")
    music_result = await generate_custom_music(
        prompt=lyrics,
        style="indie folk, acoustic guitar, male vocals, emotional",
        title=concept.title(),
        make_instrumental=False,
        model="V5",
        wait_audio=False,
        negative_tags="electronic, heavy drums"
    )

    task_id = music_result.data[0].id
    print(f"Task started: {task_id}")

    # Step 5: Poll for completion
    print("Waiting for generation...")
    while True:
        info = await get_audio_info([task_id])
        status_obj = info.data[0]

        if status_obj.status == "SUCCESS":
            print("✅ Music generated successfully!")
            break
        elif status_obj.status == "FAILED":
            raise Exception(f"Generation failed: {status_obj.error_message}")

        print(f"Status: {status_obj.status}...")
        await asyncio.sleep(10)

    # Step 6: Get audio details
    audio_url = status_obj.audio_url
    song_id = status_obj.id

    # Step 7: Generate stems for remixing
    print("Generating stems...")
    stems_result = await generate_stems(song_id)
    stem_task_id = stems_result.data[0].id

    # Wait for stems
    while True:
        stem_info = await get_audio_info([stem_task_id])
        if stem_info.data[0].status == "SUCCESS":
            break
        await asyncio.sleep(10)

    # Step 8: Get timestamped lyrics
    print("Fetching timestamped lyrics...")
    timed_lyrics = await get_timestamped_lyrics(song_id)

    # Step 9: Export everything
    export_data = {
        "original_audio": audio_url,
        "vocals_stem": stem_info.data[0].stems.vocals.url,
        "instrumental_stem": stem_info.data[0].stems.instrumental.url,
        "lyrics": lyrics,
        "timestamped_lyrics": timed_lyrics.data,
        "metadata": {
            "title": concept.title(),
            "duration": status_obj.duration,
            "model": status_obj.model_name,
            "tags": status_obj.tags
        }
    }

    print(f"\n✅ Production complete!")
    print(f"Audio: {audio_url}")
    print(f"Credits used: ~30")
    print(f"Credits remaining: {(await get_credits()).data.credits_left}")

    return export_data
```

### Workflow 2: Batch Music Generation

**Scenario:** Generate multiple tracks with different variations

```python
async def batch_generate(prompts, style_template):
    # Pre-flight check
    status = await get_api_status()
    estimated_credits = len(prompts) * 20

    if status.data.credits_remaining < estimated_credits:
        raise Exception(f"Need {estimated_credits} credits, have {status.data.credits_remaining}")

    # Start all generations
    tasks = []
    for i, prompt in enumerate(prompts):
        print(f"Starting generation {i+1}/{len(prompts)}: {prompt[:50]}...")

        result = await generate_music(
            prompt=prompt,
            make_instrumental=False,
            model="V5",
            wait_audio=False
        )

        tasks.append({
            "task_id": result.data[0].id,
            "prompt": prompt,
            "index": i
        })

        # Rate limiting: wait 2 seconds between requests
        await asyncio.sleep(2)

    print(f"\n{len(tasks)} generations started!")

    # Poll for completion
    completed = []
    while len(completed) < len(tasks):
        # Check all incomplete tasks
        incomplete_ids = [t["task_id"] for t in tasks if t not in completed]

        if incomplete_ids:
            results = await get_audio_info(incomplete_ids)

            for result in results.data:
                if result.status == "SUCCESS":
                    # Find the task
                    task = next(t for t in tasks if t["task_id"] == result.id)
                    completed.append(task)

                    print(f"✅ [{len(completed)}/{len(tasks)}] {task['prompt'][:50]}")
                    print(f"   Audio: {result.audio_url}")
                elif result.status == "FAILED":
                    task = next(t for t in tasks if t["task_id"] == result.id)
                    print(f"❌ Failed: {task['prompt'][:50]}")
                    completed.append(task)  # Mark as done (failed)

        if len(completed) < len(tasks):
            await asyncio.sleep(15)

    print(f"\n✅ Batch complete! Generated {len(tasks)} tracks")

    # Final credit check
    final_credits = await get_credits()
    credits_used = status.data.credits_remaining - final_credits.data.credits_left
    print(f"Credits used: {credits_used}")
    print(f"Credits remaining: {final_credits.data.credits_left}")
```

### Workflow 3: A/B Testing Different Styles

**Scenario:** Test the same prompt with different musical styles

```python
async def ab_test_styles(base_prompt, styles, title_base):
    results = []

    for i, style in enumerate(styles):
        print(f"\nGenerating variant {i+1}: {style}")

        result = await generate_custom_music(
            prompt=base_prompt,
            style=style,
            title=f"{title_base} (Style {i+1})",
            make_instrumental=False,
            model="V4_5",
            wait_audio=True  # Wait for each to complete
        )

        audio_info = result.data[0]
        results.append({
            "style": style,
            "audio_url": audio_info.audio_url,
            "duration": audio_info.duration,
            "title": audio_info.title
        })

        print(f"✅ Generated: {audio_info.title}")
        print(f"   Listen: {audio_info.audio_url}")

    # Present results
    print("\n" + "="*60)
    print("A/B TEST RESULTS")
    print("="*60)

    for i, result in enumerate(results):
        print(f"\nVariant {i+1}:")
        print(f"Style: {result['style']}")
        print(f"Audio: {result['audio_url']}")

    return results
```

### Workflow 4: Karaoke Video Creation

**Scenario:** Generate music and create a karaoke video

```python
async def create_karaoke_video(prompt, style, title):
    # Step 1: Generate music
    music = await generate_custom_music(
        prompt=prompt,
        style=style,
        title=title,
        make_instrumental=False,
        model="V4",
        wait_audio=True
    )

    song_id = music.data[0].id
    original_audio = music.data[0].audio_url

    # Step 2: Generate instrumental stem
    stems = await generate_stems(song_id)
    stem_task_id = stems.data[0].id

    # Wait for stems
    while True:
        stem_info = await get_audio_info([stem_task_id])
        if stem_info.data[0].status == "SUCCESS":
            break
        await asyncio.sleep(10)

    instrumental_url = stem_info.data[0].stems.instrumental.url

    # Step 3: Get timestamped lyrics
    timed_lyrics = await get_timestamped_lyrics(song_id)

    # Step 4: Download audio
    instrumental_path = download_audio(instrumental_url, "karaoke_audio.mp3")

    # Step 5: Create video with lyrics overlay
    video_path = create_lyric_video(
        audio_path=instrumental_path,
        lyrics_data=timed_lyrics.data,
        title=title,
        output="karaoke_video.mp4"
    )

    print(f"✅ Karaoke video created: {video_path}")

    return {
        "video": video_path,
        "original_audio": original_audio,
        "instrumental": instrumental_url,
        "lyrics": timed_lyrics.data
    }
```

---

## Error Handling

### Common Error Types

#### 1. Authentication Errors

**Error:** Invalid API Key
```json
{
  "success": false,
  "error": "API Error: Invalid API key"
}
```

**Solution:**
- Verify `SUNO_API_KEY` environment variable
- Get new key from https://sunoapi.org/api-key
- Check for typos or extra characters

#### 2. Credit Errors

**Error:** Insufficient Credits
```json
{
  "success": false,
  "error": "API Error: Insufficient credits"
}
```

**Solution:**
- Check credits with `get_credits()`
- Purchase more at https://sunoapi.org/pricing
- Optimize usage (use V3_5 for testing)

#### 3. Timeout Errors

**Error:** Generation Timeout
```json
{
  "success": false,
  "error": "Task timeout: Generation took too long"
}
```

**Solution:**
- Use `wait_audio: false` and poll with `get_audio_info`
- Check task status manually
- Retry with same task ID
- Contact support if persistent

#### 4. Network Errors

**Error:** Connection Failed
```json
{
  "success": false,
  "error": "Network error: ECONNREFUSED"
}
```

**Solution:**
- Check internet connection
- Verify firewall settings
- Test API endpoint: `curl https://api.sunoapi.org/api/v1/generate/credit`
- Check API status page

#### 5. Validation Errors

**Error:** Invalid Parameters
```json
{
  "success": false,
  "error": "Title exceeds maximum length of 80 characters"
}
```

**Solution:**
- Review parameter constraints
- Validate inputs before calling
- Check data types match requirements

### Error Recovery Patterns

**Pattern 1: Retry with Exponential Backoff**
```python
async def generate_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await generate_music(prompt=prompt)
            return result
        except NetworkError as e:
            if attempt == max_retries - 1:
                raise

            wait_time = 2 ** attempt  # 1s, 2s, 4s
            print(f"Retry {attempt + 1}/{max_retries} in {wait_time}s...")
            await asyncio.sleep(wait_time)
```

**Pattern 2: Graceful Degradation**
```python
async def generate_with_fallback(prompt, preferred_model="V5"):
    models_to_try = [preferred_model, "V4", "V3_5"]

    for model in models_to_try:
        try:
            result = await generate_music(
                prompt=prompt,
                model=model
            )
            return result
        except InsufficientCreditsError:
            if model == models_to_try[-1]:
                raise
            print(f"Cannot afford {model}, trying {models_to_try[models_to_try.index(model) + 1]}...")
```

**Pattern 3: Credit-Aware Operations**
```python
async def safe_generate(prompt, required_credits=25):
    # Check credits first
    credits = await get_credits()

    if credits.data.credits_left < required_credits:
        raise InsufficientCreditsError(
            f"Need {required_credits}, have {credits.data.credits_left}"
        )

    # Proceed with generation
    return await generate_music(prompt=prompt)
```

---

## Best Practices

### 1. Credit Management

**Track Usage:**
```python
class CreditTracker:
    def __init__(self):
        self.operations = []

    async def track_operation(self, operation_name, estimated_cost):
        before = await get_credits()

        # Perform operation
        yield

        after = await get_credits()
        actual_cost = before.data.credits_left - after.data.credits_left

        self.operations.append({
            "operation": operation_name,
            "estimated": estimated_cost,
            "actual": actual_cost,
            "timestamp": datetime.now()
        })

    def get_summary(self):
        total_cost = sum(op["actual"] for op in self.operations)
        return {
            "total_operations": len(self.operations),
            "total_cost": total_cost,
            "average_cost": total_cost / len(self.operations)
        }
```

**Set Budgets:**
```python
async def with_budget(max_credits, operation):
    initial = await get_credits()

    try:
        result = await operation()
    finally:
        final = await get_credits()
        used = initial.data.credits_left - final.data.credits_left

        if used > max_credits:
            logging.warning(f"Budget exceeded: {used} > {max_credits}")

    return result
```

### 2. Async Operations

**Always Use Polling for Production:**
```python
# ❌ BAD: Blocking wait
result = await generate_music(prompt="...", wait_audio=True)

# ✅ GOOD: Async polling
result = await generate_music(prompt="...", wait_audio=False)
task_id = result.data[0].id

# Poll in background
audio_info = await poll_until_complete(task_id)
```

**Parallel Generation:**
```python
async def generate_multiple(prompts):
    # Start all generations at once
    tasks = await asyncio.gather(*[
        generate_music(prompt=p, wait_audio=False)
        for p in prompts
    ])

    # Collect task IDs
    task_ids = [t.data[0].id for t in tasks]

    # Poll all together
    return await poll_all_until_complete(task_ids)
```

### 3. Prompt Engineering

**Effective Music Prompts:**
```python
# ❌ Vague
"happy song"

# ✅ Specific
"upbeat indie pop song with jangly guitars, hand claps, and cheerful female vocals about summer road trips"

# ❌ Too many conflicting styles
"classical heavy metal jazz dubstep"

# ✅ Coherent fusion
"neo-soul with jazz influences, smooth electric piano, and R&B vocals"

# ❌ No emotional context
"instrumental track"

# ✅ Emotional and descriptive
"melancholic instrumental piano piece with subtle strings, perfect for rainy afternoon reflection"
```

**Use Negative Tags Strategically:**
```python
# Remove unwanted elements
{
  "style": "acoustic folk, gentle, storytelling",
  "negative_tags": "drums, electric guitar, bass, synth"
}

# Prevent style conflicts
{
  "style": "classical piano, minimal, peaceful",
  "negative_tags": "vocals, percussion, electronic elements"
}
```

### 4. Error Handling

**Always Handle Errors:**
```python
try:
    result = await generate_music(prompt="...")
except ApiKeyError:
    logging.error("Invalid API key - check environment variables")
except InsufficientCreditsError:
    logging.error("Out of credits - purchase more")
except TimeoutError:
    logging.warning("Generation timed out - retry or check task manually")
except NetworkError as e:
    logging.error(f"Network error: {e} - check connection")
except Exception as e:
    logging.error(f"Unexpected error: {e}")
```

### 5. Resource Cleanup

**Download and Cache:**
```python
async def cache_audio(task_id, cache_dir="./audio_cache"):
    # Get audio info
    info = await get_audio_info([task_id])
    audio_url = info.data[0].audio_url

    # Generate cache filename
    cache_file = f"{cache_dir}/{task_id}.mp3"

    # Download if not cached
    if not os.path.exists(cache_file):
        download_audio(audio_url, cache_file)

    return cache_file
```

### 6. Monitoring and Logging

**Log All Operations:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

async def generate_with_logging(prompt):
    logging.info(f"Starting generation: {prompt[:50]}...")

    try:
        result = await generate_music(prompt=prompt)
        task_id = result.data[0].id

        logging.info(f"Generation started: task_id={task_id}")

        # Poll
        final = await poll_until_complete(task_id)

        logging.info(f"Generation complete: duration={final.duration}s")
        logging.info(f"Audio URL: {final.audio_url}")

        return final
    except Exception as e:
        logging.error(f"Generation failed: {e}")
        raise
```

---

## Conclusion

This comprehensive reference covers all 9 tools in the Suno AI MCP server. Each tool is designed to work seamlessly within the Model Context Protocol ecosystem, enabling AI assistants to create professional music with minimal friction.

**Key Takeaways:**

1. **Start Simple**: Use `generate_music` for quick results
2. **Go Custom**: Use `generate_custom_music` for precise control
3. **Poll Smartly**: Always use async operations in production
4. **Manage Credits**: Monitor usage and set budgets
5. **Handle Errors**: Implement retry logic and graceful degradation
6. **Monitor Health**: Use `get_api_status` before batch operations

**Resources:**

- 📖 **API Docs**: https://docs.sunoapi.org
- 🔑 **Get API Key**: https://sunoapi.org/api-key
- 💰 **Pricing**: https://sunoapi.org/pricing
- 🐛 **Issues**: GitHub repository
- 💬 **Support**: support@sunoapi.org

---

**Version:** 1.0.0
**Last Updated:** 2025-01-15
**Server Version:** suno-music-generator v1.0.0
**FastMCP Version:** 3.23.0 (patched)
