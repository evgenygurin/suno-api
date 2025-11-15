#!/bin/bash

# Скрипт для проверки статуса и скачивания трека из Suno API
# Использование: ./download_track.sh <TASK_ID> <API_KEY>

TASK_ID="${1:-b9247557-4a34-4a3f-8c9e-8023eee78d08}"
API_KEY="${2}"

if [ -z "$API_KEY" ]; then
    echo "❌ Ошибка: Нужен API ключ!"
    echo ""
    echo "Использование:"
    echo "  ./download_track.sh <TASK_ID> <API_KEY>"
    echo ""
    echo "Пример:"
    echo "  ./download_track.sh b9247557-4a34-4a3f-8c9e-8023eee78d08 your_api_key_here"
    echo ""
    echo "Получить API ключ: https://sunoapi.org/api-key"
    exit 1
fi

echo "🎵 Проверяем статус трека..."
echo "📋 Task ID: $TASK_ID"
echo ""

# Проверяем статус трека
RESPONSE=$(curl -s -X GET \
  "https://api.sunoapi.org/api/v1/generate/record-info?taskId=$TASK_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json")

# Проверяем успешность запроса
CODE=$(echo "$RESPONSE" | jq -r '.code // 0')

if [ "$CODE" == "401" ]; then
    echo "❌ Ошибка авторизации!"
    echo ""
    echo "Проблемы могут быть:"
    echo "  1. API ключ неверный"
    echo "  2. API ключ истёк"
    echo "  3. Недостаточно кредитов на балансе"
    echo ""
    echo "Получить новый API ключ: https://sunoapi.org/api-key"
    exit 1
fi

if [ "$CODE" != "200" ]; then
    echo "❌ Ошибка API: $CODE"
    echo "$RESPONSE" | jq .
    exit 1
fi

# Извлекаем статус
STATUS=$(echo "$RESPONSE" | jq -r '.data.status // "unknown"')
echo "📊 Статус: $STATUS"
echo ""

if [ "$STATUS" == "SUCCESS" ]; then
    # Извлекаем информацию о треках
    TRACKS=$(echo "$RESPONSE" | jq -r '.data.response.data[]')

    if [ -z "$TRACKS" ]; then
        echo "⚠️  Треки ещё не готовы, попробуй через минуту"
        exit 0
    fi

    # Получаем URLs
    AUDIO_URLS=$(echo "$RESPONSE" | jq -r '.data.response.data[].audio_url')
    VIDEO_URLS=$(echo "$RESPONSE" | jq -r '.data.response.data[].video_url')
    TITLES=$(echo "$RESPONSE" | jq -r '.data.response.data[].title')

    echo "✅ Трек готов!"
    echo ""

    # Показываем информацию о каждом треке
    INDEX=1
    echo "$RESPONSE" | jq -r '.data.response.data[] |
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "🎵 Трек #" + ($INDEX | tostring) + "\n" +
        "📝 Название: " + .title + "\n" +
        "🎼 Стиль: " + .tags + "\n" +
        "⏱️  Длительность: " + (.metadata.duration | tostring) + " сек\n" +
        "🔊 Аудио: " + .audio_url + "\n" +
        "🎬 Видео: " + .video_url + "\n"
    '

    # Скачиваем треки
    echo ""
    echo "💾 Скачиваем треки..."
    echo ""

    INDEX=1
    echo "$RESPONSE" | jq -r '.data.response.data[] | .audio_url + "|" + .title' | while IFS='|' read -r URL TITLE; do
        # Очищаем название для использования в имени файла
        CLEAN_TITLE=$(echo "$TITLE" | sed 's/[^a-zA-Z0-9а-яА-Я._-]/_/g')
        FILENAME="${CLEAN_TITLE}.mp3"

        echo "  📥 Скачиваю: $FILENAME"
        curl -s -o "$FILENAME" "$URL"

        if [ -f "$FILENAME" ]; then
            SIZE=$(ls -lh "$FILENAME" | awk '{print $5}')
            echo "  ✅ Сохранено: $FILENAME ($SIZE)"
        else
            echo "  ❌ Ошибка скачивания"
        fi

        INDEX=$((INDEX + 1))
        echo ""
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 Готово!"

elif [ "$STATUS" == "PENDING" ] || [ "$STATUS" == "GENERATING" ]; then
    echo "⏳ Трек ещё генерируется..."
    echo ""
    echo "Обычно генерация занимает 1-3 минуты"
    echo "Запусти скрипт снова через минуту:"
    echo ""
    echo "  ./download_track.sh $TASK_ID $API_KEY"

elif [ "$STATUS" == "FAILED" ]; then
    echo "❌ Генерация не удалась"
    echo ""
    echo "Детали ошибки:"
    echo "$RESPONSE" | jq '.data.errorMessage // "Неизвестная ошибка"'

else
    echo "⚠️  Неизвестный статус: $STATUS"
    echo ""
    echo "Полный ответ API:"
    echo "$RESPONSE" | jq .
fi
