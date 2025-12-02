import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  QrCode, 
  Trash2, 
  RefreshCw, 
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Info,
  Wifi,
  WifiOff,
  Copy,
  Download,
  Power,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppInstance {
  id: number;
  name: string;
  instance_name?: string;
  instance_id?: string;
  phone_number: string | null;
  qrcode: string | null;
  pairing_code?: string | null;
  pairingCode?: string | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  created_at: string;
  updated_at: string;
  has_token?: boolean;
}

export default function WhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const { toast } = useToast();

  // Buscar instâncias
  const fetchInstances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/whatsapp/instances`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setInstances(data);
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao buscar instâncias WhatsApp',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar instâncias do provedor (UAZAPI)
  const syncInstances = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/whatsapp/instances/sync`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Sincronizado', description: 'Instâncias atualizadas do UAZAPI' });
        fetchInstances();
      } else {
        toast({ title: 'Erro', description: data.error || 'Falha ao sincronizar instâncias', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao sincronizar instâncias:', error);
      toast({ title: 'Erro', description: 'Erro de conexão ao sincronizar', variant: 'destructive' });
    }
  };

  // Criar nova instância
  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da instância é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/whatsapp/instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newInstanceName.trim(),
          phone_number: newPhoneNumber.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Instância WhatsApp criada com sucesso!'
        });
        setNewInstanceName('');
        setNewPhoneNumber('');
        fetchInstances();
        
        // Abrir modal de pareamento (código ou QR)
        const pairingCode = data.pairingCode || data.pairing_code || data.code || null;
        if (data.qrcode || pairingCode) {
          setSelectedInstance({
            ...(data as WhatsAppInstance),
            pairing_code: pairingCode,
            pairingCode,
            phone_number: data.phone_number || newPhoneNumber || null
          });
          setQrModalOpen(true);
        }
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao criar instância',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  // Gerar código de pareamento (e QR se disponível)
  const getPairingCode = async (instance: WhatsAppInstance) => {
    try {
      let phone = instance.phone_number || newPhoneNumber;
      if (!phone) {
        const promptPhone = window.prompt('Informe o número (E.164) do dispositivo que será pareado:', '');
        if (!promptPhone) {
          toast({ title: 'Número obrigatório', description: 'Informe o número do aparelho para gerar o código', variant: 'destructive' });
          return;
        }
        phone = promptPhone;
      }

      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const instanceId = instance.id;
      const response = await fetch(`${apiBase}/whatsapp/instances/${instanceId}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      if (response.ok) {
        const pairingCode = data.pairingCode || data.pairing_code || data.code || null;
        setSelectedInstance({
          ...instance,
          qrcode: data.qrcode,
          pairing_code: pairingCode,
          pairingCode,
          phone_number: phone || instance.phone_number
        });
        setQrModalOpen(true);
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao obter código de pareamento',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao obter código de pareamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    }
  };

  // Deletar instância
  const deleteInstance = async (instance: WhatsAppInstance) => {
    if (!confirm(`Tem certeza que deseja deletar a instância "${instance.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const instanceId = instance.id;
      const response = await fetch(`${apiBase}/whatsapp/instances/${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Instância deletada com sucesso!'
        });
        fetchInstances();
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao deletar instância',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: 'Erro',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      });
    }
  };

  const openWebhookModal = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    const base = (import.meta.env.VITE_PUBLIC_BASE_URL || '') as string;
    const defaultUrl = (base && base.trim()) ? `${base.replace(/\/+$/,'')}/api/webhooks/uaz` : `${window.location.origin}/api/webhooks/uaz`;
    setWebhookUrl(defaultUrl);
    setWebhookModalOpen(true);
  };

  const saveWebhook = async () => {
    if (!selectedInstance) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const name = selectedInstance.instance_name || selectedInstance.name;
      const resp = await fetch(`${apiBase}/whatsapp/instances/${name}/webhook`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim() })
      });
      const data = await resp.json();
      if (resp.ok) {
        toast({ title: 'Webhook configurado', description: webhookUrl.trim() });
        setWebhookModalOpen(false);
      } else {
        toast({ title: 'Erro', description: data.error || 'Falha ao configurar webhook', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao configurar webhook', variant: 'destructive' });
    }
  };

  // Buscar instâncias ao montar componente
  useEffect(() => {
    fetchInstances();
  }, []);

  // Atualizar status periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInstances();
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Verificar status mais frequentemente quando há instâncias conectando
  useEffect(() => {
    const connectingInstances = instances.filter(i => i.status === 'connecting');
    if (connectingInstances.length === 0) return;

    const interval = setInterval(async () => {
      // Verificar status de cada instância conectando
      let statusChanged = false;
      
      for (const instance of connectingInstances) {
        try {
          const token = localStorage.getItem('token');
          const apiBase = import.meta.env.VITE_API_URL || '/api';
          const response = await fetch(`${apiBase}/whatsapp/instances/${instance.id}/status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            // Se mudou para connected, marcar para atualizar lista
            if (data.status === 'connected' && instance.status !== 'connected') {
              statusChanged = true;
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
        }
      }
      
      // Atualizar lista se algum status mudou
      if (statusChanged) {
        fetchInstances();
      }
    }, 5000); // Verificar a cada 5 segundos quando está conectando

    return () => clearInterval(interval);
  }, [instances]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: 'bg-green-100 text-green-800 border-green-200',
          text: 'Conectado',
          description: 'WhatsApp conectado e funcionando'
        };
      case 'disconnected':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          badge: 'bg-red-100 text-red-800 border-red-200',
          text: 'Desconectado',
          description: 'Aguardando conexão'
        };
      case 'connecting':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500 animate-spin" />,
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Conectando',
          description: 'Processando conexão'
        };
      default:
        return {
          icon: <XCircle className="h-5 w-5 text-gray-500" />,
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Erro',
          description: 'Problema na conexão'
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header - Estilo Importar Excel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">WhatsApp Business</h1>
                <p className="text-gray-600 text-xl font-light mt-1">Gerenciamento Profissional de Instâncias</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">{instances.filter(i => i.status === 'connected').length} Conectados</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{instances.filter(i => i.status === 'connecting').length} Conectando</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{instances.filter(i => i.status === 'disconnected').length} Desconectados</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-3xl font-bold text-gray-900">{instances.length}</div>
              <div className="text-gray-600 text-sm font-medium mt-1">Total de Instâncias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Criação - Estilo Clean */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Criar Nova Instância</h2>
              <p className="text-gray-600">Configure um novo número WhatsApp para suas campanhas</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Nome da Instância *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ex: minha-empresa"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:border-gray-400 focus:outline-none transition-colors text-gray-900 font-medium"
                />
              </div>
              <p className="text-xs text-gray-500">Identificador único da instância</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Número de Telefone
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="5511999999999 (opcional)"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:border-gray-400 focus:outline-none transition-colors text-gray-900 font-medium"
                />
              </div>
              <p className="text-xs text-gray-500">Código do país + DDD + número</p>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={createInstance}
                disabled={creating || !newInstanceName.trim()}
                className="w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center space-x-2 shadow-lg"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Criar Instância</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Instâncias - Design Clean */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Suas Instâncias</h2>
                <p className="text-gray-600">Gerencie seus números WhatsApp conectados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConnectedOnly((v) => !v)}
                className={`px-4 py-2 rounded-xl border transition-all ${showConnectedOnly ? 'bg-green-600 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {showConnectedOnly ? 'Somente conectadas' : 'Todas'}
              </button>
              <button
                onClick={fetchInstances}
                disabled={loading}
                className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-xl border border-gray-300 transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
              <button
                onClick={syncInstances}
                className="bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <Wifi className="h-4 w-4" />
                <span>Sincronizar UAZAPI</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-gray-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Carregando instâncias...</p>
              </div>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma instância criada</h3>
              <p className="text-gray-600 mb-6">Crie sua primeira instância WhatsApp para começar a enviar mensagens.</p>
              <button
                onClick={() => document.getElementById('instance-name')?.focus()}
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Criar Primeira Instância
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(showConnectedOnly ? instances.filter(i => i.status === 'connected') : instances).map((instance) => {
                const statusInfo = getStatusInfo(instance.status);
                return (
                  <div key={instance.id} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-900">{instance.name}</h3>
                          <p className="text-sm text-gray-600">
                            {instance.phone_number ? 
                              `+${instance.phone_number}` : 
                              'Número não definido'
                            }
                          </p>
                          <div className="mt-1 text-xs">
                            {instance.has_token ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-bold">Token OK</span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold">Sem token</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${statusInfo.badge}`}>
                        <div className="flex items-center space-x-1">
                          {statusInfo.icon}
                          <span>{statusInfo.text}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{statusInfo.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Criado em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {instance.status !== 'connected' && (
                          <button
                            onClick={() => getPairingCode(instance)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>Parear por código</span>
                          </button>
                        )}
                        <button
                          onClick={() => openWebhookModal(instance)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
                        >
                          <Wifi className="h-4 w-4" />
                          <span>Webhook</span>
                        </button>
                        
                        <button
                          onClick={() => deleteInstance(instance)}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pareamento - Código e QR */}
      {qrModalOpen && selectedInstance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg">Pareamento WhatsApp</h3>
                    <p className="text-gray-600 text-sm">{selectedInstance.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {selectedInstance.pairingCode || selectedInstance.pairing_code ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center space-y-3">
                  <p className="text-sm text-gray-600 font-semibold">Código de pareamento</p>
                  <div className="text-3xl font-extrabold tracking-widest text-gray-900 bg-white border border-gray-200 rounded-xl py-3">
                    {selectedInstance.pairingCode || selectedInstance.pairing_code}
                  </div>
                  <button
                    onClick={() => {
                      const code = selectedInstance.pairingCode || selectedInstance.pairing_code;
                      if (code) navigator.clipboard.writeText(String(code));
                      toast({ title: 'Copiado', description: 'Código copiado para a área de transferência' });
                    }}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar código
                  </button>
                </div>
              ) : null}

              {selectedInstance.qrcode ? (
                <div className="text-center">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-4">
                    <img
                      src={`data:image/png;base64,${selectedInstance.qrcode}`}
                      alt="QR Code WhatsApp"
                      className="w-56 h-56 mx-auto rounded-xl"
                    />
                  </div>
                  <p className="text-sm text-gray-700 mb-4">Se preferir, escaneie o QR Code com o WhatsApp.</p>
                </div>
              ) : null}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-800 space-y-1">
                    <p className="font-medium">Como parear por código:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      <li>Abra o WhatsApp no celular</li>
                      <li>Toque em "Dispositivos Conectados"</li>
                      <li>Escolha "Conectar com código do telefone"</li>
                      <li>Digite o código acima</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => getPairingCode(selectedInstance)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Gerar novo código</span>
                </button>
                {selectedInstance.qrcode && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`data:image/png;base64,${selectedInstance.qrcode}`);
                      toast({
                        title: 'Copiado!',
                        description: 'QR Code copiado para a área de transferência'
                      });
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar QR</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {webhookModalOpen && selectedInstance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg">Configurar Webhook</h3>
                    <p className="text-gray-600 text-sm">{selectedInstance.name}</p>
                  </div>
                </div>
                <button onClick={()=>setWebhookModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <input value={webhookUrl} onChange={(e)=>setWebhookUrl(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="https://seu-dominio/api/webhooks/uaz" />
              <div className="flex justify-end gap-2">
                <button onClick={()=>setWebhookModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancelar</button>
                <button onClick={saveWebhook} className="px-4 py-2 rounded bg-gray-700 text-white">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
