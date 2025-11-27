import express from 'express';
import type { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
// Banco via adaptador SQLite
import { initDatabase, dbGet, dbAll, dbRun } from './utils/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import XLSX from 'xlsx';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import EvolutionAPI from './services/evolution.js';
import { TTSServiceFactory, saveAudioFile, generateAudioFilename } from './services/tts.js';
import { authenticateToken, requireAdmin } from './middleware/auth.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { defaultRateLimiter, authRateLimiter } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';
import { validate, schemas } from './utils/validators.js';
import { validatePhone, normalizePhone } from './utils/phoneValidator.js';
import { SMSServiceFactory } from './services/sms.js';
import { EmailServiceFactory } from './services/email.js';
import crypto from 'crypto';
import axios from 'axios';

// Definir __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
(() => {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env')
  ];
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      break;
    }
  }
})();

async function loadEvolutionConfigFromDB() {
  try {
    const urlRow: any = await dbGet('SELECT value FROM app_settings WHERE key = ? AND category = ?', ['evolutionApiUrl', 'api']);
    const keyRow: any = await dbGet('SELECT value FROM app_settings WHERE key = ? AND category = ?', ['evolutionApiKey', 'api']);
    const rawUrl = (urlRow && urlRow.value) ? urlRow.value : process.env.EVOLUTION_API_URL;
    const rawKey = (keyRow && keyRow.value) ? keyRow.value : process.env.EVOLUTION_API_KEY;
    const url = String(rawUrl || '').trim().replace(/`/g, '').replace(/\/+$/, '');
    const key = String(rawKey || '').trim().replace(/`/g, '');

    // Atualizar variáveis de ambiente
    if (url) {
      process.env.EVOLUTION_API_URL = url;
    }
    if (key) {
      process.env.EVOLUTION_API_KEY = key;
    }

    // Atualizar instância do EvolutionAPI
    evolutionAPI.setConfig(url, key);

    logger.info('Configurações do Evolution carregadas do banco de dados', {
      url: url || 'não configurado',
      hasKey: !!key && key !== 'your-api-key'
    });
  } catch (error: any) {
    logger.warn('Erro ao carregar configurações do Evolution do banco:', { error: error.message });
    // Continuar usando configurações do .env se houver erro
  }
}

// Validar e gerar JWT_SECRET se necessário
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  // Gerar JWT_SECRET automaticamente
  const generatedSecret = crypto.randomBytes(64).toString('hex');
  process.env.JWT_SECRET = generatedSecret;

  // Tentar salvar no .env
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('JWT_SECRET=')) {
        envContent += `\nJWT_SECRET=${generatedSecret}\n`;
        fs.writeFileSync(envPath, envContent);
        logger.info('✅ JWT_SECRET gerado e salvo automaticamente no .env');
      }
    } else {
      // Criar .env se não existir
      fs.writeFileSync(envPath, `JWT_SECRET=${generatedSecret}\nPORT=3006\nNODE_ENV=production\n`);
      logger.info('✅ Arquivo .env criado com JWT_SECRET gerado automaticamente');
    }
  } catch (error) {
    logger.warn('⚠️  Não foi possível salvar JWT_SECRET no .env, usando em memória');
  }

  logger.info('✅ JWT_SECRET gerado automaticamente');
}

const app = express();
const PORT = process.env.PORT || 3006;

// Configurar Evolution API
const evolutionAPI = new EvolutionAPI();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Adicionar header para upgrade automático de HTTP para HTTPS
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "upgrade-insecure-requests");
  next();
});

// CORS configurado adequadamente
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== WEBHOOK BRIDGE (Elementor → Google Apps Script) =====
// (Movido para depois do body-parser)

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== WEBHOOK BRIDGE (Elementor → Google Apps Script) =====
// Implementação simples: recebe dados, retorna 200 OK, encaminha para GAS
app.all('/webhook-bridge.php', (req, res) => {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby66oCrq7Fj-wDQx3YyycNWUJ_XnzXQtToR0k5qIq_676UA0iujTxymI4WU9jF7F8Ulh/exec';

  // 1. Responde imediatamente 200 OK (antes de qualquer processamento)
  res.status(200).send('OK');

  // 2. Encaminha para Google Apps Script em background
  setImmediate(async () => {
    try {
      // Aceita tanto JSON quanto form-urlencoded
      const data = req.body || {};

      logger.info('[webhook-bridge] Recebido:', {
        method: req.method,
        contentType: req.headers['content-type'],
        data: data
      });

      await axios.post(WEB_APP_URL, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      logger.info('[webhook-bridge] ✅ Encaminhado para GAS');
    } catch (error: any) {
      logger.error('[webhook-bridge] ❌ Erro:', error.message);
    }
  });
});

// Endpoint alternativo (caso o .php não funcione)
const handleElementorWebhook = (req: any, res: any) => {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby66oCrq7Fj-wDQx3YyycNWUJ_XnzXQtToR0k5qIq_676UA0iujTxymI4WU9j7F8Ulh/exec';

  // Responde imediatamente com texto simples "OK" (o que o Elementor espera)
  res.status(200).send('OK');

  setImmediate(async () => {
    try {
      // Aceita JSON ou form-urlencoded
      const data = req.body || {};

      logger.info('[elementor-webhook] Recebido:', {
        path: req.path,
        method: req.method,
        contentType: req.headers['content-type'],
        dataKeys: Object.keys(data)
      });

      await axios.post(WEB_APP_URL, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      logger.info('[elementor-webhook] ✅ Dados encaminhados para GAS');
    } catch (error: any) {
      logger.error('[elementor-webhook] ❌ Erro:', error.message);
    }
  });
};

app.all('/api/elementor-webhook', handleElementorWebhook);
app.all('/elementor-webhook.php', handleElementorWebhook);

function getPublicBaseUrl(req?: Request): string {
  const envUrl = (process.env.PUBLIC_BASE_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/+$/, '');
  const xfProto = (req?.headers['x-forwarded-proto'] as string) || '';
  const xfHost = (req?.headers['x-forwarded-host'] as string) || '';
  const proto = (xfProto || req?.protocol || 'http').replace(/\/+$/, '');
  const host = (xfHost || req?.get('host') || `localhost:${process.env.PORT || 3006}`).replace(/\/+$/, '');
  return `${proto}://${host}`;
}

function buildAbsoluteUrl(url: string, req?: Request): string {
  const u = String(url || '');
  if (/^https?:\/\//i.test(u)) return u;
  const base = getPublicBaseUrl(req);
  const cleanBase = base.replace(/\/+$/, '');
  let rel = u.startsWith('/') ? u : `/${u}`;
  if (rel.startsWith('/uploads/')) rel = `/api${rel}`;
  return `${cleanBase}${rel}`;
}

// Servir arquivos estáticos do frontend
// __dirname em produção: dist-server/api
// Precisamos ir para a raiz do projeto e então para dist/
const projectRoot = path.resolve(__dirname, '../..');
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  logger.info('✅ Servindo arquivos estáticos de:', distPath);
  logger.info('   __dirname:', __dirname);
  logger.info('   projectRoot:', projectRoot);
} else {
  logger.warn('⚠️  Pasta dist/ não encontrada em:', distPath);
  logger.warn('   __dirname atual:', __dirname);
  logger.warn('   projectRoot:', projectRoot);
  // Tentar caminho alternativo
  const altDistPath = path.join(__dirname, '../dist');
  if (fs.existsSync(altDistPath)) {
    app.use(express.static(altDistPath));
    logger.info('✅ Usando caminho alternativo:', altDistPath);
  }
}

// Servir arquivos de upload
const uploadsPath = path.join(projectRoot, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    logger.info('✅ Pasta uploads criada em:', uploadsPath);
  } catch (e) {
    logger.warn('⚠️  Falha ao criar pasta uploads:', { uploadsPath, error: e });
  }
}
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));
logger.info('✅ Servindo arquivos de upload de:', uploadsPath);

// Rate limiting global
app.use(defaultRateLimiter);

// Funções auxiliares para banco de dados (definidas globalmente via import)
// dbGet, dbAll, dbRun são importadas de ./utils/database.js

// Função auxiliar para criar notificações (definida após inicialização do banco)
async function createNotification(userId: number | null, type: string, title: string, message: string): Promise<void> {
  try {
    await dbRun(`
      INSERT INTO notifications (user_id, type, title, message, read, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [userId, type, title, message, false]);

    console.log(`✅ Notificação criada: ${title} - ${message}`);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limite
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'));
    }
  }
});

// Upload para imagens (apenas imagens)
const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limite
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
  }
});

// Upload para vídeos (apenas vídeos)
const uploadVideo = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limite
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de vídeo são permitidos'));
    }
  }
});

// Upload para mídia (imagens, vídeos e áudio)
const uploadMedia = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limite
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem, vídeo ou áudio são permitidos'));
    }
  }
});

// Funções auxiliares para SQLite (definidas globalmente)
// Criar diretório de uploads se não existir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login aprimorado (com rate limiting mais restritivo)
app.post('/api/auth/login', authRateLimiter, validate(schemas.login), asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário ativo
    const user = await dbGet('SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND is_active = true', [email]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'super-secret-jwt-key-2025-simconsult-secure-token-change-in-production',
      { expiresIn: '7d' }
    );

    // Registrar log de atividade
    await dbRun(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'login', JSON.stringify({ ip: req.ip, userAgent: req.get('User-Agent') })]
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Erro no login:', { error });
    throw error; // Será capturado pelo errorHandler
  }
}));

// Logout (requer autenticação)
app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any;

        await dbRun(
          'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
          [decoded.userId, 'logout', JSON.stringify({ ip: req.ip })]
        );
      } catch (error) {
        // Token inválido ou expirado, apenas ignora
      }
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    logger.error('Erro no logout:', { error });
    throw error;
  }
}));

// Verificar token
// Verificar token
app.get('/api/auth/verify', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    const user = await dbGet('SELECT id, name, email, role FROM users WHERE id = ? AND is_active = true', [userId]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao verificar token:', { error });
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
}));


// ===== ROTAS DO DASHBOARD =====

// Estatísticas do dashboard (requer autenticação)
app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const totalContacts = await dbGet('SELECT COUNT(*) as count FROM contacts WHERE is_active = true');
    const messagesToday = await dbGet('SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = DATE("now")');
    const deliveryStats = await dbGet(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered
      FROM messages 
      WHERE DATE(created_at) = DATE("now")
    `);
    const activeInstances = await dbGet('SELECT COUNT(*) as count FROM whatsapp_instances WHERE status = "connected"');

    // Valores padrão se não houver dados
    const total = deliveryStats?.total || 0;
    const delivered = deliveryStats?.delivered || 0;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100 * 100) / 100 : 0;

    res.json({
      total_contacts: totalContacts?.count || 0,
      messages_sent_today: messagesToday?.count || 0,
      delivery_rate: deliveryRate,
      active_instances: activeInstances?.count || 0
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', { error });
    // Retornar valores padrão em caso de erro
    res.json({
      total_contacts: 0,
      messages_sent_today: 0,
      delivery_rate: 0,
      active_instances: 0
    });
  }
}));

// Campanhas recentes (requer autenticação)
app.get('/api/dashboard/recent-campaigns', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const campaigns = await dbAll(`
      SELECT 
        id,
        name,
        status,
        scheduled_at as schedule_time,
        0 as target_count,
        0 as sent_count,
        0 as delivered_count,
        0 as read_count,
        created_at
      FROM campaigns
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json(campaigns);
  } catch (error) {
    logger.error('Erro ao buscar campanhas recentes:', { error });
    throw error;
  }
}));

// Status das instâncias WhatsApp (requer autenticação)
app.get('/api/dashboard/whatsapp-status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const instances = await dbAll(`
      SELECT 
        id,
        name as instance_name,
        phone_connected as phone_number,
        status,
        last_connection as last_activity,
        created_at
      FROM whatsapp_instances
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json(instances);
  } catch (error) {
    logger.error('Erro ao buscar status WhatsApp:', { error });
    throw error;
  }
}));

// ===== ROTAS DE CAMPANHAS =====

// Upload de mídia unificado (imagem, vídeo, áudio)
app.post('/api/upload/media', authenticateToken, uploadMedia.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const fileUrl = buildAbsoluteUrl(`/uploads/${req.file.filename}`, req);
    const mimetype = req.file.mimetype;
    let type = 'unknown';

    if (mimetype.startsWith('image/')) type = 'image';
    else if (mimetype.startsWith('video/')) type = 'video';
    else if (mimetype.startsWith('audio/')) type = 'audio';

    logger.info(`Upload de mídia realizado: ${req.file.filename} (${type})`);

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: mimetype,
      type: type
    });
  } catch (error) {
    logger.error('Erro no upload de mídia:', { error });
    throw error;
  }
}));

// Listar campanhas (requer autenticação)
app.get('/api/campaigns', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const campaigns = await dbAll(`
      SELECT 
        c.id,
        c.name,
        c.message as message_template,
        c.message_type,
        CASE WHEN c.status = 'draft' AND c.scheduled_at IS NOT NULL THEN 'scheduled' ELSE c.status END as status,
        c.scheduled_at as schedule_time,
        c.use_tts,
        c.tts_config_id,
        c.tts_audio_file,
        c.created_at,
        -- Aggregated delivery metrics
        (
          SELECT COUNT(*) FROM messages m WHERE m.campaign_id = c.id
        ) AS total_target,
        (
          SELECT COALESCE(SUM(CASE WHEN m.status = 'sent' THEN 1 ELSE 0 END), 0)
          FROM messages m WHERE m.campaign_id = c.id
        ) AS total_sent,
        (
          SELECT COALESCE(SUM(CASE WHEN m.status = 'delivered' THEN 1 ELSE 0 END), 0)
          FROM messages m WHERE m.campaign_id = c.id
        ) AS total_delivered,
        (
          SELECT COALESCE(SUM(CASE WHEN m.status = 'read' THEN 1 ELSE 0 END), 0)
          FROM messages m WHERE m.campaign_id = c.id
        ) AS total_read,
        (
          SELECT COALESCE(SUM(CASE WHEN m.status = 'failed' THEN 1 ELSE 0 END), 0)
          FROM messages m WHERE m.campaign_id = c.id
        ) AS total_failed
      FROM campaigns c
      ORDER BY c.created_at DESC
    `);

    res.json({ campaigns });
  } catch (error) {
    logger.error('Erro ao buscar campanhas:', { error });
    throw error;
  }
}));

