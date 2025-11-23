const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const XLSX = require('xlsx');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do SQLite
let db;

// Inicializar SQLite
function initializeSQLite() {
  return new Promise((resolve, reject) => {
    try {
      // Criar diretório de dados se não existir
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Abrir conexão SQLite
      const dbPath = path.join(dataDir, 'crm_whatsapp.db');
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar ao SQLite:', err);
          reject(err);
          return;
        }
        console.log('✅ Conectado ao SQLite com sucesso!');
        
        // Criar tabelas
        createTables().then(() => {
          resolve();
        }).catch(reject);
      });
    } catch (error) {
      console.error('Erro ao conectar ao SQLite:', error);
      reject(error);
    }
  });
}

// Função para criar tabelas SQLite
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de usuários
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de contatos
      db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          segment TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de campanhas
      db.run(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          media_url TEXT,
          scheduled_at DATETIME,
          status TEXT DEFAULT 'draft',
          target_segment TEXT,
          created_by INTEGER,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de mensagens
      db.run(`
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de instâncias WhatsApp
      db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_instances (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          instance_id TEXT UNIQUE NOT NULL,
          qrcode TEXT,
          status TEXT DEFAULT 'disconnected',
          phone_connected TEXT,
          last_connection DATETIME,
          created_by INTEGER,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de configurações TTS
      db.run(`
        CREATE TABLE IF NOT EXISTS tts_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          api_key TEXT,
          voice_id TEXT,
          language TEXT DEFAULT 'pt-BR',
          speed REAL DEFAULT 1.0,
          pitch REAL DEFAULT 1.0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Inserir usuário admin padrão
        db.get('SELECT id FROM users WHERE email = ?', ['admin@crm.com'], (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            bcrypt.hash('admin123', 10, (err, hashedPassword) => {
              if (err) {
                reject(err);
                return;
              }
              
              db.run(`
                INSERT INTO users (name, email, password_hash, role) 
                VALUES (?, ?, ?, ?)
              `, ['Administrador', 'admin@crm.com', hashedPassword, 'admin'], (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                console.log('✅ Usuário admin criado: admin@crm.com / admin123');
                resolve();
              });
            });
          } else {
            resolve();
          }
        });
      });
    });
  });
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

// Criar diretório de uploads se não existir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    bcrypt.compare(password, user.password_hash, (err, validPassword) => {
      if (err) {
        console.error('Erro no login:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (!validPassword) {
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
    });
  });
});

// ===== ROTAS DO DASHBOARD =====

// Estatísticas do dashboard
app.get('/api/dashboard/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as count FROM contacts WHERE is_active = 1',
    'SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = DATE("now")',
    'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "delivered" THEN 1 END) as delivered FROM messages WHERE DATE(created_at) = DATE("now")',
    'SELECT COUNT(*) as count FROM whatsapp_instances WHERE status = "connected"'
  ];
  
  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  })).then(results => {
    const [totalContacts, messagesToday, deliveryStats, activeInstances] = results;
    
    const deliveryRate = deliveryStats.total > 0 ? 
      Math.round((deliveryStats.delivered / deliveryStats.total) * 100 * 100) / 100 : 0;
    
    res.json({
      total_contacts: totalContacts.count,
      messages_sent_today: messagesToday.count,
      delivery_rate: deliveryRate,
      active_instances: activeInstances.count
    });
  }).catch(error => {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  });
});

// Campanhas recentes
app.get('/api/dashboard/recent-campaigns', (req, res) => {
  db.all(`
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
  `, (err, campaigns) => {
    if (err) {
      console.error('Erro ao buscar campanhas recentes:', err);
      return res.status(500).json({ error: 'Erro ao buscar campanhas recentes' });
    }
    
    res.json(campaigns);
  });
});

// Status das instâncias WhatsApp
app.get('/api/dashboard/whatsapp-status', (req, res) => {
  db.all(`
    SELECT 
      id,
      name as instance_name,
      phone_connected as phone_number,
      status,
      last_connection as last_activity,
      created_at
    FROM whatsapp_instances
    WHERE is_active = 1
    ORDER BY created_at DESC
  `, (err, instances) => {
    if (err) {
      console.error('Erro ao buscar status WhatsApp:', err);
      return res.status(500).json({ error: 'Erro ao buscar status WhatsApp' });
    }
    
    res.json(instances);
  });
});

// ===== ROTAS DE CAMPANHAS =====

