import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { chat_id } = await req.json();
        const token = Deno.env.get('TELEGRAM_BOT_TOKEN');

        if (!token) {
            return Response.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 });
        }

        // Получение информации о чате
        const chatResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id })
        });

        const chatResult = await chatResponse.json();

        if (!chatResult.ok) {
            return Response.json({ error: chatResult.description }, { status: 400 });
        }

        // Получение количества участников
        const countResponse = await fetch(`https://api.telegram.org/bot${token}/getChatMemberCount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id })
        });

        const countResult = await countResponse.json();
        const memberCount = countResult.ok ? countResult.result : 0;

        return Response.json({ 
            success: true, 
            chat_info: chatResult.result,
            member_count: memberCount,
            message: 'Информация о группе получена. Синхронизация участников работает через вебхук.'
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});