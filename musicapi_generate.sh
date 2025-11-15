#!/bin/bash

# Создание трека через MusicAPI.ai (Suno v5)
# Использование: ./musicapi_generate.sh

API_KEY="52082f4fc871b6231ae719899fe53d02"
API_URL="https://api.musicapi.ai/api/v1/sonic/create"

echo "🎵 Создаём трек 'Дрилл-Частушка — Голубь и Басс'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# JSON payload
read -r -d '' PAYLOAD << 'EOF'
{
  "custom_mode": true,
  "prompt": "[Куплет 1]\nГолубь у подъезда топчет лёд\nБасс гудит, 808 ведёт\nНа районе дрилл звучит всерьёз\nЧастушки новый стиль принёс\n\n[Припев]\nЭй, голубок, расскажи-ка мне\nКак drill и folk слились во мне\nБалалайка с басом в унисон\nЭто русский дрилл, новый закон\n\n[Куплет 2]\nМорозит нос, но бит горячий\n808 качает, это значит\nЧто традиция жива, но в новой форме\nЧастушка дрилл теперь в норме\n\n[Припев]\nЭй, голубок, не молчи, пой\nDrill-частушка - это мой настрой\nУличный напев с агрессией\nНовая волна с прогрессией",
  "title": "Дрилл-Частушка — Голубь и Басс",
  "tags": "Russian drill-rap, ultra-aggressive, snarling, aggressive Russian vocals, частушечный напев, tight and clear 808 with strong sub, clipped midrange grit, balalaika motifs, accordion stabs, sharp hats, slap snare, cold dark mix, tight sidechain pump under kick, precise note definition with short glide",
  "style_weight": 0.8,
  "weirdness_constraint": 0.3,
  "negative_tags": "",
  "make_instrumental": false,
  "mv": "sonic-v5"
}
EOF

# Отправляем запрос
echo "📤 Отправляю запрос в MusicAPI..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo ""
echo "📥 Ответ API:"
echo "$RESPONSE" | jq .
echo ""

# Проверяем успех
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
TASK_ID=$(echo "$RESPONSE" | jq -r '.data.task_id // empty')

if [ "$SUCCESS" == "true" ] && [ -n "$TASK_ID" ]; then
    echo "✅ Задача создана успешно!"
    echo "📋 Task ID: $TASK_ID"
    echo ""
    echo "⏳ Генерация занимает обычно 2-4 минуты"
    echo ""
    echo "🔍 Проверить статус:"
    echo "   ./musicapi_check.sh $TASK_ID"
    echo ""

    # Сохраняем task_id
    echo "$TASK_ID" > last_task_id.txt
    echo "💾 Task ID сохранён в: last_task_id.txt"
else
    echo "❌ Ошибка создания задачи!"
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // .error // "Unknown error"')
    echo "   $ERROR_MSG"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
