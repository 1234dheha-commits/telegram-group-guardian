import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOT_TOKEN = '8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { telegram_user_id, chat_id, reason, duration } = await req.json();

        const durationMinutes = parseInt(duration) || 60;
        const untilDate = Math.floor(Date.now() / 1000) + (durationMinutes * 60);

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/restrictChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                user_id: parseInt(telegram_user_id),
                until_date: untilDate,
                permissions: {
                    can_send_messages: false
                }
            })
        });

        const data = await response.json();

        if (data.ok) {
            const users = await base44.asServiceRole.entities.TelegramUser.filter({
                telegram_id: telegram_user_id
            });

            if (users.length > 0) {
                await base44.asServiceRole.entities.TelegramUser.update(users[0].id, {
                    status: 'restricted',
                    muted_until: new Date(untilDate * 1000).toISOString()
                });
            }

            await base44.asServiceRole.entities.ModerationAction.create({
                action_type: 'mute',
                target_telegram_id: telegram_user_id,
                target_username: users[0]?.username || '',
                moderator_name: user.full_name,
                reason: reason || 'Нарушение правил',
                duration: `${durationMinutes} минут`
            });

            return Response.json({ success: true });
        } else {
            return Response.json({ success: false, error: data.description });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});