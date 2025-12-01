import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

interface UAZAPIConfig {
    baseURL: string;
    apiKey: string;
}

interface SendTextMessage {
    number: string;
    text: string;
    delay?: number;
}

interface SendMediaMessage {
    number: string;
    media: string; // URL ou Base64
    caption?: string;
    delay?: number;
}

interface SendAudioMessage {
    number: string;
    audio: string; // URL ou Base64
    delay?: number;
    ptt?: boolean; // Push to talk (mensagem de voz)
}

class UAZAPI {
    private client: AxiosInstance;
    private baseURL: string;
    private apiKey: string; // admin token por padrão
    private adminToken: string;
    private instanceTokens: Record<string, string> = {};

    constructor() {
        this.baseURL = (process.env.UAZAPI_URL || '').trim().replace(/`/g, '').replace(/\/+$/, '');
        this.apiKey = (process.env.UAZAPI_KEY || '').trim().replace(/`/g, '');
        this.adminToken = this.apiKey;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey,
                'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
            }
        });

        this.client.interceptors.request.use(
            (config) => {
                logger.debug('[UAZAPI] Request', { method: config.method, url: config.url });
                // Garantir token em header e/ou query
                if (this.apiKey) {
                    config.headers = config.headers || {} as any;
                    if (!config.headers['Authorization']) config.headers['Authorization'] = `Bearer ${this.apiKey}`;
                    if (!config.headers['admintoken']) config.headers['admintoken'] = this.adminToken;
                    if (!config.headers['apikey']) config.headers['apikey'] = this.apiKey;
                }
                const isGet = (config.method || 'get').toLowerCase() === 'get';
                if (isGet) {
                    const params = (config.params || {}) as any;
                    if (!params.access_token && this.apiKey) params.access_token = this.apiKey;
                    config.params = params;
                } else if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
                    const data = config.data as any;
                    if (!data.access_token && this.apiKey) data.access_token = this.apiKey;
                    config.data = data;
                }
                return config;
            },
            (error) => {
                logger.error('[UAZAPI] Request error', { error: error.message });
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                logger.debug('[UAZAPI] Response', { status: response.status });
                return response;
            },
            (error) => {
                logger.error('[UAZAPI] Response error', { status: error.response?.status, data: error.response?.data, message: error.message });
                return Promise.reject(error);
            }
        );
    }

    setConfig(baseURL: string, apiKey: string): void {
        this.baseURL = (baseURL || '').trim().replace(/`/g, '').replace(/\/+$/, '');
        this.apiKey = (apiKey || '').trim().replace(/`/g, '');
        this.adminToken = this.apiKey;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey,
                'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
            }
        });
    }

  async checkConnection(): Promise<boolean> {
        try {
            const resp = await this.client.get('/status');
            return !!resp?.data;
        } catch {
            try {
                const resp = await this.client.get('/instance/fetchInstances');
                return Array.isArray(resp?.data);
            } catch {
                return false;
            }
        }
    }

    async createInstance(instanceName: string, phone?: string): Promise<any> {
        try {
            const resp = await this.client.post('/instance/init', { name: instanceName, phone }, { headers: { admintoken: this.adminToken, Authorization: `Bearer ${this.adminToken}` } });
            return resp.data;
        } catch (error) {
            this.handleError(error, 'Erro ao criar instância');
        }
    }

    async connectInstance(instanceName: string, phone?: string, tokenOverride?: string): Promise<any> {
        try {
            const token = tokenOverride || this.instanceTokens[instanceName] || this.adminToken;
            const primary = phone ? `/instance/connect/${instanceName}?phone=${encodeURIComponent(phone)}` : `/instance/connect/${instanceName}`;
            let resp = await this.client.get(primary, { headers: { Authorization: `Bearer ${token}`, token, access_token: token } as any });
            return resp.data;
        } catch (error) {
            // Tentativas alternativas comuns
            try {
                const token = tokenOverride || this.instanceTokens[instanceName] || this.adminToken;
                const alt = await this.client.post('/instance/connect', { name: instanceName, phone, access_token: token }, { headers: { Authorization: `Bearer ${token}`, token } as any });
                return alt.data;
            } catch (e2) {
                try {
                    const token = tokenOverride || this.instanceTokens[instanceName] || this.adminToken;
                    const alt2 = await this.client.get(`/api/instance/connect/${instanceName}${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`, { headers: { Authorization: `Bearer ${token}`, token, access_token: token } as any });
                    return alt2.data;
                } catch (e3) {
                    this.handleError(e3, 'Erro ao conectar instância');
                }
            }
        }
    }

  async generatePairingCode(phone: string, instanceName?: string, tokenOverride?: string): Promise<any> {
        try {
            const token = tokenOverride || (instanceName ? this.instanceTokens[instanceName] : this.adminToken);
            let url = `/pairing/code?phone=${encodeURIComponent(phone)}${instanceName ? `&instance=${encodeURIComponent(instanceName)}` : ''}`;
            let resp = await this.client.get(url, { headers: { Authorization: `Bearer ${token}`, token, access_token: token } as any });
            if (!resp?.data || (resp.status >= 400)) {
                url = `/api/pairing/code?phone=${encodeURIComponent(phone)}${instanceName ? `&instance=${encodeURIComponent(instanceName)}` : ''}`;
                resp = await this.client.get(url, { headers: { Authorization: `Bearer ${token}`, token, access_token: token } as any });
            }
            if (!resp?.data || (resp.status >= 400)) {
                url = `/api/get_paircode?phone=${encodeURIComponent(phone)}${instanceName ? `&instance=${encodeURIComponent(instanceName)}` : ''}`;
                resp = await this.client.get(url, { headers: { Authorization: `Bearer ${token}`, token, access_token: token } as any });
            }
            return resp.data;
        } catch (error) {
            this.handleError(error, 'Erro ao gerar código de pareamento');
        }
  }

  async fetchInstances(): Promise<any[]> {
    try {
      const resp = await this.client.get('/instance/fetchInstances', { headers: { Authorization: `Bearer ${this.adminToken}` } });
      return Array.isArray(resp.data) ? resp.data : [];
    } catch (error) {
      try {
        const resp = await this.client.get('/api/instance/fetchInstances', { headers: { Authorization: `Bearer ${this.adminToken}` } });
        return Array.isArray(resp.data) ? resp.data : [];
      } catch (e2) {
        this.handleError(e2, 'Erro ao listar instâncias');
      }
    }
  }

  setAdminToken(token: string) {
    this.adminToken = token;
  }

  setInstanceToken(name: string, token: string) {
    if (name && token) this.instanceTokens[name] = token;
  }

  async createGroup(subject: string, participants: string[], tokenOverride?: string): Promise<any> {
    try {
      const headers: any = { token: tokenOverride || this.adminToken };
      const payload = { subject, participants };
      let resp = await this.client.post('/group/create', payload, { headers });
      return resp.data;
    } catch (error) {
      try {
        const headers: any = { token: tokenOverride || this.adminToken };
        const payload = { subject, participants };
        let resp = await this.client.post('/groups/create', payload, { headers });
        return resp.data;
      } catch (e2) {
        this.handleError(e2, 'Erro ao criar grupo');
      }
    }
  }

  async addParticipants(groupId: string, participants: string[], tokenOverride?: string): Promise<any> {
    try {
      const headers: any = { token: tokenOverride || this.adminToken };
      const payload = { chatId: groupId, participants };
      let resp = await this.client.post('/group/add', payload, { headers });
      return resp.data;
    } catch (error) {
      try {
        const headers: any = { token: tokenOverride || this.adminToken };
        const payload = { chatId: groupId, participants };
        let resp = await this.client.post('/groups/addParticipants', payload, { headers });
        return resp.data;
      } catch (e2) {
        this.handleError(e2, 'Erro ao adicionar participantes');
      }
    }
  }

    async getInstanceStatus(instanceName: string): Promise<any> {
        try {
            const resp = await this.client.get(`/instance/connectionState/${instanceName}`);
            return resp.data;
        } catch (error) {
            this.handleError(error, 'Erro ao obter status da instância');
        }
    }

    async disconnectInstance(instanceName: string): Promise<void> {
        try {
            await this.client.post(`/instance/disconnect/${instanceName}`);
        } catch (error) {
            this.handleError(error, 'Erro ao desconectar instância');
        }
    }

    async deleteInstance(instanceName: string): Promise<void> {
        try {
            await this.client.delete(`/instance/delete/${instanceName}`);
        } catch (error) {
            this.handleError(error, 'Erro ao deletar instância');
        }
    }

    async setupWebhook(instanceName: string, url: string): Promise<void> {
        try {
            await this.client.post(`/webhook/set/${instanceName}`, { url, events: ['messages', 'connection.update', 'qrcode.updated'] });
        } catch (error) {
            this.handleError(error, 'Erro ao configurar webhook');
        }
    }

    async checkNumber(instanceName: string, number: string): Promise<boolean> {
        try {
            const resp = await this.client.post(`/message/checkNumber/${instanceName}`, { number });
            return !!resp?.data?.valid || !!resp?.data;
        } catch (error) {
            this.handleError(error, 'Erro ao verificar número');
        }
    }

    async sendTextMessage(instanceName: string, message: SendTextMessage, tokenOverride?: string): Promise<any> {
        try {
            let resp = await this.client.post(`/send/text`, { number: (message as any).number, text: (message as any).text || (message as any).message }, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
            return resp.data;
        } catch (error) {
            try {
                const payload = { number: (message as any).number, text: (message as any).text || (message as any).message };
                let resp = await this.client.post(`/message/sendText`, { ...payload, instance: instanceName }, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                return resp.data;
            } catch (e1) {
                try {
                    const payload = { number: (message as any).number, text: (message as any).text || (message as any).message };
                    let resp = await this.client.post(`/api/message/text/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                    return resp.data;
                } catch (e2) {
                    this.handleError(e2, 'Erro ao enviar texto');
                }
            }
        }
    }

    async sendImage(instanceName: string, message: SendMediaMessage, tokenOverride?: string): Promise<any> {
        try {
            const payload = { number: (message as any).number, type: 'image', file: (message as any).media || (message as any).url, text: (message as any).caption };
            let resp = await this.client.post(`/send/media`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
            return resp.data;
        } catch (error) {
            // Fallbacks comuns
            try {
                const payload = { number: (message as any).number, url: (message as any).media || (message as any).url, caption: (message as any).caption };
                let resp = await this.client.post(`/message/sendMedia/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                return resp.data;
            } catch (e1) {
                try {
                    const payload = { number: (message as any).number, url: (message as any).media || (message as any).url, caption: (message as any).caption, type: 'image' };
                    let resp = await this.client.post(`/api/message/image/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                    return resp.data;
                } catch (e2) {
                    this.handleError(e2, 'Erro ao enviar imagem');
                }
            }
        }
    }

    async sendAudio(instanceName: string, message: SendAudioMessage, tokenOverride?: string): Promise<any> {
        try {
            const payload = { number: (message as any).number, type: 'audio', file: (message as any).audio || (message as any).url, text: (message as any).caption };
            let resp = await this.client.post(`/send/media`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
            return resp.data;
        } catch (error) {
            try {
                const payload = { number: (message as any).number, audio: (message as any).audio || (message as any).url };
                let resp = await this.client.post(`/message/sendMedia/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                return resp.data;
            } catch (e1) {
                try {
                    const payload = { number: (message as any).number, audio: (message as any).audio || (message as any).url };
                    let resp = await this.client.post(`/api/message/audio/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                    return resp.data;
                } catch (e2) {
                    this.handleError(e2, 'Erro ao enviar áudio');
                }
            }
        }
    }

    async sendVideo(instanceName: string, message: SendMediaMessage, tokenOverride?: string): Promise<any> {
        try {
            const payload = { number: (message as any).number, type: 'video', file: (message as any).media || (message as any).url, text: (message as any).caption };
            let resp = await this.client.post(`/send/media`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
            return resp.data;
        } catch (error) {
            try {
                const payload = { number: (message as any).number, url: (message as any).media || (message as any).url, caption: (message as any).caption };
                let resp = await this.client.post(`/message/sendMedia/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                return resp.data;
            } catch (e1) {
                try {
                    const payload = { number: (message as any).number, url: (message as any).media || (message as any).url, caption: (message as any).caption, type: 'video' };
                    let resp = await this.client.post(`/api/message/video/${instanceName}`, payload, { headers: { token: tokenOverride || this.instanceTokens[instanceName] } });
                    return resp.data;
                } catch (e2) {
                    this.handleError(e2, 'Erro ao enviar vídeo');
                }
            }
        }
    }

    private handleError(error: unknown, message: string): never {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 0;
            const errorMessage = (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message;
            logger.error(message, { status, error: errorMessage, url: error.config?.url });
            throw new Error(`UAZAPI Error (${status}): ${errorMessage}`);
        }
        logger.error(message, { error });
        throw new Error(message);
    }
}

export default UAZAPI;
