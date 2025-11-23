import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import EvolutionAPI from './services/evolution';

// Carregar variáveis de ambiente
dotenv.config();

// Definir __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3008;

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

    // Criar tabelas básicas
    await createTables();
    console.log('✅ Tabelas criadas com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar SQLite:', error);
    throw error;
  }
}

// Criar tabelas básicas
async function createTables() {
  return new Promise<void>((resolve, reject) => {
    const createTablesSQL = `
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

      -- Tabela de mensagens
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      );

      -- Tabela de instâncias WhatsApp
      CREATE TABLE IF NOT EXISTS whatsapp_instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        phone_number TEXT,
        qrcode TEXT,
        status TEXT DEFAULT 'disconnected',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
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

// ===== ROTAS BÁSICAS DE TESTE =====

// Testar conexão
app.get('/api/test', (req, res) => {
  res.json({ message: 'API WhatsApp CRM funcionando!', timestamp: new Date().toISOString() });
});

// Testar Evolution API
app.get('/api/evolution/test', async (req, res) => {
  try {
    // Testar conexão criando uma instância de teste
    const testInstance = await evolutionAPI.createInstance('test-instance');
    
    // Se criou com sucesso, deletar a instância de teste
    await evolutionAPI.deleteInstance('test-instance');
    
    res.json({
      success: true,
      evolution_api: testInstance,
      message: 'Evolution API conectada com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao conectar com Evolution API',
      details: error.message
    });
  }
});

// Listar contatos
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await dbAll('SELECT * FROM contacts ORDER BY created_at DESC');
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

// Enviar mensagem de teste
app.post('/api/messages/send-test', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }

    // Formatar número de telefone
    const formattedPhone = phone.replace(/\D/g, '');
    const phoneNumber = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    // Enviar mensagem via Evolution API
    const response = await evolutionAPI.sendTextMessage('default', {
      number: phoneNumber,
      text: message
    });

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
      evolution_response: response,
      phone: phoneNumber
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      details: error.message
    });
  }
});

// Criar instância WhatsApp
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
        'INSERT INTO whatsapp_instances (name, phone_number, qrcode, status) VALUES (?, ?, ?, ?)',
        [name, phone_number || null, evolutionInstance.qrcode || null, evolutionInstance.status || 'disconnected']
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

// Deletar instância
app.delete('/api/whatsapp/instances/:name', async (req, res) => {
  try {
    const { name } = req.params;

    try {
      // Deletar da Evolution API
      await evolutionAPI.deleteInstance(name);
      
      // Deletar do banco de dados
      const result = await dbRun('DELETE FROM whatsapp_instances WHERE name = ?', [name]);
      
      if (result.changes > 0) {
        res.json({ message: 'Instância deletada com sucesso' });
      } else {
        res.status(404).json({ error: 'Instância não encontrada' });
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      res.status(500).json({
        error: 'Erro ao deletar instância',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erro ao deletar instância:', error);
    res.status(500).json({ error: 'Erro ao deletar instância' });
  }
});

// ===== INICIAR SERVIDOR =====

// Inicializar SQLite e iniciar servidor
async function startServer() {
  try {
    await initializeSQLite();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor WhatsApp CRM rodando na porta ${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`🔗 Evolution API: ${process.env.EVOLUTION_API_URL || 'http://localhost:8080'}`);
      console.log('✅ Banco de dados SQLite inicializado');
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();