// Criar campanha (requer autenticação)
app.post('/api/campaigns', authenticateToken, asyncHandler(async (req, res) => {
  try {
    logger.info('=== DEBUG CRIAR CAMPANHA ===');
    logger.info('Body recebido:', JSON.stringify(req.body, null, 2));

    // A validação pode estar esperando body aninhado, vamos aceitar ambos os formatos
    const bodyData = req.body.body || req.body;
    const {
      name,
      message_template,
      message,  // Aceitar também 'message' como alternativa
      message_type,
      schedule_time,
      scheduled_at,  // Aceitar também 'scheduled_at'
      segment_id,  // Segmento alvo
      target_segment, // Segmento alvo (novo)
      use_tts,
      tts_config_id,
      tts_audio_file,
      channel,
      sms_config_id,
      sms_template_id,
      email_config_id,
      email_subject,
      email_template_id,
      media_url,
      is_test,
      test_phone
    } = {
      ...bodyData,
      ...req.body
    };

    // Usar message_template ou message (remover espaços em branco)
    const finalMessage = (message_template || message || '').trim();
    const finalScheduleTime = schedule_time || scheduled_at || null;

    const rawMediaUrl = media_url || bodyData.media_url || req.body.media_url || null;
    const finalMediaUrl = rawMediaUrl ? buildAbsoluteUrl(String(rawMediaUrl), req as Request) : null;

    // Converter strings vazias para null nos campos opcionais
    const finalTtsConfigId = tts_config_id && tts_config_id.toString().trim() ? tts_config_id : null;
    const finalTtsAudioFile = tts_audio_file && tts_audio_file.toString().trim() ? tts_audio_file : null;
    const finalSmsConfigId = sms_config_id && sms_config_id.toString().trim() ? sms_config_id : null;
    const finalSmsTemplateId = sms_template_id && sms_template_id.toString().trim() ? sms_template_id : null;
    const finalEmailConfigId = email_config_id && email_config_id.toString().trim() ? email_config_id : null;
    const finalEmailSubject = email_subject && email_subject.toString().trim() ? email_subject : null;
    const finalEmailTemplateId = email_template_id && email_template_id.toString().trim() ? email_template_id : null;

    // Validação manual
    if (!name || !name.trim()) {
      logger.warn('Tentativa de criar campanha sem nome');
      return res.status(400).json({
        success: false,
        error: 'Nome da campanha é obrigatório',
        received: { name, message_template, message }
      });
    }

    // Mensagem só é obrigatória se não for imagem ou vídeo (que pode ter apenas media_url)
    if (!finalMessage || !finalMessage.trim()) {
      if (message_type !== 'image' && message_type !== 'video') {
        logger.warn('Tentativa de criar campanha sem mensagem', {
          message_template,
          message,
          finalMessage,
          message_type
        });
        return res.status(400).json({
          success: false,
          error: 'Mensagem é obrigatória para campanhas de texto ou áudio',
          received: { message_template, message, finalMessage, message_type }
        });
      } else if (!finalMediaUrl) {
        // Para imagem/vídeo, precisa ter media_url ou mensagem (legenda)
        logger.warn('Tentativa de criar campanha imagem/vídeo sem mídia nem mensagem', {
          message_type,
          finalMediaUrl
        });
        return res.status(400).json({
          success: false,
          error: 'Para campanhas de imagem/vídeo, é necessário fornecer uma URL de mídia ou uma mensagem (legenda)',
          received: { message_type, finalMediaUrl }
        });
      }
    }

    // Normalizar data de agendamento
    let normalizedSchedule = null;
    let initialStatus = 'draft';

    if (finalScheduleTime) {
      try {
        const date = new Date(finalScheduleTime);
        if (!isNaN(date.getTime())) {
          normalizedSchedule = date.toISOString();
          // Se a data for futura, status é scheduled. Se for passada ou presente, pode ser executada imediatamente (mas vamos manter scheduled para o cron pegar)
          initialStatus = 'scheduled';
        }
      } catch (e) {
        logger.warn('Data de agendamento inválida:', finalScheduleTime);
      }
    }

    const result = await dbRun(`
      INSERT INTO campaigns (
        name, 
        message, 
        message_type, 
        scheduled_at, 
        status,
        target_segment,
        use_tts, 
        tts_config_id, 
        tts_audio_file,
        channel,
        sms_config_id,
        sms_template_id,
        email_config_id,
        email_subject,
        email_template_id,
        media_url,
        is_test,
        test_phone
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      finalMessage,
      message_type || 'text',
      normalizedSchedule,
      initialStatus,
      target_segment || segment_id || null,
      use_tts || false,
      finalTtsConfigId,
      finalTtsAudioFile,
      channel || 'whatsapp',
      finalSmsConfigId,
      finalSmsTemplateId,
      finalEmailConfigId,
      finalEmailSubject,
      finalEmailTemplateId,
      finalMediaUrl,
      is_test ? 1 : 0,
      test_phone || null
    ]);

    let newCampaign: any = await dbGet('SELECT * FROM campaigns WHERE id = ?', [result.lastID]);
    if (newCampaign && newCampaign.status === 'draft' && newCampaign.scheduled_at) {
      await dbRun(`UPDATE campaigns SET status = 'scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [result.lastID]);
      newCampaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [result.lastID]);
    }

    // Criar notificação de campanha criada
    const userId = (req as any).user?.userId;
    await createNotification(
      userId,
      'success',
      'Campanha criada',
      `Campanha "${name}" foi criada com sucesso`
    );

    logger.info('Campanha criada com sucesso:', { id: result.lastID, name });
    res.json(newCampaign);
  } catch (error: any) {
    logger.error('Erro ao criar campanha:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Se for erro de validação do banco, retornar mensagem mais clara
    if (error.message && error.message.includes('NOT NULL constraint')) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos: algum campo obrigatório está faltando',
        details: error.message
      });
    }

    // Retornar erro genérico
    res.status(500).json({
      success: false,
      error: 'Erro ao criar campanha',
      message: error.message || 'Erro desconhecido'
    });
  }
}));

// Atualizar status da campanha (requer autenticação)
app.patch('/api/campaigns/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await dbRun(`
      UPDATE campaigns 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    const updatedCampaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);
    res.json(updatedCampaign);
  } catch (error) {
    logger.error('Erro ao atualizar status da campanha:', { error });
    throw error;
  }
}));

// Atualizar campanha (requer autenticação)
app.put('/api/campaigns/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      message,
      message_template,
      message_type,
      type,
      scheduled_at,
      scheduled_time,
      schedule_time,
      use_tts,
      tts_config_id,
      tts_audio_file,
      channel,
      sms_config_id,
      sms_template_id,
      email_config_id,
      email_subject,
      email_template_id,
      media_url,
      status
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    const setIf = (field: string, value: any) => {
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        params.push(value);
      }
    };

    setIf('name', name);
    setIf('message', message ?? message_template);
    setIf('message_type', message_type ?? type);
    const schedRaw = scheduled_at ?? scheduled_time ?? schedule_time;
    let schedNorm: string | undefined = undefined;
    if (schedRaw) {
      const s = String(schedRaw).replace('T', ' ').trim();
      schedNorm = s.length === 16 ? `${s}:00` : s;
    }
    setIf('scheduled_at', schedNorm);
    setIf('use_tts', use_tts);
    setIf('tts_config_id', tts_config_id);
    setIf('tts_audio_file', tts_audio_file);
    setIf('channel', channel);
    setIf('sms_config_id', sms_config_id);
    setIf('sms_template_id', sms_template_id);
    setIf('email_config_id', email_config_id);
    setIf('email_subject', email_subject);
    setIf('email_template_id', email_template_id);
    const mediaToSet = media_url !== undefined ? (media_url ? buildAbsoluteUrl(String(media_url), req as Request) : null) : undefined;
    setIf('media_url', mediaToSet);
    if (status !== undefined) {
      setIf('status', status);
    } else if (schedNorm) {
      setIf('status', 'scheduled');
    }
    setIf('is_test', req.body.is_test !== undefined ? (req.body.is_test ? 1 : 0) : undefined);
    setIf('test_phone', req.body.test_phone);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    if (updates.length === 1) {
      return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
    }

    await dbRun(`
      UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?
    `, params);

    let updated = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (updated && updated.status === 'draft' && updated.scheduled_at) {
      await dbRun(`UPDATE campaigns SET status = 'scheduled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
      updated = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);
    }
    res.json(updated);
  } catch (error: any) {
    logger.error('Erro ao atualizar campanha:', { error: error.message });
    throw error;
  }
}));

// Parar campanha (requer autenticação)
app.post('/api/campaigns/:id/stop', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`
      UPDATE campaigns SET status = 'paused', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [id]);
    const updated = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Erro ao parar campanha:', { error });
    throw error;
  }
}));

app.get('/api/campaigns/:id/messages', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params as any;
    const { status, limit } = req.query as any;
    const lim = Number(limit) > 0 ? Number(limit) : 100;
    let where = 'WHERE m.campaign_id = ?';
    const params: any[] = [id];
    if (status && status !== 'all') {
      where += ' AND m.status = ?';
      params.push(status);
    }
    params.push(lim);
    const rows = await dbAll(`
      SELECT 
        m.id as message_id,
        m.status,
        m.sent_at,
        m.delivered_at,
        m.read_at,
        m.error_message,
        c.name,
        c.phone
      FROM messages m
      JOIN contacts c ON c.id = m.contact_id
      ${where}
      ORDER BY COALESCE(m.delivered_at, m.read_at, m.sent_at, m.created_at) DESC
      LIMIT ?
    `, params);
    res.json({ success: true, messages: rows });
  } catch (error: any) {
    logger.error('Erro ao listar mensagens da campanha:', { error: error.message });
    res.status(500).json({ success: false, error: 'Erro ao listar mensagens' });
  }
}));
// Estatísticas da campanha (requer autenticação)
app.get('/api/campaigns/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const totals = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM messages
      WHERE campaign_id = ?
    `, [id]);

    const deliveredList = await dbAll(`
      SELECT m.id as message_id, c.name, c.phone, m.sent_at, m.delivered_at, m.read_at, m.status
      FROM messages m
      JOIN contacts c ON c.id = m.contact_id
      WHERE m.campaign_id = ? AND m.status IN ('sent', 'delivered', 'read')
      ORDER BY m.delivered_at DESC NULLS LAST, m.read_at DESC NULLS LAST, m.sent_at DESC
      LIMIT 100
    `, [id]);

    const failedList = await dbAll(`
      SELECT m.id as message_id, c.name, c.phone, m.error_message
      FROM messages m
      JOIN contacts c ON c.id = m.contact_id
      WHERE m.campaign_id = ? AND m.status = 'failed'
      ORDER BY m.created_at DESC
      LIMIT 100
    `, [id]);

    const percentage = totals && totals.total > 0 ? Math.round(((totals.sent || 0) / totals.total) * 100) : 0;

    res.json({
      success: true,
      total_target: totals?.total || 0,
      total_sent: totals?.sent || 0,
      total_delivered: totals?.delivered || 0,
      total_read: totals?.read || 0,
      total_failed: totals?.failed || 0,
      total_pending: totals?.pending || 0,
      percentage,
      delivered: deliveredList,
      failed: failedList
    });
  } catch (error: any) {
    logger.error('Erro ao obter estatísticas da campanha:', { error: error.message });
    res.status(500).json({ success: false, error: 'Erro ao obter estatísticas da campanha' });
  }
}));

// Iniciar campanha (requer autenticação)
app.post('/api/campaigns/:id/start', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await dbRun(`
      UPDATE campaigns 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    const campaign: any = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);

    const userId = (req as any).user?.userId;
    await createNotification(
      userId,
      'success',
      'Campanha iniciada',
      `Campanha "${campaign.name}" foi iniciada com sucesso`
    );

    await loadEvolutionConfigFromDB();

    let contactIds: string[] = [];

    // Se houver segmento definido, buscar apenas contatos desse segmento
    if (campaign.target_segment && campaign.target_segment.trim() !== '') {
      const contacts = await dbAll(`
        SELECT id FROM contacts 
        WHERE segment = ?
          AND (is_blocked = false OR is_blocked IS NULL)
          AND is_active = true
      `, [campaign.target_segment]);
      contactIds = contacts.map((c: any) => String(c.id));
    } else {
      // Se não houver segmento, buscar TODOS os contatos ativos (exceto se for teste)
      if (!campaign.is_test) {
        const contacts = await dbAll(`
          SELECT id FROM contacts 
          WHERE (is_blocked = 0 OR is_blocked IS NULL)
            AND (is_active = 1 OR is_active IS NULL)
        `);
        contactIds = contacts.map((c: any) => String(c.id));
        logger.info(`Campanha ${campaign.id} sem segmento: enviando para ${contactIds.length} contatos`);
      }
    }

    if (campaign.is_test) {
      if (campaign.test_phone && String(campaign.test_phone).trim() !== '') {
        const phone = normalizePhone(String(campaign.test_phone));
        let contact = await dbGet('SELECT id FROM contacts WHERE phone = ?', [phone]);
        if (!contact) {
          const insert = await dbRun('INSERT INTO contacts (name, phone, is_active) VALUES (?, ?, true)', ['Teste', phone]);
          contact = { id: insert.lastID } as any;
        }
        contactIds = [String(contact.id)];
      } else if (contactIds.length > 0) {
        contactIds = contactIds.slice(0, 1);
      }
    }

    await processCampaignWithQueue(campaign, contactIds);

    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Erro ao iniciar campanha:', { error });
    throw error;
  }
}));

// Pausar campanha (requer autenticação)
app.post('/api/campaigns/:id/pause', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await dbRun(`
      UPDATE campaigns 
      SET status = 'paused', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    const updatedCampaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);

    // Criar notificação de campanha pausada
    const userId = (req as any).user?.userId;
    await createNotification(
      userId,
      'warning',
      'Campanha pausada',
      `Campanha "${updatedCampaign.name}" foi pausada`
    );

    res.json({ success: true, data: updatedCampaign });
  } catch (error) {
    logger.error('Erro ao pausar campanha:', { error });
    throw error;
  }
}));

// Aplicar template à campanha (requer autenticação)
app.post('/api/campaigns/:id/apply-template', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { template_type, template_id, variables } = req.body;

    if (!template_type || !template_id) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de template e ID do template são obrigatórios'
      });
    }

    let templateData;
    let updateFields = [];
    let updateValues = [];

    if (template_type === 'sms') {
      // Buscar template SMS
      templateData = await dbGet('SELECT * FROM sms_templates WHERE id = ?', [template_id]);
      if (!templateData) {
        return res.status(404).json({
          success: false,
          error: 'Template SMS não encontrado'
        });
      }

      // Aplicar variáveis ao conteúdo
      let message = templateData.content;
      if (variables && typeof variables === 'object') {
        Object.entries(variables).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
      }

      updateFields.push('message = ?', 'sms_template_id = ?');
      updateValues.push(message, template_id);

    } else if (template_type === 'email') {
      // Buscar template Email
      templateData = await dbGet('SELECT * FROM email_templates WHERE id = ?', [template_id]);
      if (!templateData) {
        return res.status(404).json({
          success: false,
          error: 'Template de email não encontrado'
        });
      }

      // Aplicar variáveis ao conteúdo e assunto
      let subject = templateData.subject;
      let htmlContent = templateData.html_content;
      let textContent = templateData.text_content;

      if (variables && typeof variables === 'object') {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(value));
          htmlContent = htmlContent.replace(regex, String(value));
          textContent = textContent.replace(regex, String(value));
        });
      }

      updateFields.push('message = ?', 'email_subject = ?', 'email_template_id = ?');
      updateValues.push(textContent, subject, template_id);

    } else {
      return res.status(400).json({
        success: false,
        error: 'Tipo de template inválido. Use "sms" ou "email"'
      });
    }

    // Atualizar campanha
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await dbRun(`
      UPDATE campaigns 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    const updatedCampaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Template aplicado com sucesso',
      data: updatedCampaign
    });

  } catch (error) {
    logger.error('Erro ao aplicar template à campanha:', { error });
    throw error;
  }
}));

// Deletar campanha (requer autenticação)
app.delete('/api/campaigns/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a campanha existe
    const campaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Deletar campanha
    await dbRun('DELETE FROM campaigns WHERE id = ?', [id]);

    res.json({ success: true, message: 'Campanha deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar campanha:', { error });
    throw error;
  }
}));

// ===== ROTAS DE CONTATOS =====

// Listar contatos (requer autenticação)
app.get('/api/contacts', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { search, tag, status, blocked } = req.query;
    let query = `
      SELECT 
        id,
        name,
        phone,
        email,
        segment as tags,
        '' as custom_fields,
        is_active,
        is_blocked,
        CASE 
          WHEN is_active = true OR is_active IS NULL THEN 'active'
          ELSE 'canceled'
        END as status,
        created_at,
        updated_at
      FROM contacts
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (tag) {
      query += ` AND segment = ?`;
      params.push(tag);
    }

    if (status) {
      query += ` AND is_active = ?`;
      params.push(status === 'active' ? true : false);
    }

    // Filtrar bloqueados (por padrão não mostra bloqueados)
    if (blocked === 'true') {
      query += ` AND is_blocked = true`;
    } else if (blocked !== 'all') {
      query += ` AND (is_blocked = false OR is_blocked IS NULL)`;
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const contacts = await dbAll(query, params);
    res.json(contacts);
  } catch (error) {
    logger.error('Erro ao buscar contatos:', { error });
    throw error;
  }
}));

// Bloquear/Desbloquear contato (requer autenticação)
app.patch('/api/contacts/:id/block', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    await dbRun(`
      UPDATE contacts 
      SET is_blocked = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [blocked ? true : false, id]);

    const updatedContact = await dbGet('SELECT * FROM contacts WHERE id = ?', [id]);
    res.json(updatedContact);
  } catch (error) {
    logger.error('Erro ao bloquear/desbloquear contato:', { error });
    throw error;
  }
}));

// Exportar contatos (requer autenticação)
app.get('/api/contacts/export', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { format = 'excel' } = req.query;

    const contacts = await dbAll(`
      SELECT 
        name,
        phone,
        email,
        segment as tags,
        is_active,
        is_blocked,
        created_at
      FROM contacts
      WHERE (is_blocked = false OR is_blocked IS NULL)
      ORDER BY created_at DESC
    `);

    if (format === 'excel' || format === 'xlsx') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(contacts);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatos');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=contatos_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } else {
      // CSV
      const worksheet = XLSX.utils.json_to_sheet(contacts);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=contatos_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    }
  } catch (error) {
    logger.error('Erro ao exportar contatos:', { error });
    throw error;
  }
}));

