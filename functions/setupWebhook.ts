import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOT_TOKEN = '8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await req.json();

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.ok) {
            return Response.json({
                success: true,
                message: 'Вебхук успешно установлен'
            });
        } else {
            return Response.json({
                success: false,
                error: data.description || 'Ошибка установки вебхука'
            });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});