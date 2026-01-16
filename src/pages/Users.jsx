import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, AlertTriangle, Ban, UserX, VolumeX, Volume2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionDialog, setActionDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['telegram-users'],
    queryFn: () => base44.entities.TelegramUser.list('-created_date')
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, user }) => {
      // Получить Chat ID из конфигурации
      const configs = await base44.entities.BotConfig.filter({ is_active: true });
      const chat_id = configs.length > 0 ? configs[0].chat_id : '';

      if (!chat_id) {
        throw new Error('Chat ID не настроен. Перейдите в "Настройка бота"');
      }

      // Вызов backend функций для реальных действий
      let response;
      if (action === 'ban') {
        response = await base44.functions.invoke('banUser', {
          telegram_user_id: user.telegram_id,
          chat_id: chat_id,
          reason: reason,
          duration: duration
        });
      } else if (action === 'kick') {
        response = await base44.functions.invoke('kickUser', {
          telegram_user_id: user.telegram_id,
          chat_id: chat_id,
          reason: reason
        });
      } else if (action === 'mute') {
        // Преобразование длительности в секунды (простой пример)
        const duration_seconds = duration.includes('день') ? parseInt(duration) * 86400 : 
                               duration.includes('час') ? parseInt(duration) * 3600 : 0;
        response = await base44.functions.invoke('muteUser', {
          telegram_user_id: user.telegram_id,
          chat_id: chat_id,
          reason: reason,
          duration_seconds: duration_seconds
        });
      } else if (action === 'unmute') {
        response = await base44.functions.invoke('unmuteUser', {
          telegram_user_id: user.telegram_id,
          chat_id: chat_id
        });
      } else if (action === 'unban') {
        response = await base44.functions.invoke('unbanUser', {
          telegram_user_id: user.telegram_id,
          chat_id: chat_id
        });
      } else if (action === 'warn') {
        // Для предупреждения просто обновляем локально
        const currentUser = await base44.auth.me();
        await base44.entities.ModerationAction.create({
          action_type: 'warn',
          target_telegram_id: user.telegram_id,
          target_username: user.username,
          moderator_name: currentUser.full_name,
          reason: reason
        });
        await base44.entities.TelegramUser.update(user.id, {
          warnings: (user.warnings || 0) + 1
        });
      }

      if (response && !response.data.success) {
        throw new Error(response.data.error || 'Ошибка выполнения действия');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-users'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      setActionDialog(null);
      setReason('');
      setDuration('');
      toast.success('Действие выполнено');
    }
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telegram_id?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Активен', className: 'bg-[#10b981] text-white' },
      banned: { label: 'Забанен', className: 'bg-[#ef4444] text-white' },
      kicked: { label: 'Исключён', className: 'bg-[#f59e0b] text-white' },
      restricted: { label: 'Ограничен', className: 'bg-[#6366f1] text-white' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleAction = (action, user) => {
    setActionDialog({ action, user });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Управление пользователями</h1>
        <p className="text-[#a0a0a0]">Управляйте участниками Telegram группы</p>
      </div>

      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Участники группы</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a0a0a0] w-4 h-4" />
              <Input
                placeholder="Поиск по имени или username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="banned">Забаненные</SelectItem>
                <SelectItem value="kicked">Исключённые</SelectItem>
                <SelectItem value="restricted">Ограниченные</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1a1a1a] hover:bg-[#1a1a1a] border-[#2a2a2a]">
                  <TableHead className="text-[#a0a0a0]">Пользователь</TableHead>
                  <TableHead className="text-[#a0a0a0]">Telegram ID</TableHead>
                  <TableHead className="text-[#a0a0a0]">Роль</TableHead>
                  <TableHead className="text-[#a0a0a0]">Статус</TableHead>
                  <TableHead className="text-[#a0a0a0]">Предупреждения</TableHead>
                  <TableHead className="text-[#a0a0a0] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                    <TableCell className="text-white">
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-[#a0a0a0]">@{user.username || 'нет username'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#a0a0a0]">{user.telegram_id}</TableCell>
                    <TableCell className="text-[#a0a0a0] capitalize">{user.role}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-[#a0a0a0]">{user.warnings || 0}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction('warn', user)}
                          className="text-[#f59e0b] hover:bg-[#1a1a1a] hover:text-[#f59e0b]"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                        {user.status === 'restricted' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction('unmute', user)}
                            className="text-[#10b981] hover:bg-[#1a1a1a] hover:text-[#10b981]"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction('mute', user)}
                            className="text-[#6366f1] hover:bg-[#1a1a1a] hover:text-[#6366f1]"
                          >
                            <VolumeX className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction('kick', user)}
                          className="text-[#f59e0b] hover:bg-[#1a1a1a] hover:text-[#f59e0b]"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                        {user.status === 'banned' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction('unban', user)}
                            className="text-[#10b981] hover:bg-[#1a1a1a] hover:text-[#10b981]"
                          >
                            ✓
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction('ban', user)}
                            className="text-[#ef4444] hover:bg-[#1a1a1a] hover:text-[#ef4444]"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-[#141414] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'warn' && 'Предупреждение'}
              {actionDialog?.action === 'ban' && 'Бан пользователя'}
              {actionDialog?.action === 'kick' && 'Исключить пользователя'}
              {actionDialog?.action === 'mute' && 'Ограничить пользователя'}
              {actionDialog?.action === 'unmute' && 'Снять ограничение'}
              {actionDialog?.action === 'unban' && 'Разбанить пользователя'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[#a0a0a0]">
              Пользователь: @{actionDialog?.user?.username || actionDialog?.user?.first_name}
            </p>
            <div>
              <label className="text-sm text-[#a0a0a0] mb-2 block">Причина</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Укажите причину действия..."
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
            </div>
            {(actionDialog?.action === 'mute' || actionDialog?.action === 'ban') && (
              <div>
                <label className="text-sm text-[#a0a0a0] mb-2 block">Длительность</label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Например: 1 день, 7 дней, навсегда"
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
              className="bg-transparent border-[#2a2a2a] text-white hover:bg-[#1a1a1a]"
            >
              Отмена
            </Button>
            <Button
              onClick={() => actionMutation.mutate(actionDialog)}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}