// Importar contatos (requer autenticação)
app.post('/api/contacts/import', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const row of data) {
      try {
        // Mapear colunas flexivelmente
        const name = row['Nome'] || row['nome'] || row['Name'] || row['name'] || row['Contact Name'] || '';
        let phone = row['Telefone'] || row['telefone'] || row['Phone'] || row['phone'] || row['Whatsapp'] || row['whatsapp'] || row['Mobile'] || '';
        const email = row['Email'] || row['email'] || row['E-mail'] || '';
        // Usar coluna do Excel ou o fallback do corpo da requisição (tag global)
        const segment = row['Segmento'] || row['segmento'] || row['Segment'] || row['segment'] || row['Tags'] || row['tags'] || req.body.tag || '';

        if (!phone) {
          errorCount++;
          errors.push({ row, error: 'Telefone não encontrado' });
          continue;
        }

        // Normalizar telefone
        // Remover tudo que não é dígito
        phone = String(phone).replace(/\D/g, '');

        // Adicionar DDI 55 se não tiver (assumindo Brasil se tiver 10 ou 11 dígitos)
        if (phone.length === 10 || phone.length === 11) {
          phone = '55' + phone;
        }

        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
          errorCount++;
          errors.push({ row, error: phoneValidation.error });
          continue;
        }

        const normalizedPhone = normalizePhone(phone);

        // Verificar se já existe
        const existing = await dbGet('SELECT id FROM contacts WHERE phone = ?', [normalizedPhone]);

        if (existing) {
          // Atualizar
          await dbRun(`
            UPDATE contacts 
            SET name = COALESCE(?, name), 
                email = COALESCE(?, email), 
                segment = COALESCE(?, segment),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [name || null, email || null, segment || null, existing.id]);
          updatedCount++;
        } else {
          // Inserir
          await dbRun(`
            INSERT INTO contacts (name, phone, email, segment, is_active, is_blocked)
            VALUES (?, ?, ?, ?, true, false)
          `, [name || 'Sem Nome', normalizedPhone, email || null, segment || null]);
          importedCount++;
        }

      } catch (err: any) {
        errorCount++;
        errors.push({ row, error: err.message });
      }
    }

    // Remover arquivo temporário
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Importação concluída',
      imported: importedCount,
      updated: updatedCount,
      failed: errorCount,
      errors: errors.slice(0, 20) // Limitar erros no retorno
    });

  } catch (error) {
    logger.error('Erro na importação de contatos:', { error });
    // Tentar remover arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
}));

// Adicionar contato (requer autenticação)
app.post('/api/contacts', authenticateToken, validate(schemas.createContact), asyncHandler(async (req, res) => {
  try {
    const { name, phone, email, tags, segment, custom_fields } = req.body;

    // Validar telefone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: phoneValidation.error || 'Telefone inválido'
      });
    }

    // Normalizar telefone
    const normalizedPhone = normalizePhone(phone);

    // Verificar se já existe
    const existing = await dbGet('SELECT id FROM contacts WHERE phone = ?', [normalizedPhone]);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Contato com este telefone já existe'
      });
    }

    // Usar segment se fornecido, senão usar tags (retrocompatibilidade)
    const contactSegment = segment || tags || '';

    const result = await dbRun(`
      INSERT INTO contacts (name, phone, email, segment, is_active, is_blocked)
      VALUES (?, ?, ?, ?, true, false)
    `, [name, normalizedPhone, email || null, contactSegment]);

    const newContact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    res.json(newContact);
  } catch (error) {
    logger.error('Erro ao criar contato:', { error });
    throw error;
  }
}));

// Atualizar contato (requer autenticação)
app.put('/api/contacts/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, tags, segment } = req.body;

    // Verificar se contato existe
    const existing = await dbGet('SELECT * FROM contacts WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Contato não encontrado'
      });
    }

    // Se phone foi fornecido, validar e normalizar
    let normalizedPhone = existing.phone;
    if (phone && phone !== existing.phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: phoneValidation.error || 'Telefone inválido'
        });
      }
      normalizedPhone = normalizePhone(phone);

      // Verificar se novo telefone já existe em outro contato
      const phoneExists = await dbGet('SELECT id FROM contacts WHERE phone = ? AND id != ?', [normalizedPhone, id]);
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          error: 'Já existe outro contato com este telefone'
        });
      }
    }

    // Usar segment se fornecido, senão usar tags (retrocompatibilidade)
    const contactSegment = segment !== undefined ? segment : (tags !== undefined ? tags : existing.segment);

    logger.info('PUT /api/contacts/:id - Dados recebidos:', {
      id,
      body: req.body,
      existing_segment: existing.segment,
      new_segment: contactSegment
    });

    await dbRun(`
      UPDATE contacts 
      SET name = ?, phone = ?, email = ?, segment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name !== undefined ? name : existing.name,
      normalizedPhone,
      email !== undefined ? email : existing.email,
      contactSegment,
      id
    ]);

    const updatedContact = await dbGet('SELECT * FROM contacts WHERE id = ?', [id]);
    logger.info('PUT /api/contacts/:id - Contato atualizado:', updatedContact);
    res.json(updatedContact);
  } catch (error) {
    logger.error('Erro ao atualizar contato:', { error });
    throw error;
  }
}));

app.delete('/api/contacts/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params as any;
    await dbRun('DELETE FROM messages WHERE contact_id = ?', [id]);
    const result = await dbRun('DELETE FROM contacts WHERE id = ?', [id]);
    res.json({ success: true, deleted: result?.changes || 0 });
  } catch (error) {
    logger.error('Erro ao excluir contato:', { error });
    throw error;
  }
}));

// ===== ROTAS DE SEGMENTOS =====

// Listar segmentos (requer autenticação)
app.get('/api/segments', authenticateToken, asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/segments - Buscando segmentos');
    // Buscar segmentos únicos dos contatos
    const segments = await dbAll(`
      SELECT DISTINCT 
        segment as name,
        segment as id,
        COUNT(*) as contact_count
      FROM contacts
      WHERE segment IS NOT NULL AND segment != ''
      GROUP BY segment
      ORDER BY contact_count DESC, segment ASC
    `);

    logger.info(`GET /api/segments - Retornando ${segments.length} segmentos`);
    res.json(segments);
  } catch (error: any) {
    logger.error('Erro ao buscar segmentos:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar segmentos',
      message: error.message
    });
  }
}));

// Criar segmento (requer autenticação)
app.post('/api/segments', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nome do segmento é obrigatório'
      });
    }

    // Verificar se já existe
    const existing = await dbGet('SELECT COUNT(*) as count FROM contacts WHERE segment = ?', [name.trim()]);

    res.json({
      id: name.trim(),
      name: name.trim(),
      contact_count: existing?.count || 0
    });
  } catch (error) {
    logger.error('Erro ao criar segmento:', { error });
    throw error;
  }
}));

// Obter contatos de um segmento (requer autenticação)
app.get('/api/segments/:id/contacts', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const contacts = await dbAll(`
      SELECT 
        id,
        name,
        phone,
        email,
        segment as tags,
        is_active,
        is_blocked,
        created_at
      FROM contacts
      WHERE segment = ? AND (is_blocked = false OR is_blocked IS NULL)
      ORDER BY created_at DESC
    `, [id]);

    res.json(contacts);
  } catch (error) {
    logger.error('Erro ao buscar contatos do segmento:', { error });
    throw error;
  }
}));

// ===== ROTAS DE UPLOAD DE MÍDIA =====

// Upload de imagem para campanhas (requer autenticação)
app.post('/api/upload/image', authenticateToken, uploadImage.single('image'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem enviada'
      });
    }

    const imageUrl = buildAbsoluteUrl(`/api/uploads/${req.file.filename}`, req as Request);

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error: any) {
    logger.error('Erro ao fazer upload de imagem:', { error });
    if (error.message) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}));

// Upload de vídeo para campanhas (requer autenticação)
app.post('/api/upload/video', authenticateToken, uploadVideo.single('video'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum vídeo enviado'
      });
    }

    const videoUrl = buildAbsoluteUrl(`/api/uploads/${req.file.filename}`, req as Request);

    res.json({
      success: true,
      url: videoUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error: any) {
    logger.error('Erro ao fazer upload de vídeo:', { error });
    if (error.message) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}));



// ===== ROTAS DE IMPORTAÇÃO EXCEL =====

// Upload e processamento de Excel (requer autenticação)
app.post('/api/import/excel', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Processar dados
    let processed = 0;
    let errors = 0;
    const errorLog: string[] = [];

    const normalizeKey = (k: string) => String(k || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_+]/g, '');
    const pickFlexible = (rowObj: any, keys: string[]): string => {
      const targets = keys.map(normalizeKey);
      for (const rk of Object.keys(rowObj || {})) {
        const nk = normalizeKey(rk);
        if (targets.includes(nk)) {
          const v = rowObj[rk];
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
      }
      for (const k of keys) {
        const v = rowObj[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };

    const nameKeys = ['Nome', 'name', 'Name', 'nome', 'contact_name', 'Cliente', 'cliente', 'Contato', 'contato', 'Nome Completo', 'nomecompleto'];
    const phoneKeys = ['Telefone', 'phone', 'Phone', 'Celular', 'celular', 'WhatsApp', 'whatsapp', 'Fone', 'fone', 'Telefone com DDD', 'telefone_com_ddd', 'ddd+telefone', 'DDD+Telefone', 'DDD+TELEFONE', 'Numero', 'Número', 'numero', 'número', 'DDD+Numero', 'DDD+Número', 'whatsappcomddd', 'WhatsApp com DDD'];

    const tagRaw = (req.query.tag as string) || (req.body?.tag as string) || '';
    const tag = tagRaw ? String(tagRaw).trim().toLowerCase() : '';

    for (let idx = 0; idx < data.length; idx++) {
      const row: any = data[idx];
      try {
        const nameRaw = pickFlexible(row, nameKeys);
        const nameClean = (nameRaw || '').replace(/[0-9]/g, '').replace(/\s{2,}/g, ' ').trim();
        const rawPhone = pickFlexible(row, phoneKeys);
        const email = pickFlexible(row, ['Email', 'email', 'E-mail', 'e-mail', 'mail']);
        if (!rawPhone) {
          errors++;
          errorLog.push(`Registro ${idx + 1}: Telefone não encontrado`);
          continue;
        }
        const normalizedPhone = normalizePhone(rawPhone);
        const phoneValidation = validatePhone(normalizedPhone);
        if (!phoneValidation.isValid) {
          errors++;
          errorLog.push(`Registro ${idx + 1}: Telefone inválido (${rawPhone})`);
          continue;
        }
        const finalName = nameClean && nameClean.length > 0 ? nameClean : `Contato ${normalizedPhone}`;
        const existing = await dbGet('SELECT id, segment FROM contacts WHERE phone = ?', [normalizedPhone]);
        if (!existing) {
          await dbRun(`
            INSERT INTO contacts (name, phone, email, segment, is_active)
            VALUES (?, ?, ?, ?, true)
          `, [finalName, normalizedPhone, email || null, tag || null]);
        } else if (tag && (!existing.segment || String(existing.segment).trim() === '')) {
          await dbRun('UPDATE contacts SET segment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [tag, existing.id]);
        }
        processed++;
      } catch (error) {
        errors++;
        errorLog.push(`Registro ${idx + 1}: Erro inesperado`);
      }
    }

    // Limpar arquivo temporário
    fs.unlinkSync(req.file.path);

    res.json({ processed, errors, errorLog: errorLog.slice(0, 10), total: data.length });

  } catch (error) {
    logger.error('Erro ao processar Excel:', { error });
    throw error;
  }
}));

// Importar contatos lendo um arquivo já existente em /public (requer autenticação)
app.post('/api/import/public', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { filename, nameCol, phoneCol, sheetIndex, sheetName, tag } = req.body as any;
    if (!filename || String(filename).trim() === '') {
      return res.status(400).json({ error: 'Informe o nome do arquivo em public (ex: contatos.xlsx)' });
    }

    const candidates = [
      path.resolve(process.cwd(), 'public', filename),
      path.resolve(__dirname, '../public', filename),
      path.resolve(__dirname, '../../public', filename)
    ];
    let fullPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) { fullPath = p; break; }
    }
    if (!fullPath) {
      return res.status(404).json({ error: `Arquivo não encontrado em public: ${filename}` });
    }

    const workbook = XLSX.readFile(fullPath);
    let targetSheetName: string | null = null;
    if (typeof sheetIndex === 'number' && workbook.SheetNames[sheetIndex]) {
      targetSheetName = workbook.SheetNames[sheetIndex];
    } else if (sheetName && workbook.SheetNames.includes(sheetName)) {
      targetSheetName = sheetName;
    } else {
      let bestScore = -1;
      for (const sn of workbook.SheetNames) {
        const ws = workbook.Sheets[sn];
        const testRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const cols = Math.max(...testRows.map((r: any[]) => r.length), 0);
        let score = 0;
        const sample = Math.min(testRows.length, 50);
        for (let i = 1; i < sample; i++) {
          const r: any[] = testRows[i] as any[];
          for (let c = 0; c < cols; c++) {
            const v = String(r[c] ?? '').trim();
            const d = v.replace(/\D/g, '');
            if (d.length >= 8 && d.length <= 13) score++;
          }
        }
        if (score > bestScore) { bestScore = score; targetSheetName = sn; }
      }
      if (!targetSheetName) targetSheetName = workbook.SheetNames[0];
    }
    const worksheet = workbook.Sheets[targetSheetName as string];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    let processed = 0;
    let errors = 0;
    const errorLog: string[] = [];

    const normalizeKey = (k: string) => String(k || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_+]/g, '');
    const pickFlexible = (rowObj: any, keys: string[]): string => {
      const targets = keys.map(normalizeKey);
      for (const rk of Object.keys(rowObj || {})) {
        const nk = normalizeKey(rk);
        if (targets.includes(nk)) {
          const v = rowObj[rk];
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
      }
      for (const k of keys) {
        const v = rowObj[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };

    const rowsCount = Array.isArray(rows) ? rows.length : 0;
    if (rowsCount === 0) {
      return res.json({ processed: 0, errors: 0, errorLog: [], total: 0 });
    }

    const cols = Math.max(...rows.map((r: any[]) => r.length));
    const scorePhone: number[] = Array.from({ length: cols }, () => 0);
    const scoreName: number[] = Array.from({ length: cols }, () => 0);
    const sampleLimit = rowsCount;
    for (let i = 0; i < sampleLimit; i++) {
      const r: any[] = rows[i] as any[];
      for (let c = 0; c < cols; c++) {
        const v = String(r[c] ?? '').trim();
        if (!v) continue;
        const digits = v.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 13) scorePhone[c] += 1;
        const hasLetters = /[A-Za-zÀ-ÿ]/.test(v);
        const hasManyDigits = digits.length > 4;
        if (hasLetters && !hasManyDigits) scoreName[c] += 1;
      }
    }
    let pCol = typeof phoneCol === 'number' ? Math.max(0, Number(phoneCol) - 1) : scorePhone.indexOf(Math.max(...scorePhone));
    let nCol = typeof nameCol === 'number' ? Math.max(0, Number(nameCol) - 1) : scoreName.indexOf(Math.max(...scoreName));
    if (!Number.isInteger(nCol) || scoreName[nCol] === 0) nCol = Math.max(0, pCol - 1);

    // Tag derivada
    const deriveTag = () => {
      if (tag && String(tag).trim()) return String(tag).trim().toLowerCase();
      const fname = filename.toLowerCase();
      if (fname.includes('analise') || fname.includes('análise') || fname.includes('tendencia') || fname.includes('tendência')) return 'analises-tendencias';
      if (fname.includes('lista') && fname.includes('transmissao')) return 'preco';
      if (fname.includes('preco') || fname.includes('preço')) return 'preco';
      return '';
    };
    const defaultTag = deriveTag();

    for (let idx = 1; idx < rowsCount; idx++) {
      const r: any[] = rows[idx] as any[];
      try {
        let rawPhone = String(r[pCol] ?? '').trim();
        if (!rawPhone) {
          rawPhone = '';
          for (let c = 0; c < cols; c++) {
            const v = String(r[c] ?? '').trim();
            const d = v.replace(/\D/g, '');
            if (d.length >= 10 && d.length <= 13) { rawPhone = v; break; }
          }
        }
        if (!rawPhone) {
          errors++;
          errorLog.push(`Registro ${idx}: Telefone não encontrado`);
          continue;
        }
        const normalizedPhone = normalizePhone(rawPhone);
        const phoneValidation = validatePhone(normalizedPhone);
        if (!phoneValidation.isValid) {
          errors++;
          errorLog.push(`Registro ${idx}: Telefone inválido (${rawPhone})`);
          continue;
        }
        const nameRaw = String(r[nCol] ?? '').trim();
        const nameClean = nameRaw.replace(/[0-9]/g, '').replace(/\s{2,}/g, ' ').trim();
        const finalName = nameClean && nameClean.length > 0 ? nameClean : `Contato ${normalizedPhone}`;
        const existing = await dbGet('SELECT id, segment FROM contacts WHERE phone = ?', [normalizedPhone]);
        if (!existing) {
          await dbRun(`
            INSERT INTO contacts (name, phone, email, segment, is_active)
            VALUES (?, ?, ?, ?, 1)
          `, [finalName, normalizedPhone, null, defaultTag || null]);
        } else if (defaultTag && (!existing.segment || String(existing.segment).trim() === '')) {
          await dbRun('UPDATE contacts SET segment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [defaultTag, existing.id]);
        }
        processed++;
      } catch {
        errors++;
        errorLog.push(`Registro ${idx}: Erro inesperado`);
      }
    }

    res.json({ processed, errors, errorLog: errorLog.slice(0, 10), total: Math.max(rowsCount - 1, 0) });
  } catch (error) {
    logger.error('Erro ao importar do public:', { error });
    res.status(500).json({ error: 'Erro ao importar dados do public' });
  }
}));

// Listar arquivos disponíveis em /public para importação
app.get('/api/import/public/list', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'public'),
      path.resolve(__dirname, '../public'),
      path.resolve(__dirname, '../../public')
    ];
    let dir: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) { dir = p; break; }
    }
    if (!dir) return res.json({ files: [] });
    const all = fs.readdirSync(dir);
    const files = all.filter(f => /\.(xlsx|xls|csv)$/i.test(f));
    res.json({ files });
  } catch (error) {
    logger.error('Erro ao listar arquivos de public:', { error });
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
}));

// ===== ROTAS DE TEMPLATES =====

// Listar templates (requer autenticação)
app.get('/api/templates', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT 
        id,
        name,
        content,
        variables,
        category,
        message_type,
        usage_count,
        is_active,
        created_at,
        updated_at
      FROM message_templates
      WHERE is_active = true
    `;

    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (name LIKE ? OR content LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY usage_count DESC, created_at DESC`;

    const templates = await dbAll(query, params);
    res.json(templates);
  } catch (error) {
    logger.error('Erro ao buscar templates:', { error });
    throw error;
  }
}));

