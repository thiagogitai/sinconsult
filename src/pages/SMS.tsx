import React, { useState, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Eye, 
  Save,
  X,
  Phone,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const SMS: React.FC = () => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');
  const [previewData, setPreviewData] = useState({
    character_count: 0,
    sms_count: 0,
    estimated_cost: 0
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Detectar variáveis na mensagem
  useEffect(() => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = message.matchAll(variableRegex);
    const foundVars: Record<string, string> = {};
    
    for (const match of matches) {
      const varName = match[1];
      if (!foundVars[varName]) {
        foundVars[varName] = variables[varName] || '';
      }
    }
    
    setVariables(foundVars);
  }, [message]);

  // Atualizar preview quando mensagem ou variáveis mudarem
  useEffect(() => {
    updatePreview();
  }, [message, variables]);

  const updatePreview = async () => {
    if (!message) {
      setPreview('');
      setPreviewData({
        character_count: 0,
        sms_count: 0,
        estimated_cost: 0
      });
      return;
    }

    try {
      const response = await fetch('/api/sms/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message, variables })
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
        setPreviewData({
          character_count: data.character_count,
          sms_count: data.sms_count,
          estimated_cost: data.estimated_cost
        });
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  };

  const handleSend = async () => {
    if (!phoneNumber || !message) {
      toast({ title: 'Erro', description: 'Preencha o número e a mensagem', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message,
          variables: Object.keys(variables).length > 0 ? variables : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: 'Sucesso', description: 'SMS enviado com sucesso!' });
        setMessage('');
        setPhoneNumber('');
        setVariables({});
      } else {
        toast({ title: 'Erro', description: data.error || 'Erro ao enviar SMS', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao enviar SMS', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enviar SMS</h1>
            <p className="text-sm text-gray-500">Crie e envie mensagens SMS personalizadas</p>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>{showPreview ? 'Ocultar' : 'Mostrar'} Preview</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Editor de Mensagem</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+55 11 98765-4321"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar."
            />
            <p className="text-xs text-gray-500 mt-2">
              Caracteres: {message.length} | SMS: {Math.ceil(message.length / 160)}
            </p>
          </div>

          {/* Variáveis */}
          {Object.keys(variables).length > 0 && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Variáveis
              </label>
              <div className="space-y-2">
                {Object.keys(variables).map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-gray-600 w-24">{`{{${key}}}`}</span>
                    <input
                      type="text"
                      value={variables[key]}
                      onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                      placeholder={`Valor para ${key}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSend}
              disabled={loading || !phoneNumber || !message}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <Send className="h-5 w-5" />
              <span>{loading ? 'Enviando...' : 'Enviar SMS'}</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{phoneNumber || 'Número não informado'}</span>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 min-h-[200px]">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {preview || message || 'Digite uma mensagem para ver o preview...'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{previewData.character_count}</div>
                <div className="text-xs text-gray-600 mt-1">Caracteres</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{previewData.sms_count}</div>
                <div className="text-xs text-gray-600 mt-1">SMS</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  R$ {previewData.estimated_cost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Custo Est.</div>
              </div>
            </div>

            {previewData.sms_count > 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta mensagem será dividida em {previewData.sms_count} SMS.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SMS;

