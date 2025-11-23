import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

/**
 * Middleware de validação usando Zod
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        throw new AppError('Dados inválidos', 400, 'VALIDATION_ERROR');
      }
      next(error);
    }
  };
};

// Schemas de validação comuns
export const schemas = {
  login: z.object({
    body: z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
    })
  }),

  createContact: z.object({
    body: z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      phone: z.string().min(10, 'Telefone inválido'),
      email: z.string().email('Email inválido').optional().or(z.literal('')),
      tags: z.string().optional(),
      custom_fields: z.record(z.any()).optional()
    })
  }),

  createCampaign: z.object({
    body: z.object({
      name: z.string().min(1, 'Nome da campanha é obrigatório'),
      message_template: z.string().min(1, 'Mensagem é obrigatória'),
      message_type: z.enum(['text', 'image', 'audio', 'video', 'document']).default('text'),
      schedule_time: z.string().datetime().optional(),
      use_tts: z.boolean().optional(),
      tts_config_id: z.string().optional()
    })
  }),

  createWhatsAppInstance: z.object({
    body: z.object({
      instance_name: z.string().min(1, 'Nome da instância é obrigatório'),
      phone_number: z.string().optional()
    })
  }),

  sendMessage: z.object({
    body: z.object({
      instance_id: z.string().min(1, 'ID da instância é obrigatório'),
      phone_number: z.string().min(10, 'Número de telefone inválido'),
      message: z.string().min(1, 'Mensagem é obrigatória'),
      message_type: z.enum(['text', 'image', 'audio', 'video', 'document']).default('text'),
      media_url: z.string().url().optional()
    })
  }),

  generateTTS: z.object({
    body: z.object({
      text: z.string().min(1, 'Texto é obrigatório').max(5000, 'Texto muito longo'),
      provider: z.enum(['openai', 'elevenlabs']),
      voice: z.string().min(1, 'Voz é obrigatória'),
      options: z.record(z.any()).optional()
    })
  }),

  createTemplate: z.object({
    body: z.object({
      name: z.string().min(1, 'Nome do template é obrigatório'),
      content: z.string().min(1, 'Conteúdo é obrigatório'),
      variables: z.array(z.string()).optional(),
      category: z.string().optional(),
      message_type: z.enum(['text', 'image', 'audio', 'video', 'document']).default('text')
    })
  }),

  updateTemplate: z.object({
    body: z.object({
      name: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      variables: z.array(z.string()).optional(),
      category: z.string().optional(),
      message_type: z.enum(['text', 'image', 'audio', 'video', 'document']).optional()
    })
  }),

  sendSMS: z.object({
    body: z.object({
      phone_number: z.string().min(10, 'Número de telefone inválido'),
      message: z.string().min(1, 'Mensagem é obrigatória'),
      sms_config_id: z.number().optional(),
      variables: z.record(z.string()).optional()
    })
  }),

  sendEmail: z.object({
    body: z.object({
      email_address: z.string().email('Email inválido'),
      subject: z.string().min(1, 'Assunto é obrigatório'),
      content: z.string().min(1, 'Conteúdo é obrigatório'),
      email_config_id: z.number().optional(),
      variables: z.record(z.string()).optional(),
      html: z.boolean().optional()
    })
  }),

  createEmailTemplate: z.object({
    body: z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      subject: z.string().min(1, 'Assunto é obrigatório'),
      html_content: z.string().optional(),
      text_content: z.string().optional(),
      variables: z.array(z.string()).optional(),
      category: z.string().optional()
    })
  }),

  unsubscribe: z.object({
    body: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      channel: z.enum(['email', 'sms', 'whatsapp', 'all']),
      reason: z.string().optional(),
      custom_message: z.string().optional()
    })
  })
};

