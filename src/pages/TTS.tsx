import React, { useState, useEffect } from 'react';
import { Volume2, Settings, Play, Save, Globe, User } from 'lucide-react';

const TTS: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [testText, setTestText] = useState('Olá, esta é uma mensagem de teste do sistema CRM WhatsApp.');
  const [voices, setVoices] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  const providers = [
    { id: 'openai', name: 'OpenAI TTS', status: 'active' },
    { id: 'elevenlabs', name: 'ElevenLabs', status: 'active' },
    { id: 'google', name: 'Google Cloud TTS', status: 'inactive' },
    { id: 'aws', name: 'Amazon Polly', status: 'inactive' },
    { id: 'azure', name: 'Microsoft Azure', status: 'inactive' }
  ];

  const metrics = {
    totalAudioGenerated: 2847,
    totalCharacters: 156420,
    estimatedCost: 7.82,
    cacheHitRate: 73,
    averageDuration: 8.5
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Buscar voices quando o provider mudar
  useEffect(() => {
    fetchVoices(selectedProvider);
  }, [selectedProvider]);

  // Buscar arquivos recentes
  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const fetchVoices = async (provider: string) => {
    try {
      const response = await fetch(`http://localhost:3020/api/tts/voices/${provider}`);
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices);
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar voices:', error);
      // Usar voices padrão em caso de erro
      const defaultVoices = {
        openai: [
          { id: 'alloy', name: 'Alloy - Neutro', language: 'pt-BR' },
          { id: 'echo', name: 'Echo - Masculino', language: 'pt-BR' },
          { id: 'nova', name: 'Nova - Feminino', language: 'pt-BR' },
          { id: 'shimmer', name: 'Shimmer - Feminino', language: 'pt-BR' }
        ],
        elevenlabs: [
          { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Feminino', language: 'pt-BR' }
        ]
      };
      setVoices(defaultVoices[provider as keyof typeof defaultVoices] || []);
    }
  };

  const fetchRecentFiles = async () => {
    try {
      const response = await fetch('http://localhost:3020/api/tts/files');
      if (response.ok) {
        const data = await response.json();
        setRecentFiles(data.files || []);
      }
    } catch (error) {
      console.error('Erro ao buscar arquivos recentes:', error);
    }
  };

  const generateAudio = async () => {
    if (!testText.trim()) {
      alert('Por favor, insira um texto para gerar áudio');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:3020/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          provider: selectedProvider,
          voice: selectedVoice,
          options: {
            speed: speed,
            pitch: pitch,
            volume: volume
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Áudio gerado com sucesso! Arquivo: ${data.filename}`);
        fetchRecentFiles(); // Atualizar lista de arquivos
      } else {
        const error = await response.json();
        alert(`Erro ao gerar áudio: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      alert('Erro ao conectar ao servidor TTS');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Texto para Áudio (TTS)</h1>
            <p className="text-gray-600 mt-1">Configure e gerencie a conversão de texto para áudio</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Volume2 className="h-4 w-4" />
            <span>Sistema configurado</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Áudios Gerados</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalAudioGenerated}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Volume2 className="h-6 w-6 text-gray-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Caracteres</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalCharacters.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Globe className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Custo Estimado</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.estimatedCost}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Settings className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.cacheHitRate}%</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Save className="h-6 w-6 text-gray-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duração Média</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageDuration}s</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Play className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuração do Provedor</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provedor TTS</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} {provider.status === 'active' ? '(Ativo)' : '(Inativo)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voz</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {voices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.language})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Velocidade</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{speed}x</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tom</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{pitch}x</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volume</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{Math.round(volume * 100)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Testar Configuração</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto de Teste</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Digite o texto para testar a conversão..."
              />
              <p className="text-xs text-gray-500 mt-1">Caracteres: {testText.length}</p>
            </div>

            <button 
              onClick={generateAudio}
              disabled={isGenerating}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>{isGenerating ? 'Gerando...' : 'Gerar Áudio de Teste'}</span>
            </button>

            {testText && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Previsão:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duração:</span>
                    <span className="ml-2 font-medium">~{Math.ceil(testText.length / 15)}s</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Custo:</span>
                    <span className="ml-2 font-medium">${(testText.length * 0.00004).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Audio Cache */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Áudios em Cache</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Texto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acessos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expira</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentFiles.length > 0 ? (
                recentFiles.map((file, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                      {file.texto_original}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{file.duracao}s</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{file.tamanho}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{file.acessos}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{file.expira_em_dias} dias</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 text-center">
                    Nenhum arquivo de áudio gerado ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TTS;