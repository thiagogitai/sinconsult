import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import XLSX from 'xlsx';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import EvolutionAPI from './services/evolution';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = 3007; // Nova porta para evitar conflitos

// Configurar Evolution API
const evolutionAPI = new EvolutionAPI({
  baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY || 'your-api-key'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do SQLite
let db: Database;

// Inicializar SQLite
async function initializeSQLite() {
  try {
    // Criar diretório de dados se não existir
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Conectar ao SQLite
    db = new sqlite3.Database(path.join(dataDir, 'whatsapp_crm.db'), (err) => {
      if (err) {
        console.error('Erro ao conectar ao SQLite:', err);
        throw err;
      }
      console.log('✅ Conectado ao SQLite');
    });

    // Criar tabelas
    await createTables();
    console.log('✅ Tabelas criadas com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar SQLite:', error);
    throw error;
  }
}

// Criar tabelas
async function createTables() {
  return new Promise<void>((resolve, reject) => {
    const createTablesSQL = `
      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de contatos
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        segment TEXT DEFAULT 'default',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(phone)
      );

      -- Tabela de campanhas
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        media_url TEXT,
        target_segment TEXT,
        scheduled_time DATETIME,
        status TEXT DEFAULT 'draft',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Tabela de mensagens
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        campaign_id INTEGER,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        media_url TEXT,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        delivered_at DATETIME,
        read_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      );

      -- Tabela de instâncias WhatsApp
      CREATE TABLE IF NOT EXISTS whatsapp_instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        phone_number TEXT,
        qrcode TEXT,
        status TEXT DEFAULT 'disconnected',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Tabela de configurações
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de métricas
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        date DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Inserir usuário admin padrão
      INSERT OR IGNORE INTO users (name, email, password, role) 
      VALUES ('Admin', 'admin@whatsappcrm.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

      -- Inserir configurações padrão
      INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('evolution_api_url', 'http://localhost:8080'),
      ('evolution_api_key', 'your-api-key'),
      ('message_delay', '2000'),
      ('max_concurrent_messages', '1'),
      ('anti_blocking_enabled', 'true');
    `;

    db.exec(createTablesSQL, (err) => {
      if (err) {
        console.error('Erro ao criar tabelas:', err);
        reject(err);
      } else {
        console.log('Tabelas criadas com sucesso');
        resolve();
      }
    });
  });
}

// Funções auxiliares do banco de dados
function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE CONTATOS =====

// Listar contatos
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await dbAll(`
      SELECT id, name, phone, email, segment, created_at, updated_at
      FROM contacts 
      ORDER BY created_at DESC
    `);
    res.json(contacts);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// Adicionar contato
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, phone, email, segment } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    // Formatar telefone (remover caracteres especiais)
    const formattedPhone = phone.replace(/\D/g, '');

    const result = await dbRun(
      'INSERT INTO contacts (name, phone, email, segment) VALUES (?, ?, ?, ?)',
      [name, formattedPhone, email || null, segment || 'default']
    );

    const newContact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Telefone já cadastrado' });
    } else {
      res.status(500).json({ error: 'Erro ao adicionar contato' });
    }
  }
});

// Importar contatos via Excel
app.post('/api/contacts/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const importedContacts = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const name = row['Nome'] || row['Name'] || row['name'];
        const phone = row['Telefone'] || row['Phone'] || row['phone'];
        const email = row['Email'] || row['email'];
        const segment = row['Segmento'] || row['Segment'] || row['segment'] || 'default';

        if (!name || !phone) {
          errors.push(`Linha ${i + 2}: Nome e telefone são obrigatórios`);
          continue;
        }

        const formattedPhone = phone.toString().replace(/\D/g, '');

        const result = await dbRun(
          'INSERT OR IGNORE INTO contacts (name, phone, email, segment) VALUES (?, ?, ?, ?)',
          [name, formattedPhone, email || null, segment]
        );

        if (result.changes > 0) {
          importedContacts.push({ name, phone: formattedPhone, email, segment });
        }
      } catch (error) {
        errors.push(`Linha ${i + 2}: ${error.message}`);
      }
    }

    res.json({
      imported: importedContacts.length,
      errors: errors,
      total: data.length
    });
  } catch (error) {
    console.error('Erro ao importar contatos:', error);
    res.status(500).json({ error: 'Erro ao importar contatos' });
  }
});

// ===== ROTAS DE CAMPANHAS =====