// Criar template (requer autenticação)
app.post('/api/templates', authenticateToken, validate(schemas.createTemplate), asyncHandler(async (req, res) => {
  try {
    const { name, content, variables, category, message_type } = req.body;

    const result = await dbRun(`
      INSERT INTO message_templates (name, content, variables, category, message_type, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name,
      content,
      variables ? JSON.stringify(variables) : null,
      category || null,
      message_type || 'text',
      req.user?.userId || null
    ]);

    const newTemplate = await dbGet('SELECT * FROM message_templates WHERE id = ?', [result.lastID]);
    res.json(newTemplate);
  } catch (error) {
    logger.error('Erro ao criar template:', { error });
    throw error;
  }
}));

// Atualizar template (requer autenticação)
app.put('/api/templates/:id', authenticateToken, validate(schemas.updateTemplate), asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, variables, category, message_type } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (variables !== undefined) {
      updates.push('variables = ?');
      params.push(JSON.stringify(variables));
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (message_type !== undefined) {
      updates.push('message_type = ?');
      params.push(message_type);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await dbRun(`
      UPDATE message_templates 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Incrementar uso se conteúdo mudou
    if (content !== undefined) {
      await dbRun(`
        UPDATE message_templates 
        SET usage_count = usage_count + 1
        WHERE id = ?
      `, [id]);
    }

    const updatedTemplate = await dbGet('SELECT * FROM message_templates WHERE id = ?', [id]);
    res.json(updatedTemplate);
  } catch (error) {
    logger.error('Erro ao atualizar template:', { error });
    throw error;
  }
}));

// Deletar template (requer autenticação)
app.delete('/api/templates/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await dbRun(`
      UPDATE message_templates 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Template removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar template:', { error });
    throw error;
  }
}));

// Aplicar template com variáveis (requer autenticação)
app.post('/api/templates/:id/apply', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await dbGet('SELECT * FROM message_templates WHERE id = ? AND is_active = true', [id]);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    // Substituir variáveis no conteúdo
    let processedContent = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    });

    // Incrementar contador de uso
    await dbRun(`
      UPDATE message_templates 
      SET usage_count = usage_count + 1
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      content: processedContent,
      template: {
        id: template.id,
        name: template.name,
        message_type: template.message_type
      }
    });
  } catch (error) {
    logger.error('Erro ao aplicar template:', { error });
    throw error;
  }
}));

// ===== ROTAS DE SMS =====

// Listar configurações SMS (requer autenticação)
app.get('/api/sms/configs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const configs = await dbAll(`
      SELECT 
        id,
        provider,
        name,
        from_number,
        is_active,
        created_at,
        updated_at
      FROM sms_configs
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json(configs);
  } catch (error) {
    logger.error('Erro ao buscar configurações SMS:', { error });
    throw error;
  }
}));

// Criar configuração SMS (requer autenticação)
app.post('/api/sms/configs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { provider, name, apiToken, from, accountSid, authToken, fromNumber, region, accessKeyId, secretAccessKey } = req.body;

    let account_sid = null;
    let auth_token = null;
    let from_number = null;
    let api_token = null;
    let reg = null;
    let access_key = null;
    let secret_key = null;

    if (provider === 'zenvia') {
      api_token = apiToken;
      from_number = from;
    } else if (provider === 'twilio') {
      account_sid = accountSid;
      auth_token = authToken;
      from_number = fromNumber;
    } else if (provider === 'aws-sns') {
      reg = region;
      access_key = accessKeyId;
      secret_key = secretAccessKey;
    }

    const result = await dbRun(`
      INSERT INTO sms_configs (provider, name, account_sid, auth_token, from_number, api_token, region, access_key_id, secret_access_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [provider, name, account_sid, auth_token, from_number, api_token, reg, access_key, secret_key]);

    const newConfig = await dbGet('SELECT * FROM sms_configs WHERE id = ?', [result.lastID]);
    res.json(newConfig);
  } catch (error) {
    logger.error('Erro ao criar configuração SMS:', { error });
    throw error;
  }
}));

// Enviar SMS (requer autenticação)
app.post('/api/sms/send', authenticateToken, validate(schemas.sendSMS), asyncHandler(async (req, res) => {
  try {
    const { phone_number, message, sms_config_id, variables } = req.body;

    // Verificar se contato está descadastrado
    const unsubscribe = await dbGet(`
      SELECT * FROM unsubscribes 
      WHERE phone_number = ? AND (channel = 'sms' OR channel = 'all')
    `, [phone_number]);

    if (unsubscribe) {
      return res.status(400).json({
        success: false,
        error: 'Número descadastrado de SMS'
      });
    }

    // Buscar configuração SMS ativa
    const smsConfig = await dbGet(`
      SELECT * FROM sms_configs 
      WHERE id = ? AND is_active = true
    `, [sms_config_id || 1]);

    if (!smsConfig) {
      return res.status(400).json({
        success: false,
        error: 'Configuração SMS não encontrada'
      });
    }

    // Processar variáveis na mensagem
    let processedMessage = message;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processedMessage = processedMessage.replace(regex, String(value));
      });
    }

    // Criar serviço SMS
    const smsService = SMSServiceFactory.createService(smsConfig.provider, {
      apiToken: smsConfig.api_token,
      from: smsConfig.from_number,
      accountSid: smsConfig.account_sid,
      authToken: smsConfig.auth_token,
      region: smsConfig.region,
      accessKeyId: smsConfig.access_key_id,
      secretAccessKey: smsConfig.secret_access_key
    });

    // Normalizar telefone
    const normalizedPhone = normalizePhone(phone_number);

    // Buscar ou criar contato
    let contact = await dbGet('SELECT * FROM contacts WHERE phone = ?', [normalizedPhone]);
    if (!contact) {
      const result = await dbRun('INSERT INTO contacts (name, phone, is_blocked) VALUES (?, ?, 0)', [phone_number, normalizedPhone]);
      contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    }

    // Verificar se está bloqueado
    if (contact.is_blocked) {
      return res.status(400).json({
        success: false,
        error: 'Contato bloqueado'
      });
    }

    // Enviar SMS
    const smsResult = await smsService.sendSMS(normalizedPhone, processedMessage);

    // Salvar no histórico
    const messageResult = await dbRun(`
      INSERT INTO sms_messages (contact_id, sms_config_id, phone_number, message, provider, provider_message_id, status, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contact.id,
      smsConfig.id,
      normalizedPhone,
      processedMessage,
      smsConfig.provider,
      smsResult.messageId || null,
      smsResult.success ? 'sent' : 'failed',
      smsResult.cost || 0
    ]);

    if (!smsResult.success) {
      await dbRun(`
        UPDATE sms_messages 
        SET error_message = ?
        WHERE id = ?
      `, [smsResult.error, messageResult.lastID]);
    }

    res.json({
      success: smsResult.success,
      message_id: messageResult.lastID,
      provider_message_id: smsResult.messageId,
      status: smsResult.status || 'sent',
      error: smsResult.error
    });
  } catch (error) {
    logger.error('Erro ao enviar SMS:', { error });
    throw error;
  }
}));

// Preview de SMS (requer autenticação)
app.post('/api/sms/preview', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { message, variables = {} } = req.body;

    let preview = message;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      preview = preview.replace(regex, String(value));
    });

    // Calcular caracteres e estimativa de custo
    const characterCount = preview.length;
    const smsCount = Math.ceil(characterCount / 160); // SMS padrão tem 160 caracteres

    res.json({
      preview,
      character_count: characterCount,
      sms_count: smsCount,
      estimated_cost: smsCount * 0.05 // Estimativa (ajustar conforme provedor)
    });
  } catch (error) {
    logger.error('Erro ao gerar preview SMS:', { error });
    throw error;
  }
}));

// Histórico SMS (requer autenticação)
app.get('/api/sms/history', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { contact_id, limit = 50 } = req.query;

    let query = `
      SELECT 
        sm.id,
        sm.phone_number,
        sm.message,
        sm.provider,
        sm.status,
        sm.cost,
        sm.sent_at,
        sm.delivered_at,
        c.name as contact_name,
        sc.name as config_name
      FROM sms_messages sm
      LEFT JOIN contacts c ON sm.contact_id = c.id
      LEFT JOIN sms_configs sc ON sm.sms_config_id = sc.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (contact_id) {
      query += ` AND sm.contact_id = ?`;
      params.push(contact_id);
    }

    query += ` ORDER BY sm.created_at DESC LIMIT ?`;
    params.push(parseInt(limit as string));

    const messages = await dbAll(query, params);
    res.json(messages);
  } catch (error) {
    logger.error('Erro ao buscar histórico SMS:', { error });
    throw error;
  }
}));

// ===== ROTAS DE TEMPLATES SMS =====

// Listar templates SMS (requer autenticação)
app.get('/api/sms/templates', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const templates = await dbAll(`
      SELECT 
        id,
        name,
        content,
        variables,
        category,
        is_active,
        created_at,
        updated_at
      FROM sms_templates
      WHERE 1=1
      ORDER BY created_at DESC
    `);

    // Parse variables JSON
    const parsedTemplates = templates.map(template => ({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : []
    }));

    res.json(parsedTemplates);
  } catch (error) {
    logger.error('Erro ao buscar templates SMS:', { error });
    throw error;
  }
}));

// Criar template SMS (requer autenticação)
app.post('/api/sms/templates', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { name, content, variables, category, is_active } = req.body;

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: 'Nome e conteúdo do template são obrigatórios'
      });
    }

    const result = await dbRun(`
      INSERT INTO sms_templates (name, content, variables, category, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [
      name.trim(),
      content.trim(),
      JSON.stringify(variables || []),
      category || 'marketing',
      is_active !== false ? true : false
    ]);

    const newTemplate = await dbGet(`
      SELECT * FROM sms_templates WHERE id = ?
    `, [result.lastID]);

    res.json({
      success: true,
      message: 'Template criado com sucesso',
      data: {
        ...newTemplate,
        variables: newTemplate.variables ? JSON.parse(newTemplate.variables) : []
      }
    });
  } catch (error) {
    logger.error('Erro ao criar template SMS:', { error });
    throw error;
  }
}));

// Atualizar template SMS (requer autenticação)
app.put('/api/sms/templates/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, variables, category, is_active } = req.body;

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: 'Nome e conteúdo do template são obrigatórios'
      });
    }

    await dbRun(`
      UPDATE sms_templates 
      SET name = ?, content = ?, variables = ?, category = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name.trim(),
      content.trim(),
      JSON.stringify(variables || []),
      category || 'marketing',
      is_active !== false ? true : false,
      id
    ]);

    const updatedTemplate = await dbGet(`
      SELECT * FROM sms_templates WHERE id = ?
    `, [id]);

    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Template atualizado com sucesso',
      data: {
        ...updatedTemplate,
        variables: updatedTemplate.variables ? JSON.parse(updatedTemplate.variables) : []
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar template SMS:', { error });
    throw error;
  }
}));

// Deletar template SMS (requer autenticação)
app.delete('/api/sms/templates/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbRun('DELETE FROM sms_templates WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Template deletado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar template SMS:', { error });
    throw error;
  }
}));

// ===== ROTAS DE EMAIL =====

// Listar configurações Email (requer autenticação)
app.get('/api/email/configs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const configs = await dbAll(`
      SELECT 
        id,
        provider,
        name,
        from_email,
        is_active,
        created_at,
        updated_at
      FROM email_configs
      WHERE is_active = true
      ORDER BY created_at DESC
    `);

    res.json(configs);
  } catch (error) {
    logger.error('Erro ao buscar configurações Email:', { error });
    throw error;
  }
}));

// Criar configuração Email (requer autenticação)
app.post('/api/email/configs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { provider, name, host, port, secure, user, password, from_email, api_key, region, access_key_id, secret_access_key } = req.body;

    const result = await dbRun(`
      INSERT INTO email_configs (provider, name, host, port, secure, user, password, from_email, api_key, region, access_key_id, secret_access_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [provider, name, host, port, secure ? 1 : 0, user, password, from_email, api_key, region, access_key_id, secret_access_key]);

    const newConfig = await dbGet('SELECT * FROM email_configs WHERE id = ?', [result.lastID]);
    res.json(newConfig);
  } catch (error) {
    logger.error('Erro ao criar configuração Email:', { error });
    throw error;
  }
}));

// Enviar Email (requer autenticação)
app.post('/api/email/send', authenticateToken, validate(schemas.sendEmail), asyncHandler(async (req, res) => {
  try {
    const { email_address, subject, content, email_config_id, variables, html } = req.body;

    // Verificar se email está descadastrado
    const unsubscribe = await dbGet(`
      SELECT * FROM unsubscribes 
      WHERE email_address = ? AND (channel = 'email' OR channel = 'all')
    `, [email_address]);

    if (unsubscribe) {
      return res.status(400).json({
        success: false,
        error: 'Email descadastrado'
      });
    }

    // Verificar se está em quarentena
    const quarantine = await dbGet(`
      SELECT * FROM email_messages 
      WHERE email_address = ? 
        AND is_in_quarantine = 1 
        AND (quarantine_until IS NULL OR quarantine_until > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
      LIMIT 1
    `, [email_address]);

    if (quarantine) {
      return res.status(400).json({
        success: false,
        error: 'Email em quarentena',
        reason: quarantine.quarantine_reason,
        until: quarantine.quarantine_until
      });
    }

    // Buscar configuração Email ativa
    const emailConfig = await dbGet(`
      SELECT * FROM email_configs 
      WHERE id = ? AND is_active = true
    `, [email_config_id || 1]);

    if (!emailConfig) {
      return res.status(400).json({
        success: false,
        error: 'Configuração Email não encontrada'
      });
    }

    // Processar variáveis no conteúdo
    let processedContent = content;
    let processedSubject = subject;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processedContent = processedContent.replace(regex, String(value));
        processedSubject = processedSubject.replace(regex, String(value));
      });
    }

    // Criar serviço Email
    const emailService = EmailServiceFactory.createService(emailConfig.provider, {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure === 1,
      user: emailConfig.user,
      pass: emailConfig.password,
      from: emailConfig.from_email,
      apiKey: emailConfig.api_key,
      region: emailConfig.region,
      accessKeyId: emailConfig.access_key_id,
      secretAccessKey: emailConfig.secret_access_key
    });

    // Buscar ou criar contato
    let contact = await dbGet('SELECT * FROM contacts WHERE email = ?', [email_address]);
    if (!contact) {
      const result = await dbRun('INSERT INTO contacts (name, email, is_blocked) VALUES (?, ?, 0)', [email_address, email_address]);
      contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    }

    // Verificar se está bloqueado
    if (contact.is_blocked) {
      return res.status(400).json({
        success: false,
        error: 'Contato bloqueado'
      });
    }

    // Enviar Email
    const emailResult = await emailService.sendEmail(
      email_address,
      processedSubject,
      processedContent,
      { html: html !== false }
    );

    // Salvar no histórico
    const messageResult = await dbRun(`
      INSERT INTO email_messages (contact_id, email_config_id, email_address, subject, content, provider, provider_message_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contact.id,
      emailConfig.id,
      email_address,
      processedSubject,
      processedContent,
      emailConfig.provider,
      emailResult.messageId || null,
      emailResult.success ? 'sent' : 'failed'
    ]);

    if (!emailResult.success) {
      await dbRun(`
        UPDATE email_messages 
        SET error_message = ?
        WHERE id = ?
      `, [emailResult.error, messageResult.lastID]);

      // Se for bounce, colocar em quarentena
      if (emailResult.error?.toLowerCase().includes('bounce') ||
        emailResult.error?.toLowerCase().includes('invalid')) {
        await dbRun(`
          UPDATE email_messages 
          SET is_in_quarantine = 1,
              quarantine_reason = ?,
              quarantine_until = datetime('now', '+7 days'),
              bounce_type = 'hard'
          WHERE id = ?
        `, [emailResult.error, messageResult.lastID]);
      }
    }

    res.json({
      success: emailResult.success,
      message_id: messageResult.lastID,
      provider_message_id: emailResult.messageId,
      accepted: emailResult.accepted,
      rejected: emailResult.rejected
    });
  } catch (error) {
    logger.error('Erro ao enviar Email:', { error });
    throw error;
  }
}));

// Templates de Email (requer autenticação)
app.get('/api/email/templates', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT 
        id,
        name,
        subject,
        html_content,
        text_content,
        variables,
        category,
        usage_count,
        is_active,
        created_at,
        updated_at
      FROM email_templates
      WHERE is_active = true
    `;

    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (name LIKE ? OR subject LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY usage_count DESC, created_at DESC`;

    const templates = await dbAll(query, params);
    res.json(templates);
  } catch (error) {
    logger.error('Erro ao buscar templates de email:', { error });
    throw error;
  }
}));

// Criar template de Email (requer autenticação)
app.post('/api/email/templates', authenticateToken, validate(schemas.createEmailTemplate), asyncHandler(async (req, res) => {
  try {
    const { name, subject, html_content, text_content, variables, category } = req.body;

    const result = await dbRun(`
      INSERT INTO email_templates (name, subject, html_content, text_content, variables, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name,
      subject,
      html_content || null,
      text_content || null,
      variables ? JSON.stringify(variables) : null,
      category || null
    ]);

    const newTemplate = await dbGet('SELECT * FROM email_templates WHERE id = ?', [result.lastID]);
    res.json(newTemplate);
  } catch (error) {
    logger.error('Erro ao criar template de email:', { error });
    throw error;
  }
}));

