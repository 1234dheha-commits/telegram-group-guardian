import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from "sonner";

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [action, setAction] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date')
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status, action, notes }) => {
      const currentUser = await base44.auth.me();
      
      await base44.entities.Report.update(reportId, {
        status: status,
        action_taken: action,
        reviewed_by: currentUser.full_name
      });

      if (action && action !== 'none') {
        // Получить Chat ID из конфигурации
        const configs = await base44.entities.BotConfig.filter({ is_active: true });
        const chat_id = configs.length > 0 ? configs[0].chat_id : selectedReport.chat_id;

        // Вызов соответствующей функции
        if (action === 'delete_message' && selectedReport.message_id) {
          await base44.functions.invoke('deleteMessage', {
            chat_id: chat_id,
            message_id: selectedReport.message_id,
            reason: notes
          });
        } else if (action === 'ban') {
          await base44.functions.invoke('banUser', {
            telegram_user_id: selectedReport.telegram_user_id,
            chat_id: chat_id,
            reason: `Репорт: ${selectedReport.reason}`,
            duration: 'навсегда'
          });
        } else if (action === 'mute') {
          await base44.functions.invoke('muteUser', {
            telegram_user_id: selectedReport.telegram_user_id,
            chat_id: chat_id,
            reason: `Репорт: ${selectedReport.reason}`,
            duration_seconds: 86400 // 1 день
          });
        } else if (action === 'kick') {
          await base44.functions.invoke('kickUser', {
            telegram_user_id: selectedReport.telegram_user_id,
            chat_id: chat_id,
            reason: `Репорт: ${selectedReport.reason}`
          });
        } else if (action === 'warn') {
          await base44.entities.ModerationAction.create({
            action_type: 'warn',
            target_telegram_id: selectedReport.telegram_user_id,
            moderator_name: currentUser.full_name,
            reason: `Репорт: ${selectedReport.reason}`,
            details: notes
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      setSelectedReport(null);
      setAction('');
      setActionNotes('');
      toast.success('Репорт обработан');
    }
  });

  const getStatusBadge = (status) => {
    const configs = {
      pending: { icon: Clock, label: 'Ожидает', className: 'bg-[#f59e0b] text-white' },
      reviewed: { icon: AlertCircle, label: 'На рассмотрении', className: 'bg-[#6366f1] text-white' },
      resolved: { icon: CheckCircle, label: 'Решён', className: 'bg-[#10b981] text-white' },
      rejected: { icon: XCircle, label: 'Отклонён', className: 'bg-[#ef4444] text-white' }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.className} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleResolve = (status) => {
    resolveReportMutation.mutate({
      reportId: selectedReport.id,
      status,
      action,
      notes: actionNotes
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Репорты</h1>
        <p className="text-[#a0a0a0]">Управление жалобами на пользователей и сообщения</p>
      </div>

      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Список репортов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] mb-4">
                  <AlertCircle className="w-8 h-8 text-[#a0a0a0]" />
                </div>
                <p className="text-[#a0a0a0]">Пока нет репортов</p>
                <p className="text-[#666] text-sm mt-2">Пользователи могут отправлять жалобы через команду /report</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3b82f6] transition-all duration-200 cursor-pointer transform hover:scale-[1.01]"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">
                          Репорт на пользователя: {report.telegram_user_id}
                        </h3>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-[#a0a0a0] text-sm mb-2">
                        Отправитель: {report.reporter_telegram_id}
                      </p>
                      {report.reason && (
                        <p className="text-[#a0a0a0] text-sm">
                          <strong>Причина:</strong> {report.reason}
                        </p>
                      )}
                    </div>
                    <span className="text-[#a0a0a0] text-sm whitespace-nowrap">
                      {format(new Date(report.created_date), 'dd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                  
                  {report.message_text && (
                    <div className="mt-3 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                      <p className="text-[#a0a0a0] text-sm">
                        <strong className="text-white">Сообщение:</strong> {report.message_text}
                      </p>
                    </div>
                  )}
                  
                  {report.reviewed_by && (
                    <p className="text-[#a0a0a0] text-sm mt-3">
                      Обработано: {report.reviewed_by}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="bg-[#141414] border-[#2a2a2a] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали репорта</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#a0a0a0] text-sm">Пользователь</p>
                <p className="text-white">{selectedReport?.telegram_user_id}</p>
              </div>
              <div>
                <p className="text-[#a0a0a0] text-sm">Отправитель</p>
                <p className="text-white">{selectedReport?.reporter_telegram_id}</p>
              </div>
              <div>
                <p className="text-[#a0a0a0] text-sm">Статус</p>
                {selectedReport && getStatusBadge(selectedReport.status)}
              </div>
              <div>
                <p className="text-[#a0a0a0] text-sm">Дата</p>
                <p className="text-white">
                  {selectedReport && format(new Date(selectedReport.created_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </p>
              </div>
            </div>
            
            {selectedReport?.reason && (
              <div>
                <p className="text-[#a0a0a0] text-sm mb-2">Причина</p>
                <p className="text-white">{selectedReport.reason}</p>
              </div>
            )}
            
            {selectedReport?.message_text && (
              <div>
                <p className="text-[#a0a0a0] text-sm mb-2">Сообщение</p>
                <div className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]">
                  <p className="text-white">{selectedReport.message_text}</p>
                </div>
              </div>
            )}
            
            {selectedReport?.status === 'pending' && (
              <>
                <div>
                  <label className="text-sm text-[#a0a0a0] mb-2 block">Действие</label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      <SelectValue placeholder="Выберите действие..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="none">Без действий</SelectItem>
                      <SelectItem value="warn">Предупреждение</SelectItem>
                      <SelectItem value="mute">Мут</SelectItem>
                      <SelectItem value="kick">Кик</SelectItem>
                      <SelectItem value="ban">Бан</SelectItem>
                      <SelectItem value="delete_message">Удалить сообщение</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-[#a0a0a0] mb-2 block">Заметки</label>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Дополнительные заметки..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedReport(null)}
              className="bg-transparent border-[#2a2a2a] text-white hover:bg-[#1a1a1a]"
            >
              Закрыть
            </Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleResolve('rejected')}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                >
                  Отклонить
                </Button>
                <Button
                  onClick={() => handleResolve('resolved')}
                  className="bg-[#10b981] hover:bg-[#059669] text-white"
                >
                  Решить
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}