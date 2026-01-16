import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BOT_TOKEN = '8508894388:AAGjHxsxYOVuwjwIXfr79ZniMqiMAr8ELhw';

async function sendMessage(chatId, text, replyToMessageId = null) {
    const params = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    if (replyToMessageId) params.reply_to_message_id = replyToMessageId;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return await response.json();
}

Deno.serve(async (req) => {
    if (req.method === 'GET') {
        return Response.json({ status: 'ok' });
    }

    if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        let update;
        try {
            update = await req.json();
        } catch (parseError) {
            return Response.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        if (!update || typeof update !== 'object') {
            return Response.json({ error: 'Invalid update format' }, { status: 400 });
        }

        const message = update.message;
        if (!message) return Response.json({ ok: true });

        const chatId = message.chat.id.toString();
        const userId = message.from.id.toString();
        const username = message.from.username || message.from.first_name || 'User';
        const text = message.text || '';

        // Команда /start
        if (text === '/start') {
            await sendMessage(chatId, 
                `👋 Привет! Я бот-модератор группы.\n\n` +
                `📋 Доступные команды:\n` +
                `/ban - забанить пользователя (ответ на сообщение)\n` +
                `/kick - кикнуть пользователя (ответ на сообщение)\n` +
                `/mute - замутить пользователя (ответ на сообщение)\n` +
                `/warn - предупредить пользователя (ответ на сообщение)\n` +
                `/unban - разбанить пользователя (ответ на сообщение)\n` +
                `/unmute - размутить пользователя (ответ на сообщение)\n` +
                `/report - пожаловаться на пользователя (ответ на сообщение)`,
                message.message_id
            );
            return Response.json({ ok: true });
        }

        // Команда /ban
        if (text.startsWith('/ban') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            const reason = text.replace('/ban', '').trim() || 'Нарушение правил';
            
            try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, user_id: targetUser.id })
                });

                await base44.asServiceRole.entities.ModerationAction.create({
                    action_type: 'ban',
                    target_telegram_id: targetUser.id.toString(),
                    target_username: targetUser.username || targetUser.first_name,
                    moderator_name: username,
                    reason: reason
                });

                const users = await base44.asServiceRole.entities.TelegramUser.filter({ telegram_id: targetUser.id.toString() });
                if (users.length > 0) {
                    await base44.asServiceRole.entities.TelegramUser.update(users[0].id, { status: 'banned' });
                }

                await sendMessage(chatId, `🚫 Пользователь ${targetUser.username || targetUser.first_name} забанен.\nПричина: ${reason}`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при бане пользователя: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
        }

        // Команда /kick
        if (text.startsWith('/kick') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            const reason = text.replace('/kick', '').trim() || 'Нарушение правил';
            
            try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, user_id: targetUser.id })
                });
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/unbanChatMember`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, user_id: targetUser.id })
                });

                await base44.asServiceRole.entities.ModerationAction.create({
                    action_type: 'kick',
                    target_telegram_id: targetUser.id.toString(),
                    target_username: targetUser.username || targetUser.first_name,
                    moderator_name: username,
                    reason: reason
                });

                await sendMessage(chatId, `👢 Пользователь ${targetUser.username || targetUser.first_name} кикнут.\nПричина: ${reason}`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при кике: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
        }

        // Команда /mute
        if (text.startsWith('/mute') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            const parts = text.split(' ');
            const duration = parseInt(parts[1]) || 60;
            const reason = parts.slice(2).join(' ') || 'Нарушение правил';
            
            try {
                const untilDate = Math.floor(Date.now() / 1000) + duration * 60;
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/restrictChatMember`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        user_id: targetUser.id,
                        until_date: untilDate,
                        permissions: { can_send_messages: false }
                    })
                });

                await base44.asServiceRole.entities.ModerationAction.create({
                    action_type: 'mute',
                    target_telegram_id: targetUser.id.toString(),
                    target_username: targetUser.username || targetUser.first_name,
                    moderator_name: username,
                    reason: reason,
                    duration: `${duration} минут`
                });

                await sendMessage(chatId, `🔇 Пользователь ${targetUser.username || targetUser.first_name} замучен на ${duration} минут.\nПричина: ${reason}`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при муте: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
        }

        // Команда /warn
        if (text.startsWith('/warn') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            const reason = text.replace('/warn', '').trim() || 'Нарушение правил';
            
            try {
                let users = await base44.asServiceRole.entities.TelegramUser.filter({ telegram_id: targetUser.id.toString() });
                let warnings = 1;
                
                if (users.length > 0) {
                    warnings = (users[0].warnings || 0) + 1;
                    await base44.asServiceRole.entities.TelegramUser.update(users[0].id, { warnings });
                } else {
                    await base44.asServiceRole.entities.TelegramUser.create({
                        telegram_id: targetUser.id.toString(),
                        username: targetUser.username || '',
                        first_name: targetUser.first_name || '',
                        warnings: 1,
                        status: 'active',
                        role: 'member'
                    });
                }

                await base44.asServiceRole.entities.ModerationAction.create({
                    action_type: 'warn',
                    target_telegram_id: targetUser.id.toString(),
                    target_username: targetUser.username || targetUser.first_name,
                    moderator_name: username,
                    reason: reason
                });

                await sendMessage(chatId, `⚠️ Пользователь ${targetUser.username || targetUser.first_name} получил предупреждение (${warnings}/3).\nПричина: ${reason}`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при предупреждении: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
        }

        // Команда /unban
        if (text.startsWith('/unban') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            
            try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/unbanChatMember`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, user_id: targetUser.id })
                });

                await base44.asServiceRole.entities.ModerationAction.create({
                    action_type: 'unban',
                    target_telegram_id: targetUser.id.toString(),
                    target_username: targetUser.username || targetUser.first_name,
                    moderator_name: username
                });

                const users = await base44.asServiceRole.entities.TelegramUser.filter({ telegram_id: targetUser.id.toString() });
                if (users.length > 0) {
                    await base44.asServiceRole.entities.TelegramUser.update(users[0].id, { status: 'active' });
                }

                await sendMessage(chatId, `✅ Пользователь ${targetUser.username || targetUser.first_name} разбанен.`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при разбане: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
        }

        // Команда /unmute
        if (text.startsWith('/unmute') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            
            try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/restrictChatMember`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        user_id: targetUser.id,
                        permissions: {
                            can_send_messages: true,
                            can_send_media_messages: true,
                            can_send_other_messages: true,
                            can_add_web_page_previews: true
                        }
                    })
                });

                await base44.asServiceRole.entities.ModerationAction.create({
                    action_type: 'unmute',
                    target_telegram_id: targetUser.id.toString(),
                    target_username: targetUser.username || targetUser.first_name,
                    moderator_name: username
                });

                await sendMessage(chatId, `🔊 Пользователь ${targetUser.username || targetUser.first_name} размучен.`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при размуте: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
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

        // Команда /report
        if (text.startsWith('/report') && message.reply_to_message) {
            const targetUser = message.reply_to_message.from;
            const messageText = message.reply_to_message.text || '';
            const reason = text.replace('/report', '').trim() || 'Не указана';

            try {
                await base44.asServiceRole.entities.Report.create({
                    telegram_user_id: targetUser.id.toString(),
                    reporter_telegram_id: userId,
                    message_text: messageText,
                    reason: reason,
                    status: 'pending',
                    chat_id: chatId,
                    message_id: message.reply_to_message.message_id.toString()
                });

                await sendMessage(chatId, `📝 Жалоба на ${targetUser.username || targetUser.first_name} принята и отправлена модераторам.`, message.message_id);
            } catch (error) {
                await sendMessage(chatId, `❌ Ошибка при отправке жалобы: ${error.message}`, message.message_id);
            }
            return Response.json({ ok: true });
        }

        return Response.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});