import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { logger } from '../utils/logger.js';

/**
 * Interface para serviços de Email
 */
export interface EmailService {
  sendEmail(to: string, subject: string, content: string, options?: EmailOptions): Promise<EmailResponse>;
  sendBulkEmail(recipients: string[], subject: string, content: string, options?: EmailOptions): Promise<EmailResponse[]>;
  validateEmail(email: string): boolean;
  previewEmail?(content: string, variables?: Record<string, string>): string;
}

export interface EmailOptions {
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
  html?: boolean;
  replyTo?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  accepted?: string[];
  rejected?: string[];
}

/**
 * Serviço de Email usando SMTP (Nodemailer)
 */
export class SMTPEmailService implements EmailService {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from?: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true para 465, false para outras portas
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      },
      tls: {
        rejectUnauthorized: false // Para desenvolvimento, remover em produção
      }
    });

    this.defaultFrom = config.from || config.auth.user;
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResponse> {
    try {
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: to,
        subject: subject,
        text: options.html ? undefined : content,
        html: options.html ? content : undefined,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error: any) {
      logger.error('Erro ao enviar email via SMTP:', { error: error.message });
      return {
        success: false,
        error: error.message || 'Erro ao enviar email',
        provider: 'smtp'
      };
    }
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];
    
    // Enviar em lotes para evitar sobrecarga
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(recipient => 
        this.sendEmail(recipient, subject, content, options)
      );
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      // Delay entre lotes para evitar rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Serviço de Email usando SendGrid
 */
export class SendGridEmailService implements EmailService {
  private apiKey: string;
  private defaultFrom: string;

  constructor(config: { apiKey: string; from?: string }) {
    this.apiKey = config.apiKey || process.env.SENDGRID_API_KEY || '';
    this.defaultFrom = config.from || process.env.SENDGRID_FROM_EMAIL || '';
    
    if (!this.apiKey) {
      throw new Error('SendGrid API Key não configurada');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResponse> {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      const msg = {
        to: to,
        from: options.from || this.defaultFrom,
        subject: subject,
        text: options.html ? undefined : content,
        html: options.html ? content : undefined,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          content: att.content?.toString('base64'),
          filename: att.filename,
          type: att.contentType,
          disposition: 'attachment'
        }))
      };

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'] || undefined,
        provider: 'sendgrid',
        accepted: [to]
      };
    } catch (error: any) {
      logger.error('Erro ao enviar email via SendGrid:', { error: error.message });
      return {
        success: false,
        error: error.message || 'Erro ao enviar email',
        provider: 'sendgrid',
        rejected: [to]
      };
    }
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResponse[]> {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      const messages = recipients.map(to => ({
        to: to,
        from: options.from || this.defaultFrom,
        subject: subject,
        text: options.html ? undefined : content,
        html: options.html ? content : undefined
      }));

      // SendGrid suporta envio em lote
      const [response] = await sgMail.send(messages);

      return recipients.map((recipient, index) => ({
        success: true,
        messageId: response.headers?.['x-message-id'] || undefined,
        provider: 'sendgrid',
        accepted: [recipient]
      }));
    } catch (error: any) {
      logger.error('Erro ao enviar emails em lote via SendGrid:', { error: error.message });
      return recipients.map(recipient => ({
        success: false,
        error: error.message || 'Erro ao enviar email',
        provider: 'sendgrid',
        rejected: [recipient]
      }));
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Serviço de Email usando AWS SES
 */
export class AWSEmailService implements EmailService {
  private ses: any;
  private defaultFrom: string;
  private region: string;

  constructor(config: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    from?: string;
  }) {
    this.region = config.region || 'us-east-1';
    this.defaultFrom = config.from || '';
    
    try {
      const AWS = require('aws-sdk');
      this.ses = new AWS.SES({
        region: this.region,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      });
    } catch (error) {
      throw new Error('AWS SDK não está instalado. Execute: npm install aws-sdk');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResponse> {
    try {
      const params = {
        Source: options.from || this.defaultFrom,
        Destination: {
          ToAddresses: [to],
          CcAddresses: options.cc || [],
          BccAddresses: options.bcc || []
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: options.html ? undefined : { Data: content, Charset: 'UTF-8' },
            Html: options.html ? { Data: content, Charset: 'UTF-8' } : undefined
          }
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined
      };

      const result = await this.ses.sendEmail(params).promise();

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-ses',
        accepted: [to]
      };
    } catch (error: any) {
      logger.error('Erro ao enviar email via AWS SES:', { error: error.message });
      return {
        success: false,
        error: error.message || 'Erro ao enviar email',
        provider: 'aws-ses',
        rejected: [to]
      };
    }
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: string,
    options: EmailOptions = {}
  ): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];
    
    // AWS SES suporta até 50 destinatários por requisição
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      try {
        const params = {
          Source: options.from || this.defaultFrom,
          Destination: {
            ToAddresses: batch
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8'
            },
            Body: {
              Text: options.html ? undefined : { Data: content, Charset: 'UTF-8' },
              Html: options.html ? { Data: content, Charset: 'UTF-8' } : undefined
            }
          }
        };

        const result = await this.ses.sendEmail(params).promise();
        
        batch.forEach(recipient => {
          results.push({
            success: true,
            messageId: result.MessageId,
            provider: 'aws-ses',
            accepted: [recipient]
          });
        });
      } catch (error: any) {
        batch.forEach(recipient => {
          results.push({
            success: false,
            error: error.message || 'Erro ao enviar email',
            provider: 'aws-ses',
            rejected: [recipient]
          });
        });
      }
      
      // Delay entre lotes
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Factory para criar serviços de Email
 */
export class EmailServiceFactory {
  static createService(provider: string, config: any): EmailService {
    switch (provider.toLowerCase()) {
      case 'smtp':
        return new SMTPEmailService({
          host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
          port: config.port || parseInt(process.env.SMTP_PORT || '587'),
          secure: config.secure || process.env.SMTP_SECURE === 'true',
          auth: {
            user: config.user || process.env.SMTP_USER || '',
            pass: config.pass || process.env.SMTP_PASS || ''
          },
          from: config.from || process.env.SMTP_FROM
        });
      
      case 'sendgrid':
        return new SendGridEmailService({
          apiKey: config.apiKey || process.env.SENDGRID_API_KEY || '',
          from: config.from || process.env.SENDGRID_FROM_EMAIL
        });
      
      case 'aws-ses':
      case 'ses':
        return new AWSEmailService({
          region: config.region || process.env.AWS_REGION || 'us-east-1',
          accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
          from: config.from || process.env.AWS_SES_FROM_EMAIL
        });
      
      default:
        throw new Error(`Provedor de Email não suportado: ${provider}`);
    }
  }
}

