#!/usr/bin/env python3
"""
Генерация треков с персонами через Suno API
"""
import os
import json
import time
import requests
from suno_persona_manager import PersonaManager

# API Configuration
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "")
SUNO_BASE_URL = "https://api.sunoapi.org/api/v1"


class SunoGenerator:
    def __init__(self, api_key=None):
        self.api_key = api_key or SUNO_API_KEY
        self.base_url = SUNO_BASE_URL
        self.headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
    
    def check_credits(self):
        """Проверить оставшиеся кредиты"""
        try:
            response = requests.get(
                f"{self.base_url}/credits",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("credits_left", 0)
            return None
        except Exception as e:
            print(f"⚠️  Ошибка проверки кредитов: {e}")
            return None
    
    def generate_with_persona(
        self,
        persona_name: str,
        lyrics: str,
        title: str = None,
        wait: bool = True
    ):
        """
        Генерация трека с персоной
        """
        # Загрузить персону
        manager = PersonaManager()
        persona = manager.get_persona(persona_name)
        
        if not persona:
            raise ValueError(f"Персона '{persona_name}' не найдена")
        
        # Подготовить параметры
        style = persona.get_suno_style_string()
        
        if not title:
            title = f"{persona.name} - Generated Track"
        
        print(f"\n🎵 Генерация трека с персоной: {persona.name}")
        print(f"   Title: {title}")
        print(f"   Model: {persona.model}")
        print(f"   Style: {style[:80]}...")
        
        # Для Suno через веб-интерфейс
        print(f"\n{'='*60}")
        print("📋 ИНСТРУКЦИИ ДЛЯ SUNO AI:")
        print(f"{'='*60}\n")
        
        print("1. Откройте https://suno.com")
        print("\n2. В поле 'Sound/Style' вставьте:")
        print(f"\n{style}\n")
        print("3. В поле 'Lyrics' вставьте:")
        print(f"\n{lyrics}\n")
        print(f"4. Title: {title}")
        print(f"5. Model: {persona.model}")
        
        print(f"\n{'='*60}")
        print("💡 ПОСЛЕ ГЕНЕРАЦИИ:")
        print(f"{'='*60}\n")
        print(f"python suno_cli.py add-track '{persona.name}' YOUR_TRACK_ID")
        print()
        
        # Сохранить в файл для удобства
        output = {
            "persona": persona.name,
            "title": title,
            "style": style,
            "lyrics": lyrics,
            "model": persona.model,
            "bpm": persona.bpm,
            "key": persona.key
        }
        
        filename = f"suno_generation_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Параметры сохранены в: {filename}")
        
        return output


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Генерация с персонами")
    parser.add_argument("persona", help="Имя персоны")
    parser.add_argument("--lyrics", help="Путь к файлу с текстом или текст напрямую")
    parser.add_argument("--title", help="Название трека")
    parser.add_argument("--demo", action="store_true", help="Использовать демо текст")
    
    args = parser.parse_args()
    
    # Демо текст для Дрилл-частушка
    demo_lyrics = """[Куплет 1]
Голубь у подъезда топчет лёд
Басс гудит, 808 ведёт
На районе дрилл звучит всерьёз
Частушки новый стиль принёс

[Припев]
Эй, голубок, расскажи-ка мне
Как drill и folk слились во мне
Балалайка с басом в унисон
Это русский дрилл, новый закон

[Куплет 2]
Морозит нос, но бит горячий
808 качает, это значит
Что традиция жива, но в новой форме
Частушка дрилл теперь в норме

[Бридж]
Cowbell бьет, снэйр трещит
Частушка в дрилле говорит
О жизни на районе в новом стиле
В басах и битах наша сила

[Припев]
Эй, голубок, не молчи, пой
Drill-частушка - это мой настрой
Уличный напев с агрессией
Новая волна с прогрессией"""
    
    # Получить текст
    if args.demo or not args.lyrics:
        lyrics = demo_lyrics
        print("📝 Используется демо текст")
    else:
        if os.path.isfile(args.lyrics):
            with open(args.lyrics, 'r', encoding='utf-8') as f:
                lyrics = f.read()
        else:
            lyrics = args.lyrics
    
    # Генерация
    generator = SunoGenerator()
    
    # Проверить кредиты
    credits = generator.check_credits()
    if credits is not None:
        print(f"\n💰 Кредитов осталось: {credits}")
    
    try:
        result = generator.generate_with_persona(
            args.persona,
            lyrics,
            args.title
        )
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

