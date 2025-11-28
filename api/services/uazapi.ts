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
    private apiKey: string;

    constructor() {
        this.baseURL = process.env.UAZAPI_URL || '';
        this.apiKey = process.env.UAZAPI_KEY || '';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey
            }
        });

        // Interceptor para log de requests
        this.client.interceptors.request.use(
            (config) => {
                logger.debug('[UAZAPI] Request:', {
                    method: config.method,
                    url: config.url,
                    data: config.data
                });
                return config;
            },
            (error) => {
                logger.error('[UAZAPI] Request error:', error);
                return Promise.reject(error);
            }
        );

        // Interceptor para log de responses
        this.client.interceptors.response.use(
            (response) => {
                logger.debug('[UAZAPI] Response:', {
                    status: response.status,
                    data: response.data
                });
                return response;
            },
            (error) => {
                logger.error('[UAZAPI] Response error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Atualiza a configuração da API
     */
    setConfig(baseURL: string, apiKey: string): void {
        this.baseURL = baseURL;
        this.apiKey = apiKey;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey
            }
        });

        logger.info('[UAZAPI] Configuração atualizada', { baseURL, hasKey: !!apiKey });
    }

    /**
     * Envia mensagem de texto
     */
    async sendTextMessage(instanceName: string, message: SendTextMessage): Promise<any> {
        try {
            const payload = {
                number: message.number,
                text: message.text,
                delay: message.delay || 1200
            };

            logger.info(`[UAZAPI] Enviando texto para ${message.number} via ${instanceName}:`, message.text);

            const response = await this.client.post(`/message/sendText/${instanceName}`, payload);
            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao enviar mensagem de texto');
        }
    }

    /**
     * Envia imagem
     */
    async sendImage(instanceName: string, message: SendMediaMessage): Promise<any> {
        try {
            const payload = {
                number: message.number,
                media: message.media,
                caption: message.caption || '',
                delay: message.delay || 1200
            };

            logger.info(`[UAZAPI] Enviando imagem para ${message.number} via ${instanceName}`, { caption: message.caption });

            const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
                ...payload,
                mediatype: 'image'
            });

            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao enviar imagem');
        }
    }

    /**
     * Envia vídeo
     */
    async sendVideo(instanceName: string, message: SendMediaMessage): Promise<any> {
        try {
            const payload = {
                number: message.number,
                media: message.media,
                caption: message.caption || '',
                delay: message.delay || 1200
            };

            logger.info(`[UAZAPI] Enviando vídeo para ${message.number} via ${instanceName}`, { caption: message.caption });

            const response = await this.client.post(`/message/sendMedia/${instanceName}`, {
                ...payload,
                mediatype: 'video'
            });

            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao enviar vídeo');
        }
    }

    /**
     * Envia áudio
     */
    async sendAudio(instanceName: string, message: SendAudioMessage): Promise<any> {
        try {
            const payload = {
                number: message.number,
                audio: message.audio,
                delay: message.delay || 1200,
                ptt: message.ptt !== false // Default true (mensagem de voz)
            };

            logger.info(`[UAZAPI] Enviando áudio para ${message.number} via ${instanceName}`, { ptt: payload.ptt });

            const response = await this.client.post(`/message/sendWhatsAppAudio/${instanceName}`, payload);

            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao enviar áudio');
        }
    }

    /**
     * Busca instâncias disponíveis
     */
    async fetchInstances(): Promise<any> {
        try {
            const response = await this.client.get('/instance/fetchInstances');
            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao buscar instâncias');
        }
    }

    /**
     * Verifica status de conexão de uma instância
     */
    async getConnectionState(instanceName: string): Promise<any> {
        try {
            const response = await this.client.get(`/instance/connectionState/${instanceName}`);
            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao verificar status de conexão');
        }
    }

    /**
     * Gera QR Code para conectar instância
     */
    async getQRCode(instanceName: string): Promise<any> {
        try {
            const response = await this.client.get(`/instance/connect/${instanceName}`);
            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao gerar QR Code');
        }
    }

    /**
     * Desconecta instância
     */
    async logout(instanceName: string): Promise<any> {
        try {
            const response = await this.client.delete(`/instance/logout/${instanceName}`);
            return response.data;
        } catch (error: unknown) {
            this.handleError(error, 'Erro ao desconectar instância');
        }
    }

    /**
     * Tratamento de erros
     */
    private handleError(error: unknown, message: string): never {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 0;
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;

            logger.error(message, {
                status,
                error: errorMessage,
                url: error.config?.url
            });

            throw new Error(`UAZAPI Error (${status}): ${errorMessage}`);
        }

        logger.error(message, { error });
        throw new Error(message);
    }
}

export default UAZAPI;
