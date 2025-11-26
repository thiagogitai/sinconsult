-- Schema PostgreSQL para o sistema SimConsult
-- Migrado de SQLite para PostgreSQL

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  segment VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  media_url TEXT,
  scheduled_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  target_segment VARCHAR(100),
  created_by INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  use_tts BOOLEAN DEFAULT FALSE,
  tts_config_id VARCHAR(100),
  tts_audio_file VARCHAR(255),
  channel VARCHAR(50) DEFAULT 'whatsapp',
  sms_config_id INTEGER,
  sms_template_id INTEGER,
  email_config_id INTEGER,
  email_subject VARCHAR(255),
  email_template_id INTEGER,
  is_test BOOLEAN DEFAULT FALSE,
  test_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  campaign_id INTEGER,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  media_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  evolution_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de instâncias WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  instance_id VARCHAR(255) UNIQUE NOT NULL,
  qrcode TEXT,
  status VARCHAR(50) DEFAULT 'disconnected',
  phone_connected VARCHAR(50),
  last_connection TIMESTAMP,
  created_by INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações TTS
CREATE TABLE IF NOT EXISTS tts_configs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  api_key TEXT,
  voice_id VARCHAR(255),
  language VARCHAR(10) DEFAULT 'pt-BR',
  speed REAL DEFAULT 1.0,
  pitch REAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de arquivos TTS gerados
CREATE TABLE IF NOT EXISTS tts_files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_text TEXT NOT NULL,
  provider VARCHAR(100) NOT NULL,
  voice_id VARCHAR(255) NOT NULL,
  duration_seconds INTEGER,
  size_kb INTEGER,
  access_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT,
  category VARCHAR(100),
  message_type VARCHAR(50) DEFAULT 'text',
  created_by INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs de atividades
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de configurações SMS
CREATE TABLE IF NOT EXISTS sms_configs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  account_sid VARCHAR(255),
  auth_token VARCHAR(255),
  from_number VARCHAR(50),
  api_token TEXT,
  region VARCHAR(50),
  access_key_id VARCHAR(255),
  secret_access_key VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico SMS
CREATE TABLE IF NOT EXISTS sms_messages (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER,
  campaign_id INTEGER,
  sms_config_id INTEGER,
  phone_number VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  provider VARCHAR(100) NOT NULL,
  provider_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  cost REAL DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (sms_config_id) REFERENCES sms_configs(id) ON DELETE SET NULL
);

-- Tabela de templates SMS
CREATE TABLE IF NOT EXISTS sms_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  category VARCHAR(100) DEFAULT 'marketing',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações Email
CREATE TABLE IF NOT EXISTS email_configs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255),
  port INTEGER,
  secure BOOLEAN DEFAULT FALSE,
  user VARCHAR(255),
  password VARCHAR(255),
  from_email VARCHAR(255),
  api_key TEXT,
  region VARCHAR(50),
  access_key_id VARCHAR(255),
  secret_access_key VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico Email
CREATE TABLE IF NOT EXISTS email_messages (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER,
  campaign_id INTEGER,
  email_config_id INTEGER,
  email_address VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  provider VARCHAR(100) NOT NULL,
  provider_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounce_type VARCHAR(50),
  is_in_quarantine BOOLEAN DEFAULT FALSE,
  quarantine_reason TEXT,
  quarantine_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (email_config_id) REFERENCES email_configs(id) ON DELETE SET NULL
);

-- Tabela de descadastros
CREATE TABLE IF NOT EXISTS unsubscribes (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER,
  channel VARCHAR(50) NOT NULL,
  email_address VARCHAR(255),
  phone_number VARCHAR(50),
  reason TEXT,
  custom_message TEXT,
  unsubscribed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Tabela de templates de email
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT,
  text_content TEXT,
  variables TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações anti-blacklist
CREATE TABLE IF NOT EXISTS email_anti_blacklist (
  id SERIAL PRIMARY KEY,
  email_config_id INTEGER,
  spf_record TEXT,
  dkim_record TEXT,
  dmarc_record TEXT,
  domain_verification TEXT,
  reputation_score INTEGER DEFAULT 100,
  last_check TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (email_config_id) REFERENCES email_configs(id) ON DELETE CASCADE
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(50) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de configurações da aplicação
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR(100) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_contact ON sms_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_contact ON email_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_contact ON unsubscribes(contact_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email_address);

-- Inserir usuário admin padrão
INSERT INTO users (name, email, password_hash, role)
SELECT 'Administrador', 'admin@crm.com', '$2b$10$YourHashHere', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@crm.com');

-- Inserir configurações padrão da Evolution API
INSERT INTO app_settings (key, value, category)
SELECT 'evolutionApiUrl', 'https://solitarybaboon-evolution.cloudfy.live', 'api'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'evolutionApiUrl');

INSERT INTO app_settings (key, value, category)
SELECT 'evolutionApiKey', '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc', 'api'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'evolutionApiKey');