// Listar campanhas
app.get('/api/campaigns', (req, res) => {
  db.all(`
    SELECT 
      id,
      name,
      message as message_template,
      message_type,
      status,
      scheduled_at as schedule_time,
      0 as target_count,
      0 as sent_count,
      0 as delivered_count,
      0 as read_count,
      0 as failed_count,
      created_at
    FROM campaigns
    ORDER BY created_at DESC
  `, (err, campaigns) => {
    if (err) {
      console.error('Erro ao buscar campanhas:', err);
      return res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
    
    res.json(campaigns);
  });
});

// Criar campanha
app.post('/api/campaigns', (req, res) => {
  const { name, message_template, message_type, schedule_time } = req.body;
  
  db.run(`
    INSERT INTO campaigns (name, message, message_type, scheduled_at)
    VALUES (?, ?, ?, ?)
  `, [name, message_template, message_type, schedule_time], function(err) {
    if (err) {
      console.error('Erro ao criar campanha:', err);
      return res.status(500).json({ error: 'Erro ao criar campanha' });
    }
    
    db.get('SELECT * FROM campaigns WHERE id = ?', [this.lastID], (err, campaign) => {
      if (err) {
        console.error('Erro ao buscar campanha:', err);
        return res.status(500).json({ error: 'Erro ao buscar campanha' });
      }
      
      res.json(campaign);
    });
  });
});

// Atualizar status da campanha
app.patch('/api/campaigns/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run(`
    UPDATE campaigns 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, id], function(err) {
    if (err) {
      console.error('Erro ao atualizar status da campanha:', err);
      return res.status(500).json({ error: 'Erro ao atualizar status da campanha' });
    }
    
    db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, campaign) => {
      if (err) {
        console.error('Erro ao buscar campanha:', err);
        return res.status(500).json({ error: 'Erro ao buscar campanha' });
      }
      
      res.json(campaign);
    });
  });
});

// ===== ROTAS DE CONTATOS =====