// Aplicar template de Email (requer autenticação)
app.post('/api/email/templates/:id/apply', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await dbGet('SELECT * FROM email_templates WHERE id = ? AND is_active = true', [id]);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    // Processar variáveis
    let processedSubject = template.subject;
    let processedHtml = template.html_content || '';
    let processedText = template.text_content || '';

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedSubject = processedSubject.replace(regex, String(value));
      processedHtml = processedHtml.replace(regex, String(value));
      processedText = processedText.replace(regex, String(value));
    });

    // Incrementar uso
    await dbRun(`
      UPDATE email_templates 
      SET usage_count = usage_count + 1
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      subject: processedSubject,
      html_content: processedHtml,
      text_content: processedText,
      template: {
        id: template.id,
        name: template.name
      }
    });
  } catch (error) {
    logger.error('Erro ao aplicar template de email:', { error });
    throw error;
  }
}));

// Preview de Email (requer autenticação)
app.post('/api/email/preview', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { subject, content, variables = {}, html = true } = req.body;

    let processedSubject = subject;
    let processedContent = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedSubject = processedSubject.replace(regex, String(value));
      processedContent = processedContent.replace(regex, String(value));
    });

    res.json({
      subject: processedSubject,
      content: processedContent,
      html: html,
      character_count: processedContent.length
    });
  } catch (error) {
    logger.error('Erro ao gerar preview de email:', { error });
    throw error;
  }
}));

// Histórico Email (requer autenticação)
app.get('/api/email/history', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { contact_id, limit = 50 } = req.query;

    let query = `
      SELECT 
        em.id,
        em.email_address,
        em.subject,
        em.provider,
        em.status,
        em.sent_at,
        em.delivered_at,
        em.opened_at,
        em.is_in_quarantine,
        em.quarantine_reason,
        c.name as contact_name,
        ec.name as config_name
      FROM email_messages em
      LEFT JOIN contacts c ON em.contact_id = c.id
      LEFT JOIN email_configs ec ON em.email_config_id = ec.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (contact_id) {
      query += ` AND em.contact_id = ?`;
      params.push(contact_id);
    }

    query += ` ORDER BY em.created_at DESC LIMIT ?`;
    params.push(parseInt(limit as string));

    const messages = await dbAll(query, params);
    res.json(messages);
  } catch (error) {
    logger.error('Erro ao buscar histórico Email:', { error });
    throw error;
  }
}));

// Descadastro (público - não requer autenticação)
app.post('/api/unsubscribe', validate(schemas.unsubscribe), asyncHandler(async (req, res) => {
  try {
    const { email, phone, channel, reason, custom_message } = req.body;

    // Buscar contato
    let contact = null;
    if (email) {
      contact = await dbGet('SELECT * FROM contacts WHERE email = ?', [email]);
    } else if (phone) {
      const normalizedPhone = normalizePhone(phone);
      contact = await dbGet('SELECT * FROM contacts WHERE phone = ?', [normalizedPhone]);
    }

    // Criar registro de descadastro
    const result = await dbRun(`
      INSERT INTO unsubscribes (contact_id, channel, email_address, phone_number, reason, custom_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      contact?.id || null,
      channel,
      email || null,
      phone ? normalizePhone(phone) : null,
      reason || null,
      custom_message || null
    ]);

    // Marcar contato como bloqueado se for 'all'
    if (contact && channel === 'all') {
      await dbRun(`
        UPDATE contacts 
        SET is_blocked = true
        WHERE id = ?
      `, [contact.id]);
    }

    res.json({
      success: true,
      message: custom_message || 'Você foi descadastrado com sucesso. Não receberá mais mensagens deste canal.',
      unsubscribe_id: result.lastID
    });
  } catch (error) {
    logger.error('Erro ao processar descadastro:', { error });
    throw error;
  }
}));

// Listar descadastros (requer autenticação)
app.get('/api/unsubscribes', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { channel, limit = 100 } = req.query;

    let query = `
      SELECT 
        u.id,
        u.channel,
        u.email_address,
        u.phone_number,
        u.reason,
        u.custom_message,
        u.unsubscribed_at,
        c.name as contact_name
      FROM unsubscribes u
      LEFT JOIN contacts c ON u.contact_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (channel) {
      query += ` AND u.channel = ?`;
      params.push(channel);
    }

    query += ` ORDER BY u.unsubscribed_at DESC LIMIT ?`;
    params.push(parseInt(limit as string));

    const unsubscribes = await dbAll(query, params);
    res.json(unsubscribes);
  } catch (error) {
    logger.error('Erro ao buscar descadastros:', { error });
    throw error;
  }
}));

// Quarentena de emails (requer autenticação)
app.get('/api/email/quarantine', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const emails = await dbAll(`
      SELECT DISTINCT
        email_address,
        quarantine_reason,
        quarantine_until,
        MAX(created_at) as last_attempt
      FROM email_messages
      WHERE is_in_quarantine = 1
        AND (quarantine_until IS NULL OR quarantine_until > CURRENT_TIMESTAMP)
      GROUP BY email_address
      ORDER BY last_attempt DESC
    `);

    res.json(emails);
  } catch (error) {
    logger.error('Erro ao buscar emails em quarentena:', { error });
    throw error;
  }
}));

// Remover da quarentena (requer autenticação)
app.post('/api/email/quarantine/:email/remove', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;

    await dbRun(`
      UPDATE email_messages 
      SET is_in_quarantine = 0,
          quarantine_until = NULL,
          quarantine_reason = NULL
      WHERE email_address = ?
    `, [email]);

    res.json({
      success: true,
      message: 'Email removido da quarentena'
    });
  } catch (error) {
    logger.error('Erro ao remover email da quarentena:', { error });
    throw error;
  }
}));

// Verificar configurações anti-blacklist (requer autenticação)
app.get('/api/email/anti-blacklist/:config_id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { config_id } = req.params;

    const config = await dbGet(`
      SELECT * FROM email_anti_blacklist
      WHERE email_config_id = ?
    `, [config_id]);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }

    res.json(config);
  } catch (error) {
    logger.error('Erro ao buscar configuração anti-blacklist:', { error });
    throw error;
  }
}));

// Atualizar configurações anti-blacklist (requer autenticação)
app.put('/api/email/anti-blacklist/:config_id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { config_id } = req.params;
    const { spf_record, dkim_record, dmarc_record, domain_verification } = req.body;

    const existing = await dbGet(`
      SELECT * FROM email_anti_blacklist
      WHERE email_config_id = ?
    `, [config_id]);

    if (existing) {
      await dbRun(`
        UPDATE email_anti_blacklist 
        SET spf_record = ?,
            dkim_record = ?,
            dmarc_record = ?,
            domain_verification = ?,
            last_check = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE email_config_id = ?
      `, [spf_record, dkim_record, dmarc_record, domain_verification, config_id]);
    } else {
      await dbRun(`
        INSERT INTO email_anti_blacklist (email_config_id, spf_record, dkim_record, dmarc_record, domain_verification, last_check)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [config_id, spf_record, dkim_record, dmarc_record, domain_verification]);
    }

    const updated = await dbGet(`
      SELECT * FROM email_anti_blacklist
      WHERE email_config_id = ?
    `, [config_id]);

    res.json(updated);
  } catch (error) {
    logger.error('Erro ao atualizar configuração anti-blacklist:', { error });
    throw error;
  }
}));

// ===== ROTAS DE TTS =====

// Configurações TTS (requer autenticação)
app.get('/api/tts/configs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const configs = await dbAll(`
      SELECT * FROM tts_configs 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);

    res.json(configs);
  } catch (error) {
    logger.error('Erro ao buscar configurações TTS:', { error });
    throw error;
  }
}));

// Métricas TTS (requer autenticação)
app.get('/api/tts/metrics', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Buscar métricas reais da tabela tts_files
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_audio_generated,
        COALESCE(SUM(LENGTH(original_text)), 0) as total_characters,
        COALESCE(AVG(duration_seconds), 0) as average_duration,
        COUNT(CASE WHEN access_count > 1 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as cache_hit_rate
      FROM tts_files
    `);

    // Calcular custo estimado (aproximação: $0.00004 por caractere para ElevenLabs)
    const estimatedCost = (stats?.total_characters || 0) * 0.00004;

    res.json({
      total_audio_generated: stats?.total_audio_generated || 0,
      total_characters: stats?.total_characters || 0,
      estimated_cost: estimatedCost,
      cache_hit_rate: Math.round(stats?.cache_hit_rate || 0),
      average_duration: stats?.average_duration || 0
    });
  } catch (error) {
    logger.error('Erro ao buscar métricas TTS:', { error });
    // Retornar zeros em caso de erro
    res.json({
      total_audio_generated: 0,
      total_characters: 0,
      estimated_cost: 0,
      cache_hit_rate: 0,
      average_duration: 0
    });
  }
}));

// Arquivos TTS salvos (requer autenticação)
app.get('/api/tts/files', authenticateToken, asyncHandler(async (req, res) => {
  try {
    logger.info('GET /api/tts/files - Buscando arquivos TTS');
    // Verificar se a tabela existe, se não existir retornar array vazio
    let files: any[] = [];
    try {
      files = await dbAll(`
        SELECT 
          id,
          filename,
          original_text as texto_original,
          duration_seconds as duracao,
          size_kb || ' KB' as tamanho,
          access_count as acessos,
          created_at as criado_em,
          CASE 
            WHEN expires_at IS NULL THEN 30
            ELSE CAST((julianday(expires_at) - julianday('now')) AS INTEGER)
          END as expira_em_dias
        FROM tts_files 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
    } catch (error: any) {
      // Se a tabela não existir, retornar array vazio
      if (error.message && error.message.includes('no such table')) {
        logger.info('Tabela tts_files não existe ainda, retornando array vazio');
        files = [];
      } else {
        throw error;
      }
    }

    logger.info(`GET /api/tts/files - Retornando ${files.length} arquivos`);
    res.json({ files: files });
  } catch (error: any) {
    logger.error('Erro ao buscar arquivos TTS:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar arquivos TTS',
      message: error.message,
      files: []
    });
  }
}));

// Gerar áudio TTS (requer autenticação)
app.post('/api/tts/generate', authenticateToken, validate(schemas.generateTTS), asyncHandler(async (req, res) => {
  try {
    const { text, provider, voice, options = {} } = req.body;

    if (!text || !provider || !voice) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: text, provider, voice'
      });
    }

    // Criar serviço TTS
    const ttsService = TTSServiceFactory.createService(provider);

    // Gerar áudio
    const audioBuffer = await ttsService.generateAudio(text, voice, options);

    // Gerar nome do arquivo
    const filename = generateAudioFilename(text, provider, voice);

    // Salvar arquivo
    const filePath = saveAudioFile(audioBuffer, filename);

    // Calcular estatísticas
    const duration = Math.ceil(text.length / 15); // Estimativa: 15 caracteres por segundo
    const sizeKB = Math.ceil(audioBuffer.length / 1024);

    // Salvar informações no banco de dados
    const result = await dbRun(`
      INSERT INTO tts_files (filename, original_text, provider, voice_id, duration_seconds, size_kb, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [filename, text, provider, voice, duration, sizeKB]);

    res.json({
      success: true,
      filename: filename,
      file_path: filePath,
      duration: duration,
      size_kb: sizeKB,
      provider: provider,
      voice: voice,
      text_length: text.length
    });

  } catch (error: any) {
    logger.error('Erro ao gerar áudio TTS:', { error: error.message });
    throw error;
  }
}));

// Buscar voices disponíveis (requer autenticação)
app.get('/api/tts/voices/:provider', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { provider } = req.params;

    if (!provider) {
      return res.status(400).json({ error: 'Provider é obrigatório' });
    }

    const ttsService = TTSServiceFactory.createService(provider);
    const voices = await ttsService.getVoices();

    res.json({ voices });

  } catch (error: any) {
    logger.error('Erro ao buscar voices:', { error: error.message });
    throw error;
  }
}));

// ===== ROTAS DE NOTIFICAÇÕES =====
// (Tabela de notificações criada em createTables())

// Limpar notificações antigas (requer autenticação)
app.delete('/api/notifications/cleanup', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const days = parseInt(req.query.days as string) || 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await dbRun(`
      DELETE FROM notifications 
      WHERE (user_id = ? OR user_id IS NULL) 
      AND created_at < ?
    `, [userId, cutoffDate.toISOString()]);

    res.json({
      success: true,
      message: `Notificações antigas removidas (mais de ${days} dias)`
    });
  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar notificações'
    });
  }
}));

// Rota de teste para notificações (requer autenticação)
app.get('/api/notifications/test', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    // Criar notificações de teste
    const testNotifications = [
      {
        user_id: userId,
        type: 'info',
        title: 'Sistema iniciado',
        message: 'O sistema foi iniciado com sucesso',
        read: false,
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        type: 'success',
        title: 'Teste de notificação',
        message: 'Esta é uma notificação de teste',
        read: false,
        created_at: new Date(Date.now() - 60000).toISOString()
      }
    ];

    // Inserir notificações de teste
    for (const notification of testNotifications) {
      await dbRun(`
        INSERT INTO notifications (user_id, type, title, message, read, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [notification.user_id, notification.type, notification.title, notification.message, notification.read, notification.created_at]);
    }

    res.json({
      success: true,
      message: 'Notificações de teste criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar notificações de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar notificações de teste'
    });
  }
}));

// Listar notificações (requer autenticação)
app.get('/api/notifications', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const notifications = await dbAll(`
      SELECT 
        id,
        type,
        title,
        message,
        read,
        created_at as createdAt
      FROM notifications
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    res.json({
      notifications: notifications.map((n: any) => ({
        ...n,
        read: n.read === 1 || n.read === true
      })),
      unread_count: unreadCount
    });
  } catch (error) {
    logger.error('Erro ao buscar notificações:', { error });
    throw error;
  }
}));

// Marcar notificação como lida (requer autenticação)
app.post('/api/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao marcar notificação como lida:', { error });
    throw error;
  }
}));

// Marcar todas como lidas (requer autenticação)
app.post('/api/notifications/read-all', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    await dbRun('UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL', [userId]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao marcar todas como lidas:', { error });
    throw error;
  }
}));

// Deletar notificação (requer autenticação)
app.delete('/api/notifications/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao deletar notificação:', { error });
    throw error;
  }
}));

// ===== ROTAS DE USUÁRIOS =====

// Listar usuários (apenas admin)
app.get('/api/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT 
        id,
        name,
        email,
        role,
        is_active,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(users.map((u: any) => ({
      ...u,
      is_active: u.is_active === 1 || u.is_active === true
    })));
  } catch (error) {
    logger.error('Erro ao buscar usuários:', { error });
    throw error;
  }
}));

// Criar usuário (apenas admin)
app.post('/api/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar senha
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se email já existe
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const result = await dbRun(
      'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [name, email, passwordHash, role]
    );

    const newUser = await dbGet('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: newUser
    });
  } catch (error) {
    logger.error('Erro ao criar usuário:', { error });
    throw error;
  }
}));

// Atualizar usuário (apenas admin)
app.put('/api/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active, password } = req.body;

    // Verificar se usuário existe
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Validar email se fornecido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email inválido'
        });
      }

      // Verificar se email já existe em outro usuário
      const existingUser = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }
    }

    // Validar senha se fornecida
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Construir query de atualização
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar'
      });
    }

    values.push(id);
    await dbRun(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedUser = await dbGet('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', { error });
    throw error;
  }
}));

// Deletar usuário (apenas admin)
app.delete('/api/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // Não permitir deletar a si mesmo
    if (parseInt(id) === userId) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode deletar seu próprio usuário'
      });
    }

    // Verificar se usuário existe
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao deletar usuário:', { error });
    throw error;
  }
}));

// ===== ROTAS DE CONFIGURAÇÕES =====
// (Tabela de configurações criada em createTables())

// Buscar configurações (requer autenticação)
app.get('/api/settings', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT key, value, category FROM app_settings WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const settings = await dbAll(query, params);

    // Converter para objeto
    const settingsObj: any = {};
    settings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);
  } catch (error) {
    logger.error('Erro ao buscar configurações:', { error });
    throw error;
  }
}));

// Salvar configurações (requer autenticação)
app.post('/api/settings', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const settings = req.body as any;
    const category = (req.query.category as string) || settings.category || 'general';

    for (const [key, val] of Object.entries(settings)) {
      const value = String(val);
      const cat = (key === 'evolutionApiUrl' || key === 'evolutionApiKey') ? 'api' : category;
      await dbRun(
        `INSERT INTO app_settings (key, value, category, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, category = excluded.category, updated_at = CURRENT_TIMESTAMP`,
        [key, value, cat]
      );
    }

    await loadEvolutionConfigFromDB();
    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    logger.error('Erro ao salvar configurações:', { error });
    throw error;
  }
}));

// ===== ROTAS DO DASHBOARD =====
// (Rotas duplicadas removidas - já existem acima)

// Campanhas recentes (requer autenticação)
app.get('/api/campaigns/recent', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const campaigns = await dbAll(`
      SELECT 
        id,
        name,
        status,
        target_count,
        sent_count,
        scheduled_at as schedule_time,
        created_at
      FROM campaigns
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({ campaigns });
  } catch (error) {
    logger.error('Erro ao buscar campanhas recentes:', { error });
    throw error;
  }
}));

