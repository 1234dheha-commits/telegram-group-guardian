import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from 'lucide-react';

export default function Settings() {
  const [warningMessage, setWarningMessage] = useState('');
  const [banMessage, setBanMessage] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.ModerationSettings.list()
  });

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
          await base44.entities.ModerationSettings.create(setting);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Настройки сохранены');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Настройки модерации</h1>
        <p className="text-[#a0a0a0]">Настройте параметры модерации группы</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Сообщения для модерации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block">
                Сообщение при предупреждении
              </Label>
              <Textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Например: Вы получили предупреждение за нарушение правил группы."
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0]"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-[#a0a0a0] mb-2 block">
                Сообщение при бане
              </Label>
              <Textarea
                value={banMessage}
                onChange={(e) => setBanMessage(e.target.value)}
                placeholder="Например: Вы были заблокированы за серьёзное нарушение правил."
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0]"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Фильтры контента</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-[#a0a0a0] mb-2 block">
                Запрещённые ключевые слова (через запятую)
              </Label>
              <Textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Например: спам, реклама, мошенничество"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0]"
                rows={4}
              />
              <p className="text-[#a0a0a0] text-sm mt-2">
                Сообщения, содержащие эти слова, будут помечаться для ручной проверки
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
}