#!/usr/bin/env python3
"""
Hard Trap Moscow - Suno API Music Generator
Generates aggressive hard trap track with Russian rap vocals
"""

# Fix for Python 3.12+ OpenTelemetry shutdown error
import otel_shutdown_fix  # noqa: F401

import os
import sys
import time
import json
import requests
import threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Configuration
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "your_suno_api_key_here")
BASE_URL = "https://api.sunoapi.org/api/v1"
WEBHOOK_PORT = 8877

# Global storage for callback data
callback_data = {
    "received": False,
    "data": None,
    "error": None
}


class WebhookHandler(BaseHTTPRequestHandler):
    """Simple HTTP handler for receiving Suno API callbacks"""

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

    def do_POST(self):
        """Handle POST callback from Suno API"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))

            # Store callback data globally
            callback_data["received"] = True
            callback_data["data"] = data

            print(f"\n📥 Callback received!")

            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())

        except Exception as e:
            callback_data["error"] = str(e)
            print(f"\n❌ Callback error: {e}")
            self.send_response(500)
            self.end_headers()

# Hard Trap Moscow Configuration
TRACK_CONFIG = {
    "title": "Hard Trap Moscow",
    "style": "hard trap, aggressive, 808 bass, rapid hi-hats, dark synths, Russian rap, heavy, distorted, 138 BPM, D# minor, massive bass, gunshot samples, air horns",
    "model": "V4_5PLUS",  # Richest sound for heavy production
    "customMode": True,
    "instrumental": False,  # With vocals
    "negativeTags": "soft, calm, peaceful, acoustic, gentle, slow",
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
    """Suno API Client for music generation"""

    def __init__(self, api_key: str):
        if api_key == "your_suno_api_key_here":
            print("❌ ERROR: Please set SUNO_API_KEY environment variable")
            print("\n🔑 Get your API key from: https://sunoapi.org/api-key")
            print("\nThen run:")
            print("  export SUNO_API_KEY='your_actual_key'")
            print("  python generate_hard_trap.py")
            sys.exit(1)

        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_music(self, config: dict, callback_url: str) -> str:
        """Generate music and return task ID"""
        url = f"{BASE_URL}/generate"

        # Add callback URL to config
        config["callBackUrl"] = callback_url

        print(f"\n🎵 Generating: {config['title']}")
        print(f"📊 Model: {config['model']}")
        print(f"🎼 Style: {config['style'][:80]}...")
        print(f"🎤 Vocals: Yes (Russian rap)")
        print(f"🔗 Callback: {callback_url}")

        try:
            response = requests.post(url, json=config, headers=self.headers, timeout=30)
            response.raise_for_status()

            data = response.json()

            if data.get("code") != 200:
                raise Exception(f"API Error: {data.get('msg', 'Unknown error')}")

            task_id = data["data"]["taskId"]
            print(f"✅ Task created: {task_id}")
            return task_id

        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)

    def get_task_status(self, task_id: str) -> dict:
        """Get task status and audio info"""
        url = f"{BASE_URL}/generate/record-info"
        params = {"taskId": task_id}

        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=30)
            response.raise_for_status()

            data = response.json()

            if data.get("code") != 200:
                raise Exception(f"API Error: {data.get('msg', 'Unknown error')}")

            return data["data"]

        except requests.exceptions.RequestException as e:
            print(f"❌ Network error: {e}")
            return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    def wait_for_completion(self, task_id: str, max_wait: int = 300) -> dict:
        """Wait for task completion with progress updates"""
        start_time = time.time()
        poll_interval = 5  # seconds

        print("\n⏳ Waiting for generation to complete...")
        print("This usually takes 2-4 minutes for V4_5PLUS model\n")

        while time.time() - start_time < max_wait:
            status_data = self.get_task_status(task_id)

            if not status_data:
                print("⚠️  Failed to get status, retrying...")
                time.sleep(poll_interval)
                continue

            status = status_data.get("status")
            elapsed = int(time.time() - start_time)

            if status == "SUCCESS":
                print(f"\n✅ Generation completed in {elapsed} seconds!")
                return status_data.get("response", {}).get("data", [])

            elif status == "FAILED":
                error_msg = status_data.get("errorMessage", "Unknown error")
                print(f"\n❌ Generation failed: {error_msg}")
                sys.exit(1)

            elif status in ["PENDING", "GENERATING"]:
                # Progress indicator
                dots = "." * ((elapsed // 5) % 4)
                print(f"⏳ [{elapsed}s] {status}{dots:<3}", end="\r", flush=True)
                time.sleep(poll_interval)

            else:
                print(f"⚠️  Unknown status: {status}")
                time.sleep(poll_interval)

        print(f"\n❌ Timeout: Generation took longer than {max_wait} seconds")
        sys.exit(1)

    def download_track(self, audio_info: list, output_dir: Path):
        """Download generated tracks"""
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n📥 Downloading {len(audio_info)} track(s)...\n")

        downloaded = []

        for i, track in enumerate(audio_info, 1):
            audio_url = track.get("audio_url")
            if not audio_url:
                print(f"⚠️  Track {i}: No audio URL found")
                continue

            title = track.get("title", f"track_{i}")
            filename = f"{title.replace(' ', '_').replace('/', '-')}.mp3"
            filepath = output_dir / filename

            try:
                print(f"📥 Downloading: {filename}")
                response = requests.get(audio_url, timeout=60)
                response.raise_for_status()

                with open(filepath, "wb") as f:
                    f.write(response.content)

                file_size = filepath.stat().st_size / (1024 * 1024)
                print(f"✅ Saved: {filepath} ({file_size:.2f} MB)")

                # Print track info
                print(f"   Duration: {track.get('duration', 'N/A')}s")
                print(f"   Model: {track.get('model_name', 'N/A')}")
                if track.get("tags"):
                    print(f"   Tags: {track['tags']}")

                downloaded.append(str(filepath))

            except Exception as e:
                print(f"❌ Failed to download {filename}: {e}")

        return downloaded


def start_webhook_server(port: int) -> HTTPServer:
    """Start webhook server in background thread"""
    server = HTTPServer(('0.0.0.0', port), WebhookHandler)

    def run_server():
        print(f"🌐 Webhook server started on port {port}")
        while not callback_data["received"]:
            server.handle_request()

    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()

    return server


def get_public_url(port: int) -> str:
    """Get ngrok public URL or localhost"""
    # Try to use ngrok if available for remote callbacks
    # For now, use localhost (works if Suno API can reach it)
    # In production, you'd use ngrok or a public domain

    # Check if we can determine public IP
    try:
        # Get local IP
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()

        # For local testing, we'll use localhost
        # In production, replace with your public domain/ngrok
        return f"http://localhost:{port}/callback"
    except:
        return f"http://localhost:{port}/callback"


def wait_for_callback(max_wait: int = 300) -> dict:
    """Wait for webhook callback"""
    start_time = time.time()

    print("\n⏳ Waiting for generation to complete...")
    print("This usually takes 2-4 minutes for V4_5PLUS model\n")

    while time.time() - start_time < max_wait:
        if callback_data["received"]:
            data = callback_data["data"]

            if data.get("code") == 200:
                print(f"\n✅ Generation completed!")
                return data.get("data", {})
            else:
                error_msg = data.get("msg", "Unknown error")
                print(f"\n❌ Generation failed: {error_msg}")
                sys.exit(1)

        # Progress indicator
        elapsed = int(time.time() - start_time)
        dots = "." * ((elapsed // 5) % 4)
        print(f"⏳ [{elapsed}s] Waiting for callback{dots:<3}", end="\r", flush=True)
        time.sleep(1)

    print(f"\n❌ Timeout: No callback received in {max_wait} seconds")
    print("💡 Tip: Make sure your firewall allows incoming connections on port", WEBHOOK_PORT)
    sys.exit(1)


def main():
    """Main execution"""
    print("=" * 60)
    print("🎵 HARD TRAP MOSCOW - Suno API Generator")
    print("=" * 60)

    # Start webhook server
    server = start_webhook_server(WEBHOOK_PORT)
    callback_url = get_public_url(WEBHOOK_PORT)

    time.sleep(1)  # Give server time to start

    # Initialize client
    client = SunoAPIClient(SUNO_API_KEY)

    # Generate music
    task_id = client.generate_music(TRACK_CONFIG, callback_url)

    # Save task ID for reference
    task_file = Path("last_task_id.txt")
    task_file.write_text(task_id)
    print(f"💾 Task ID saved to: {task_file}")

    # Wait for callback instead of polling
    audio_info = wait_for_callback()

    if not audio_info:
        print("❌ No audio data received")
        sys.exit(1)

    # Save full response
    response_file = Path("last_generation_response.json")
    response_file.write_text(json.dumps(audio_info, indent=2, ensure_ascii=False))
    print(f"💾 Full response saved to: {response_file}")

    # Download tracks
    output_dir = Path("generated_music")
    downloaded = client.download_track(audio_info, output_dir)

    # Summary
    print("\n" + "=" * 60)
    print("🎉 GENERATION COMPLETE!")
    print("=" * 60)
    print(f"\n✅ Downloaded {len(downloaded)} track(s):")
    for filepath in downloaded:
        print(f"   📁 {filepath}")

    print("\n🎧 Enjoy your Hard Trap Moscow track!")
    print("=" * 60)


if __name__ == "__main__":
    main()
