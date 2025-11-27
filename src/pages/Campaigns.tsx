import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Clock,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Download,
  Upload,
  Volume2
} from 'lucide-react';
import { campaignsAPI, segmentsAPI } from '../services/api';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [savedTTSFiles, setSavedTTSFiles] = useState<any[]>([]); // Novo estado para arquivos TTS salvos
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    type: 'text',
    segment_id: '',
    schedule: '',
    use_tts: false,
    tts_config_id: '',
    tts_audio_file: '',
    channel: 'whatsapp', // 'whatsapp', 'sms', 'email'
    sms_config_id: '',
    sms_template_id: '',
    email_config_id: '',
    email_subject: '',
    email_template_id: '',
    media_url: '', // URL da imagem ou vídeo
    is_test: false,
    test_phone: ''
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [smsConfigs, setSmsConfigs] = useState<any[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsModalData, setStatsModalData] = useState<any | null>(null);
  const [statsCampaignName, setStatsCampaignName] = useState<string>('');
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [copiedRows, setCopiedRows] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
    fetchSavedTTSFiles();
    fetchSMSConfigs();
    fetchSMSTemplates();
    fetchEmailConfigs();
    fetchEmailTemplates();
  }, []);

  const fetchSMSConfigs = async () => {
    try {
      const response = await fetch('/api/sms/configs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSmsConfigs(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações SMS:', error);
    }
  };

  const fetchSMSTemplates = async () => {
    try {
      const response = await fetch('/api/sms/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSmsTemplates(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar templates SMS:', error);
    }
  };

  const fetchEmailConfigs = async () => {
    try {
      const response = await fetch('/api/email/configs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmailConfigs(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações Email:', error);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmailTemplates(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar templates de email:', error);
    }
  };

  const fetchSavedTTSFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tts/files', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      const data = await response.json();
      if (response.ok) {
        setSavedTTSFiles(data.files || []);
      }
    } catch (error) {
      console.error('Erro ao buscar arquivos TTS salvos:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignsAPI.getAll();
      const raw = response.data?.campaigns || response.data || [];
      const normalized = (Array.isArray(raw) ? raw : []).map((c: any) => ({
        ...c,
        message: c.message ?? c.message_template ?? '',
        type: c.type ?? c.message_type ?? 'text',
        schedule: c.schedule ?? c.scheduled_time ?? c.schedule_time ?? ''
      }));
      // Métricas agregadas já vêm do GET /api/campaigns; não buscar /stats aqui
      setCampaigns(normalized);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await segmentsAPI.getAll();
      // A API pode retornar data.segments ou diretamente o array
      const segmentsData = response.data || response.data?.segments || response.data;
      setSegments(Array.isArray(segmentsData) ? segmentsData : []);
    } catch (error: any) {
      console.error('Erro ao carregar segmentos:', error);
      // Em caso de erro, definir array vazio para não quebrar a UI
      setSegments([]);
    }
  };

  const handleMediaUpload = async (file: File) => {
    try {
      setUploadingMedia(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const response = await fetch('/api/upload/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text.substring(0, 200));

        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 404) {
          throw new Error('Rota não encontrada. Verifique se o servidor está configurado corretamente.');
        } else {
          throw new Error(`Erro no servidor (${response.status}): ${text.substring(0, 100)}`);
        }
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Detectar tipo de mensagem baseado no retorno do backend
        let messageType = 'text';
        if (data.type === 'image') messageType = 'image';
        else if (data.type === 'video') messageType = 'video';
        else if (data.type === 'audio') messageType = 'audio_upload';

        setFormData(prev => ({
          ...prev,
          media_url: data.url,
          type: messageType
        }));
        setMediaPreview(data.url);
        return data.url;
      } else {
        throw new Error(data.error || data.message || 'Erro ao fazer upload');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);

      let errorMessage = 'Erro ao fazer upload';
      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('JSON')) {
        errorMessage = 'Erro ao processar resposta do servidor. Verifique se o servidor está funcionando.';
      }

      alert(errorMessage);
      throw error;
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const campaignData = {
        name: formData.name,
        message_template: formData.message,
        message_type: formData.type,
        segment_id: formData.segment_id,
        schedule_time: formData.schedule,
        use_tts: formData.use_tts,
        tts_config_id: formData.use_tts ? formData.tts_config_id : null,
        tts_audio_file: formData.use_tts && formData.tts_audio_file ? formData.tts_audio_file : null,
        channel: formData.channel,
        sms_config_id: formData.channel === 'sms' ? formData.sms_config_id : null,
        sms_template_id: formData.channel === 'sms' ? formData.sms_template_id : null,
        email_config_id: formData.channel === 'email' ? formData.email_config_id : null,
        email_subject: formData.channel === 'email' ? formData.email_subject : null,
        email_template_id: formData.channel === 'email' ? formData.email_template_id : null,
        media_url: formData.media_url || null,
        is_test: formData.is_test,
        test_phone: formData.is_test ? formData.test_phone : null,
        status: formData.schedule ? 'scheduled' : undefined
      };

      await campaignsAPI.create(campaignData);
      setShowModal(false);
      setFormData({
        name: '',
        message: '',
        type: 'text',
        segment_id: '',
        schedule: '',
        use_tts: false,
        tts_config_id: '',
        tts_audio_file: '',
        channel: 'whatsapp',
        sms_config_id: '',
        sms_template_id: '',
        email_config_id: '',
        email_subject: '',
        email_template_id: '',
        media_url: '',
        is_test: false,
        test_phone: ''
      });
      setMediaPreview(null);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      const msg = error?.response?.data?.error || error?.message || 'Erro ao criar campanha';
      alert(msg);
    }
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    const mediaUrl = campaign.media_url || '';
    setFormData({
      name: campaign.name,
      message: campaign.message || campaign.message_template || '',
      type: campaign.type || campaign.message_type || 'text',
      segment_id: campaign.segment_id || '',
      schedule: campaign.scheduled_time || campaign.schedule_time || '',
      use_tts: campaign.use_tts || false,
      tts_config_id: campaign.tts_config_id || '',
      tts_audio_file: campaign.tts_audio_file || '',
      channel: campaign.channel || 'whatsapp',
      sms_config_id: campaign.sms_config_id || '',
      sms_template_id: campaign.sms_template_id || '',
      email_config_id: campaign.email_config_id || '',
      email_subject: campaign.email_subject || '',
      email_template_id: campaign.email_template_id || '',
      media_url: campaign.media_url || '',
      is_test: !!campaign.is_test,
      test_phone: campaign.test_phone || ''
    });
    setMediaPreview(campaign.media_url || null);
    setShowModal(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;

    try {
      const campaignData = {
        name: formData.name,
        message: formData.message,
        type: formData.type,
        segment_id: formData.segment_id,
        scheduled_time: formData.schedule,
        use_tts: formData.use_tts,
        tts_config_id: formData.use_tts ? formData.tts_config_id : null,
        tts_audio_file: formData.use_tts && formData.tts_audio_file ? formData.tts_audio_file : null,
        is_test: formData.is_test,
        test_phone: formData.is_test ? formData.test_phone : null,
        status: formData.schedule ? 'scheduled' : undefined
      };

      await campaignsAPI.update(editingCampaign.id, campaignData);
      setShowModal(false);
      setEditingCampaign(null);
      setFormData({
        name: '',
        message: '',
        type: 'text',
        segment_id: '',
        schedule: '',
        use_tts: false,
        tts_config_id: '',
        tts_audio_file: '',
        channel: 'whatsapp',
        sms_config_id: '',
        sms_template_id: '',
        email_config_id: '',
        email_subject: '',
        email_template_id: '',
        media_url: '',
        is_test: false,
        test_phone: ''
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      alert('Erro ao atualizar campanha. Tente novamente.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      await campaignsAPI.delete(id);
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      alert('Erro ao excluir campanha. Tente novamente.');
    }
  };

  const handleStartCampaign = async (id: string) => {
    try {
      await campaignsAPI.start(id);
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error);
      alert('Erro ao iniciar campanha. Tente novamente.');
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await campaignsAPI.pause(id);
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
      alert('Erro ao pausar campanha. Tente novamente.');
    }
  };

  const handleStopCampaign = async (id: string) => {
    try {
      await campaignsAPI.stop(id);
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao parar campanha:', error);
      alert('Erro ao parar campanha. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'running':
        return 'Em Andamento';
      case 'scheduled':
        return 'Agendada';
      case 'paused':
        return 'Pausada';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'audio':
        return <Volume2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando campanhas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Estilo Clean Importar Excel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Campanhas de Mensagens</h1>
                <p className="text-gray-600 text-xl font-light mt-1">Gerenciamento Inteligente de Comunicação</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Agendamento Inteligente</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Segmentação Avançada</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingCampaign(null);
              setFormData({
                name: '',
                message: '',
                type: 'text',
                segment_id: '',
                schedule: '',
                use_tts: false,
                tts_config_id: '',
                tts_audio_file: '',
                channel: 'whatsapp',
                sms_config_id: '',
                sms_template_id: '',
                email_config_id: '',
                email_subject: '',
                email_template_id: '',
                media_url: '',
                is_test: false,
                test_phone: ''
              });
              setMediaPreview(null);
              setShowModal(true);
            }}
            className="bg-gray-700 text-white hover:bg-gray-800 px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors font-semibold shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Estilo Sim Consult Profissional */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Total de Campanhas</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              <p className="text-xs text-gray-500">Campanhas criadas</p>
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'running').length}</p>
              <p className="text-xs text-gray-500">Campanhas ativas</p>
            </div>
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'completed').length}</p>
              <p className="text-xs text-gray-500">Campanhas finalizadas</p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
              <p className="text-xs text-gray-500">Taxa de entrega</p>
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List - Estilo Sim Consult Profissional */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Campanhas</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas campanhas de mensagens</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campanha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progresso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.message}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      {getTypeIcon(campaign.type)}
                      <span className="ml-2 capitalize font-medium">{campaign.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatDate(campaign.schedule)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{campaign.total_sent || 0} enviadas</span>
                        <span>{campaign.total_target > 0 ? Math.round(((campaign.total_sent || 0) / campaign.total_target) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${campaign.total_target > 0 ? ((campaign.total_sent || 0) / campaign.total_target) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'scheduled' && (
                        <button
                          onClick={() => handleStartCampaign(campaign.id)}
                          className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                          title="Iniciar Campanha"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {campaign.status === 'running' && (
                        <button
                          onClick={() => handlePauseCampaign(campaign.id)}
                          className="p-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
                          title="Pausar Campanha"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Editar Campanha"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const deliveredResp = await fetch(`/api/campaigns/${campaign.id}/messages?status=delivered`, {
                              headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
                            });
                            const failedResp = await fetch(`/api/campaigns/${campaign.id}/messages?status=failed`, {
                              headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
                            });
                            const deliveredData = deliveredResp.ok ? await deliveredResp.json() : { messages: [] };
                            const failedData = failedResp.ok ? await failedResp.json() : { messages: [] };
                            setStatsCampaignName(campaign.name);
                            setStatsModalData({
                              success: true,
                              total_target: campaign.total_target || 0,
                              total_sent: campaign.total_sent || 0,
                              total_delivered: campaign.total_delivered || 0,
                              total_read: campaign.total_read || 0,
                              total_failed: campaign.total_failed || 0,
                              delivered: deliveredData.messages || [],
                              failed: failedData.messages || []
                            });
                            setStatsModalOpen(true);
                          } catch (e) {
                            alert('Erro ao carregar estatísticas');
                          }
                        }}
                        className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                        title="Ver Entregas"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                        title="Excluir Campanha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Campaign Modal - Estilo Sim Consult Profissional */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCampaign ? 'Editar Campanha' : 'Criar Nova Campanha'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Fechar</span>
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Campanha</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="Ex: Campanha Matinal - Nutrição"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Canal de Envio</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>



              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Segmento</label>
                <select
                  value={formData.segment_id}
                  onChange={(e) => setFormData({ ...formData, segment_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  disabled={formData.is_test}
                >
                  <option value="">Selecione um segmento</option>
                  {segments.map(segment => (
                    <option key={segment.id} value={segment.id}>{segment.name}</option>
                  ))}
                </select>
              </div>

              {/* Configurações SMS */}
              {formData.channel === 'sms' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Configuração SMS</label>
                    <select
                      value={formData.sms_config_id}
                      onChange={(e) => setFormData({ ...formData, sms_config_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione uma configuração SMS</option>
                      {smsConfigs.map(config => (
                        <option key={config.id} value={config.id}>{config.name} ({config.provider})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Template SMS (Opcional)</label>
                    <select
                      value={formData.sms_template_id}
                      onChange={(e) => setFormData({ ...formData, sms_template_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    >
                      <option value="">Nenhum template</option>
                      {smsTemplates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Configurações Email */}
              {formData.channel === 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Configuração Email</label>
                    <select
                      value={formData.email_config_id}
                      onChange={(e) => setFormData({ ...formData, email_config_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione uma configuração Email</option>
                      {emailConfigs.map(config => (
                        <option key={config.id} value={config.id}>{config.name} ({config.provider})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assunto do Email</label>
                    <input
                      type="text"
                      value={formData.email_subject}
                      onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      placeholder="Assunto do email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Template de Email (Opcional)</label>
                    <select
                      value={formData.email_template_id}
                      onChange={(e) => setFormData({ ...formData, email_template_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    >
                      <option value="">Nenhum template</option>
                      {emailTemplates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Horário de Envio</label>
                <input
                  type="datetime-local"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div>
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.is_test}
                      onChange={(e) => setFormData({ ...formData, is_test: e.target.checked })}
                      className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Modo Teste</span>
                      <p className="text-xs text-gray-500">Envia para telefone de teste ou 1 contato</p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.is_test && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone de Teste</label>
                  <input
                    type="tel"
                    value={formData.test_phone}
                    onChange={(e) => setFormData({ ...formData, test_phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    placeholder="Ex: 55DDD999999999"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se vazio, envia para o primeiro contato do segmento.</p>
                </div>
              )}





              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensagem {formData.type === 'text' ? '' : '(Opcional)'}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder={formData.type === 'text'
                    ? "Digite sua mensagem aqui... Use {nome} para personalizar com o nome do contato."
                    : "Digite uma legenda para a imagem/vídeo (opcional)..."
                  }
                />
                <p className="text-xs text-gray-500 mt-2">Caracteres: {formData.message.length}</p>
              </div>

              {/* Upload Unificado */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mídia (Opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleMediaUpload(file);
                      }
                    }}
                    className="hidden"
                    id="media-upload"
                    disabled={uploadingMedia}
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingMedia ? 'Enviando...' : 'Clique para selecionar Imagem, Vídeo ou Áudio'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Suporta JPG, PNG, MP4, MP3, OGG</span>
                  </label>
                </div>

                {/* Preview da Mídia */}
                {mediaPreview && (
                  <div className="mt-4 relative bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, media_url: '', type: 'text' });
                        setMediaPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 z-10"
                      title="Remover mídia"
                    >
                      <Trash2 size={16} />
                    </button>

                    {formData.type === 'image' && (
                      <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    )}

                    {formData.type === 'video' && (
                      <video src={mediaPreview} controls className="max-h-48 mx-auto rounded" />
                    )}

                    {(formData.type === 'audio' || formData.type === 'audio_upload') && (
                      <div className="flex items-center justify-center p-4">
                        <audio src={mediaPreview} controls className="w-full" />
                      </div>
                    )}

                    <p className="text-center text-xs text-gray-500 mt-2">
                      Tipo detectado: {formData.type === 'audio_upload' ? 'Áudio' : formData.type === 'image' ? 'Imagem' : formData.type === 'video' ? 'Vídeo' : formData.type}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors shadow-lg"
              >
                {editingCampaign ? 'Atualizar Campanha' : 'Criar Campanha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Estatísticas */}
      {statsModalOpen && statsModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Entrega da Campanha: {statsCampaignName}</h2>
              <button onClick={() => setStatsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">Alvo</div>
                <div className="text-2xl font-bold text-gray-900">{statsModalData.total_target}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">Enviadas</div>
                <div className="text-2xl font-bold text-gray-900">{statsModalData.total_sent}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">Entregues</div>
                <div className="text-2xl font-bold text-gray-900">{statsModalData.total_delivered}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500">Falhas</div>
                <div className="text-2xl font-bold text-gray-900">{statsModalData.total_failed}</div>
              </div>
            </div>
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">Quem recebeu</div>
              <div className="border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Nome</th>
                      <th className="px-4 py-2 text-left">Telefone</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Entregue</th>
                      <th className="px-4 py-2 text-left">Lido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(statsModalData.delivered || []).map((row: any) => (
                      <tr key={row.message_id} className="border-t">
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.phone}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold
                            ${row.status === 'read' ? 'bg-blue-100 text-blue-800' :
                              row.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                row.status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'}`}>
                            {row.status === 'read' ? 'Lido' :
                              row.status === 'delivered' ? 'Entregue' :
                                row.status === 'sent' ? 'Enviado' : row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{row.delivered_at || '-'}</td>
                        <td className="px-4 py-2">{row.read_at || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-700">Dados (Nome, Telefone, Entregue, Lido)</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rows = (statsModalData.delivered || []).map((r: any) => [
                        String(r.name || '').trim(),
                        String(r.phone || '').trim(),
                        r.status === 'read' ? 'Lido' : r.status === 'delivered' ? 'Entregue' : r.status === 'sent' ? 'Enviado' : r.status,
                        String(r.delivered_at || '').trim() || '-',
                        String(r.read_at || '').trim() || '-'
                      ]);
                      const header = ['Nome', 'Telefone', 'Status', 'Entregue', 'Lido'];
                      const tsv = [header.join('\t'), ...rows.map(rr => rr.join('\t'))].join('\n');
                      navigator.clipboard.writeText(tsv);
                      setCopiedRows(true);
                      setTimeout(() => setCopiedRows(false), 2000);
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {copiedRows ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    onClick={() => {
                      const rows = (statsModalData.delivered || []).map((r: any) => [
                        String(r.name || '').trim(),
                        String(r.phone || '').trim(),
                        r.status === 'read' ? 'Lido' : r.status === 'delivered' ? 'Entregue' : r.status === 'sent' ? 'Enviado' : r.status,
                        String(r.delivered_at || '').trim() || '-',
                        String(r.read_at || '').trim() || '-'
                      ]);
                      const header = ['Nome', 'Telefone', 'Status', 'Entregue', 'Lido'];
                      const csv = [header.join(','), ...rows.map(rr => rr.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `entregas_${statsCampaignName || 'campanha'}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700"
                  >
                    Baixar CSV
                  </button>
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto text-sm text-gray-800">
                {(() => {
                  const rows = (statsModalData.delivered || []).map((r: any) => [
                    String(r.name || '').trim(),
                    String(r.phone || '').trim(),
                    r.status === 'read' ? 'Lido' : r.status === 'delivered' ? 'Entregue' : r.status === 'sent' ? 'Enviado' : r.status,
                    String(r.delivered_at || '').trim() || '-',
                    String(r.read_at || '').trim() || '-'
                  ]);
                  const header = ['Nome', 'Telefone', 'Status', 'Entregue', 'Lido'];
                  const view = [header.join(' \t '), ...rows.map(rr => rr.join(' \t '))].join('\n');
                  return view || 'Nenhum dado disponível';
                })()}
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-700">Números de telefone</div>
                <button
                  onClick={() => {
                    const phones = Array.from(new Set((statsModalData.delivered || []).map((r: any) => String(r.phone || '').trim()).filter((p: string) => p)));
                    navigator.clipboard.writeText(phones.join('\n'));
                    setCopiedPhones(true);
                    setTimeout(() => setCopiedPhones(false), 2000);
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {copiedPhones ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto text-sm text-gray-800">
                {Array.from(new Set((statsModalData.delivered || []).map((r: any) => String(r.phone || '').trim()).filter((p: string) => p))).join('\n') || 'Nenhum número disponível'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;