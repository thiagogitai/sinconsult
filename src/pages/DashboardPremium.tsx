import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Phone, 
  Clock, 
  Volume2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Activity,
  Globe,
  Zap,
  Target,
  Calendar,
  Download,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Star,
  Shield,
  Wifi
} from 'lucide-react';

const DashboardPremium: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Buscar estatísticas do dashboard
      const statsResponse = await fetch('http://localhost:3020/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Buscar campanhas recentes
      const campaignsResponse = await fetch('http://localhost:3020/api/campaigns/recent');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setRecentCampaigns(campaignsData.campaigns || []);
      }

      // Buscar instâncias WhatsApp
      const whatsappResponse = await fetch('http://localhost:3020/api/whatsapp/instances');
      if (whatsappResponse.ok) {
        const whatsappData = await whatsappResponse.json();
        setWhatsappInstances(whatsappData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return ArrowUpRight;
    if (trend === 'down') return ArrowDownRight;
    return Minus;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-2 w-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="space-y-8">

      {/* Cards de Estatísticas - Design Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-2xl"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="h-8 sm:h-10 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))
        ) : stats.length > 0 ? (
          stats.map((stat, index) => {
            const getIcon = (iconName: string) => {
              const icons: { [key: string]: any } = {
                Users, MessageSquare, CheckCircle, Phone
              };
              return icons[iconName] || Users;
            };
            
            const Icon = getIcon(stat.icon);
            const TrendIcon = getTrendIcon(stat.changeType);
            const trendColor = getTrendColor(stat.changeType);
            
            return (
              <div key={index} className="group relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden mx-auto w-full max-w-sm sm:max-w-none">
                {/* Fundo gradiente decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${trendColor} bg-opacity-10 border-2 ${trendColor.replace('text-', 'border-')} border-opacity-20`}>
                      <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-3xl sm:text-4xl font-black text-gray-900 group-hover:text-green-900 transition-colors">{stat.value}</p>
                    <p className="text-base sm:text-lg font-bold text-gray-700 group-hover:text-gray-900">{stat.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-600 font-medium">{stat.description}</p>
                  </div>
                </div>
                
                {/* Indicador de progresso animado */}
                <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 group-hover:w-full" style={{width: '75%'}}></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum dado disponível no momento</p>
          </div>
        )}
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campanhas Recentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Campanhas Recentes</h3>
                <p className="text-gray-600 font-medium">Últimas campanhas executadas</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                  <Filter className="h-5 w-5" />
                </button>
                <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {loading ? (
                // Skeleton loading para campanhas
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100">
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : recentCampaigns.length > 0 ? (
                recentCampaigns.map((campaign, index) => (
                  <div key={campaign.id || index} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:from-green-50 hover:to-white transition-all duration-300 border border-gray-100 hover:border-green-200">
                    <div className="flex items-center space-x-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        campaign.status === 'completed' ? 'bg-green-100' :
                        campaign.status === 'running' ? 'bg-blue-100' :
                        campaign.status === 'scheduled' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(campaign.status)}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900">{campaign.name}</h4>
                        <p className="text-sm font-semibold text-gray-600">
                          {campaign.target_count} contatos • {campaign.sent_count} enviadas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 text-sm font-black rounded-full border-2 ${getStatusColor(campaign.status)}`}>
                        {campaign.status === 'completed' ? 'Concluída' :
                         campaign.status === 'running' ? 'Em Execução' :
                         campaign.status === 'scheduled' ? 'Agendada' : 'Rascunho'}
                      </span>
                      <span className="text-sm font-bold text-gray-500">
                        {campaign.schedule_time ? new Date(campaign.schedule_time).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nenhuma campanha recente encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status WhatsApp */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-gray-900">WhatsApp</h3>
                <p className="text-gray-600 font-medium">Status das instâncias</p>
              </div>
              <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {/* Simulação de instâncias */}
              {[
                { name: 'Principal', phone: '+55 11 99999-9999', status: 'connected' },
                { name: 'Suporte', phone: '+55 11 98888-8888', status: 'connected' },
                { name: 'Vendas', phone: '+55 11 97777-7777', status: 'connecting' }
              ].map((instance, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      instance.status === 'connected' ? 'bg-green-100' :
                      instance.status === 'connecting' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      {instance.status === 'connected' ? 
                        <CheckCircle className="h-5 w-5 text-green-600" /> :
                       instance.status === 'connecting' ?
                        <Clock className="h-5 w-5 text-yellow-600 animate-spin" /> :
                        <XCircle className="h-5 w-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">{instance.name}</h4>
                      <p className="text-sm font-semibold text-gray-600">{instance.phone}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-black rounded-full border-2 ${
                    instance.status === 'connected' ? 'bg-green-100 text-green-800 border-green-200' :
                    instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {instance.status === 'connected' ? 'Conectado' :
                     instance.status === 'connecting' ? 'Conectando' : 'Erro'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas Premium */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-gray-900">Ações Rápidas</h3>
              <p className="text-gray-600 font-medium">Tarefas mais comuns do sistema</p>
            </div>
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <button className="group flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-blue-100">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-black text-blue-900 text-center">Nova Campanha</span>
            </button>
            <button className="group flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-green-100">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-black text-green-900 text-center">Importar Contatos</span>
            </button>
            <button className="group flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-purple-100">
              <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-black text-purple-900 text-center">Conectar WhatsApp</span>
            </button>
            <button className="group flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-orange-100">
              <Volume2 className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 mb-2 sm:mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-black text-orange-900 text-center">Configurar TTS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé Simples */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            © 2025 @ Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPremium;