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
        
        // Se tiver QR Code, mostrar modal
        if (data.qrcode) {
          setSelectedInstance(data.instance);
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

  // Obter QR Code
  const getQRCode = async (instance: WhatsAppInstance) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const instanceId = instance.id || instance.instance_id || instance.name;
      const response = await fetch(`${apiBase}/whatsapp/instances/${instanceId}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedInstance({...instance, qrcode: data.qrcode});
        setQrModalOpen(true);
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
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const instanceId = instance.id || instance.instance_id || instance.name;
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
            <button
              onClick={fetchInstances}
              disabled={loading}
              className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-xl border border-gray-300 transition-all duration-200 flex items-center space-x-2"
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
              {instances.map((instance) => {
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
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
                          >
                            <QrCode className="h-4 w-4" />
                            <span>QR Code</span>
                          </button>
                        )}
                        
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

      {/* Modal de QR Code - Estilo Clean */}
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
                    <h3 className="text-gray-900 font-bold text-lg">QR Code WhatsApp</h3>
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
            
            <div className="p-8">
              {selectedInstance.qrcode ? (
                <div className="text-center">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-6">
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
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start space-x-2">
                        <Info className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div className="text-sm text-gray-800">
                          <p className="font-medium mb-1">Como escanear:</p>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700">
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
                        className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
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
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
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
                    className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
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