// Listar campanhas
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await dbAll(`
      SELECT c.*, u.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(campaigns);
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    res.status(500).json({ error: 'Erro ao buscar campanhas' });
  }
});

// Criar campanha
app.post('/api/campaigns', async (req, res) => {
  try {
    const { name, message, message_type, media_url, target_segment, scheduled_time } = req.body;

    if (!name || !message) {
      return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });
    }

    const result = await dbRun(
      `INSERT INTO campaigns (name, message, message_type, media_url, target_segment, scheduled_time, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, 'draft', 1)`,
      [name, message, message_type || 'text', media_url || null, target_segment || null, scheduled_time || null]
    );

    const newCampaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [result.lastID]);
    res.status(201).json(newCampaign);
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ error: 'Erro ao criar campanha' });
  }
});

// ===== ROTAS DE MENSAGENS =====

// Listar mensagens
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await dbAll(`
      SELECT m.*, c.name as contact_name, c.phone as contact_phone
      FROM messages m
      LEFT JOIN contacts c ON m.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 100
    `);
    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem
app.post('/api/messages/send', async (req, res) => {
  try {
    const { contact_id, campaign_id, content, message_type, media_url } = req.body;

    if (!contact_id || !content) {
      return res.status(400).json({ error: 'Contato e conteúdo são obrigatórios' });
    }

    // Buscar contato
    const contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [contact_id]);
    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    // Criar mensagem no banco
    const result = await dbRun(
      'INSERT INTO messages (contact_id, campaign_id, content, message_type, media_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [contact_id, campaign_id || null, content, message_type || 'text', media_url || null, 'pending']
    );

    const messageId = result.lastID;

    // Enviar mensagem via Evolution API
    try {
      // Formatar número de telefone
      const phoneNumber = contact.phone.startsWith('55') ? contact.phone : `55${contact.phone}`;

      let response;
      if (message_type === 'text') {
        response = await evolutionAPI.sendTextMessage('default', {
          number: phoneNumber,
          text: content
        });
      } else if (message_type === 'image' && media_url) {
        response = await evolutionAPI.sendImageMessage('default', {
          number: phoneNumber,
          caption: content,
          media: media_url
        });
      }

      // Atualizar status da mensagem
      await dbRun(
        'UPDATE messages SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['sent', messageId]
      );

      res.json({
        message: 'Mensagem enviada com sucesso',
        message_id: messageId,
        evolution_response: response
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem via Evolution API:', error);
      
      // Atualizar status como erro
      await dbRun(
        'UPDATE messages SET status = ?, error_message = ? WHERE id = ?',
        ['error', error.message, messageId]
      );

      res.status(500).json({
        error: 'Erro ao enviar mensagem via WhatsApp',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ===== ROTAS DE WHATSAPP =====

// Listar instâncias
app.get('/api/whatsapp/instances', async (req, res) => {
  try {
    const instances = await dbAll('SELECT * FROM whatsapp_instances ORDER BY created_at DESC');
    res.json(instances);
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error);
    res.status(500).json({ error: 'Erro ao buscar instâncias' });
  }
});

// Criar instância
app.post('/api/whatsapp/instances', async (req, res) => {
  try {
    const { name, phone_number } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da instância é obrigatório' });
    }

    try {
      // Criar instância na Evolution API
      const evolutionInstance = await evolutionAPI.createInstance(name, phone_number);

      // Salvar no banco de dados
      const result = await dbRun(
        'INSERT INTO whatsapp_instances (name, phone_number, qrcode, status, created_by) VALUES (?, ?, ?, ?, ?)',
        [name, phone_number || null, evolutionInstance.qrcode || null, evolutionInstance.status || 'disconnected', 1]
      );

      const newInstance = await dbGet('SELECT * FROM whatsapp_instances WHERE id = ?', [result.lastID]);
      
      res.status(201).json({
        instance: newInstance,
        qrcode: evolutionInstance.qrcode,
        evolution_response: evolutionInstance
      });
    } catch (error) {
      console.error('Erro ao criar instância na Evolution API:', error);
      res.status(500).json({
        error: 'Erro ao criar instância na Evolution API',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({ error: 'Erro ao criar instância' });
  }
});

// Obter QR Code
app.get('/api/whatsapp/instances/:name/qrcode', async (req, res) => {
  try {
    const { name } = req.params;

    try {
      const qrcode = await evolutionAPI.getQRCode(name);
      
      // Atualizar QR Code no banco
      await dbRun(
        'UPDATE whatsapp_instances SET qrcode = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
        [qrcode.base64, name]
      );

      res.json({ qrcode });
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      res.status(500).json({
        error: 'Erro ao obter QR Code',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ error: 'Erro ao obter QR Code' });
  }
});

// Configurar multer para upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// ===== ROTAS DE TTS (Text-to-Speech) =====

// Gerar áudio TTS
app.post('/api/tts/generate', upload.single('text'), async (req, res) => {
  try {
    const { text, voice, provider } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    // Aqui você implementaria a integração com o serviço TTS escolhido
    // Por enquanto, vamos retornar uma resposta simulada
    const audioUrl = `/tmp/tts_${Date.now()}.mp3`;
    
    res.json({
      success: true,
      audio_url: audioUrl,
      text: text,
      voice: voice || 'default',
      provider: provider || 'google'
    });
  } catch (error) {
    console.error('Erro ao gerar TTS:', error);
    res.status(500).json({ error: 'Erro ao gerar áudio' });
  }
});

// ===== ROTAS DE MÉTRICAS =====

// Obter métricas do dashboard
app.get('/api/metrics/dashboard', async (req, res) => {
  try {
    const [
      totalContacts,
      totalMessages,
      sentMessages,
      deliveredMessages,
      totalCampaigns,
      activeInstances
    ] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM contacts'),
      dbGet('SELECT COUNT(*) as count FROM messages'),
      dbGet('SELECT COUNT(*) as count FROM messages WHERE status = "sent"'),
      dbGet('SELECT COUNT(*) as count FROM messages WHERE delivered_at IS NOT NULL'),
      dbGet('SELECT COUNT(*) as count FROM campaigns'),
      dbGet('SELECT COUNT(*) as count FROM whatsapp_instances WHERE status = "connected"')
    ]);

    const recentMessages = await dbAll(`
      SELECT m.*, c.name as contact_name, c.phone as contact_phone
      FROM messages m
      LEFT JOIN contacts c ON m.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `);

    res.json({
      contacts: totalContacts?.count || 0,
      messages: totalMessages?.count || 0,
      sent: sentMessages?.count || 0,
      delivered: deliveredMessages?.count || 0,
      campaigns: totalCampaigns?.count || 0,
      activeInstances: activeInstances?.count || 0,
      recentMessages
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// ===== INICIAR SERVIDOR =====

// Inicializar SQLite e iniciar servidor
async function startServer() {
  try {
    await initializeSQLite();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔧 API: http://localhost:${PORT}/api`);
      console.log('✅ Banco de dados SQLite inicializado');
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();