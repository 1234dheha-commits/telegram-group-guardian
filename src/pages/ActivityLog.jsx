import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.ModerationAction.list('-created_date', 100)
  });

  const filteredActions = actions.filter(action => {
    const matchesSearch = 
      action.moderator_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.target_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.target_telegram_id?.includes(searchQuery);
    
    const matchesAction = actionFilter === 'all' || action.action_type === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionColor = (actionType) => {
    const colors = {
      ban: 'bg-red-500',
      kick: 'bg-orange-500',
      warn: 'bg-yellow-500',
      mute: 'bg-purple-500',
      unmute: 'bg-green-500',
      unban: 'bg-blue-500',
      delete_message: 'bg-gray-500'
    };
    return colors[actionType] || 'bg-gray-500';
  };

  const getActionLabel = (actionType) => {
    const labels = {
      ban: 'Бан',
      kick: 'Кик',
      warn: 'Предупреждение',
      mute: 'Мут',
      unmute: 'Размут',
      unban: 'Разбан',
      delete_message: 'Удаление сообщения'
    };
    return labels[actionType] || actionType;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Логи действий</h1>
        <p className="text-[#a0a0a0]">Хронология всех действий модераторов</p>
      </div>

      <Card className="bg-[#141414] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">История действий</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a0a0a0] w-4 h-4" />
              <Input
                placeholder="Поиск по модератору или пользователю..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0]"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="all">Все действия</SelectItem>
                <SelectItem value="warn">Предупреждения</SelectItem>
                <SelectItem value="mute">Муты</SelectItem>
                <SelectItem value="kick">Кики</SelectItem>
                <SelectItem value="ban">Баны</SelectItem>
                <SelectItem value="delete_message">Удаления</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {filteredActions.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] mb-4">
                  <Activity className="w-8 h-8 text-[#a0a0a0]" />
                </div>
                <p className="text-[#a0a0a0]">Пока нет действий модерации</p>
                <p className="text-[#666] text-sm mt-2">Действия появятся здесь после первой модерации</p>
              </div>
            ) : (
              filteredActions.map((action, index) => (
                <div
                  key={action.id}
                  className="relative pl-8 pb-6 last:pb-0 transition-all duration-300 hover:translate-x-1"
                >
                  {index !== filteredActions.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gradient-to-b from-[#2a2a2a] to-transparent" />
                  )}
                  
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${getActionColor(action.action_type)} flex items-center justify-center shadow-lg transition-transform hover:scale-110`}>
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium">
                          {getActionLabel(action.action_type)}
                        </h3>
                        <p className="text-[#a0a0a0] text-sm mt-1">
                          <strong>Модератор:</strong> {action.moderator_name}
                        </p>
                        <p className="text-[#a0a0a0] text-sm">
                          <strong>Пользователь:</strong> @{action.target_username || action.target_telegram_id}
                        </p>
                      </div>
                      <span className="text-[#a0a0a0] text-sm whitespace-nowrap">
                        {format(new Date(action.created_date), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </span>
                    </div>
                    
                    {action.reason && (
                      <div className="mt-3 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                        <p className="text-[#a0a0a0] text-sm">
                          <strong className="text-white">Причина:</strong> {action.reason}
                        </p>
                      </div>
                    )}
                    
                    {action.duration && (
                      <p className="text-[#a0a0a0] text-sm mt-2">
                        <strong>Длительность:</strong> {action.duration}
                      </p>
                    )}
                    
                    {action.details && (
                      <p className="text-[#a0a0a0] text-sm mt-2">
                        {action.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}