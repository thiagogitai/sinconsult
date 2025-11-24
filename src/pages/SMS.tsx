import React, { useState, useEffect } from 'react';
import { 
  Save, 
  MessageSquare, 
  Eye, 
  Plus,
  Edit,
  Trash2,
  Copy,
  Send,
  Phone,
  AlertCircle,
  CheckCircle2,
  Settings,
  FileText
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface SMSTemplate {
  id?: number;
  name: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const SMS: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para criar/editar template
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateCategory, setTemplateCategory] = useState('marketing');
  
  // Preview
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    character_count: 0,
    sms_count: 0
  });

  // Carregar templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Detectar variáveis no template
  useEffect(() => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = templateContent.matchAll(variableRegex);
    const foundVars: Record<string, string> = {};
    
    for (const match of matches) {
      const varName = match[1];
      if (!foundVars[varName]) {
        foundVars[varName] = previewVariables[varName] || '';
      }
    }
    
    setPreviewVariables(foundVars);
  }, [templateContent]);

  // Atualizar preview
  useEffect(() => {
    updatePreview();
  }, [templateContent, previewVariables]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sms/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast({ title: 'Erro', description: 'Erro ao carregar templates', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = () => {
    if (!templateContent) {
      setPreviewContent('');
      setPreviewData({ character_count: 0, sms_count: 0 });
      return;
    }

    let preview = templateContent;
    Object.entries(previewVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
    });

    setPreviewContent(preview);
    
    // Calcular estatísticas
    const charCount = preview.length;
    const smsCount = Math.ceil(charCount / 160);
    
    setPreviewData({
      character_count: charCount,
      sms_count: smsCount
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      toast({ title: 'Erro', description: 'Preencha o nome e conteúdo do template', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const variables = Object.keys(previewVariables);
      const templateData = {
        name: templateName.trim(),
        content: templateContent.trim(),
        variables,
        category: templateCategory,
        is_active: true
      };

      const url = editingTemplate?.id 
        ? `/api/sms/templates/${editingTemplate.id}`
        : '/api/sms/templates';
      
      const method = editingTemplate?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({ 
          title: 'Sucesso', 
          description: editingTemplate ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!'
        });
        
        // Limpar formulário
        setTemplateName('');
        setTemplateContent('');
        setTemplateCategory('marketing');
        setEditingTemplate(null);
        setIsEditing(false);
        
        // Recarregar templates
        fetchTemplates();
      } else {
        toast({ title: 'Erro', description: data.error || 'Erro ao salvar template', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar template', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setTemplateCategory(template.category || 'marketing');
    setIsEditing(true);
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sms/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({ title: 'Sucesso', description: 'Template excluído com sucesso!' });
        fetchTemplates();
      } else {
        toast({ title: 'Erro', description: 'Erro ao excluir template', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir template', variant: 'destructive' });
    }
  };

  const handleDuplicate = (template: SMSTemplate) => {
    setEditingTemplate(null);
    setTemplateName(`${template.name} (Cópia)`);
    setTemplateContent(template.content);
    setTemplateCategory(template.category || 'marketing');
    setIsEditing(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateContent('');
    setTemplateCategory('marketing');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateContent('');
    setTemplateCategory('marketing');
  };

  const categories = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'transactional', label: 'Transacional' },
    { value: 'notification', label: 'Notificação' },
    { value: 'support', label: 'Suporte' }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h1>
              <p className="text-sm text-gray-500">Crie templates de SMS personalizáveis</p>
            </div>
          </div>
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Editor de Template</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Template
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Ex: Campanha de Boas-Vindas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo do Template
              </label>
              <textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent h-32 resize-none"
                placeholder="Digite sua mensagem aqui... Use {{nome}} para variáveis"
              />
              <p className="text-xs text-gray-500 mt-1">
                {"Use {{variavel}} para criar campos personalizáveis"}
              </p>
            </div>

            <button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Template</span>
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Ocultar' : 'Mostrar'}</span>
              </button>
            </div>

            {showPreview && Object.keys(previewVariables).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Variáveis de Teste</h3>
                {Object.keys(previewVariables).map(varName => (
                  <div key={varName}>
                    <label className="block text-xs text-gray-600 mb-1">{`{{${varName}}}`}</label>
                    <input
                      type="text"
                      value={previewVariables[varName] || ''}
                      onChange={(e) => setPreviewVariables(prev => ({
                        ...prev,
                        [varName]: e.target.value
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder={`Valor para {{${varName}}}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Visualização</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {previewContent || 'Seu preview aparecerá aqui...'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Agora</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Caracteres:</span>
                <span className="font-medium">{previewData.character_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SMS necessários:</span>
                <span className="font-medium">{previewData.sms_count}</span>
              </div>
              {previewData.character_count > 160 && (
                <div className="flex items-center space-x-1 text-xs text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Mensagem longa - será cobrada como {previewData.sms_count} SMS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates de SMS</h1>
            <p className="text-sm text-gray-500">Crie e gerencie templates de SMS para suas campanhas</p>
          </div>
        </div>
        <button
          onClick={handleNewTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Template</span>
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template criado</h3>
          <p className="text-gray-500 mb-4">Crie seu primeiro template de SMS para começar</p>
          <button
            onClick={handleNewTemplate}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Criar Primeiro Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {categories.find(cat => cat.value === template.category)?.label || template.category}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {template.is_active && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {template.content}
                </p>
                {template.variables && template.variables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.variables.map(varName => (
                      <span key={varName} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                        {`{{${varName}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id!)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {Math.ceil(template.content.length / 160)} SMS
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SMS;