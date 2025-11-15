#!/bin/bash

# Проверка статуса и скачивание трека из MusicAPI.ai
# Использование: ./musicapi_check.sh <TASK_ID>

API_KEY="52082f4fc871b6231ae719899fe53d02"

# Получаем task_id
if [ -n "$1" ]; then
    TASK_ID="$1"
elif [ -f "last_task_id.txt" ]; then
    TASK_ID=$(cat last_task_id.txt)
    echo "📋 Используем последний Task ID из файла: $TASK_ID"
else
    echo "❌ Ошибка: Нужен Task ID!"
    echo ""
    echo "Использование:"
    echo "  ./musicapi_check.sh <TASK_ID>"
    echo "  или создайте трек через ./musicapi_generate.sh"
    exit 1
fi

echo "🎵 Проверяем статус трека..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем статус
RESPONSE=$(curl -s -X GET \
  "https://api.musicapi.ai/api/v1/sonic/task/$TASK_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json")

echo "$RESPONSE" | jq .
echo ""

# Проверяем успех
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
STATUS=$(echo "$RESPONSE" | jq -r '.data.status // "unknown"')

if [ "$SUCCESS" == "true" ]; then
    echo "📊 Статус: $STATUS"
    echo ""

    if [ "$STATUS" == "success" ]; then
        # Извлекаем URLs
        AUDIO_URL=$(echo "$RESPONSE" | jq -r '.data.audio_url // empty')
        VIDEO_URL=$(echo "$RESPONSE" | jq -r '.data.video_url // empty')
        TITLE=$(echo "$RESPONSE" | jq -r '.data.title // "track"')
        TAGS=$(echo "$RESPONSE" | jq -r '.data.tags // ""')

        if [ -n "$AUDIO_URL" ]; then
            echo "✅ Трек готов!"
            echo ""
            echo "📝 Название: $TITLE"
            echo "🎼 Стиль: $TAGS"
            echo ""
            echo "🔊 Аудио: $AUDIO_URL"
            echo "🎬 Видео: $VIDEO_URL"
            echo ""

            # Скачиваем
            FILENAME="${TITLE//[^a-zA-Z0-9а-яА-Я._-]/_}.mp3"
            echo "💾 Скачиваю: $FILENAME"
            curl -s -o "$FILENAME" "$AUDIO_URL"

            if [ -f "$FILENAME" ]; then
                SIZE=$(ls -lh "$FILENAME" | awk '{print $5}')
                echo "✅ Сохранено: $FILENAME ($SIZE)"
            fi

            echo ""
            echo "🎉 Готово!"
        else
            echo "⚠️  Аудио URL пока не доступен"
        fi

    elif [ "$STATUS" == "pending" ] || [ "$STATUS" == "processing" ]; then
        echo "⏳ Трек ещё генерируется..."
        echo "   Обычно это занимает 2-4 минуты"
        echo ""
        echo "Запусти снова через минуту:"
        echo "  ./musicapi_check.sh $TASK_ID"

    elif [ "$STATUS" == "failed" ]; then
        echo "❌ Генерация не удалась"
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.data.error_message // "Unknown error"')
        echo "   Ошибка: $ERROR_MSG"

    else
        echo "⚠️  Неизвестный статус: $STATUS"
    fi
else
    ERROR_TYPE=$(echo "$RESPONSE" | jq -r '.type // "unknown"')
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // "Unknown error"')

    if [ "$ERROR_TYPE" == "api_error" ]; then
        echo "❌ API ошибка: $ERROR_MSG"

        REFUNDED=$(echo "$RESPONSE" | jq -r '.already_refunded // false')
        if [ "$REFUNDED" == "true" ]; then
            echo "💰 Кредиты уже возвращены"
            echo ""
            echo "Можешь попробовать создать трек заново:"
            echo "  ./musicapi_generate.sh"
        fi
    else
        echo "❌ Ошибка: $ERROR_MSG"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
