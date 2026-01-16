import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // Обработка GET запросов для проверки работоспособности
    if (req.method === 'GET') {
        return Response.json({ status: 'ok' });
    }

    // Разрешены только GET и POST
    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // Безопасный парсинг JSON с валидацией
        let update;
        try {
            update = await req.json();
        } catch (parseError) {
            return Response.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // Валидация входящих данных
        if (!update || typeof update !== 'object') {
            return Response.json({ error: 'Invalid update format' }, { status: 400 });
        }

        // Обработка новых участников
        if (update.message?.new_chat_members) {
            for (const member of update.message.new_chat_members) {
                const existing = await base44.asServiceRole.entities.TelegramUser.filter({
                    telegram_id: member.id.toString()
                });

                if (existing.length === 0) {
                    await base44.asServiceRole.entities.TelegramUser.create({
                        telegram_id: member.id.toString(),
                        username: member.username || '',
                        first_name: member.first_name || '',
                        last_name: member.last_name || '',
                        role: 'member',
                        status: 'active',
                        warnings: 0,
                        join_date: new Date().toISOString()
                    });
                }
            }
        }

        // Обработка покинувших участников
        if (update.message?.left_chat_member) {
            const member = update.message.left_chat_member;
            const users = await base44.asServiceRole.entities.TelegramUser.filter({
                telegram_id: member.id.toString()
            });

            if (users.length > 0) {
                await base44.asServiceRole.entities.TelegramUser.update(users[0].id, {
                    status: 'kicked'
                });
            }
        }

        // Обработка репортов (когда пользователь пересылает сообщение боту с жалобой)
        if (update.message?.text && update.message.text.startsWith('/report')) {
            const reporterId = update.message.from.id.toString();
            const chatId = update.message.chat.id.toString();
            
            // Если это ответ на сообщение
            if (update.message.reply_to_message) {
                const targetUser = update.message.reply_to_message.from;
                const messageText = update.message.reply_to_message.text || '';
                const reason = update.message.text.replace('/report', '').trim() || 'Не указана';

                await base44.asServiceRole.entities.Report.create({
                    telegram_user_id: targetUser.id.toString(),
                    reporter_telegram_id: reporterId,
                    message_text: messageText,
                    reason: reason,
                    status: 'pending',
                    chat_id: chatId,
                    message_id: update.message.reply_to_message.message_id.toString()
                });
            }
        }

        return Response.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});