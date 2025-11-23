import React from 'react';
import { Clock, Calendar, Play, Pause, Settings } from 'lucide-react';

const Schedules: React.FC = () => {
  const schedules = [
    {
      id: 1,
      name: 'Campanha Matinal',
      time: '08:00',
      status: 'active',
      lastRun: '2024-11-22 08:15',
      nextRun: '2024-11-23 08:00',
      frequency: 'Diariamente'
    },
    {
      id: 2,
      name: 'Campanha Vespertina',
      time: '17:00',
      status: 'active',
      lastRun: '2024-11-22 17:05',
      nextRun: '2024-11-23 17:00',
      frequency: 'Diariamente'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                      <p className="text-sm text-gray-600">{schedule.frequency} às {schedule.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                    {schedule.status === 'active' ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Última Execução</span>
                    </div>
                    <p className="text-sm text-gray-600">{schedule.lastRun}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Próxima Execução</span>
                    </div>
                    <p className="text-sm text-gray-600">{schedule.nextRun}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">Configurar</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
                    <Pause className="h-4 w-4" />
                    <span className="text-sm font-medium">Pausar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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