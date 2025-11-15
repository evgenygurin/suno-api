#!/usr/bin/env python3
"""
Дрилл-частушка - Russian Drill + Traditional Chastushka
Fusion: Aggressive 808s + Balalaika + Accordion
"""

# Fix for Python 3.12+ OpenTelemetry shutdown error
import otel_shutdown_fix  # noqa: F401

import os
import sys
import time
import json
import requests
from pathlib import Path

# Configuration
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "632ac3d353a5a2c4042905b1a39093e5")
BASE_URL = "https://api.sunoapi.org/api/v1"
DUMMY_CALLBACK = "https://webhook.site/unique-endpoint"

# Дрилл-частушка Configuration
TRACK_CONFIG = {
    "title": "Дрилл-частушка",
    "style": "Russian drill-rap, ultra-aggressive, balalaika, accordion, 808 bass, sharp hi-hats, slap snare, частушечный напев, 142 BPM, D minor",
    "model": "V4_5PLUS",
    "customMode": True,
    "instrumental": False,
    "negativeTags": "soft, calm, melodic, smooth, gentle, pop",
    "callBackUrl": DUMMY_CALLBACK,
    "prompt": """[Intro - Balalaika motif]
*aggressive balalaika strum*
Эй! Частушка на drill!
*808 drop*

[Verse 1 - Частушка style]
На районе drill качает (эй!)
Балалайка басс роняет (ха!)
808 как молот бьёт
Аккордеон огонь даёт!

[Pre-Chorus]
Drill-drill, частушка моя
Tight 808, балалайка, бля!
Cold dark mix, агрессивный флоу
Русский drill - это наше шоу!

[Chorus - Aggressive]
Дрилл-частушка! Bass качает!
Accordion stabs - всё сметает!
Sharp hats режут, snare как плеть!
Русский drill - не передать!

[Verse 2 - Chastushka rhymes]
Балалайка-drill играет (бум!)
Midrange grit всё разрывает (пау!)
Sidechain pump под каждый kick
Частушечный drill - это клик!

[Bridge - Balalaika solo + 808]
*balalaika motifs over heavy 808*
Tight and clear, sub идёт
Короткий glide, bass рвёт!
Traditional + ultra-new
Русский drill, я даю!

[Chorus]
Дрилл-частушка! Bass качает!
Accordion stabs - всё сметает!
Sharp hats режут, snare как плеть!
Русский drill - не передать!

[Outro - Частушка traditional ending]
Эх, раз, ещё раз!
Дрилл-частушка - высший класс!
*balalaika + 808 fadeout*
Ха-ха-ха!"""
}


