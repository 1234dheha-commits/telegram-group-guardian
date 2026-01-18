import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Save, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function Settings({ selectedGroupId, selectedGroup }) {
  const [warningMessage, setWarningMessage] = useState('');
  const [banMessage, setBanMessage] = useState('');
  const [keywords, setKeywords] = useState('');
  const [chatId, setChatId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const queryClient = useQueryClient();
  const groupChatId = selectedGroup?.chat_id;

  const { data: settings = [] } = useQuery({
    queryKey: ['settings', groupChatId],
    queryFn: () => groupChatId ? base44.entities.ModerationSettings.filter({ chat_id: groupChatId }) : Promise.resolve([]),
    enabled: !!groupChatId
  });

  useEffect(() => {
    const checkCreator = async () => {
      if (!selectedGroup) return;
      try {
        const currentUser = await base44.auth.me();
        const configs = await base44.entities.BotConfig.filter({ chat_id: selectedGroup.chat_id });
        if (configs.length > 0 && configs[0].owner_email === currentUser.email) {
          setIsCreator(true);
        } else {
          setIsCreator(false);
        }
      } catch (error) {
        setIsCreator(false);
      }
    };
    checkCreator();
  }, [selectedGroup]);

  useEffect(() => {
    const warningSetting = settings.find(s => s.setting_key === 'warning_message');
    const banSetting = settings.find(s => s.setting_key === 'ban_message');
    const keywordsSetting = settings.find(s => s.setting_key === 'blocked_keywords');

    if (warningSetting) setWarningMessage(warningSetting.setting_value);
    if (banSetting) setBanMessage(banSetting.setting_value);
    if (keywordsSetting) setKeywords(keywordsSetting.setting_value);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (settingsData) => {
      for (const setting of settingsData) {
        const existing = settings.find(s => s.setting_key === setting.setting_key);
        if (existing) {
          await base44.entities.ModerationSettings.update(existing.id, setting);
        } else {
          await base44.entities.ModerationSettings.create({
            ...setting,
            chat_id: groupChatId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', groupChatId] });
      toast.success('Настройки сохранены');
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + error.message);
    }
  });

  const handleSave = () => {
    saveMutation.mutate([
      {
        setting_key: 'warning_message',
        setting_value: warningMessage,
        description: 'Сообщение при предупреждении'
      },
      {
        setting_key: 'ban_message',
        setting_value: banMessage,
        description: 'Сообщение при бане'
      },
      {
        setting_key: 'blocked_keywords',
        setting_value: keywords,
        description: 'Список запрещённых слов'
      }
    ]);
  };

  const handleSaveConfig = async () => {
    if (!chatId) {
      toast.error('Введите Chat ID группы');
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      const existing = await base44.entities.BotConfig.filter({ 
        chat_id: chatId, 
        owner_email: currentUser.email 
      });

      if (existing.length > 0) {
        await base44.entities.BotConfig.update(existing[0].id, {
          chat_title: groupName || `Группа ${chatId}`,
          is_active: true
        });
        toast.success('Конфигурация обновлена');
      } else {
        await base44.entities.BotConfig.create({
          chat_id: chatId,
          chat_title: groupName || `Группа ${chatId}`,
          is_active: true,
          owner_email: currentUser.email
        });
        toast.success('Группа успешно подключена!');
      }
      
      queryClient.invalidateQueries({ queryKey: ['user-bot-configs'] });
      setChatId('');
      setGroupName('');
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
    setIsLoading(false);
  };

  if (!selectedGroupId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a]/70 backdrop-blur-sm border border-[#2a2a2a] flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-[#3b82f6]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Подключите группу</h2>
        <p className="text-[#a0a0a0] max-w-md mb-8">
          Добавьте новую группу для модерации
        </p>

        {/* Форма подключения группы */}
        <Card className="glass-card max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-lg">Данные группы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block text-sm">Название группы</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Моя группа"
                className="bg-[#1a1a1a]/70 backdrop-blur-sm border-[#2a2a2a] text-white text-sm"
              />
            </div>
            
            <div>
              <Label className="text-[#a0a0a0] mb-2 block text-sm">Chat ID группы</Label>
              <Input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-100xxxxxxxxxx"
                className="bg-[#1a1a1a]/70 backdrop-blur-sm border-[#2a2a2a] text-white text-sm"
              />
              <p className="text-[#666] text-xs mt-2">
                Получите Chat ID через @userinfobot
              </p>
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={isLoading || !chatId}
              className="bg-[#10b981] hover:bg-[#059669] text-white w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Подключить группу'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a]/70 backdrop-blur-sm border border-[#ef4444] flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-[#ef4444]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Доступ запрещён</h2>
        <p className="text-[#a0a0a0] max-w-md">
          Только создатель группы может изменять настройки
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Настройки</h1>
        {selectedGroup && (
          <div className="text-[#a0a0a0] text-sm md:text-base">
            <div className="font-medium">{selectedGroup.chat_title || 'Без названия'}</div>
            <div className="text-xs text-[#666]">{selectedGroup.chat_id}</div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-white text-lg md:text-xl">Сообщения модерации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block text-sm">
                Сообщение при предупреждении
              </Label>
              <Textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Вы получили предупреждение..."
                className="bg-[#1a1a1a]/70 backdrop-blur-sm border-[#2a2a2a] text-white placeholder:text-[#666] text-sm"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-[#a0a0a0] mb-2 block text-sm">
                Сообщение при бане
              </Label>
              <Textarea
                value={banMessage}
                onChange={(e) => setBanMessage(e.target.value)}
                placeholder="Вы были заблокированы..."
                className="bg-[#1a1a1a]/70 backdrop-blur-sm border-[#2a2a2a] text-white placeholder:text-[#666] text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-white text-lg md:text-xl">Фильтры контента</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block text-sm">
                Запрещённые слова (через запятую)
              </Label>
              <Textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="спам, реклама, мошенничество"
                className="bg-[#1a1a1a]/70 backdrop-blur-sm border-[#2a2a2a] text-white placeholder:text-[#666] text-sm"
                rows={4}
              />
              <p className="text-[#666] text-xs mt-2">
                Сообщения с этими словами будут помечаться
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white w-full md:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}