// ===== ROTAS DE INSTÂNCIAS WHATSAPP =====

// Debug: Testar conexão com Evolution API (sem autenticação para teste)
app.get('/api/whatsapp/test-connection', asyncHandler(async (req, res) => {
  try {
    console.log('=== DEBUG EVOLUTION API ===');
    console.log('URL:', process.env.EVOLUTION_API_URL);
    console.log('API Key existente:', !!process.env.EVOLUTION_API_KEY);
    console.log('API Key length:', process.env.EVOLUTION_API_KEY?.length || 0);

    const isConnected = await evolutionAPI.checkConnection();

    console.log('Conexão Evolution API:', isConnected ? 'SUCESSO' : 'FALHA');

    res.json({
      success: true,
      connected: isConnected,
      config: {
        url: process.env.EVOLUTION_API_URL,
        hasApiKey: !!process.env.EVOLUTION_API_KEY,
        apiKeyLength: process.env.EVOLUTION_API_KEY?.length || 0
      }
    });
  } catch (error) {
    console.error('Erro detalhado ao testar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao testar conexão',
      details: error.message,
      stack: error.stack
    });
  }
}));

app.post('/api/whatsapp/instances/:name/webhook', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { name } = req.params;
    const { url } = req.body as any;
    if (!url || String(url).trim() === '') {
      return res.status(400).json({ success: false, error: 'URL do webhook é obrigatória' });
    }
    await evolutionAPI.setupWebhook(name, url);
    res.json({ success: true, message: 'Webhook configurado com sucesso' });
  } catch (error: any) {
    logger.error('Erro ao configurar webhook da instância:', { error: error.message });
    res.status(500).json({ success: false, error: error.message || 'Erro ao configurar webhook' });
  }
}));

// Debug: Criar instância completamente aberta para teste
app.post('/api/whatsapp/test-open', asyncHandler(async (req, res) => {
  try {
    console.log('=== DEBUG CRIAR INSTÂNCIA OPEN ===');
    console.log('Body recebido:', req.body);

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome da instância é obrigatório'
      });
    }

    console.log('Criando instância:', name);
    const evolutionInstance = await evolutionAPI.createInstance(name);
    console.log('Instância criada com sucesso:', evolutionInstance);

    res.json({
      success: true,
      message: 'Instância criada com sucesso',
      instance: evolutionInstance
    });

  } catch (error) {
    console.error('Erro detalhado ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar instância',
      details: error.message,
      stack: error.stack
    });
  }
}));

// Listar instâncias (requer autenticação)
app.get('/api/whatsapp/instances', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Carregar configurações do Evolution antes de verificar
    await loadEvolutionConfigFromDB();

    let instances = await dbAll(`
      SELECT 
        id,
        name as instance_name,
        instance_id,
        phone_connected as phone_number,
        status,
        qrcode,
        CURRENT_TIMESTAMP as qrcode_expires_at,
        last_connection as last_activity,
        created_at
      FROM whatsapp_instances
      WHERE (is_active = true OR is_active IS NULL)
      ORDER BY created_at DESC
    `);

    logger.info(`Total de instâncias encontradas: ${instances.length}`, {
      instances: instances.map((i: any) => ({ id: i.id, name: i.instance_name, status: i.status, is_active: i.is_active }))
    });

    // Verificar status na Evolution API para instâncias que estão "connecting" ou "created"
    for (const instance of instances) {
      if ((instance.status === 'connecting' || instance.status === 'created') && (instance.instance_id || instance.instance_name)) {
        try {
          const instanceName = instance.instance_id || instance.instance_name;
          logger.info(`Verificando status da instância ${instanceName} na Evolution API (status atual: ${instance.status})...`);

          const evolutionStatus: any = await evolutionAPI.getInstanceStatus(instanceName);

          // Evolution API pode retornar state aninhado em instance ou diretamente
          const instanceData = evolutionStatus.instance || evolutionStatus;
          const state = instanceData.state || evolutionStatus.state || evolutionStatus.status || '';
          const stateStr = String(state).toLowerCase();

          // Também verificar connectionState se existir
          const connectionState = instanceData.connectionState || (evolutionStatus as any).connectionState || state;
          const connectionStateStr = String(connectionState).toLowerCase();

          logger.info(`Status retornado pela Evolution API para ${instanceName}:`, {
            state,
            stateStr,
            connectionState,
            connectionStateStr,
            instanceData,
            fullResponse: evolutionStatus
          });

          let mappedStatus = instance.status;
          // Verificar ambos state e connectionState
          const finalState = connectionStateStr || stateStr;

          // Se state é "connecting" mas já passou tempo suficiente, verificar se realmente está conectado
          if (finalState === 'open' || finalState === 'connected') {
            mappedStatus = 'connected';
          } else if (finalState === 'close' || finalState === 'closed' || finalState === 'disconnected') {
            mappedStatus = 'disconnected';
          } else if (finalState === 'connecting') {
            // Se está "connecting" há muito tempo, pode já estar conectado
            // Verificar se há phoneConnected ou outros indicadores
            const hasPhone = evolutionStatus.phoneConnected || evolutionStatus.phoneNumber || instanceData.phoneConnected || instanceData.phoneNumber;
            if (hasPhone) {
              mappedStatus = 'connected';
            }
          }

          // Se o status mudou, atualizar no banco
          if (mappedStatus !== instance.status) {
            const phoneConnected = evolutionStatus.phoneConnected || evolutionStatus.phoneNumber || evolutionStatus.phone || instance.phone_number;
            await dbRun(`
              UPDATE whatsapp_instances 
              SET status = ?, phone_connected = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [mappedStatus, phoneConnected, instance.id]);

            logger.info(`Status da instância ${instanceName} atualizado: ${instance.status} -> ${mappedStatus}`);

            // Atualizar na lista de retorno
            instance.status = mappedStatus;
            instance.phone_number = phoneConnected;
          }
        } catch (error: any) {
          // Logar erro mas continuar
          logger.warn('Erro ao verificar status individual:', { error: error.message, instance: instance.instance_name || instance.instance_id });
        }
      }
    }

    res.json(instances);
  } catch (error) {
    logger.error('Erro ao buscar instâncias WhatsApp:', { error });
    throw error;
  }
}));

// Health check do Evolution API (requer autenticação)
app.get('/api/whatsapp/health', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const isConnected = await evolutionAPI.checkConnection();
    const baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const apiKey = process.env.EVOLUTION_API_KEY;

    res.json({
      isHealthy: isConnected,
      message: isConnected
        ? 'Evolution API está funcionando'
        : 'Evolution API não está acessível',
      details: {
        baseURL,
        apiKeyConfigured: !!apiKey && apiKey !== 'your-api-key',
        connectionStatus: isConnected ? 'connected' : 'disconnected'
      }
    });
  } catch (error: any) {
    logger.error('Erro ao verificar Evolution API:', { error });
    res.status(500).json({
      isHealthy: false,
      message: `Erro ao verificar Evolution API: ${error.message}`,
      details: { error: error.message }
    });
  }
}));

// Criar instância (requer autenticação) - VERSÃO SEM VALIDAÇÃO PARA DEBUG
app.post('/api/whatsapp/instances-debug', authenticateToken, asyncHandler(async (req, res) => {
  try {
    console.log('=== DEBUG CRIAR INSTÂNCIA ===');
    console.log('Body recebido:', req.body);
    console.log('Headers:', req.headers);

    const { name, instance_name, phone_number, phone } = req.body;
    const instanceName = name || instance_name;
    const phoneNumber = phone_number || phone;

    console.log('Instance name:', instanceName);
    console.log('Phone number:', phoneNumber);

    if (!instanceName) {
      console.log('Erro: Nome da instância é obrigatório');
      return res.status(400).json({
        success: false,
        error: 'Nome da instância é obrigatório'
      });
    }

    // Verificar se Evolution API está acessível
    console.log('Verificando conexão com Evolution API...');
    const isConnected = await evolutionAPI.checkConnection();
    console.log('Evolution API conectada:', isConnected);

    if (!isConnected) {
      console.log('Evolution API não está acessível');
      return res.status(503).json({
        success: false,
        error: 'Evolution API não está acessível',
        message: 'Verifique se a Evolution API está rodando e se as configurações estão corretas no arquivo .env'
      });
    }

    // Criar instância na Evolution API
    console.log('Criando instância na Evolution API...');
    const evolutionInstance = await evolutionAPI.createInstance(instanceName, phoneNumber);
    console.log('Instância criada com sucesso:', evolutionInstance);

    res.json({
      success: true,
      message: 'Instância criada com sucesso',
      instance: evolutionInstance
    });

  } catch (error) {
    console.error('Erro detalhado ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar instância',
      details: error.message,
      stack: error.stack
    });
  }
}));

// Criar instância (requer autenticação) - com debug aprimorado
app.post('/api/whatsapp/instances',
  authenticateToken,
  (req, res, next) => {
    console.log('=== VALIDAÇÃO DEBUG ===');
    console.log('Headers:', req.headers);
    console.log('Body antes da validação:', req.body);
    next();
  },
  validate(schemas.createWhatsAppInstance),
  (err, req, res, next) => {
    // Handler específico para erros de validação
    if (err.statusCode === 400 && err.code === 'VALIDATION_ERROR') {
      console.log('=== ERRO DE VALIDAÇÃO DETECTADO ===');
      console.log('Erro:', err.message);
      console.log('Body que causou erro:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Erro de validação',
        details: err.message,
        receivedBody: req.body
      });
    }
    next(err);
  },
  asyncHandler(async (req, res) => {
    try {
      console.log('=== DEBUG CRIAR INSTÂNCIA ORIGINAL ===');
      console.log('Headers:', req.headers);
      console.log('Body recebido:', req.body);
      console.log('User:', req.user);

      const { name, instance_name, phone_number, phone } = req.body;
      const instanceName = name || instance_name;
      const phoneNumber = phone_number || phone;

      console.log('Instance name:', instanceName);
      console.log('Phone number:', phoneNumber);

      if (!instanceName) {
        console.log('Erro: Nome da instância é obrigatório');
        return res.status(400).json({
          success: false,
          error: 'Nome da instância é obrigatório'
        });
      }

      // Carregar configurações do Evolution do banco de dados antes de usar
      console.log('Carregando configurações do Evolution do banco de dados...');
      await loadEvolutionConfigFromDB();
      console.log('Configurações carregadas. URL:', process.env.EVOLUTION_API_URL);

      // Verificar se Evolution API está acessível
      console.log('Verificando conexão com Evolution API...');
      const isConnected = await evolutionAPI.checkConnection();
      console.log('Evolution API conectada:', isConnected);

      if (!isConnected) {
        console.log('Evolution API não está acessível');
        return res.status(503).json({
          success: false,
          error: 'Evolution API não está acessível',
          message: 'Verifique se a Evolution API está rodando e se as configurações estão corretas no arquivo .env'
        });
      }

      // Criar instância na Evolution API
      const evolutionInstance = await evolutionAPI.createInstance(instanceName, phoneNumber);

      // A resposta do Evolution API pode ter diferentes formatos
      const instanceId = evolutionInstance.instanceId || evolutionInstance.instanceName || instanceName;
      let qrcode = evolutionInstance.qrcode || evolutionInstance.qrcodeBase64 || null;

      // Se não tiver QR code, tentar gerar chamando connectInstance
      if (!qrcode) {
        try {
          logger.info('QR code não veio na criação, tentando gerar via connectInstance...');
          const connectionData = await evolutionAPI.connectInstance(instanceName);
          qrcode = (connectionData as any).base64 || (connectionData as any).qrcode || null;
          if (qrcode && qrcode.startsWith('data:image')) {
            qrcode = qrcode.split(',')[1]; // Remover prefixo data:image
          }
          logger.info('QR code gerado via connectInstance:', { hasQRCode: !!qrcode });
        } catch (error: any) {
          logger.warn('Erro ao gerar QR code via connectInstance:', { error: error.message });
        }
      }

      // Status inicial deve ser "connecting" se tiver QR code, senão "created"
      const status = qrcode ? 'connecting' : (evolutionInstance.status || 'created');

      logger.info('Criando instância no banco:', { instanceName, instanceId, status, hasQRCode: !!qrcode });

      // Salvar no banco de dados local
      const result = await dbRun(`
      INSERT INTO whatsapp_instances (name, instance_id, phone_connected, status, qrcode, is_active)
      VALUES (?, ?, ?, ?, ?, true)
    `, [instanceName, instanceId, phoneNumber || null, status, qrcode || null]);

      const newInstance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [result.lastID]);

      if (!newInstance) {
        throw new Error('Erro ao recuperar instância criada');
      }

      logger.info('Instância criada com sucesso:', { id: newInstance.id, name: newInstance.name });

      res.json({
        ...newInstance,
        qrcode: qrcode,
        qrcode_url: qrcode ? `data:image/png;base64,${qrcode}` : null
      });
    } catch (error: any) {
      logger.error('Erro ao criar instância WhatsApp:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: 'Erro ao criar instância WhatsApp',
        message: error.message || 'Erro desconhecido',
        details: error.response?.data || error.message
      });
    }
  }));

// Atualizar status da instância (requer autenticação)
app.patch('/api/whatsapp/instances/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await dbRun(`
      UPDATE whatsapp_instances 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    const updatedInstance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
    res.json(updatedInstance);
  } catch (error) {
    logger.error('Erro ao atualizar status da instância:', { error });
    throw error;
  }
}));

// Conectar instância (obter QR Code) (requer autenticação)
app.post('/api/whatsapp/instances/:id/connect', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar instância no banco
    const instance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    // Conectar na Evolution API (gera QR Code)
    const connectionData = await evolutionAPI.connectInstance(instance.instance_id);
    const base64 = (connectionData as any).base64 as string | undefined;
    const code = (connectionData as any).code as string | undefined;

    // Normalizar base64 para armazenar apenas o conteúdo
    const base64Content = base64 && base64.startsWith('data:image')
      ? base64.split(',')[1]
      : base64 || null;

    // Atualizar status no banco
    await dbRun(`
      UPDATE whatsapp_instances 
      SET status = ?, qrcode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['connecting', base64Content, id]);

    // Criar notificação de conexão iniciada
    const userId = (req as any).user?.userId;
    await createNotification(
      userId,
      'info',
      'WhatsApp conectando',
      `Instância "${instance.name}" está conectando... Escaneie o QR Code`
    );

    res.json({
      qrcode: base64Content,
      qrcode_url: base64 || (base64Content ? `data:image/png;base64,${base64Content}` : null),
      code,
      status: 'connecting'
    });
  } catch (error) {
    logger.error('Erro ao conectar instância:', { error });
    throw error;
  }
}));

// Desconectar instância (requer autenticação)
app.post('/api/whatsapp/instances/:id/disconnect', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar instância no banco
    const instance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    // Desconectar na Evolution API
    await evolutionAPI.disconnectInstance(instance.instance_id);

    // Atualizar status no banco
    await dbRun(`
      UPDATE whatsapp_instances 
      SET status = ?, phone_connected = NULL, qrcode = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['disconnected', id]);

    res.json({ message: 'Instância desconectada com sucesso' });
  } catch (error) {
    logger.error('Erro ao desconectar instância:', { error });
    throw error;
  }
}));

// Deletar instância WhatsApp (requer autenticação)
app.delete('/api/whatsapp/instances/:id', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar instância no banco
    const instance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    // Deletar na Evolution API se tiver instance_id
    if (instance.instance_id) {
      try {
        await evolutionAPI.deleteInstance(instance.instance_id);
      } catch (error) {
        logger.warn('Erro ao deletar instância na Evolution API (continuando):', { error });
      }
    }

    // Deletar do banco
    await dbRun('DELETE FROM whatsapp_instances WHERE id = ?', [id]);

    res.json({ success: true, message: 'Instância deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar instância:', { error });
    throw error;
  }
}));

