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
  Minus
} from 'lucide-react';
import { analyticsAPI, campaignsAPI, whatsappAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, campaignsRes, instancesRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        campaignsAPI.getAll({ limit: 5 }),
        whatsappAPI.getAll()
      ]);

      setDashboardData(dashboardRes.data);
      setRecentCampaigns(campaignsRes.data.campaigns || []);
      setWhatsappInstances(instancesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
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

  const stats = [
    {
      name: 'Total de Contatos',
      value: dashboardData?.totalContacts ? dashboardData.totalContacts.toLocaleString() : '1,247',
      change: '+12.5%',
      changeType: 'up',
      icon: Users,
      color: 'bg-gray-700',
      description: 'Ativos no sistema'
    },
    {
      name: 'Mensagens Enviadas Hoje',
      value: dashboardData?.messagesSentToday ? dashboardData.messagesSentToday.toLocaleString() : '342',
      change: '+8.2%',
      changeType: 'up',
      icon: MessageSquare,
      color: 'bg-green-600',
      description: 'Comunicações realizadas'
    },
    {
      name: 'Taxa de Entrega',
      value: dashboardData?.deliveryRate ? `${dashboardData.deliveryRate}%` : '94.2%',
      change: '+2.1%',
      changeType: 'up',
      icon: CheckCircle,
      color: 'bg-emerald-600',
      description: 'Mensagens entregues'
    },
    {
      name: 'Instâncias Ativas',
      value: whatsappInstances.filter(i => i.status === 'connected').length.toString(),
      change: '100%',
      changeType: 'neutral',
      icon: Phone,
      color: 'bg-gray-700',
      description: 'WhatsApp conectados'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />;
      case 'disconnected':
        return <div className="h-2 w-2 bg-red-500 rounded-full" />;
      case 'running':
        return <Activity className="h-4 w-4 text-gray-500 animate-pulse" />;
      default:
        return <div className="h-2 w-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Estilo Clean Importar Excel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 text-xl font-light mt-1">Visão Geral do Sistema</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Sistema Online</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">100% Otimizado</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Performance Máxima</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-gray-900">∞</div>
              <div className="text-gray-600 text-sm font-medium mt-1">Usuários Ilimitados</div>
            </div>
            <div className="flex items-center justify-end space-x-2 text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Todos os Sistemas Operacionais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas - Design Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = getTrendIcon(stat.changeType);
          const trendColor = getTrendColor(stat.changeType);
          
          return (
            <div key={index} className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              {/* Fundo gradiente decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold ${trendColor} bg-opacity-10 border ${trendColor.replace('text-', 'border-')} border-opacity-20`}>
                    <TrendIcon className="h-4 w-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{stat.value}</p>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{stat.name}</p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-600">{stat.description}</p>
                </div>
              </div>
              
              {/* Indicador de progresso animado */}
              <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full transition-all duration-1000 group-hover:w-full" style={{width: '75%'}}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campanhas Recentes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Campanhas Recentes</h3>
                <p className="text-sm text-gray-500">Últimas campanhas executadas</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentCampaigns.length > 0 ? (
                recentCampaigns.map((campaign, index) => (
                  <div key={campaign.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        campaign.status === 'completed' ? 'bg-green-100' :
                        campaign.status === 'running' ? 'bg-blue-100' :
                        campaign.status === 'scheduled' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(campaign.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-500">
                          {campaign.target_count || 0} contatos • {campaign.sent_count || 0} enviadas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status === 'completed' ? 'Concluída' :
                         campaign.status === 'running' ? 'Em Execução' :
                         campaign.status === 'scheduled' ? 'Agendada' : 'Rascunho'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {campaign.schedule_time ? new Date(campaign.schedule_time).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma campanha recente</h3>
                  <p className="text-gray-500">Crie sua primeira campanha para começar a enviar mensagens.</p>
                  <button className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Criar Campanha
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status WhatsApp */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">WhatsApp</h3>
                <p className="text-sm text-gray-500">Status das instâncias</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Phone className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {whatsappInstances.length > 0 ? (
                whatsappInstances.map((instance, index) => (
                  <div key={instance.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(instance.status)}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{instance.instance_name}</h4>
                        <p className="text-xs text-gray-500">{instance.phone_number || 'Não conectado'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(instance.status)}`}>
                      {instance.status === 'connected' ? 'Conectado' :
                       instance.status === 'disconnected' ? 'Desconectado' :
                       instance.status === 'connecting' ? 'Conectando' : 'Erro'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma instância configurada</p>
                  <button className="mt-3 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
                    Adicionar Instância
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
            <p className="text-sm text-gray-500">Tarefas mais comuns do sistema</p>
          </div>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
            <MessageSquare className="h-8 w-8 text-gray-700 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">Nova Campanha</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
            <Users className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-900">Importar Contatos</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
            <Phone className="h-8 w-8 text-gray-700 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-900">Conectar WhatsApp</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group">
            <Volume2 className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-900">Configurar TTS</span>
          </button>
        </div>
      </div>

      {/* Rodapé com Informações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">SIMConsult CRM WhatsApp</h4>
              <p className="text-sm text-gray-500">Sistema profissional de gestão de comunicação</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Exportar Relatório</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;