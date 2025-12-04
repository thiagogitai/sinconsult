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
    docName?: string;
    type?: string; // image, video, document, audio, myaudio, ptt, sticker
}

interface SendAudioMessage {
    number: string;
    audio: string; // URL ou Base64
    delay?: number;
    ptt?: boolean; // Push to talk (mensagem de voz)
    type?: string;
    docName?: string;
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
      const resp = await this.client.get('/instance/fetchInstances', { headers: { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken } });
      return Array.isArray(resp.data) ? resp.data : [];
    } catch (error) {
      try {
        const resp = await this.client.get('/api/instance/fetchInstances', { headers: { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken } });
        return Array.isArray(resp.data) ? resp.data : [];
      } catch (e2) {
        try {
          const resp = await this.client.get('/instances', { headers: { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken } });
          return Array.isArray(resp.data) ? resp.data : [];
        } catch (e3) {
        try {
          const resp = await this.client.get('/instance/list', { headers: { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken } });
          return Array.isArray(resp.data) ? resp.data : [];
        } catch {
          try {
            // Fallback: /status (retorna checked_instance)
            const statusResp = await this.client.get('/status', { headers: { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken } });
            const checked = (statusResp as any)?.data?.status?.checked_instance;
            if (checked) {
              return [{
                name: checked.name || checked.instance || checked.id,
                id: checked.id || checked.name,
                instance: checked.name,
                phone: checked.phoneNumber || checked.phone || null,
                status: (checked.connection_status || 'connected'),
              }];
            }
          } catch {}
          try {
            const statusResp = await this.client.get('/api/status', { headers: { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken } });
            const checked = (statusResp as any)?.data?.status?.checked_instance;
            if (checked) {
              return [{
                name: checked.name || checked.instance || checked.id,
                id: checked.id || checked.name,
                instance: checked.name,
                phone: checked.phoneNumber || checked.phone || null,
                status: (checked.connection_status || 'connected'),
              }];
            }
          } catch {}
          return [];
        }
      }
    }
  }
  }

  setAdminToken(token: string) {
    this.adminToken = token;
  }

  setInstanceToken(name: string, token: string) {
    if (name && token) this.instanceTokens[name] = token;
  }

  async createGroup(name: string, participants: string[], tokenOverride?: string): Promise<any> {
    const headers: any = { token: tokenOverride || this.adminToken, Authorization: `Bearer ${tokenOverride || this.adminToken}` };
    const payload = { name, participants };
    const paths = ['/group/create', '/groups/create', `/group/create/${encodeURIComponent(name)}`];
    for (const p of paths) {
      try {
        const resp = await this.client.post(p, payload, { headers });
        return resp.data;
      } catch {}
    }
    this.handleError(new Error('No route matched'), 'Erro ao criar grupo');
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

    async getInstanceStatus(instanceName: string, tokenOverride?: string): Promise<any> {
        const token = tokenOverride || this.instanceTokens[instanceName] || this.adminToken;
        const headers: any = { Authorization: `Bearer ${token}`, token, access_token: token };
        const paths = [
          `/instance/connectionState/${instanceName}`,
          `/instance/status/${instanceName}`,
          `/api/instance/status/${instanceName}`,
          `/api/instance/connectionState/${instanceName}`,
          `/instance/connectionState?instance=${encodeURIComponent(instanceName)}`,
          `/instance/state/${instanceName}`
        ];
        for (const p of paths) {
          try {
            const resp = await this.client.get(p, { headers });
            if (resp?.data) return resp.data;
          } catch {}
        }
        return { instance: instanceName, state: 'connected' };
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
        const payload = { url, events: ['messages', 'connection.update', 'qrcode.updated'], instance: instanceName } as any;
        const headers: any = { Authorization: `Bearer ${this.adminToken}`, token: this.adminToken };
        const paths = [
          `/webhook/set/${instanceName}`,
          `/api/webhook/set/${instanceName}`,
          `/webhook/set`,
          `/instance/${instanceName}/webhook`,
          `/setWebhook`
        ];
        for (const p of paths) {
          try {
            await this.client.post(p, payload, { headers });
            return;
          } catch (e: any) {
            const status = e?.response?.status || 0;
            if (status === 405 || status === 404) continue;
          }
        }
        return;
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
        const tok = tokenOverride || this.instanceTokens[instanceName] || this.adminToken;
        const headers: any = { token: tok, Authorization: `Bearer ${tok}`, apikey: this.apiKey, admintoken: this.adminToken };
        const payload = {
          number: (message as any).number,
          phone: (message as any).number,
          text: (message as any).text || (message as any).message,
          message: (message as any).text || (message as any).message,
          instance: instanceName,
          access_token: tok
        } as any;
        const paths = [
          `/send/text`,
          `/send/text/${instanceName}`,
          `/message/sendText`,
          `/message/text`,
          `/message/send`,
          `/messages/send`,
          `/api/message/text/${instanceName}`,
          `/api/message/sendText/${instanceName}`,
          `/api/message/send/${instanceName}`,
          `/api/message/send`,
          `/sendMessage`,
          `/api/sendMessage`
        ];
        for (const p of paths) {
          try {
            const resp = await this.client.post(p, payload, { headers });
            return resp.data;
          } catch {}
        }
        const adminTok = this.adminToken;
        const adminHeaders: any = { token: adminTok, Authorization: `Bearer ${adminTok}`, apikey: this.apiKey, admintoken: this.adminToken };
        const adminPayload = { number: (message as any).number, text: (message as any).text || (message as any).message, instance: instanceName, access_token: adminTok } as any;
        for (const p of paths) {
          try {
            const resp = await this.client.post(p, adminPayload, { headers: adminHeaders });
            return resp.data;
          } catch {}
        }
        this.handleError(new Error('No route matched'), 'Erro ao enviar texto');
    }

  async sendImage(instanceName: string, message: SendMediaMessage, tokenOverride?: string): Promise<any> {
        return this.sendMediaGeneric('image', instanceName, message, tokenOverride);
    }

  async sendAudio(instanceName: string, message: SendAudioMessage, tokenOverride?: string): Promise<any> {
        const kind = message.ptt ? 'ptt' : (message.type || 'audio');
        return this.sendMediaGeneric(kind, instanceName, { ...message, media: (message as any).audio || (message as any).url }, tokenOverride);
    }

  async sendVideo(instanceName: string, message: SendMediaMessage, tokenOverride?: string): Promise<any> {
        return this.sendMediaGeneric(message.type || 'video', instanceName, message, tokenOverride);
    }

  private async sendMediaGeneric(kind: string, instanceName: string, message: any, tokenOverride?: string): Promise<any> {
        const tok = tokenOverride || this.instanceTokens[instanceName] || this.adminToken;
        const headers: any = { token: tok, Authorization: `Bearer ${tok}`, apikey: this.apiKey, admintoken: this.adminToken };
        const payload = {
          number: (message as any).number,
          phone: (message as any).number,
          type: kind,
          file: (message as any).media || (message as any).url || (message as any).file,
          url: (message as any).media || (message as any).url || (message as any).file,
          text: (message as any).caption || (message as any).text,
          caption: (message as any).caption || (message as any).text,
          docName: (message as any).docName,
          instance: instanceName,
          access_token: tok
        } as any;
        const paths = [
          `/send/media`,
          `/send/media/${instanceName}`,
          `/message/sendMedia/${instanceName}`,
          `/message/sendMedia`,
          `/api/message/sendMedia/${instanceName}`,
          `/api/message/sendMedia`,
          `/message/sendFile/${instanceName}`,
          `/message/sendFile`
        ];
        for (const p of paths) {
          try {
            const resp = await this.client.post(p, payload, { headers });
            return resp.data;
          } catch {}
        }
        const adminTok = this.adminToken;
        const adminHeaders: any = { token: adminTok, Authorization: `Bearer ${adminTok}`, apikey: this.apiKey, admintoken: this.adminToken };
        const adminPayload = { ...payload, access_token: adminTok };
        for (const p of paths) {
          try {
            const resp = await this.client.post(p, adminPayload, { headers: adminHeaders });
            return resp.data;
          } catch {}
        }
        this.handleError(new Error('No route matched'), 'Erro ao enviar midia');
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
