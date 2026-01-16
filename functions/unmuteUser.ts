import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOT_TOKEN = '8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { telegram_user_id, chat_id } = await req.json();

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/restrictChatMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                user_id: parseInt(telegram_user_id),
                permissions: {
                    can_send_messages: true,
                    can_send_media_messages: true,
                    can_send_other_messages: true,
                    can_add_web_page_previews: true
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
                    status: 'active',
                    muted_until: null
                });
            }

            await base44.asServiceRole.entities.ModerationAction.create({
                action_type: 'unmute',
                target_telegram_id: telegram_user_id,
                target_username: users[0]?.username || '',
                moderator_name: user.full_name
            });

            return Response.json({ success: true });
        } else {
            return Response.json({ success: false, error: data.description });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});