import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { telegram_user_id, chat_id, reason, duration_seconds } = await req.json();
        const token = Deno.env.get('TELEGRAM_BOT_TOKEN');

        if (!token) {
            return Response.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 });
        }

        // Вычисление времени окончания мута
        const until_date = duration_seconds ? Math.floor(Date.now() / 1000) + duration_seconds : 0;

        // Вызов Telegram API для мута
        const response = await fetch(`https://api.telegram.org/bot${token}/restrictChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                user_id: parseInt(telegram_user_id),
                permissions: {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false,
                    can_change_info: false,
                    can_invite_users: false,
                    can_pin_messages: false
                },
                until_date: until_date
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
            const muted_until = until_date ? new Date(until_date * 1000).toISOString() : null;
            await base44.entities.TelegramUser.update(users[0].id, {
                status: 'restricted',
                muted_until: muted_until
            });
        }

        // Лог действия
        await base44.entities.ModerationAction.create({
            action_type: 'mute',
            target_telegram_id: telegram_user_id,
            moderator_name: user.full_name,
            reason: reason || 'Не указана',
            duration: duration_seconds ? `${duration_seconds / 86400} дней` : 'навсегда'
        });

        return Response.json({ success: true, message: 'Пользователь ограничен' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});