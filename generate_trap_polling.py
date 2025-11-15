#!/usr/bin/env python3
"""
Hard Trap Moscow - Suno API Generator (Polling Version)
Uses dummy callback + polling for status checking
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
DUMMY_CALLBACK = "https://webhook.site/unique-endpoint"  # Dummy callback

# Hard Trap Moscow Configuration
TRACK_CONFIG = {
    "title": "Hard Trap Moscow",
    "style": "hard trap, aggressive, 808 bass, rapid hi-hats, dark synths, Russian rap, heavy, distorted, 138 BPM, D# minor, massive bass, gunshot samples, air horns",
    "model": "V4_5PLUS",
    "customMode": True,
    "instrumental": False,
    "negativeTags": "soft, calm, peaceful, acoustic, gentle, slow",
    "callBackUrl": DUMMY_CALLBACK,  # Required but we'll use polling
    "prompt": """[Intro]
Москва! Жесткий trap!
(Bass drop!)

[Verse 1]
Москва в огне, bass бьет по стенам (стенам!)
808 трясет, мы в этой системе (е-е!)
Темные улицы, холодный бетон
Агрессивный flow, это наш закон

[Pre-Chorus]
Hard trap Moscow, звук идет со дна
Massive 808s, качает вся страна
Gunshot samples, это наша игра
Жесткий стиль, от рассвета до утра

[Chorus]
Москва! Hard trap! Агрессивный стиль!
Тяжелые басы рвут на части всю пыль!
808 давит, snare бьет по ушам!
Московский trap - мы даем жару вам!

[Verse 2]
Distorted 808, синты как нож
Rapid hi-hats режут, этот sound не врешь
Air horns орут, crowd кричит "Еще!"
Компрессия на максимум, все что мы хочем

[Bridge]
Dark synth leads, ведут нас в темноту
Gunshot echoes, мы меняем высоту
Heavy compression, каждый sound идет в атаку
Московский trap, мы не знаем пощады

[Chorus]
Москва! Hard trap! Агрессивный стиль!
Тяжелые басы рвут на части всю пыль!
808 давит, snare бьет по ушам!
Московский trap - мы даем жару вам!

[Outro]
Hard trap Moscow... Bass до утра...
Жесткий sound... Москва... (gunshots)
Ха!"""
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
        print(f"🎤 Vocals: Yes (Russian rap)")

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
        poll_interval = 10  # seconds

        print("\n⏳ Waiting for generation...")
        print("This takes 2-5 minutes for V4_5PLUS model\n")

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
                    print(f"📦 Generated {len(audio_list)} track variant(s)")
                    return audio_list
                else:
                    print(f"\n⚠️  Status is SUCCESS but no audio data")
                    print(f"Raw data: {json.dumps(status_data, indent=2, ensure_ascii=False)}")
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
                print(f"⚠️  Unknown status: {status}")
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

            title = track.get("title", f"Hard_Trap_Moscow_{i}")
            filename = f"{title.replace(' ', '_')}.mp3"
            filepath = output_dir / filename

            try:
                print(f"📥 Downloading: {filename}")
                response = requests.get(audio_url, timeout=120)
                response.raise_for_status()

                filepath.write_bytes(response.content)

                size_mb = filepath.stat().st_size / (1024 * 1024)
                print(f"✅ Saved: {filepath} ({size_mb:.2f} MB)")

                # Show track info
                if track.get("duration"):
                    print(f"   Duration: {track['duration']}s")
                if track.get("tags"):
                    print(f"   Tags: {track['tags']}")

                downloaded.append(str(filepath))

            except Exception as e:
                print(f"❌ Download failed: {e}")

        return downloaded


def main():
    """Main execution"""
    print("=" * 70)
    print("🎵 HARD TRAP MOSCOW - Suno API Generator (Polling)")
    print("=" * 70)

    # Initialize client
    client = SunoAPIClient(SUNO_API_KEY)

    # Generate music
    task_id = client.generate_music(TRACK_CONFIG)

    # Save task ID
    Path("last_task_id.txt").write_text(task_id)
    print(f"💾 Task ID saved: {task_id}")

    # Wait for completion via polling
    audio_list = client.wait_for_completion(task_id)

    # Save full response
    Path("last_generation.json").write_text(
        json.dumps(audio_list, indent=2, ensure_ascii=False)
    )

    # Download tracks
    output_dir = Path("generated_music")
    downloaded = client.download_track(audio_list, output_dir)

    # Summary
    print("\n" + "=" * 70)
    print("🎉 GENERATION COMPLETE!")
    print("=" * 70)
    print(f"\n✅ Downloaded {len(downloaded)} track(s):")
    for path in downloaded:
        print(f"   📁 {path}")

    print("\n🎧 Enjoy your Hard Trap Moscow!")
    print("=" * 70)


if __name__ == "__main__":
    main()
