import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Получаем токен из переменных окружения
const BOT_TOKEN = Deno.env.get('8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw');

// Универсальная функция для ответа с CORS и JSON
function jsonResponse(data, { status = 200 } = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await req.json();

        if (!BOT_TOKEN) {
            return jsonResponse({ error: 'BOT_TOKEN is not set in environment' }, { status: 500 });
        }

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            return jsonResponse({ success: false, error: 'Ошибка парсинга ответа Telegram' }, { status: 500 });
        }

        if (data.ok) {
            return jsonResponse({
                success: true,
                message: 'Вебхук успешно установлен'
            });
        } else {
            return jsonResponse({
                success: false,
                error: data.description || 'Ошибка установки вебхука'
            }, { status: 500 });
        }
    } catch (error) {
        // Логируем ошибку для дебага
        console.error('setupWebhook error:', error);
        return jsonResponse({ error: error.message || String(error) }, { status: 500 });
    }
});