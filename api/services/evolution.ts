import axios, { AxiosError } from 'axios';

// Interface para respostas da Evolution API
interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  qrcode?: string;
  qrcodeBase64?: string;
  phoneNumber?: string;
  phoneConnected?: string;
  msg: string;
}

interface EvolutionMessageResponse {
  key: {
    id: string;
    from: string;
    to: string;
    participant?: string;
  };
  message: {
    extendedTextMessage?: {
      text: string;
    };
    conversation?: string;
    imageMessage?: any;
    audioMessage?: any;
    videoMessage?: any;
    documentMessage?: any;
  };
  messageTimestamp: number;
  status: 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';
}

interface EvolutionTextMessage {
  number: string;
  text: string;
  delay?: number;
}

interface EvolutionMediaMessage {
  number: string;
  caption?: string;
  media: string; // Base64 ou URL
  delay?: number;
  mimetype?: string; // MIME type da mídia (ex: image/jpeg, video/mp4)
}

interface EvolutionAudioMessage {
  number: string;
  audio: string; // Base64 ou URL
  delay?: number;
  ptt?: boolean; // Push to talk
}

class EvolutionAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    const envUrl = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').trim().replace(/`/g, '').replace(/\/+$/, '');
    const envKey = (process.env.EVOLUTION_API_KEY || 'your-api-key').trim().replace(/`/g, '');
    this.baseURL = envUrl;
    this.apiKey = envKey;

    // Validar configuração
    if (!this.apiKey || this.apiKey === 'your-api-key') {
      console.warn('⚠️  EVOLUTION_API_KEY não configurado! Configure no arquivo .env');
    }
  }

  setConfig(baseURL?: string, apiKey?: string) {
    if (baseURL && baseURL.length > 0) {
      const clean = baseURL.trim().replace(/`/g, '').replace(/\/+$/, '');
      this.baseURL = clean;
    }
    if (apiKey && apiKey.length > 0) {
      const cleanKey = apiKey.trim().replace(/`/g, '');
      this.apiKey = cleanKey;
    }
  }

  // Configurar headers de autenticação
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Evolution API v2 usa 'apikey' no header
    if (this.apiKey && this.apiKey !== 'your-api-key') {
      headers['apikey'] = this.apiKey;
    }

    return headers;
  }

  // Verificar se a API está acessível
  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/`, {
        headers: this.getHeaders(),
        timeout: 10000, // 10 segundos para APIs remotas
      });
      // Evolution API v2 retorna status 200 com mensagem de boas-vindas
      return response.status === 200;
    } catch (error) {
      // Se for erro de conexão, a API não está acessível
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          return false;
        }
        // Outros erros (como 401) ainda indicam que a API está respondendo
        return axiosError.response !== undefined;
      }
      return false;
    }
  }

  // Tratamento de erros melhorado
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
        throw new Error(`Evolution API não está acessível em ${this.baseURL}. Verifique se o servidor está rodando.`);
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        if (status === 401 || status === 403) {
          throw new Error(`Erro de autenticação na Evolution API. Verifique a API_KEY.`);
        }

        if (status === 404) {
          throw new Error(`Endpoint não encontrado na Evolution API. Verifique a URL: ${this.baseURL}`);
        }

        const errorMessage = data?.message || data?.error || data?.msg || defaultMessage;
        throw new Error(`Evolution API Error (${status}): ${errorMessage}`);
      }

      if (axiosError.request) {
        throw new Error(`Sem resposta da Evolution API. Verifique se está rodando em ${this.baseURL}`);
      }
    }

    throw new Error(defaultMessage);
  }

  // Criar nova instância WhatsApp
  async createInstance(instanceName: string, phoneNumber?: string): Promise<EvolutionInstance> {
    try {
      // Evolution API v2 - endpoint correto e parâmetros
      const response = await axios.post(`${this.baseURL}/instance/create`, {
        instanceName: instanceName,
        integration: 'WHATSAPP-BAILEYS', // Integration type required for v2
        number: phoneNumber || undefined
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao criar instância WhatsApp');
    }
  }

  // Conectar instância (gerar QR Code)
  async connectInstance(instanceName: string): Promise<{ base64?: string; code?: string; pairingCode?: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/instance/connect/${instanceName}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao conectar instância WhatsApp');
    }
  }

  // Obter status da instância
  async getInstanceStatus(instanceName: string): Promise<EvolutionInstance> {
    try {
      const response = await axios.get(`${this.baseURL}/instance/connectionState/${instanceName}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao obter status da instância WhatsApp');
    }
  }

  // Desconectar instância
  async disconnectInstance(instanceName: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/instance/disconnect/${instanceName}`, {}, {
        headers: this.getHeaders(),
      });
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao desconectar instância WhatsApp');
    }
  }

  // Excluir instância
  async deleteInstance(instanceName: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/instance/delete/${instanceName}`, {
        headers: this.getHeaders(),
      });
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao excluir instância WhatsApp');
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(instanceName: string, message: EvolutionTextMessage): Promise<EvolutionMessageResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/message/sendText/${instanceName}`, message, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao enviar mensagem de texto');
    }
  }

  // Enviar imagem
  async sendImage(instanceName: string, message: EvolutionMediaMessage): Promise<EvolutionMessageResponse> {
    try {
      // Detectar mimetype da imagem automaticamente
      let mimetype = message.mimetype || 'image/jpeg';

      if (message.media) {
        if (message.media.startsWith('data:image/png')) {
          mimetype = 'image/png';
        } else if (message.media.startsWith('data:image/gif')) {
          mimetype = 'image/gif';
        } else if (message.media.startsWith('data:image/webp')) {
          mimetype = 'image/webp';
        } else if (message.media.includes('.png')) {
          mimetype = 'image/png';
        } else if (message.media.includes('.gif')) {
          mimetype = 'image/gif';
        } else if (message.media.includes('.webp')) {
          mimetype = 'image/webp';
        }
      }

      // Remover prefixo data: se existir (Evolution API espera base64 puro)
      let cleanMedia = message.media;
      if (cleanMedia && cleanMedia.startsWith('data:')) {
        const base64Index = cleanMedia.indexOf('base64,');
        if (base64Index !== -1) {
          cleanMedia = cleanMedia.substring(base64Index + 7); // Remove "base64,"
        }
      }

      const payload = {
        number: message.number,
        mediatype: 'image',
        mimetype: mimetype,
        media: cleanMedia,
        caption: message.caption,
        delay: message.delay
      };

      // Evolution API v2 usa /message/sendMedia para todos os tipos de mídia
      const response = await axios.post(`${this.baseURL}/message/sendMedia/${instanceName}`, payload, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao enviar imagem');
    }
  }

  // Enviar áudio
  async sendAudio(instanceName: string, message: EvolutionAudioMessage): Promise<EvolutionMessageResponse> {
    try {
      // Remover prefixo data: se existir
      let cleanAudio = message.audio;
      if (cleanAudio && cleanAudio.startsWith('data:')) {
        const base64Index = cleanAudio.indexOf('base64,');
        if (base64Index !== -1) {
          cleanAudio = cleanAudio.substring(base64Index + 7);
        }
      }

      const payload = {
        number: message.number,
        mediatype: 'audio',
        mimetype: 'audio/mp4',
        media: cleanAudio,
        delay: message.delay
      };

      // Usar sendMedia para áudio também
      const response = await axios.post(`${this.baseURL}/message/sendMedia/${instanceName}`, payload, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao enviar áudio');
    }
  }

  // Enviar vídeo
  async sendVideo(instanceName: string, message: EvolutionMediaMessage): Promise<EvolutionMessageResponse> {
    try {
      // Detectar mimetype do vídeo automaticamente
      let mimetype = message.mimetype || 'video/mp4';

      if (message.media) {
        if (message.media.startsWith('data:video/webm')) {
          mimetype = 'video/webm';
        } else if (message.media.includes('.webm')) {
          mimetype = 'video/webm';
        }
      }

      // Remover prefixo data: se existir
      let cleanMedia = message.media;
      if (cleanMedia && cleanMedia.startsWith('data:')) {
        const base64Index = cleanMedia.indexOf('base64,');
        if (base64Index !== -1) {
          cleanMedia = cleanMedia.substring(base64Index + 7);
        }
      }

      const payload = {
        number: message.number,
        mediatype: 'video',
        mimetype: mimetype,
        media: cleanMedia,
        caption: message.caption,
        delay: message.delay
      };

      // Evolution API v2 usa /message/sendMedia para todos os tipos de mídia
      const response = await axios.post(`${this.baseURL}/message/sendMedia/${instanceName}`, payload, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao enviar vídeo');
    }
  }

  // Enviar documento
  async sendDocument(instanceName: string, message: EvolutionMediaMessage): Promise<EvolutionMessageResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/message/sendDocument/${instanceName}`, message, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao enviar documento');
    }
  }

  // Obter QR Code da instância
  async getQRCode(instanceName: string): Promise<{ qrcode: string; base64: string }> {
    try {
      const response = await axios.get(`${this.baseURL}/instance/qrcode/${instanceName}`, {
        headers: this.getHeaders(),
      });

      return {
        qrcode: response.data.qrcode,
        base64: response.data.qrcodeBase64,
      };
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao obter QR Code');
    }
  }

  // Webhook para receber mensagens e status
  async setupWebhook(instanceName: string, webhookUrl: string): Promise<void> {
    try {
      const response = await axios.post(`${this.baseURL}/webhook/set/${instanceName}`, {
        url: webhookUrl,
        events: ['messages', 'connection.update', 'qrcode.updated']
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao configurar webhook');
    }
  }

  // Verificar número válido
  async checkNumber(instanceName: string, number: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseURL}/message/checkNumber/${instanceName}`, {
        number,
      }, {
        headers: this.getHeaders(),
      });

      return response.data.exists;
    } catch (error: unknown) {
      // Não lançar erro aqui, apenas retornar false
      return false;
    }
  }

  // Obter perfil do usuário
  async getProfile(instanceName: string, number: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/message/profile/${instanceName}`, {
        number,
      }, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error, 'Erro ao obter perfil do usuário');
    }
  }
}

export const evolutionAPI = new EvolutionAPI();
export default EvolutionAPI;
export type { EvolutionInstance, EvolutionMessageResponse, EvolutionTextMessage, EvolutionMediaMessage, EvolutionAudioMessage };