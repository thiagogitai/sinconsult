import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  Eye, 
  Save,
  FileText,
  Image as ImageIcon,
  Type,
  AlignLeft,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Email: React.FC = () => {
  const { addToast } = useToast();
  const [emailAddress, setEmailAddress] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isHtml, setIsHtml] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Detectar variáveis no conteúdo
  useEffect(() => {
    const content = isHtml ? htmlContent : textContent;
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = content.matchAll(variableRegex);
    const foundVars: Record<string, string> = {};
    
    for (const match of matches) {
      const varName = match[1];
      if (!foundVars[varName]) {
        foundVars[varName] = variables[varName] || '';
      }
    }
    
    // Verificar também no assunto
    const subjectMatches = subject.matchAll(variableRegex);
    for (const match of subjectMatches) {
      const varName = match[1];
      if (!foundVars[varName]) {
        foundVars[varName] = variables[varName] || '';
      }
    }
    
    setVariables(foundVars);
  }, [htmlContent, textContent, subject, isHtml]);

  // Atualizar preview
  useEffect(() => {
    updatePreview();
  }, [htmlContent, textContent, subject, variables, isHtml]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/email/templates/${templateId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ variables })
      });

      if (response.ok) {
        const data = await response.json();
        setSubject(data.subject);
        if (data.html_content) {
          setHtmlContent(data.html_content);
          setIsHtml(true);
        }
        if (data.text_content) {
          setTextContent(data.text_content);
        }
        addToast('Template carregado com sucesso!', 'success');
      }
    } catch (error) {
      addToast('Erro ao carregar template', 'error');
    }
  };

  const updatePreview = async () => {
    const content = isHtml ? htmlContent : textContent;
    if (!content && !subject) {
      setPreview('');
      setPreviewSubject('');
      return;
    }

    try {
      const response = await fetch('/api/email/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          subject, 
          content, 
          variables,
          html: isHtml
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.content);
        setPreviewSubject(data.subject);
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!subject || (!htmlContent && !textContent)) {
      addToast('Preencha o assunto e o conteúdo', 'error');
      return;
    }

    const templateName = prompt('Nome do template:');
    if (!templateName) return;

    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: templateName,
          subject,
          html_content: htmlContent || null,
          text_content: textContent || null,
          variables: Object.keys(variables)
        })
      });

      if (response.ok) {
        addToast('Template salvo com sucesso!', 'success');
        fetchTemplates();
      } else {
        addToast('Erro ao salvar template', 'error');
      }
    } catch (error) {
      addToast('Erro ao salvar template', 'error');
    }
  };

  const handleSend = async () => {
    if (!emailAddress || !subject || (!htmlContent && !textContent)) {
      addToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email_address: emailAddress,
          subject,
          content: isHtml ? htmlContent : textContent,
          variables: Object.keys(variables).length > 0 ? variables : undefined,
          html: isHtml
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addToast('Email enviado com sucesso!', 'success');
        setEmailAddress('');
        setSubject('');
        setHtmlContent('');
        setTextContent('');
        setVariables({});
      } else {
        addToast(data.error || 'Erro ao enviar email', 'error');
      }
    } catch (error) {
      addToast('Erro ao enviar email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (varName: string) => {
    const content = isHtml ? htmlContent : textContent;
    const newContent = content + ` {{${varName}}}`;
    if (isHtml) {
      setHtmlContent(newContent);
    } else {
      setTextContent(newContent);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Mail className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enviar Email</h1>
            <p className="text-sm text-gray-500">Crie e envie emails personalizados com templates</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              if (e.target.value) {
                loadTemplate(e.target.value);
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Selecionar Template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Ocultar' : 'Mostrar'} Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Editor de Email</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Destinatário
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="destinatario@exemplo.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Conteúdo
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsHtml(!isHtml)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    isHtml 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isHtml ? 'HTML' : 'Texto'}
                </button>
              </div>
            </div>
            {isHtml ? (
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                placeholder="Digite o HTML do email... Use {{nome}} para personalizar."
              />
            ) : (
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                placeholder="Digite o texto do email... Use {{nome}} para personalizar."
              />
            )}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSaveTemplate}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              <Save className="h-5 w-5" />
              <span>Salvar Template</span>
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !emailAddress || !subject}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <Send className="h-5 w-5" />
              <span>{loading ? 'Enviando...' : 'Enviar Email'}</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{emailAddress || 'Email não informado'}</span>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
                <div className="text-xs text-gray-500 mb-1">Assunto:</div>
                <div className="text-sm font-semibold text-gray-900">
                  {previewSubject || subject || 'Sem assunto'}
                </div>
              </div>
              <div 
                className="bg-white rounded-lg p-4 border border-gray-200 min-h-[300px]"
                dangerouslySetInnerHTML={isHtml ? { __html: preview || htmlContent || 'Digite o conteúdo para ver o preview...' } : undefined}
              >
                {!isHtml && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {preview || textContent || 'Digite o conteúdo para ver o preview...'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Email;

