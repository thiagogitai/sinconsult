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
  phone_number: string | null;
  qrcode: string | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  created_at: string;
  updated_at: string;
}

export default function WhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const { toast } = useToast();

  // Buscar instâncias
  const fetchInstances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para visualizar instâncias WhatsApp',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/whatsapp/instances', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setInstances(data);
      } else if (response.status === 401) {
        toast({
          title: 'Erro de Autenticação',
          description: data.message || 'Token de autenticação não fornecido',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao buscar instâncias WhatsApp',
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
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para criar instâncias WhatsApp',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        
        // Se tiver QR Code, mostrar modal
        if (data.qrcode) {
          setSelectedInstance(data.instance);
          setQrModalOpen(true);
        }
      } else if (response.status === 401) {
        toast({
          title: 'Erro de Autenticação',
          description: data.message || 'Token de autenticação não fornecido',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro',
          description: data.message || data.error || 'Erro ao criar instância',
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

  // Obter QR Code
  const getQRCode = async (instance: WhatsAppInstance) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para obter QR Code',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`/api/whatsapp/instances/${instance.name}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedInstance({...instance, qrcode: data.qrcode});
        setQrModalOpen(true);
      } else if (response.status === 401) {
        toast({
          title: 'Erro de Autenticação',
          description: data.message || 'Token de autenticação não fornecido',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao obter QR Code',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
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
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado para deletar instâncias',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`/api/whatsapp/instances/${instance.name}`, {
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
      } else if (response.status === 401) {
        const data = await response.json();
        toast({
          title: 'Erro de Autenticação',
          description: data.message || 'Token de autenticação não fornecido',
          variant: 'destructive'
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao deletar instância',
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
      {/* Header Premium - Cores Sim Consult */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-green-600/30"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/15 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">WhatsApp Business</h1>
                <p className="text-blue-100 text-xl font-light mt-1">Gerenciamento Profissional de Instâncias</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{instances.filter(i => i.status === 'connected').length} Conectados</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm font-medium">{instances.filter(i => i.status === 'connecting').length} Conectando</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <div className="h-3 w-3 bg-red-400 rounded-full"></div>
                <span className="text-sm font-medium">{instances.filter(i => i.status === 'disconnected').length} Desconectados</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold text-white">{instances.length}</div>
              <div className="text-blue-100 text-sm font-medium mt-1">Total de Instâncias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Criação Premium */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
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
                  className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 font-medium"
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
                  className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-900 font-medium"
                />
              </div>
              <p className="text-xs text-gray-500">Código do país + DDD + número</p>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={createInstance}
                disabled={creating || !newInstanceName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center space-x-2 shadow-lg"
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

      {/* Lista de Instâncias - Design Premium */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Suas Instâncias</h2>
                <p className="text-gray-600">Gerencie seus números WhatsApp conectados</p>
              </div>
            </div>
            <button
              onClick={fetchInstances}
              disabled={loading}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-xl border-2 border-gray-200 transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Criar Primeira Instância
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {instances.map((instance) => {
                const statusInfo = getStatusInfo(instance.status);
                return (
                  <div key={instance.id} className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-900">{instance.name}</h3>
                          <p className="text-sm text-gray-600">
                            {instance.phone_number ? 
                              `+${instance.phone_number}` : 
                              'Número não definido'
                            }
                          </p>
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
                            onClick={() => getQRCode(instance)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>QR Code</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteInstance(instance)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-3 rounded-xl transition-all duration-200 transform hover:scale-105"
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

      {/* Modal de QR Code Premium */}
      {qrModalOpen && selectedInstance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">QR Code WhatsApp</h3>
                    <p className="text-blue-100 text-sm">{selectedInstance.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="text-white hover:text-blue-200 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              {selectedInstance.qrcode ? (
                <div className="text-center">
                  <div className="bg-white p-6 rounded-2xl shadow-inner mb-6 border-2 border-gray-100">
                    <img 
                      src={`data:image/png;base64,${selectedInstance.qrcode}`}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 mx-auto rounded-xl"
                    />
                  </div>
                  <div className="space-y-4">
                    <p className="text-gray-700 font-medium">
                      Escaneie este QR Code com seu WhatsApp para conectar a instância.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-2">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Como escanear:</p>
                          <ol className="list-decimal list-inside space-y-1 text-blue-700">
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Toque em "Dispositivos Conectados"</li>
                            <li>Toque em "Conectar um dispositivo"</li>
                            <li>Aponte a câmera para o QR Code</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => getQRCode(selectedInstance)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Atualizar</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`data:image/png;base64,${selectedInstance.qrcode}`);
                          toast({
                            title: 'Copiado!',
                            description: 'QR Code copiado para a área de transferência'
                          });
                        }}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">QR Code não disponível</h4>
                  <p className="text-gray-600 mb-6">Clique no botão abaixo para gerar um novo QR Code.</p>
                  <button
                    onClick={() => getQRCode(selectedInstance)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <RefreshCw className="h-5 w-5 mr-2 inline" />
                    Gerar QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}