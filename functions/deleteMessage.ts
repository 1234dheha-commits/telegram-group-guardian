import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOT_TOKEN = '8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chat_id, message_id, reason } = await req.json();

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                message_id: parseInt(message_id)
            })
        });

        const data = await response.json();

        if (data.ok) {
            await base44.asServiceRole.entities.ModerationAction.create({
                action_type: 'delete_message',
                moderator_name: user.full_name,
                reason: reason || 'Удалено модератором',
                details: `Chat: ${chat_id}, Message: ${message_id}`
            });

            return Response.json({ success: true });
        } else {
            return Response.json({ success: false, error: data.description });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});