// Obter status da instância (requer autenticação)
app.get('/api/whatsapp/instances/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Carregar configurações do Evolution antes de verificar
    await loadEvolutionConfigFromDB();

    // Buscar instância no banco
    const instance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    // Obter status da Evolution API
    try {
      const evolutionStatus: any = await evolutionAPI.getInstanceStatus(instance.instance_id || instance.name);

      // Evolution API v2 retorna 'state' com valores: 'open', 'close', 'connecting'
      // Priorizar 'state' sobre 'status' pois é o campo principal da Evolution API v2
      const state = evolutionStatus.state || evolutionStatus.status || '';
      const stateStr = String(state).toLowerCase();

      // Mapear status da Evolution API para nosso formato
      let mappedStatus: string = instance.status; // Manter status atual por padrão

      if (stateStr === 'open') {
        mappedStatus = 'connected';
      } else if (stateStr === 'close' || stateStr === 'closed') {
        mappedStatus = 'disconnected';
      } else if (stateStr === 'connecting' || stateStr === 'connect') {
        mappedStatus = 'connecting';
      } else if (stateStr === 'connected') {
        mappedStatus = 'connected';
      } else if (stateStr === 'disconnected') {
        mappedStatus = 'disconnected';
      }

      // Atualizar status no banco se mudou
      if (mappedStatus !== instance.status) {
        const phoneConnected = evolutionStatus.phoneConnected || evolutionStatus.phoneNumber || evolutionStatus.phone || instance.phone_connected;
        await dbRun(`
          UPDATE whatsapp_instances 
          SET status = ?, phone_connected = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [mappedStatus, phoneConnected, id]);

        logger.info(`Status da instância ${instance.name} atualizado: ${instance.status} -> ${mappedStatus} (Evolution state: ${stateStr})`);

        // Buscar instância atualizada
        const updatedInstance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [id]);
        return res.json({
          ...updatedInstance,
          evolution_status: evolutionStatus
        });
      }

      return res.json({
        ...instance,
        status: mappedStatus,
        evolution_status: evolutionStatus
      });
    } catch (error: any) {
      // Se houver erro ao verificar na Evolution API, retornar status do banco
      logger.warn('Erro ao verificar status na Evolution API:', { error: error.message, instance: instance.name });
      return res.json(instance);
    }
  } catch (error) {
    logger.error('Erro ao obter status da instância:', { error });
    throw error;
  }
}));

// Criar instância diretamente (para testes - sem autenticação)
app.post('/api/whatsapp/instances-direct',
  asyncHandler(async (req, res) => {
    try {
      console.log('=== CRIAR INSTÂNCIA DIRETA (SEM AUTENTICAÇÃO) ===');
      console.log('Body recebido:', req.body);

      const { name, instance_id, phone_connected, status, qrcode } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Nome da instância é obrigatório'
        });
      }

      // Criar diretamente no banco de dados
      const result = await dbRun(`
        INSERT INTO whatsapp_instances (name, instance_id, phone_connected, status, qrcode)
        VALUES (?, ?, ?, ?, ?)
      `, [name, instance_id || name, phone_connected || null, status || 'created', qrcode || null]);

      const newInstance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [result.lastID]);

      console.log('✅ Instância criada com sucesso:', newInstance);

      res.json({
        success: true,
        message: 'Instância criada com sucesso',
        instance: newInstance
      });

    } catch (error) {
      console.error('Erro ao criar instância direta:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar instância',
        message: error.message
      });
    }
  })
);

// ===== ROTAS DE ENVIO DE MENSAGENS =====

// Enviar mensagem individual (requer autenticação)
app.post('/api/messages/send', authenticateToken, validate(schemas.sendMessage), asyncHandler(async (req, res) => {
  try {
    const { instance_id, phone_number, message, message_type, media_url } = req.body;

    // Validar dados
    if (!instance_id || !phone_number || !message) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar se a instância está conectada
    const instance = await dbGet('SELECT * FROM whatsapp_instances WHERE instance_id = ? OR name = ?', [instance_id, instance_id]);
    if (!instance || (instance.status !== 'connected' && instance.status !== 'open')) {
      return res.status(400).json({ error: 'Instância não está conectada' });
    }

    // Normalizar telefone
    const normalizedPhone = normalizePhone(phone_number);

    // Buscar contato
    let contact = await dbGet('SELECT * FROM contacts WHERE phone = ?', [normalizedPhone]);
    if (!contact) {
      // Criar contato se não existir
      const result = await dbRun('INSERT INTO contacts (name, phone, is_blocked) VALUES (?, ?, 0)', [phone_number, normalizedPhone]);
      contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    }

    // Verificar se contato está bloqueado
    if (contact.is_blocked) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível enviar mensagem para contato bloqueado'
      });
    }

    // Criar registro de mensagem
    const messageResult = await dbRun(`
      INSERT INTO messages (contact_id, content, message_type, media_url, status)
      VALUES (?, ?, ?, ?, ?)
    `, [contact.id, message, message_type || 'text', media_url || null, 'pending']);

    const messageRecord = await dbGet('SELECT * FROM messages WHERE id = ?', [messageResult.lastID]);

    // Enviar mensagem via Evolution API
    let sentMessage;
    try {
      // Preparar mídia (converter para Base64 se for local)
      let finalMedia = media_url;
      if (media_url && (message_type === 'image' || message_type === 'video' || message_type === 'audio' || message_type === 'audio_upload')) {
        finalMedia = await getMediaContent(media_url);
      }

      if (message_type === 'image' && finalMedia) {
        sentMessage = await evolutionAPI.sendImage(instance.name || instance_id, {
          number: phone_number,
          caption: message,
          media: finalMedia
        });
      } else if ((message_type === 'audio' || message_type === 'audio_upload') && finalMedia) {
        sentMessage = await evolutionAPI.sendAudio(instance.name || instance_id, {
          number: phone_number,
          audio: finalMedia
        });
      } else if (message_type === 'video' && finalMedia) {
        sentMessage = await evolutionAPI.sendVideo(instance.name || instance_id, {
          number: phone_number,
          caption: message,
          media: finalMedia
        });
      } else {
        sentMessage = await evolutionAPI.sendTextMessage(instance.name || instance_id, {
          number: phone_number,
          text: message
        });
      }

      // Atualizar status da mensagem
      await dbRun(`
        UPDATE messages 
        SET status = ?, sent_at = ?, error_message = NULL
        WHERE id = ?
      `, ['sent', new Date().toISOString(), messageRecord.id]);

      res.json({
        success: true,
        message_id: messageRecord.id,
        evolution_id: sentMessage.key?.id || null,
        status: 'sent'
      });

    } catch (sendError) {
      // Atualizar status da mensagem com erro
      await dbRun(`
        UPDATE messages 
        SET status = ?, error_message = ?
        WHERE id = ?
      `, ['failed', sendError.message, messageRecord.id]);

      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem',
        details: sendError.message
      });
    }

  } catch (error) {
    logger.error('Erro ao enviar mensagem:', { error });
    throw error;
  }
}));

// Enviar mensagem em massa (campanha) (requer autenticação)
app.post('/api/messages/bulk-send', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { instance_id, contact_ids, message, message_type, media_url, campaign_id } = req.body;

    // Validar dados
    if (!instance_id || !contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0 || !message) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar se a instância está conectada
    const instance = await dbGet('SELECT * FROM whatsapp_instances WHERE instance_id = ?', [instance_id]);
    if (!instance || (instance.status !== 'connected' && instance.status !== 'open')) {
      return res.status(400).json({ error: 'Instância não está conectada' });
    }

    const results = [];
    const errors = [];

    // Implementar envio com delay anti-bloqueio
    for (let i = 0; i < contact_ids.length; i++) {
      const contact_id = contact_ids[i];

      try {
        // Buscar contato
        const contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [contact_id]);
        if (!contact) {
          errors.push({ contact_id, error: 'Contato não encontrado' });
          continue;
        }

        // Criar registro de mensagem
        const messageResult = await dbRun(`
          INSERT INTO messages (contact_id, campaign_id, content, message_type, media_url, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [contact_id, campaign_id || null, message, message_type || 'text', media_url || null, 'pending']);

        // Delay anti-bloqueio (1-3 segundos entre mensagens)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

        // Enviar mensagem
        let sentMessage;
        try {
          // Preparar mídia (converter para Base64 se for local)
          let finalMedia = media_url;
          if (media_url && (message_type === 'image' || message_type === 'video' || message_type === 'audio')) {
            finalMedia = await getMediaContent(media_url);
          }

          if (message_type === 'image' && finalMedia) {
            sentMessage = await evolutionAPI.sendImage(instance.name || instance_id, {
              number: contact.phone,
              caption: message,
              media: finalMedia
            });
          } else if (message_type === 'audio' && finalMedia) {
            sentMessage = await evolutionAPI.sendAudio(instance.name || instance_id, {
              number: contact.phone,
              audio: finalMedia
            });
          } else if (message_type === 'video' && finalMedia) {
            sentMessage = await evolutionAPI.sendVideo(instance.name || instance_id, {
              number: contact.phone,
              caption: message,
              media: finalMedia
            });
          } else {
            sentMessage = await evolutionAPI.sendTextMessage(instance.name || instance_id, {
              number: contact.phone,
              text: message
            });
          }

          // Atualizar status da mensagem
          await dbRun(`
            UPDATE messages 
            SET status = ?, sent_at = ?, error_message = NULL
            WHERE id = ?
          `, ['sent', new Date().toISOString(), messageResult.lastID]);

          results.push({
            contact_id,
            message_id: messageResult.lastID,
            evolution_id: sentMessage.key?.id || null,
            status: 'sent'
          });

        } catch (sendError) {
          // Atualizar status da mensagem com erro
          await dbRun(`
            UPDATE messages 
            SET status = ?, error_message = ?
            WHERE id = ?
          `, ['failed', sendError.message, messageResult.lastID]);

          errors.push({
            contact_id,
            error: sendError.message
          });
        }

      } catch (error) {
        errors.push({ contact_id, error: error.message });
      }
    }

    res.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.slice(0, 10) // Limitar a 10 erros no retorno
    });

  } catch (error) {
    logger.error('Erro ao enviar mensagens em massa:', { error });
    throw error;
  }
}));

// Rota de Upload de Mídia (Genérica)
app.post('/api/upload/media', authenticateToken, uploadMedia.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const fileUrl = buildAbsoluteUrl(`/uploads/${req.file.filename}`, req);
    const mimetype = req.file.mimetype;
    let type = 'unknown';

    if (mimetype.startsWith('image/')) type = 'image';
    else if (mimetype.startsWith('video/')) type = 'video';
    else if (mimetype.startsWith('audio/')) type = 'audio';

    logger.info(`Upload de mídia realizado: ${req.file.filename} (${type})`);

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: mimetype,
      type: type
    });
  } catch (error) {
    logger.error('Erro no upload de mídia:', { error });
    throw error;
  }
}));

// ===== SISTEMA DE AGENDAMENTO =====

// Sistema de fila para envio com anti-bloqueio
class MessageQueue {
  private queue: any[] = [];
  private isProcessing = false;
  private maxConcurrent = 1; // Enviar uma mensagem por vez para evitar bloqueio
  private delayBetweenMessages = 2000; // 2 segundos entre mensagens

  add(message: any) {
    this.queue.push(message);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift();

      try {
        await this.sendMessage(message);
      } catch (error) {
        logger.error('Erro ao enviar mensagem da fila:', { error });
      }

      // Delay entre mensagens para evitar bloqueio
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenMessages));
      }
    }

    this.isProcessing = false;
  }

  private async sendMessage(message: any) {
    const { instance_id, contact_id, campaign_id, content, message_type, media_url } = message;

    // Buscar contato
    const contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [contact_id]);
    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    // Criar registro de mensagem
    const messageResult = await dbRun(`
      INSERT INTO messages (contact_id, campaign_id, content, message_type, media_url, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [contact_id, campaign_id || null, content, message_type || 'text', media_url || null, 'pending']);

    try {
      // Preparar mídia (converter para Base64 se for local)
      let finalMedia = media_url;
      if (media_url && (message_type === 'image' || message_type === 'video' || message_type === 'audio')) {
        finalMedia = await getMediaContent(media_url);
      }

      // Enviar mensagem via Evolution API
      let sentMessage;
      if (message_type === 'image' && finalMedia) {
        sentMessage = await evolutionAPI.sendImage(instance_id, {
          number: contact.phone,
          caption: content,
          media: finalMedia
        });
      } else if (message_type === 'audio' && finalMedia) {
        sentMessage = await evolutionAPI.sendAudio(instance_id, {
          number: contact.phone,
          audio: finalMedia
        });
      } else if (message_type === 'video' && finalMedia) {
        sentMessage = await evolutionAPI.sendVideo(instance_id, {
          number: contact.phone,
          caption: content,
          media: finalMedia
        });
      } else {
        sentMessage = await evolutionAPI.sendTextMessage(instance_id, {
          number: contact.phone,
          text: content
        });
      }

      // Atualizar status da mensagem
      await dbRun(`
        UPDATE messages 
        SET status = ?, sent_at = ?, error_message = NULL
        WHERE id = ?
      `, ['sent', new Date().toISOString(), messageResult.lastID]);

      logger.info(`✅ Mensagem enviada para ${contact.phone}`);

    } catch (sendError: any) {
      // Atualizar status da mensagem com erro
      await dbRun(`
        UPDATE messages 
        SET status = ?, error_message = ?
        WHERE id = ?
      `, ['failed', sendError.message, messageResult.lastID]);

      logger.error(`Erro ao enviar para ${contact.phone}:`, { error: sendError.message });
      throw sendError;
    }
  }
}

// Função auxiliar para obter conteúdo da mídia (URL ou Base64)
async function getMediaContent(url: string): Promise<string> {
  try {
    logger.info(`[getMediaContent] Processando URL: ${url}`);

    if (!url) {
      logger.warn('[getMediaContent] URL vazia');
      return '';
    }

    // Se for URL remota (http/https) e não for localhost/127.0.0.1, retorna a URL
    // Mas verificar se contém /uploads/ ou /api/uploads/ - se sim, é local mesmo sendo URL completa
    const isLocalUpload = url.includes('/uploads/') || url.includes('/api/uploads/');

    if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1') && !isLocalUpload) {
      logger.info('[getMediaContent] URL remota detectada, retornando original');
      return url;
    }

    // Se for local, ler arquivo e converter para Base64
    let filePath = url;

    // Remover prefixo de URL se existir (http://localhost:3006/api/uploads/image.jpg -> /api/uploads/image.jpg)
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        filePath = urlObj.pathname;
      } catch (e) {
        // Se não for URL válida, usar como está
        filePath = url;
      }
    }

    // Ajustar caminho para sistema de arquivos
    // Se começar com /api/uploads ou /uploads, remover e pegar apenas o nome do arquivo
    if (filePath.includes('/uploads/')) {
      const parts = filePath.split('/uploads/');
      const filename = parts[parts.length - 1]; // Pegar a última parte (pode ter múltiplos /uploads/)
      filePath = path.join(process.cwd(), 'uploads', filename);
    } else if (filePath.startsWith('/')) {
      // Tentar encontrar em uploads se for caminho absoluto
      const filename = path.basename(filePath);
      filePath = path.join(process.cwd(), 'uploads', filename);
    } else if (!path.isAbsolute(filePath)) {
      // Se for caminho relativo, assumir que está em uploads/
      filePath = path.join(process.cwd(), 'uploads', filePath);
    }

    logger.info(`[getMediaContent] Caminho resolvido: ${filePath}`);

    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      logger.error(`[getMediaContent] Arquivo não encontrado: ${filePath}`);
      // Tentar caminho alternativo (raiz do projeto/uploads)
      const altPath = path.join(__dirname, '../../uploads', path.basename(filePath));
      logger.info(`[getMediaContent] Tentando caminho alternativo: ${altPath}`);

      if (fs.existsSync(altPath)) {
        filePath = altPath;
      } else {
        // Tentar também em uploads/ relativo ao diretório atual
        const altPath2 = path.join(process.cwd(), 'uploads', path.basename(filePath));
        if (fs.existsSync(altPath2)) {
          filePath = altPath2;
        } else {
          logger.error(`[getMediaContent] Arquivo não encontrado em nenhum caminho alternativo`);
          return url; // Retorna URL original se falhar
        }
      }
    }

    // Ler arquivo
    const fileBuffer = await fs.promises.readFile(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = getMimeType(filePath);

    logger.info(`[getMediaContent] Arquivo lido com sucesso. Tamanho: ${fileBuffer.length} bytes. Mime: ${mimeType}`);

    return `data:${mimeType};base64,${base64}`;
  } catch (error: any) {
    logger.error('[getMediaContent] Erro ao processar mídia:', { error: error.message, stack: error.stack });
    return url; // Retorna URL original em caso de erro
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

const messageQueue = new MessageQueue();

// Função para processar campanhas com sistema de fila anti-bloqueio
async function processCampaignWithQueue(campaign: any, contactIds: string[]) {
  try {
    // Obter instância ativa
    const instance = await dbGet(`
      SELECT * FROM whatsapp_instances 
      WHERE status IN ('connected','open') AND (is_active = true OR is_active IS NULL)
      ORDER BY last_connection DESC 
      LIMIT 1
    `);

    if (!instance) {
      logger.error('Nenhuma instância WhatsApp conectada disponível');
      await dbRun(`
        UPDATE campaigns 
        SET status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [campaign.id]);
      return;
    }

    logger.info(`Usando instância: ${instance.name || instance.instance_id} (${instance.phone_connected})`);

    // Processar em lotes para evitar bloqueio
    const batchSize = 10; // Enviar de 10 em 10 contatos
    const messageDelay = 2000; // 2 segundos entre mensagens
    const batchDelay = 10000; // 10 segundos entre lotes

    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batch = contactIds.slice(i, i + batchSize);
      logger.info(`Processando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(contactIds.length / batchSize)}`);

      // Aguardar entre lotes (exceto o primeiro)
      if (i > 0) {
        logger.debug(`Aguardando ${batchDelay / 1000} segundos antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }

      // Processar cada contato do lote
      for (const contactId of batch) {
        try {
          // Obter detalhes do contato
          const contact = await dbGet('SELECT * FROM contacts WHERE id = ? AND (is_blocked = false OR is_blocked IS NULL) AND is_active = true', [contactId]);
          if (!contact) {
            logger.warn(`Contato ${contactId} não encontrado ou está bloqueado`);
            continue;
          }

          logger.info(`Enviando mensagem para ${contact.phone} (${contact.name})`);

          // Criar mensagem no banco de dados
          const messageResult = await dbRun(`
            INSERT INTO messages (contact_id, campaign_id, content, message_type, status, created_at)
            VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
          `, [contactId, campaign.id, campaign.message || '', campaign.message_type]);

          // Enviar mensagem via Evolution API
          let sent = false;
          let errorMessage = null;

          try {
            let resp: any = null;
            if (campaign.message_type === 'text') {
              resp = await evolutionAPI.sendTextMessage(instance.name || instance.instance_id, {
                number: contact.phone,
                text: campaign.message_template,
                delay: messageDelay
              });
              sent = true;
            } else if (campaign.message_type === 'image' && campaign.media_url) {
              // Converter URL local para Base64 se necessário
              const mediaContent = await getMediaContent(campaign.media_url);
              resp = await evolutionAPI.sendImage(instance.name || instance.instance_id, {
                number: contact.phone,
                media: mediaContent,
                caption: campaign.message_template,
                delay: messageDelay
              });
              sent = true;
            } else if (campaign.message_type === 'video' && campaign.media_url) {
              // Converter URL local para Base64 se necessário
              const videoContent = await getMediaContent(campaign.media_url);
              resp = await evolutionAPI.sendVideo(instance.name || instance.instance_id, {
                number: contact.phone,
                media: videoContent,
                caption: campaign.message_template,
                delay: messageDelay
              });
              sent = true;
            } else if (campaign.message_type === 'audio') {
              let audioUrl = campaign.media_url || (campaign.tts_audio_file ? `/uploads/tts/${campaign.tts_audio_file}` : null);
              if (audioUrl) {
                // Converter URL local para Base64 se necessário
                const audioContent = await getMediaContent(audioUrl);
                resp = await evolutionAPI.sendAudio(instance.name || instance.instance_id, {
                  number: contact.phone,
                  audio: audioContent,
                  delay: messageDelay,
                  ptt: true
                });
                sent = true;
              }
            }

            if (sent) {
              logger.info(`Mensagem enviada para ${contact.phone}`);

              // Atualizar status da mensagem
              const evoId = resp?.key?.id || null;
              await dbRun(`
                UPDATE messages 
                SET status = 'sent', sent_at = CURRENT_TIMESTAMP, error_message = NULL, evolution_id = COALESCE(?, evolution_id)
                WHERE id = ?
              `, [evoId, messageResult.lastID]);
            }

          } catch (sendError) {
            errorMessage = sendError.message;
            logger.error(`Erro ao enviar para ${contact.phone}:`, { error: errorMessage });

            // Atualizar status da mensagem com erro
            await dbRun(`
              UPDATE messages 
              SET status = 'failed', error_message = ?
              WHERE id = ?
            `, [errorMessage, messageResult.lastID]);
          }

          // Aguardar entre mensagens para evitar bloqueio
          if (sent || errorMessage) {
            await new Promise(resolve => setTimeout(resolve, messageDelay));
          }

        } catch (contactError: any) {
          logger.error(`Erro ao processar contato ${contactId}:`, { error: contactError.message });
        }
      }
    }

    // Marcar campanha como concluída
    await dbRun(`
      UPDATE campaigns 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [campaign.id]);

    logger.info(`Campanha ${campaign.name} concluída com sucesso!`);

  } catch (error) {
    logger.error(`Erro ao processar campanha ${campaign.name}:`, { error: error.message });

    // Marcar campanha como falhada
    await dbRun(`
      UPDATE campaigns 
      SET status = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [campaign.id]);
  }
}

// ===== ROTAS DE SEGURANÇA =====

// Webhook para receber confirmações de entrega do Evolution API (sem autenticação - webhook externo)
app.post('/api/webhooks/evolution', asyncHandler(async (req, res) => {
  try {
    const { event, data } = req.body;

    logger.info(`Webhook recebido: ${event}`, { data });

    // Processar diferentes tipos de eventos
    if (event === 'messages.upsert') {
      // Mensagem recebida ou status atualizado
      if (data.key && data.key.id) {
        const messageId = data.key.id;
        const status = getMessageStatusFromEvent(data);

        if (status) {
          // Atualizar status da mensagem no banco usando evolution_id
          if (status === 'sent') {
            await dbRun(`UPDATE messages SET status='sent', sent_at=CURRENT_TIMESTAMP WHERE evolution_id = ?`, [messageId]);
          } else if (status === 'delivered') {
            await dbRun(`UPDATE messages SET status='delivered', delivered_at=CURRENT_TIMESTAMP WHERE evolution_id = ?`, [messageId]);
          } else if (status === 'read') {
            await dbRun(`UPDATE messages SET status='read', read_at=CURRENT_TIMESTAMP WHERE evolution_id = ?`, [messageId]);
          } else if (status === 'played') {
            await dbRun(`UPDATE messages SET status='read', read_at=CURRENT_TIMESTAMP WHERE evolution_id = ?`, [messageId]);
          }
          logger.info(`Status da mensagem ${messageId} atualizado para: ${status}`);
        }
      }
    } else if (event === 'connection.update') {
      // Atualização de conexão da instância
      if (data.instance && data.state) {
        await dbRun(`
          UPDATE whatsapp_instances 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE instance_id = ?
        `, [data.state, data.instance]);

        logger.info(`Status da instância ${data.instance}: ${data.state}`);
      }
    } else if (event === 'qrcode.updated') {
      // QR Code atualizado
      if (data.instance && data.qrcode) {
        await dbRun(`
          UPDATE whatsapp_instances 
          SET qrcode = ?, updated_at = CURRENT_TIMESTAMP
          WHERE instance_id = ?
        `, [data.qrcode, data.instance]);

        logger.info(`QR Code atualizado para instância ${data.instance}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Erro ao processar webhook:', { error });
    throw error;
  }
}));