// Listar contatos
app.get('/api/contacts', (req, res) => {
  const { search, tag, status } = req.query;
  let query = `
    SELECT 
      id,
      name,
      phone,
      email,
      segment as tags,
      '' as custom_fields,
      is_active,
      created_at,
      updated_at
    FROM contacts
    WHERE 1=1
  `;
  
  const params = [];
  
  if (search) {
    query += ` AND (name LIKE ? OR phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (tag) {
    query += ` AND segment = ?`;
    params.push(tag);
  }
  
  if (status) {
    query += ` AND is_active = ?`;
    params.push(status === 'active' ? 1 : 0);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  db.all(query, params, (err, contacts) => {
    if (err) {
      console.error('Erro ao buscar contatos:', err);
      return res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
    
    res.json(contacts);
  });
});

// Adicionar contato
app.post('/api/contacts', (req, res) => {
  const { name, phone, email, tags, custom_fields } = req.body;
  
  db.run(`
    INSERT INTO contacts (name, phone, email, segment)
    VALUES (?, ?, ?, ?)
  `, [name, phone, email, tags || ''], function(err) {
    if (err) {
      console.error('Erro ao criar contato:', err);
      return res.status(500).json({ error: 'Erro ao criar contato' });
    }
    
    db.get('SELECT * FROM contacts WHERE id = ?', [this.lastID], (err, contact) => {
      if (err) {
        console.error('Erro ao buscar contato:', err);
        return res.status(500).json({ error: 'Erro ao buscar contato' });
      }
      
      res.json(contact);
    });
  });
});

// ===== ROTAS DE IMPORTAÇÃO EXCEL =====

// Upload e processamento de Excel
app.post('/api/import/excel', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Processar dados
    let processed = 0;
    let errors = 0;
    const errorLog = [];
    
    // Processar em lote para melhor performance
    const processRow = (row) => {
      return new Promise((resolve) => {
        const name = row['Nome'] || row['name'];
        const phone = row['Telefone'] || row['phone'];
        const email = row['Email'] || row['email'];
        
        if (!name || !phone) {
          errors++;
          errorLog.push(`Linha ${processed + 1}: Nome e telefone são obrigatórios`);
          resolve();
          return;
        }
        
        // Verificar se já existe
        db.get('SELECT id FROM contacts WHERE phone = ?', [phone], (err, existing) => {
          if (err) {
            errors++;
            errorLog.push(`Linha ${processed + 1}: ${err.message}`);
            resolve();
            return;
          }
          
          if (!existing) {
            db.run(`
              INSERT INTO contacts (name, phone, email)
              VALUES (?, ?, ?)
            `, [name, phone, email], (err) => {
              if (err) {
                errors++;
                errorLog.push(`Linha ${processed + 1}: ${err.message}`);
              } else {
                processed++;
              }
              resolve();
            });
          } else {
            processed++;
            resolve();
          }
        });
      });
    };
    
    // Processar todas as linhas
    Promise.all(data.map(processRow)).then(() => {
      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);
      
      res.json({
        processed,
        errors,
        errorLog: errorLog.slice(0, 10),
        total: data.length
      });
    });
    
  } catch (error) {
    console.error('Erro ao processar Excel:', error);
    res.status(500).json({ error: 'Erro ao processar arquivo Excel' });
  }
});

// ===== ROTAS DE TTS =====

// Configurações TTS
app.get('/api/tts/configs', (req, res) => {
  db.all(`
    SELECT * FROM tts_configs 
    WHERE is_active = 1 
    ORDER BY created_at DESC
  `, (err, configs) => {
    if (err) {
      console.error('Erro ao buscar configurações TTS:', err);
      return res.status(500).json({ error: 'Erro ao buscar configurações TTS' });
    }
    
    res.json(configs);
  });
});

// Métricas TTS
app.get('/api/tts/metrics', (req, res) => {
  // SQLite não tem tabela tts_metrics, retornar dados mockados por enquanto
  res.json({
    total_requests: 0,
    total_characters: 0,
    total_duration: 0,
    total_cost_cents: 0,
    cache_hit_rate: 0
  });
});

// ===== ROTAS DE INSTÂNCIAS WHATSAPP =====

// Listar instâncias
app.get('/api/whatsapp/instances', (req, res) => {
  db.all(`
    SELECT 
      id,
      name as instance_name,
      phone_connected as phone_number,
      status,
      qrcode,
      datetime('now') as qrcode_expires_at,
      last_connection as last_activity,
      created_at
    FROM whatsapp_instances
    WHERE is_active = 1
    ORDER BY created_at DESC
  `, (err, instances) => {
    if (err) {
      console.error('Erro ao buscar instâncias WhatsApp:', err);
      return res.status(500).json({ error: 'Erro ao buscar instâncias WhatsApp' });
    }
    
    res.json(instances);
  });
});

// Criar instância
app.post('/api/whatsapp/instances', (req, res) => {
  const { instance_name, phone_number } = req.body;
  const instanceId = `instance_${Date.now()}`;
  
  db.run(`
    INSERT INTO whatsapp_instances (name, instance_id, phone_connected)
    VALUES (?, ?, ?)
  `, [instance_name, instanceId, phone_number], function(err) {
    if (err) {
      console.error('Erro ao criar instância WhatsApp:', err);
      return res.status(500).json({ error: 'Erro ao criar instância WhatsApp' });
    }
    
    db.get('SELECT * FROM whatsapp_instances WHERE id = ?', [this.lastID], (err, instance) => {
      if (err) {
        console.error('Erro ao buscar instância:', err);
        return res.status(500).json({ error: 'Erro ao buscar instância' });
      }
      
      res.json(instance);
    });
  });
});

// Atualizar status da instância
app.patch('/api/whatsapp/instances/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run(`
    UPDATE whatsapp_instances 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, id], function(err) {
    if (err) {
      console.error('Erro ao atualizar status da instância:', err);
      return res.status(500).json({ error: 'Erro ao atualizar status da instância' });
    }
    
    db.get('SELECT * FROM whatsapp_instances WHERE id = ?', [id], (err, instance) => {
      if (err) {
        console.error('Erro ao buscar instância:', err);
        return res.status(500).json({ error: 'Erro ao buscar instância' });
      }
      
      res.json(instance);
    });
  });
});

// ===== SISTEMA DE AGENDAMENTO =====

// Agendar campanhas (executa a cada minuto)
cron.schedule('* * * * *', () => {
  console.log('Verificando campanhas agendadas...');
  
  db.all(`
    SELECT 
      id,
      name,
      message as message_template,
      message_type,
      0 as target_count
    FROM campaigns
    WHERE status = 'scheduled' 
      AND scheduled_at <= datetime('now')
  `, (err, campaigns) => {
    if (err) {
      console.error('Erro no agendamento:', err);
      return;
    }
    
    campaigns.forEach(campaign => {
      console.log(`Processando campanha: ${campaign.name}`);
      
      // Aqui implementaríamos o envio real para o Evolution API
      // Por enquanto, apenas atualizamos o status
      db.run(`
        UPDATE campaigns 
        SET status = 'running', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [campaign.id]);
    });
  });
});

// ===== ROTAS DE SEGURANÇA =====

// Configurações de segurança
app.get('/api/security/configs', (req, res) => {
  // SQLite não tem tabela security_configs, retornar dados mockados
  res.json([]);
});

// ===== INICIAR SERVIDOR =====

initializeSQLite().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
  });
}).catch((error) => {
  console.error('❌ Erro ao inicializar banco de dados:', error);
  process.exit(1);
});

module.exports = app;