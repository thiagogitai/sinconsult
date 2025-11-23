import React, { useState } from 'react';
import { Phone, QrCode, Settings, AlertCircle, CheckCircle, Play, RefreshCw } from 'lucide-react';

const WhatsApp: React.FC = () => {
  const [instances, setInstances] = useState([
    {
      id: 1,
      name: 'Instância Principal',
      phone: '+55 11 98765-4321',
      status: 'connected',
      lastActivity: '2 minutos atrás',
      qrcode: null,
      apiKey: 'evolution_api_key_123'
    },
    {
      id: 2,
      name: 'Instância Secundária',
      phone: '+55 11 99876-5432',
      status: 'connected',
      lastActivity: '5 minutos atrás',
      qrcode: null,
      apiKey: 'evolution_api_key_456'
    },
    {
      id: 3,
      name: 'Instância de Backup',
      phone: null,
      status: 'disconnected',
      lastActivity: '1 hora atrás',
      qrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      apiKey: 'evolution_api_key_789'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstance, setNewInstance] = useState({ name: '', phone: '' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-5 w-5 text-yellow-600" />;
      case 'disconnected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleCreateInstance = () => {
    if (newInstance.name) {
      const instance = {
        id: instances.length + 1,
        name: newInstance.name,
        phone: newInstance.phone || null,
        status: 'disconnected' as const,
        lastActivity: 'Nunca',
        qrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apiKey: `evolution_api_key_${Date.now()}`
      };
      setInstances([...instances, instance]);
      setShowCreateModal(false);
      setNewInstance({ name: '', phone: '' });
    }
  };

  const handleRefreshQR = (id: number) => {
    // Simulate QR code refresh
    console.log('Refreshing QR code for instance:', id);
  };

  const handleDisconnect = (id: number) => {
    setInstances(instances.map(instance => 
      instance.id === id 
        ? { ...instance, status: 'disconnected', phone: null, lastActivity: 'Agora' }
        : instance
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
            <p className="text-gray-600 mt-1">Gerencie suas instâncias WhatsApp e QR Codes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>Nova Instância</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Instâncias</p>
              <p className="text-2xl font-bold text-gray-900">{instances.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Phone className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conectadas</p>
              <p className="text-2xl font-bold text-gray-900">{instances.filter(i => i.status === 'connected').length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Desconectadas</p>
              <p className="text-2xl font-bold text-gray-900">{instances.filter(i => i.status === 'disconnected').length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">QR Codes</p>
              <p className="text-2xl font-bold text-gray-900">{instances.filter(i => i.qrcode).length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Instances List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Instâncias WhatsApp</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {instances.map((instance) => (
            <div key={instance.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(instance.status)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{instance.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {instance.phone ? instance.phone : 'Não conectado'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Última atividade: {instance.lastActivity}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(instance.status)}`}>
                    {instance.status === 'connected' ? 'Conectado' : 
                     instance.status === 'connecting' ? 'Conectando' : 'Desconectado'}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {instance.qrcode && (
                      <button
                        onClick={() => handleRefreshQR(instance.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg"
                        title="Atualizar QR Code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    
                    {instance.status === 'connected' && (
                      <button
                        onClick={() => handleDisconnect(instance.id)}
                        className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                      >
                        Desconectar
                      </button>
                    )}
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {instance.qrcode && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">QR Code para Conexão</h4>
                    <span className="text-xs text-gray-500">Escaneie com seu WhatsApp</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <img
                        src={instance.qrcode}
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Como conectar:</strong>
                        </p>
                        <ol className="text-sm text-yellow-700 mt-1 space-y-1">
                          <li>1. Abra o WhatsApp no seu celular</li>
                          <li>2. Toque em <strong>Configurações</strong> → <strong>Dispositivos Conectados</strong></li>
                          <li>3. Toque em <strong>Conectar um Dispositivo</strong></li>
                          <li>4. Aponte a câmera para o QR Code acima</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  API Key: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{instance.apiKey}</span>
                </div>
                <div className="text-gray-500">
                  Evolution API v2.0
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Criar Nova Instância</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instância</label>
                <input
                  type="text"
                  value={newInstance.name}
                  onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Instância Principal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Telefone (opcional)</label>
                <input
                  type="text"
                  value={newInstance.phone}
                  onChange={(e) => setNewInstance({ ...newInstance, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+55 11 98765-4321"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> A instância será criada com status desconectado. Use o QR Code para conectar.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateInstance}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Criar Instância
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;