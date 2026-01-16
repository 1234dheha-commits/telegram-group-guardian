import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOT_TOKEN = '8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chat_id } = await req.json();

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${chat_id}`);
        const data = await response.json();

        if (data.ok) {
            const memberCountResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount?chat_id=${chat_id}`);
            const memberCountData = await memberCountResponse.json();

            return Response.json({
                success: true,
                chat_info: data.result,
                member_count: memberCountData.result || 0
            });
        } else {
            return Response.json({
                success: false,
                error: data.description || 'Не удалось получить информацию о группе'
            });
        }
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});