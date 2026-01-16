import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { telegram_user_id, chat_id } = await req.json();
        const token = Deno.env.get('TELEGRAM_BOT_TOKEN');

        if (!token) {
            return Response.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 });
        }

        // Разбан
        const response = await fetch(`https://api.telegram.org/bot${token}/unbanChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                user_id: parseInt(telegram_user_id),
                only_if_banned: true
            })
        });

        const result = await response.json();

        if (!result.ok) {
            return Response.json({ error: result.description }, { status: 400 });
        }

        // Обновление базы данных
        const users = await base44.entities.TelegramUser.filter({
            telegram_id: telegram_user_id
        });

        if (users.length > 0) {
            await base44.entities.TelegramUser.update(users[0].id, {
                status: 'active'
            });
        }

        // Лог действия
        await base44.entities.ModerationAction.create({
            action_type: 'unban',
            target_telegram_id: telegram_user_id,
            moderator_name: user.full_name,
            reason: 'Разбан'
        });

        return Response.json({ success: true, message: 'Пользователь разбанен' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});