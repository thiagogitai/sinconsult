import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Interface para provedores de SMS
 */
export interface SMSService {
  sendSMS(to: string, message: string, options?: any): Promise<SMSResponse>;
  getBalance?(): Promise<number>;
  validateNumber(phone: string): Promise<boolean>;
  previewMessage?(message: string, variables?: Record<string, string>): string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  cost?: number;
  status?: string;
}

/**
 * Serviço SMS usando Zenvia
 */
export class ZenviaSMSService implements SMSService {
  private apiToken: string;
  private from: string;

  constructor(config: { apiToken: string; from?: string }) {
    this.apiToken = config.apiToken || process.env.ZENVIA_API_TOKEN || '';
    this.from = config.from || process.env.ZENVIA_FROM || '';
    
    if (!this.apiToken) {
      throw new Error('Zenvia API Token não configurado');
    }
  }

  async sendSMS(to: string, message: string, options: any = {}): Promise<SMSResponse> {
    try {
      // Normalizar número
      const normalizedTo = this.normalizePhone(to);
      
      const response = await axios.post(
        'https://api.zenvia.com/v2/channels/sms/messages',
        {
          from: options.from || this.from,
          to: normalizedTo,
          contents: [
            {
              type: 'text',
              text: message
            }
          ]
        },
        {
          headers: {
            'X-API-TOKEN': this.apiToken,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.id,
        provider: 'zenvia',
        status: response.data.status || 'sent'
      };
    } catch (error: any) {
      logger.error('Erro ao enviar SMS via Zenvia:', { error: error.response?.data || error.message });
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao enviar SMS',
        provider: 'zenvia'
      };
    }
  }

  async validateNumber(phone: string): Promise<boolean> {
    try {
      const normalized = this.normalizePhone(phone);
      return /^\+\d{10,15}$/.test(normalized);
    } catch {
      return false;
    }
  }

  previewMessage(message: string, variables?: Record<string, string>): string {
    if (!variables) return message;
    
    let preview = message;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      preview = preview.replace(regex, value);
    });
    return preview;
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começa com código de país e tem 10-11 dígitos, assume Brasil
    if (!phone.startsWith('+')) {
      if (cleaned.length >= 10 && cleaned.length <= 11) {
        cleaned = '55' + cleaned;
      }
      return '+' + cleaned;
    }
    
    return phone;
  }
}

/**
 * Serviço SMS usando Twilio
 */
export class TwilioSMSService implements SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private client: any;

  constructor(config: { accountSid: string; authToken: string; fromNumber: string }) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromNumber = config.fromNumber;
    
    // Twilio SDK será carregado dinamicamente se disponível
    try {
      // Tentar usar Twilio SDK se instalado
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
    } catch (error) {
      // Se não tiver Twilio instalado, usar API REST
      this.client = null;
    }
  }

  async sendSMS(to: string, message: string, options: any = {}): Promise<SMSResponse> {
    try {
      // Normalizar número (remover caracteres não numéricos, adicionar + se necessário)
      const normalizedTo = this.normalizePhone(to);
      
      if (this.client) {
        // Usar Twilio SDK
        const result = await this.client.messages.create({
          body: message,
          from: this.fromNumber,
          to: normalizedTo,
          ...options
        });

        return {
          success: true,
          messageId: result.sid,
          provider: 'twilio',
          cost: parseFloat(result.price || '0')
        };
      } else {
        // Usar API REST do Twilio
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
          new URLSearchParams({
            From: this.fromNumber,
            To: normalizedTo,
            Body: message
          }),
          {
            auth: {
              username: this.accountSid,
              password: this.authToken
            }
          }
        );

        return {
          success: true,
          messageId: response.data.sid,
          provider: 'twilio',
          cost: parseFloat(response.data.price || '0')
        };
      }
    } catch (error: any) {
      logger.error('Erro ao enviar SMS via Twilio:', { error: error.message });
      return {
        success: false,
        error: error.message || 'Erro ao enviar SMS',
        provider: 'twilio'
      };
    }
  }

  async validateNumber(phone: string): Promise<boolean> {
    try {
      const normalized = this.normalizePhone(phone);
      // Validação básica: deve ter código de país e número válido
      return /^\+\d{10,15}$/.test(normalized);
    } catch {
      return false;
    }
  }

  private normalizePhone(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começa com +, adiciona código do país (assume Brasil se 10-11 dígitos)
    if (!phone.startsWith('+')) {
      if (cleaned.length >= 10 && cleaned.length <= 11) {
        cleaned = '55' + cleaned;
      }
      return '+' + cleaned;
    }
    
    return phone;
  }
}

/**
 * Serviço SMS usando AWS SNS
 */
export class AWSSMSService implements SMSService {
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private sns: any;

  constructor(config: { region: string; accessKeyId: string; secretAccessKey: string }) {
    this.region = config.region || 'us-east-1';
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    
    try {
      const AWS = require('aws-sdk');
      this.sns = new AWS.SNS({
        region: this.region,
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      });
    } catch (error) {
      throw new Error('AWS SDK não está instalado. Execute: npm install aws-sdk');
    }
  }

  async sendSMS(to: string, message: string, options: any = {}): Promise<SMSResponse> {
    try {
      const normalizedTo = this.normalizePhone(to);
      
      const params = {
        PhoneNumber: normalizedTo,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: options.messageType || 'Transactional'
          }
        }
      };

      const result = await this.sns.publish(params).promise();

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-sns',
        cost: 0 // AWS SNS cobra por uso, não retorna custo na resposta
      };
    } catch (error: any) {
      logger.error('Erro ao enviar SMS via AWS SNS:', { error: error.message });
      return {
        success: false,
        error: error.message || 'Erro ao enviar SMS',
        provider: 'aws-sns'
      };
    }
  }

  async validateNumber(phone: string): Promise<boolean> {
    try {
      const normalized = this.normalizePhone(phone);
      return /^\+\d{10,15}$/.test(normalized);
    } catch {
      return false;
    }
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (!phone.startsWith('+')) {
      if (cleaned.length >= 10 && cleaned.length <= 11) {
        cleaned = '55' + cleaned;
      }
      return '+' + cleaned;
    }
    return phone;
  }
}

/**
 * Factory para criar serviços SMS
 */
export class SMSServiceFactory {
  static createService(provider: string, config: any): SMSService {
    switch (provider.toLowerCase()) {
      case 'zenvia':
        return new ZenviaSMSService({
          apiToken: config.apiToken || process.env.ZENVIA_API_TOKEN || '',
          from: config.from || process.env.ZENVIA_FROM || ''
        });
      
      case 'twilio':
        return new TwilioSMSService({
          accountSid: config.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
          authToken: config.authToken || process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: config.fromNumber || process.env.TWILIO_FROM_NUMBER || ''
        });
      
      case 'aws-sns':
      case 'aws':
        return new AWSSMSService({
          region: config.region || process.env.AWS_REGION || 'us-east-1',
          accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || ''
        });
      
      default:
        throw new Error(`Provedor SMS não suportado: ${provider}`);
    }
  }
}

