import React, { useState, useEffect } from 'react';
import { Settings, User, Shield, Bell, Database, Key, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Estados para cada categoria
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'CRM WhatsApp',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    currency: 'BRL',
    batchSending: true,
    pauseOnError: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    messagesPerHour: 200,
    messagesPerDay: 2000,
    minDelay: 1,
    maxDelay: 5,
    startTime: '08:00',
    endTime: '18:00'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    completionNotifications: true,
    errorAlerts: true,
    notificationEmail: 'admin@crmwhatsapp.com'
  });

  const [apiSettings, setApiSettings] = useState({
    evolutionApiUrl: process.env.EVOLUTION_API_URL || '',
    evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
    timeout: 30
  });

  useEffect(() => {
    fetchSettings();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/settings?category=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Aplicar configurações carregadas
        if (activeTab === 'general') {
          setGeneralSettings(prev => ({ ...prev, ...data }));
        } else if (activeTab === 'security') {
          setSecuritySettings(prev => ({ ...prev, ...data }));
        } else if (activeTab === 'notifications') {
          setNotificationSettings(prev => ({ ...prev, ...data }));
        } else if (activeTab === 'api') {
          setApiSettings(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      
      let settingsToSave: any = {};
      
      if (activeTab === 'general') {
        settingsToSave = generalSettings;
      } else if (activeTab === 'security') {
        settingsToSave = securitySettings;
      } else if (activeTab === 'notifications') {
        settingsToSave = notificationSettings;
      } else if (activeTab === 'api') {
        settingsToSave = apiSettings;
      }

      const response = await fetch(`${apiBase}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsToSave)
      });

      if (response.ok) {
        toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' });
      } else {
        const data = await response.json();
        toast({ title: 'Erro', description: data.message || 'Erro ao salvar configurações', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar configurações', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Geral', icon: Settings },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'database', name: 'Banco de Dados', icon: Database }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600">Configure seu sistema CRM WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Sistema</label>
                    <input
                      type="text"
                      value={generalSettings.systemName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, systemName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="America/Sao_Paulo">America/São Paulo (UTC-3)</option>
                      <option value="America/Rio_Branco">America/Rio Branco (UTC-5)</option>
                      <option value="America/Fortaleza">America/Fortaleza (UTC-3)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="BRL">Real Brasileiro (R$)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Configurações de Envio</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Habilitar envio em lote</label>
                      <p className="text-xs text-gray-500">Envie mensagens em lotes para melhor performance</p>
                    </div>
                    <button
                      onClick={() => setGeneralSettings({ ...generalSettings, batchSending: !generalSettings.batchSending })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        generalSettings.batchSending ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        generalSettings.batchSending ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pausar em caso de erro</label>
                      <p className="text-xs text-gray-500">Pausa automaticamente se detectar muitos erros</p>
                    </div>
                    <button
                      onClick={() => setGeneralSettings({ ...generalSettings, pauseOnError: !generalSettings.pauseOnError })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        generalSettings.pauseOnError ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        generalSettings.pauseOnError ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Segurança</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limite de mensagens por hora</label>
                    <input
                      type="number"
                      value={securitySettings.messagesPerHour}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, messagesPerHour: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo de 1000 mensagens por hora</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limite de mensagens por dia</label>
                    <input
                      type="number"
                      value={securitySettings.messagesPerDay}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, messagesPerDay: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo de 5000 mensagens por dia</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delay mínimo (segundos)</label>
                    <input
                      type="number"
                      value={securitySettings.minDelay}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, minDelay: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delay máximo (segundos)</label>
                    <input
                      type="number"
                      value={securitySettings.maxDelay}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxDelay: parseInt(e.target.value) })}
                      min="1"
                      max="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Horários Permitidos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora inicial</label>
                    <input
                      type="time"
                      value={securitySettings.startTime}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora final</label>
                    <input
                      type="time"
                      value={securitySettings.endTime}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Notificações</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notificações por email</label>
                      <p className="text-xs text-gray-500">Receba notificações sobre campanhas e erros</p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({ ...notificationSettings, emailNotifications: !notificationSettings.emailNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.emailNotifications ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notificações de conclusão</label>
                      <p className="text-xs text-gray-500">Notifique quando campanhas forem concluídas</p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({ ...notificationSettings, completionNotifications: !notificationSettings.completionNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.completionNotifications ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.completionNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Alertas de erro</label>
                      <p className="text-xs text-gray-500">Notifique sobre erros críticos no sistema</p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({ ...notificationSettings, errorAlerts: !notificationSettings.errorAlerts })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.errorAlerts ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.errorAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email para notificações</label>
                <input
                  type="email"
                  value={notificationSettings.notificationEmail}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, notificationEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Evolution API Key</span>
                    <button className="text-sm text-green-600 hover:text-green-700">Regenerar</button>
                  </div>
                  <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                    {apiSettings.evolutionApiKey ? '••••••••••••••••' : 'Não configurado'}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Esta chave é usada para se conectar ao Evolution API. Mantenha-a segura e não a compartilhe.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Configurações da API</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Base da Evolution API</label>
                    <input
                      type="text"
                      value={apiSettings.evolutionApiUrl}
                      onChange={(e) => setApiSettings({ ...apiSettings, evolutionApiUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (segundos)</label>
                    <input
                      type="number"
                      value={apiSettings.timeout}
                      onChange={(e) => setApiSettings({ ...apiSettings, timeout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações do Banco de Dados</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tipo:</span>
                      <span className="ml-2 font-medium">SQLite</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium text-green-600">Conectado</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Estatísticas do Banco</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total de Registros</div>
                    <div className="text-2xl font-bold text-gray-900">-</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Tamanho do Banco</div>
                    <div className="text-2xl font-bold text-gray-900">-</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Último Backup</div>
                    <div className="text-sm font-medium text-gray-900">-</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Fazer Backup Agora
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Otimizar Banco
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Limpar Cache
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
