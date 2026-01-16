import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chat_id, message_id, reason } = await req.json();
        const token = Deno.env.get('TELEGRAM_BOT_TOKEN');

        if (!token) {
            return Response.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 });
        }

        // Удаление сообщения
        const response = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                message_id: parseInt(message_id)
            })
        });

        const result = await response.json();

        if (!result.ok) {
            return Response.json({ error: result.description }, { status: 400 });
        }

        // Лог действия
        await base44.entities.ModerationAction.create({
            action_type: 'delete_message',
            moderator_name: user.full_name,
            reason: reason || 'Не указана',
            details: `Удалено сообщение ${message_id} в чате ${chat_id}`
        });

        return Response.json({ success: true, message: 'Сообщение удалено' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});