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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <p className="text-[#a0a0a0] text-center py-8">Нет действий</p>
            ) : (
              actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                    <div>
                      <p className="text-white font-medium">
                        {action.action_type === 'ban' && '🚫 Бан'}
                        {action.action_type === 'kick' && '👢 Кик'}
                        {action.action_type === 'warn' && '⚠️ Предупреждение'}
                        {action.action_type === 'mute' && '🔇 Мут'}
                        {action.action_type === 'unmute' && '🔊 Размут'}
                        {action.action_type === 'unban' && '✅ Разбан'}
                        {action.action_type === 'delete_message' && '🗑️ Удалено сообщение'}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}