// Função auxiliar para determinar status da mensagem
function getMessageStatusFromEvent(data: any): string | null {
  if (data.update && data.update.pollUpdates) {
    return 'delivered';
  }

  if (data.messageTimestamp) {
    return 'sent';
  }

  if (data.key && data.key.fromMe) {
    return 'sent';
  }

  return null;
}

// Configurações de segurança (requer autenticação)
app.get('/api/security/configs', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // SQLite não tem tabela security_configs, retornar dados mockados
    res.json([]);
  } catch (error) {
    logger.error('Erro ao buscar configurações de segurança:', { error });
    throw error;
  }
}));

// ===== ROTA CATCH-ALL PARA SPA (deve vir antes do errorHandler) =====
// Servir index.html para todas as rotas que não são API ou arquivos estáticos
const projectRootForSPA = path.resolve(__dirname, '../..');
const distPathForSPA = path.join(projectRootForSPA, 'dist');
app.get('*', (req, res, next) => {
  // Se for rota de API, passar adiante
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Se for arquivo estático (tem extensão), tentar servir
  if (req.path.includes('.')) {
    const filePath = path.join(distPathForSPA, req.path);
    if (fs.existsSync(filePath)) {
      return res.sendFile(path.resolve(filePath));
    }
    // Tentar caminho alternativo
    const altFilePath = path.join(__dirname, '../dist', req.path);
    if (fs.existsSync(altFilePath)) {
      return res.sendFile(path.resolve(altFilePath));
    }
    return next();
  }

  // Para todas as outras rotas, servir index.html (SPA)
  const indexPath = path.join(distPathForSPA, 'index.html');
  if (fs.existsSync(indexPath)) {
    logger.info('✅ Servindo index.html para rota:', req.path);
    return res.sendFile(path.resolve(indexPath));
  }

  // Tentar caminho alternativo
  const altIndexPath = path.join(__dirname, '../dist', 'index.html');
  if (fs.existsSync(altIndexPath)) {
    logger.info('✅ Servindo index.html (caminho alternativo) para rota:', req.path);
    return res.sendFile(path.resolve(altIndexPath));
  }

  logger.warn('❌ index.html não encontrado em:', indexPath);
  logger.warn('   Tentou também:', altIndexPath);
  next();
});

// ===== MIDDLEWARE DE ERRO (deve ser o último) =====
app.use(errorHandler);

// ===== INICIAR SERVIDOR =====

// Inicializar SQLite e depois iniciar servidor
// Executar processamento de campanhas agendadas imediatamente (requer autenticação)
app.post('/api/campaigns/run-now', authenticateToken, asyncHandler(async (req, res) => {
  try {
    await loadEvolutionConfigFromDB();
    const campaigns: any[] = await dbAll(`
      SELECT 
        c.id,
        c.name,
        c.status,
        c.message as message_template,
        c.message_type,
        c.media_url,
        c.target_segment,
        c.is_test,
        c.test_phone,
        GROUP_CONCAT(co.id) as contact_ids
      FROM campaigns c
      LEFT JOIN contacts co ON (c.target_segment IS NULL OR c.target_segment = '' OR co.segment = c.target_segment)
      WHERE c.status = 'scheduled' 
        AND c.scheduled_at <= CURRENT_TIMESTAMP
      GROUP BY c.id
    `);

    const results: any[] = [];
    for (const campaign of campaigns) {
      await dbRun(`UPDATE campaigns SET status = 'running', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [campaign.id]);
      let contactIds = campaign.contact_ids ? campaign.contact_ids.split(',') : [];
      if (campaign.is_test) {
        if (campaign.test_phone && String(campaign.test_phone).trim() !== '') {
          const phone = normalizePhone(String(campaign.test_phone));
          let contact = await dbGet('SELECT id FROM contacts WHERE phone = ?', [phone]);
          if (!contact) {
            const insert = await dbRun('INSERT INTO contacts (name, phone, is_active) VALUES (?, ?, true)', ['Teste', phone]);
            contact = { id: insert.lastID } as any;
          }
          contactIds = [String(contact.id)];
        } else {
          contactIds = contactIds.slice(0, 1);
        }
      }
      await processCampaignWithQueue(campaign, contactIds);
      results.push({ id: campaign.id, name: campaign.name });
    }

    res.json({ success: true, processed: results.length, campaigns: results });
  } catch (error: any) {
    logger.error('Erro ao executar processamento imediato:', { error: error.message });
    res.status(500).json({ success: false, error: 'Erro ao processar campanhas', details: error.message });
  }
}));

// Função para criar tabelas SQLite

// Funcao para criar tabelas SQLite
async function createTables(): Promise<void> {
  try {
    const schemaCandidates = [
      path.join(__dirname, '../database/schema.sql'),
      path.join(__dirname, '../../database/schema.sql'),
      path.join(process.cwd(), 'database/schema.sql'),
    ];

    const schemaPath = schemaCandidates.find(p => fs.existsSync(p));

    if (schemaPath) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Executar o schema SQL
      const commands = schema.split(';').filter(cmd => cmd.trim().length > 0);

      for (const command of commands) {
        try {
          await dbRun(command.trim());
        } catch (error: any) {
          // Ignorar erros de "ja existe" mas logar outros erros
          if (!error.message?.includes('already exists')) {
            logger.warn('Aviso ao executar comando SQL:', { error: error.message });
          }
        }
      }

      logger.info('Tabelas criadas/verificadas com sucesso!');
    } else {
      logger.warn('Arquivo schema.sql nao encontrado, criando tabelas manualmente...');
      // TODO: adicionar criacao manual de tabelas se necessario
    }
  } catch (error) {
    logger.error('Erro ao criar tabelas:', { error });
    throw error;
  }
}

// ===== ROTA DE TESTE DE ENVIO DE IMAGEM =====
app.post('/api/test/send-image', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { phone_number, media_url } = req.body;
    const testPhone = phone_number || '65981173624';

    // Buscar instância conectada
    const instance = await dbGet(`
      SELECT * FROM whatsapp_instances 
      WHERE status IN ('connected','open') AND (is_active = true OR is_active IS NULL)
      ORDER BY last_connection DESC 
      LIMIT 1
    `);

    if (!instance) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma instância WhatsApp conectada disponível'
      });
    }

    // Se não forneceu media_url, tentar encontrar uma imagem no uploads
    let finalMediaUrl = media_url;
    if (!finalMediaUrl) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        if (imageFiles.length > 0) {
          finalMediaUrl = `/api/uploads/${imageFiles[0]}`;
          logger.info(`Usando imagem encontrada: ${imageFiles[0]}`);
        }
      }
    }

    if (!finalMediaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem encontrada. Faça upload de uma imagem primeiro ou forneça media_url'
      });
    }

    // Normalizar telefone
    const normalizedPhone = normalizePhone(testPhone);

    // Buscar ou criar contato
    let contact = await dbGet('SELECT * FROM contacts WHERE phone = ?', [normalizedPhone]);
    if (!contact) {
      const result = await dbRun('INSERT INTO contacts (name, phone, is_blocked, is_active) VALUES (?, ?, false, true)', ['Teste', normalizedPhone]);
      contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    }

    // Preparar mídia (converter para Base64 se necessário)
    const finalMedia = await getMediaContent(finalMediaUrl);

    logger.info(`Enviando imagem de teste para ${testPhone}`, {
      instance: instance.name || instance.instance_id,
      mediaUrl: finalMediaUrl,
      mediaType: finalMedia.startsWith('data:') ? 'base64' : 'url'
    });

    // Enviar imagem via Evolution API
    const sentMessage = await evolutionAPI.sendImage(instance.name || instance.instance_id, {
      number: testPhone,
      caption: 'Teste de envio de imagem 🖼️',
      media: finalMedia
    });

    // Criar registro de mensagem
    await dbRun(`
      INSERT INTO messages (contact_id, content, message_type, media_url, status, sent_at, evolution_id)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `, [
      contact.id,
      'Teste de envio de imagem 🖼️',
      'image',
      finalMediaUrl,
      'sent',
      sentMessage?.key?.id || null
    ]);

    res.json({
      success: true,
      message: 'Imagem enviada com sucesso!',
      data: {
        phone: testPhone,
        instance: instance.name || instance.instance_id,
        media_url: finalMediaUrl,
        evolution_response: sentMessage
      }
    });
  } catch (error: any) {
    logger.error('Erro ao enviar imagem de teste:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar imagem',
      message: error.message
    });
  }
}));

// ===== INICIALIZAR SERVIDOR =====

// Inicializar banco de dados e depois iniciar servidor
initDatabase()
  .then(async () => {
    // Criar tabelas
    await createTables();

    // Carregar configurações da Evolution API
    await loadEvolutionConfigFromDB();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Dashboard: http://localhost:${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api`);

      // Iniciar cron jobs após o servidor estar rodando
      logger.info('Iniciando agendador de campanhas...');

      // Agendar campanhas (executa a cada minuto)
      cron.schedule('* * * * *', async () => {
        try {
          logger.debug('Verificando campanhas agendadas...');

          const campaigns = await dbAll(`
            SELECT 
              c.id,
              c.name,
              c.message as message_template,
              c.message_type,
              c.media_url,
              c.target_segment,
            GROUP_CONCAT(co.id) as contact_ids
            FROM campaigns c
            LEFT JOIN contacts co ON (
              (c.target_segment IS NULL OR c.target_segment = '') -- Se não tem segmento, pega todos (comportamento padrão?)
              OR 
              (c.target_segment IS NOT NULL AND c.target_segment != '' AND co.segment = c.target_segment) -- Se tem segmento, filtra
            )
            WHERE c.status = 'scheduled' 
              AND c.scheduled_at <= CURRENT_TIMESTAMP
            GROUP BY c.id
          `);

          for (const campaign of campaigns) {
            logger.info(`Processando campanha: ${campaign.name} (ID: ${campaign.id})`);
            logger.info(`Segmento alvo: "${campaign.target_segment}"`);

            // Se o usuário definiu um segmento mas não encontrou contatos, pode ser que o JOIN falhou ou não há contatos nesse segmento
            if (campaign.target_segment && (!campaign.contact_ids || campaign.contact_ids.length === 0)) {
              logger.warn(`Campanha ${campaign.name} tem segmento "${campaign.target_segment}" mas nenhum contato foi encontrado.`);
            }

            // Atualizar status da campanha
            await dbRun(`
              UPDATE campaigns 
              SET status = 'running', updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [campaign.id]);

            // Obter contatos da campanha
            const contactIds = campaign.contact_ids ? campaign.contact_ids.split(',') : [];

            if (contactIds.length === 0) {
              logger.warn(`Nenhum contato encontrado para a campanha ${campaign.name}`);
              await dbRun(`
                UPDATE campaigns 
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `, [campaign.id]);
              continue;
            }

            logger.info(`Encontrados ${contactIds.length} contatos para a campanha ${campaign.name}`);

            // Processar campanha com sistema de fila anti-bloqueio
            await processCampaignWithQueue(campaign, contactIds);
          }

        } catch (error) {
          logger.error('Erro no agendamento:', { error });
        }
      });
    });

    // ===== WEBHOOK BRIDGE (Elementor → Google Apps Script) =====
    // (Movido para o início do arquivo, antes do body-parser)
  })
  .catch(error => {
    logger.error('Erro ao inicializar banco de dados:', { error });
    process.exit(1);
  });
