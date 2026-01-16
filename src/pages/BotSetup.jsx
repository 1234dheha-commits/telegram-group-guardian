import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function BotSetup() {
  const [chatId, setChatId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);

  const getWebhookUrl = () => {
    return window.location.origin + '/api/functions/telegramWebhook';
  };

  const handleSetupWebhook = async () => {
    setIsLoading(true);
    try {
      const url = webhookUrl || getWebhookUrl();
      const response = await base44.functions.invoke('setupWebhook', { url });
      
      if (response.data.success) {
        setSetupStatus({ type: 'success', message: response.data.message });
        toast.success('Вебхук успешно настроен');
      } else {
        setSetupStatus({ type: 'error', message: response.data.error });
        toast.error(response.data.error);
      }
    } catch (error) {
      setSetupStatus({ type: 'error', message: error.message });
      toast.error('Ошибка настройки вебхука');
    }
    setIsLoading(false);
  };

  const handleSyncMembers = async () => {
    if (!chatId) {
      toast.error('Введите Chat ID группы');
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('syncGroupMembers', { 
        chat_id: chatId 
      });
      
      if (response.data.success) {
        toast.success('Информация о группе получена');
        setSetupStatus({ 
          type: 'success', 
          message: `Группа: ${response.data.chat_info.title}, Участников: ${response.data.member_count}` 
        });
      }
    } catch (error) {
      toast.error('Ошибка синхронизации');
      setSetupStatus({ type: 'error', message: error.message });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl w-full">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Настройка бота</h1>
        <p className="text-[#a0a0a0]">Подключите Telegram бота к вашей группе</p>
      </div>

      {/* Быстрая настройка */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border-[#3b82f6] shadow-lg shadow-[#3b82f6]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            Подключение бота
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="https://t.me/telegram_grop_moderator_test_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3b82f6] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center">
                  <span className="text-lg">→</span>
                </div>
                <div>
                  <h3 className="text-white font-medium group-hover:text-[#3b82f6] transition-colors">Открыть бота</h3>
                  <p className="text-[#a0a0a0] text-sm">Перейти в Telegram</p>
                </div>
              </div>
            </a>

            <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Выдайте права</h3>
                  <p className="text-[#a0a0a0] text-sm">Сделайте бота админом</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              <strong className="text-white">Шаг 1:</strong> Откройте бота и нажмите "Start"<br/>
              <strong className="text-white">Шаг 2:</strong> Добавьте бота в вашу группу<br/>
              <strong className="text-white">Шаг 3:</strong> Выдайте права администратора<br/>
              <strong className="text-white">Шаг 4:</strong> Вернитесь сюда и заполните данные ниже
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Настройка вебхука */}
      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Настройка вебхука</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[#a0a0a0] mb-2 block">URL вебхука</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={getWebhookUrl()}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white flex-1"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(webhookUrl || getWebhookUrl())}
                className="bg-transparent border-[#2a2a2a] text-white hover:bg-[#1a1a1a]"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[#666] text-sm mt-2">
              Вебхук настроится автоматически для обработки событий группы
            </p>
          </div>

          <Button
            onClick={handleSetupWebhook}
            disabled={isLoading}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Настройка...
              </>
            ) : (
              'Установить вебхук'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Chat ID */}
      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">ID группы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[#a0a0a0] mb-2 block">Chat ID группы</Label>
            <Input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-100xxxxxxxxxx"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
            />
            <p className="text-[#666] text-sm mt-2">
              Получите Chat ID через @userinfobot - перешлите туда сообщение из группы
            </p>
          </div>

          <Button
            onClick={handleSyncMembers}
            disabled={isLoading || !chatId}
            className="bg-[#10b981] hover:bg-[#059669] text-white w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Проверка...
              </>
            ) : (
              'Проверить подключение'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Статус */}
      {setupStatus && (
        <Alert className={`border-2 ${
          setupStatus.type === 'success' 
            ? 'bg-[#10b981]/10 border-[#10b981]' 
            : 'bg-[#ef4444]/10 border-[#ef4444]'
        }`}>
          <div className="flex items-center gap-3">
            {setupStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#10b981]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#ef4444]" />
            )}
            <AlertDescription className="text-white">
              {setupStatus.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Сохранение Chat ID */}
      {chatId && (
        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardContent className="p-4 space-y-4">
            <p className="text-[#666] text-sm">
              Сохраните Chat ID ({chatId}) для использования в модерации
            </p>
            <Button
              onClick={async () => {
                try {
                  const configs = await base44.entities.BotConfig.filter({ is_active: true });
                  if (configs.length > 0) {
                    await base44.entities.BotConfig.update(configs[0].id, { chat_id: chatId });
                  } else {
                    await base44.entities.BotConfig.create({ 
                      chat_id: chatId,
                      webhook_url: webhookUrl || getWebhookUrl(),
                      is_active: true 
                    });
                  }
                  toast.success('Конфигурация сохранена');
                } catch (error) {
                  toast.error('Ошибка сохранения');
                }
              }}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              Сохранить конфигурацию
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}