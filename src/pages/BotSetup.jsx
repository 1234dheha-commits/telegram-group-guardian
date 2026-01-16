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

  // URL вебхука (нужно заменить на реальный домен вашего приложения)
  const getWebhookUrl = () => {
    // Получаем URL функции из dashboard
    return 'https://your-app-domain.base44.run/functions/telegramWebhook';
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Настройка бота</h1>
        <p className="text-[#a0a0a0]">Подключите Telegram бота к вашей группе</p>
      </div>

      {/* Инструкция */}
      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">📋 Инструкция по настройке</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[#a0a0a0]">
          <div className="space-y-2">
            <h3 className="text-white font-medium">1. Добавьте бота в группу</h3>
            <p>• Откройте вашу группу в Telegram</p>
            <p>• Добавьте бота через меню "Добавить участников"</p>
            <p>• Выдайте боту права администратора</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-white font-medium">2. Получите Chat ID группы</h3>
            <p>• Перешлите любое сообщение из группы боту @userinfobot</p>
            <p>• Скопируйте Chat ID из ответа (выглядит как -100xxxxxxxxxx)</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-medium">3. Настройте вебхук</h3>
            <p>• Скопируйте URL вебхука ниже</p>
            <p>• Нажмите кнопку "Установить вебхук"</p>
          </div>
        </CardContent>
      </Card>

      {/* Настройка вебхука */}
      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">🔗 Настройка вебхука</CardTitle>
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
            <p className="text-[#a0a0a0] text-sm mt-2">
              Найдите реальный URL функции в Dashboard → Code → Functions → telegramWebhook
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
          <CardTitle className="text-white">💬 ID группы</CardTitle>
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
            <p className="text-[#a0a0a0] text-sm mt-2">
              Используется для выполнения модерационных действий
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
          <CardContent className="p-4">
            <p className="text-[#a0a0a0] text-sm">
              💡 Совет: Сохраните Chat ID ({chatId}) в настройках модерации для удобства
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}