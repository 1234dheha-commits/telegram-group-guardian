import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../components/dashboard/StatCard';
import { Users, AlertCircle, Activity, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Dashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ['telegram-users'],
    queryFn: () => base44.entities.TelegramUser.list()
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list()
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.ModerationAction.list('-created_date', 5)
  });

  const activeUsers = users.filter(u => u.status === 'active').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Панель управления</h1>
        <p className="text-[#a0a0a0]">Обзор модерации Telegram группы</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Активные пользователи"
          value={activeUsers}
          icon={Users}
        />
        <StatCard
          title="Новые репорты"
          value={pendingReports}
          icon={AlertCircle}
        />
        <StatCard
          title="Всего действий"
          value={actions.length}
          icon={Activity}
        />
        <StatCard
          title="Всего пользователей"
          value={users.length}
          icon={Shield}
        />
      </div>

      {/* Recent Actions */}
      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Последние действия модераторов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] mb-3">
                  <Activity className="w-6 h-6 text-[#666]" />
                </div>
                <p className="text-[#a0a0a0] text-sm">Действия появятся после модерации</p>
              </div>
            ) : (
              actions.map((action) => {
                const actionLabels = {
                  ban: 'Бан',
                  kick: 'Кик',
                  warn: 'Предупреждение',
                  mute: 'Мут',
                  unmute: 'Размут',
                  unban: 'Разбан',
                  delete_message: 'Удалено сообщение'
                };
                
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
                      <div>
                        <p className="text-white font-medium">
                          {actionLabels[action.action_type] || action.action_type}
                        </p>
                        <p className="text-[#a0a0a0] text-sm">
                          {action.target_username || action.target_telegram_id} • {action.moderator_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-[#a0a0a0] text-sm">
                      {format(new Date(action.created_date), 'dd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}