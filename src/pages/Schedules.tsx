import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Play, Pause, Settings, Trash2 } from 'lucide-react';
import { campaignsAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await campaignsAPI.getAll();
      const campaigns = response.data || [];
      
      // Filtrar apenas campanhas agendadas
      const scheduled = campaigns
        .filter((c: any) => c.schedule_time && c.status === 'scheduled')
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          time: new Date(c.schedule_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(c.schedule_time).toLocaleDateString('pt-BR'),
          status: c.status,
          lastRun: null,
          nextRun: c.schedule_time,
          frequency: 'Única',
          channel: c.channel || 'whatsapp'
        }));
      
      setSchedules(scheduled);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar agendamentos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return;
    }

    try {
      await campaignsAPI.delete(id.toString());
      toast({ title: 'Sucesso', description: 'Agendamento excluído com sucesso!' });
      fetchSchedules();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir agendamento', variant: 'destructive' });
    }
  };

  const handlePause = async (id: number) => {
    try {
      await campaignsAPI.pause(id.toString());
      toast({ title: 'Sucesso', description: 'Agendamento pausado!' });
      fetchSchedules();
    } catch (error) {
      console.error('Erro ao pausar agendamento:', error);
      toast({ title: 'Erro', description: 'Erro ao pausar agendamento', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelBadge = (channel: string) => {
    const colors: any = {
      whatsapp: 'bg-green-100 text-green-800',
      sms: 'bg-blue-100 text-blue-800',
      email: 'bg-purple-100 text-purple-800'
    };
    return colors[channel] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando agendamentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-gray-600 mt-1">Gerencie os horários de suas campanhas</p>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Horários Configurados</h2>
        </div>
        <div className="p-6">
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum agendamento encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Crie uma campanha agendada para ver aqui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                        <p className="text-sm text-gray-600">{schedule.frequency} - {schedule.date} às {schedule.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getChannelBadge(schedule.channel)}`}>
                        {schedule.channel?.toUpperCase() || 'WHATSAPP'}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status === 'scheduled' ? 'Agendado' : 'Pausado'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Data e Hora</span>
                      </div>
                      <p className="text-sm text-gray-600">{schedule.date} às {schedule.time}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Status</span>
                      </div>
                      <p className="text-sm text-gray-600">{schedule.status === 'scheduled' ? 'Agendado' : 'Pausado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handlePause(schedule.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      <Pause className="h-4 w-4" />
                      <span className="text-sm font-medium">Pausar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(schedule.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuração de Horários</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-800">
            <strong>Horários recomendados:</strong> 08:00 e 17:00 para evitar bloqueios do WhatsApp
          </p>
          <p className="text-sm text-gray-800 mt-2">
            Os envios são distribuídos em um período de 30-45 minutos para garantir segurança e evitar spam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
