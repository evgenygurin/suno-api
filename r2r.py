"""
Suno Persona Manager - система для сохранения и переиспользования персон исполнителей
"""
import json
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path


class SunoPersona:
    """Класс для представления персоны исполнителя в Suno"""
    
    def __init__(
        self,
        name: str,
        style: str,
        model: str = "V4",
        bpm: Optional[int] = None,
        key: Optional[str] = None,
        vocal_characteristics: Optional[str] = None,
        instrumental_elements: Optional[List[str]] = None,
        mixing_notes: Optional[str] = None,
        tags: Optional[List[str]] = None,
        description: Optional[str] = None
    ):
        self.name = name
        self.style = style
        self.model = model
        self.bpm = bpm
        self.key = key
        self.vocal_characteristics = vocal_characteristics
        self.instrumental_elements = instrumental_elements or []
        self.mixing_notes = mixing_notes
        self.tags = tags or []
        self.description = description
        self.created_at = datetime.now().isoformat()
        self.track_ids = []  # ID треков, созданных с этой персоной
    
    def to_dict(self) -> Dict:
        """Конвертация в словарь для сохранения"""
        return {
            "name": self.name,
            "style": self.style,
            "model": self.model,
            "bpm": self.bpm,
            "key": self.key,
            "vocal_characteristics": self.vocal_characteristics,
            "instrumental_elements": self.instrumental_elements,
            "mixing_notes": self.mixing_notes,
            "tags": self.tags,
            "description": self.description,
            "created_at": self.created_at,
            "track_ids": self.track_ids
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'SunoPersona':
        """Создание из словаря"""
        persona = cls(
            name=data["name"],
            style=data["style"],
            model=data.get("model", "V4"),
            bpm=data.get("bpm"),
            key=data.get("key"),
            vocal_characteristics=data.get("vocal_characteristics"),
            instrumental_elements=data.get("instrumental_elements", []),
            mixing_notes=data.get("mixing_notes"),
            tags=data.get("tags", []),
            description=data.get("description")
        )
        persona.created_at = data.get("created_at", persona.created_at)
        persona.track_ids = data.get("track_ids", [])
        return persona
    
    def get_suno_style_string(self) -> str:
        """
        Формирование полной строки стиля для Suno API
        """
        parts = [self.style]
        
        if self.vocal_characteristics:
            parts.append(self.vocal_characteristics)
        
        if self.instrumental_elements:
            parts.append(", ".join(self.instrumental_elements))
        
        if self.mixing_notes:
            parts.append(self.mixing_notes)
        
        style_string = ", ".join(parts)
        
        # Добавляем BPM и тональность если указаны
        if self.key:
            style_string += f", {self.key}"
        if self.bpm:
            style_string += f", {self.bpm} bpm"
        
        return style_string
    
    def add_track(self, track_id: str):
        """Добавить ID трека, созданного с этой персоной"""
        if track_id not in self.track_ids:
            self.track_ids.append(track_id)
    
    def __str__(self) -> str:
        return f"Persona: {self.name} ({self.model}) - {len(self.track_ids)} треков"


class PersonaManager:
    """Менеджер для управления коллекцией персон"""
    
    def __init__(self, storage_path: str = "suno_personas.json"):
        self.storage_path = Path(storage_path)
        self.personas: Dict[str, SunoPersona] = {}
        self.load()
    
    def save(self):
        """Сохранение всех персон в файл"""
        data = {
            name: persona.to_dict() 
            for name, persona in self.personas.items()
        }
        
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def load(self):
        """Загрузка персон из файла"""
        if not self.storage_path.exists():
            return
        
        with open(self.storage_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.personas = {
            name: SunoPersona.from_dict(persona_data)
            for name, persona_data in data.items()
        }
    
    def add_persona(self, persona: SunoPersona):
        """Добавить новую персону"""
        self.personas[persona.name] = persona
        self.save()
    
    def get_persona(self, name: str) -> Optional[SunoPersona]:
        """Получить персону по имени"""
        return self.personas.get(name)
    
    def list_personas(self) -> List[str]:
        """Список всех доступных персон"""
        return list(self.personas.keys())
    
    def update_persona(self, name: str, **kwargs):
        """Обновить параметры персоны"""
        if name not in self.personas:
            raise ValueError(f"Persona '{name}' not found")
        
        persona = self.personas[name]
        for key, value in kwargs.items():
            if hasattr(persona, key):
                setattr(persona, key, value)
        
        self.save()
    
    def delete_persona(self, name: str):
        """Удалить персону"""
        if name in self.personas:
            del self.personas[name]
            self.save()
    
    def export_persona(self, name: str, output_path: str):
        """Экспорт персоны в отдельный файл"""
        persona = self.get_persona(name)
        if not persona:
            raise ValueError(f"Persona '{name}' not found")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(persona.to_dict(), f, ensure_ascii=False, indent=2)
    
    def import_persona(self, input_path: str):
        """Импорт персоны из файла"""
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        persona = SunoPersona.from_dict(data)
        self.add_persona(persona)


# Пример использования
if __name__ == "__main__":
    manager = PersonaManager()
    
    # Создаем персону "Дрилл-частушка"
    drill_chastushka = SunoPersona(
        name="Дрилл-частушка",
        style="Russian drill-rap, ultra-aggressive",
        model="FUZZ-2.0",
        bpm=142,
        key="D Minor",
        vocal_characteristics="snarling, aggressive Russian vocals, частушечный напев",
        instrumental_elements=[
            "tight and clear 808 with strong sub",
            "clipped midrange grit",
            "balalaika motifs",
            "accordion stabs",
            "sharp hats",
            "slap snare"
        ],
        mixing_notes="cold dark mix, tight sidechain pump under kick, precise note definition with short glide",
        tags=["russian-drill", "частушки", "балалайка", "808-bass", "aggressive"],
        description="Fusion of Russian drill with traditional chastushka (folk couplets). Aggressive 808s meet balalaika and accordion."
    )
    
    manager.add_persona(drill_chastushka)
    
    print("✅ Персона 'Дрилл-частушка' сохранена!")
    print(f"\nStyle string для Suno:\n{drill_chastushka.get_suno_style_string()}")
    print(f"\nВсего персон: {len(manager.list_personas())}")