class SunoAPIClient:
    """Suno API Client"""

    def __init__(self, api_key: str):
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_music(self, config: dict) -> str:
        """Generate music and return task ID"""
        url = f"{BASE_URL}/generate"

        print(f"\n🎵 Generating: {config['title']}")
        print(f"📊 Model: {config['model']}")
        print(f"🎼 Style: {config['style'][:80]}...")
        print(f"🎤 Vocals: Russian drill + частушка")
        print(f"🎻 Instruments: Balalaika + Accordion + 808s")

        try:
            response = requests.post(url, json=config, headers=self.headers, timeout=30)
            data = response.json()

            if data.get("code") != 200:
                print(f"\n❌ API Error: {data.get('msg')}")
                print(f"Full response: {json.dumps(data, indent=2, ensure_ascii=False)}")
                sys.exit(1)

            task_id = data["data"]["taskId"]
            print(f"✅ Task created: {task_id}")
            return task_id

        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)

    def get_task_status(self, task_id: str) -> dict:
        """Poll task status"""
        url = f"{BASE_URL}/generate/record-info"
        params = {"taskId": task_id}

        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=30)
            data = response.json()

            if data.get("code") != 200:
                return None

            return data.get("data", {})

        except:
            return None

    def wait_for_completion(self, task_id: str, max_wait: int = 360) -> list:
        """Wait for task completion via polling"""
        start_time = time.time()
        poll_interval = 10

        print("\n⏳ Waiting for generation...")
        print("Drill + частушка fusion takes 2-5 minutes\n")

        while time.time() - start_time < max_wait:
            status_data = self.get_task_status(task_id)

            if not status_data:
                elapsed = int(time.time() - start_time)
                print(f"⏳ [{elapsed}s] Checking status...", end="\r", flush=True)
                time.sleep(poll_interval)
                continue

            status = status_data.get("status")
            elapsed = int(time.time() - start_time)

            if status == "SUCCESS":
                response_data = status_data.get("response", {})
                audio_list = response_data.get("data", [])

                if audio_list:
                    print(f"\n✅ Completed in {elapsed}s!")
                    print(f"📦 Generated {len(audio_list)} variant(s)")
                    return audio_list
                else:
                    time.sleep(poll_interval)

            elif status == "FAILED":
                error = status_data.get("errorMessage", "Unknown")
                print(f"\n❌ Generation failed: {error}")
                sys.exit(1)

            elif status in ["PENDING", "GENERATING"]:
                dots = "." * ((elapsed // 5) % 4)
                print(f"⏳ [{elapsed}s] {status}{dots:<3}", end="\r", flush=True)
                time.sleep(poll_interval)

            else:
                time.sleep(poll_interval)

        print(f"\n❌ Timeout after {max_wait}s")
        sys.exit(1)

    def download_track(self, audio_list: list, output_dir: Path) -> list:
        """Download all generated tracks"""
        output_dir.mkdir(parents=True, exist_ok=True)
        downloaded = []

        print(f"\n📥 Downloading {len(audio_list)} track(s)...\n")

        for i, track in enumerate(audio_list, 1):
            audio_url = track.get("audio_url")
            if not audio_url:
                print(f"⚠️  Track {i}: No audio URL")
                continue

            title = track.get("title", f"Drill_Chastushka_{i}")
            filename = f"{title.replace(' ', '_')}.mp3"
            filepath = output_dir / filename

            try:
                print(f"📥 Downloading: {filename}")
                response = requests.get(audio_url, timeout=120)
                response.raise_for_status()

                filepath.write_bytes(response.content)

                size_mb = filepath.stat().st_size / (1024 * 1024)
                print(f"✅ Saved: {filepath} ({size_mb:.2f} MB)")

                if track.get("duration"):
                    print(f"   Duration: {track['duration']}s")

                downloaded.append(str(filepath))

            except Exception as e:
                print(f"❌ Download failed: {e}")

        return downloaded


def main():
    """Main execution"""
    print("=" * 70)
    print("🎻 ДРИЛЛ-ЧАСТУШКА - Russian Drill + Traditional Chastushka")
    print("=" * 70)

    client = SunoAPIClient(SUNO_API_KEY)
    task_id = client.generate_music(TRACK_CONFIG)

    Path("last_drill_task_id.txt").write_text(task_id)
    print(f"💾 Task ID saved: {task_id}")

    audio_list = client.wait_for_completion(task_id)

    Path("drill_chastushka_metadata.json").write_text(
        json.dumps(audio_list, indent=2, ensure_ascii=False)
    )

    output_dir = Path("generated_music")
    downloaded = client.download_track(audio_list, output_dir)

    # Download covers
    print("\n📥 Downloading cover art...")
    for i, track in enumerate(audio_list, 1):
        if cover_url := track.get("image_url"):
            cover_path = output_dir / f"Дрилл-частушка_{i}_cover.jpg"
            try:
                response = requests.get(cover_url, timeout=60)
                cover_path.write_bytes(response.content)
                print(f"✅ Cover {i} saved")
            except:
                print(f"⚠️  Cover {i} failed")

    print("\n" + "=" * 70)
    print("🎉 ДРИЛЛ-ЧАСТУШКА GENERATED!")
    print("=" * 70)
    print(f"\n✅ Downloaded {len(downloaded)} track(s):")
    for path in downloaded:
        print(f"   📁 {path}")

    print("\n🎻 Балалайка + 808 = огонь!")
    print("=" * 70)


if __name__ == "__main__":
    main()
