-- Schema SQLite para o sistema SimConsult

PRAGMA foreign_keys = ON;

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  segment TEXT,
  is_active INTEGER DEFAULT 1,
  is_blocked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  scheduled_at DATETIME,
  status TEXT DEFAULT 'draft',
  target_segment TEXT,
  instance_name TEXT,
  created_by INTEGER,
  is_active INTEGER DEFAULT 1,
  use_tts INTEGER DEFAULT 0,
  tts_config_id TEXT,
  tts_audio_file TEXT,
  channel TEXT DEFAULT 'whatsapp',
  sms_config_id INTEGER,
  sms_template_id INTEGER,
  email_config_id INTEGER,
  email_subject TEXT,
  email_template_id INTEGER,
  is_test INTEGER DEFAULT 0,
  test_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  evolution_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- Tabela de instancias WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  instance_id TEXT UNIQUE NOT NULL,
  qrcode TEXT,
  status TEXT DEFAULT 'disconnected',
  phone_connected TEXT,
  last_connection DATETIME,
  created_by INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configuracoes TTS
CREATE TABLE IF NOT EXISTS tts_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  api_key TEXT,
  voice_id TEXT,
  language TEXT DEFAULT 'pt-BR',
  speed REAL DEFAULT 1.0,
  pitch REAL DEFAULT 1.0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de arquivos TTS gerados
CREATE TABLE IF NOT EXISTS tts_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_text TEXT NOT NULL,
  provider TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  duration_seconds INTEGER,
  size_kb INTEGER,
  access_count INTEGER DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT,
  category TEXT,
  message_type TEXT DEFAULT 'text',
  created_by INTEGER,
  is_active INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de atividades
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de configuracoes SMS
CREATE TABLE IF NOT EXISTS sms_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  account_sid TEXT,
  auth_token TEXT,
  from_number TEXT,
  api_token TEXT,
  region TEXT,
  access_key_id TEXT,
  secret_access_key TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de historico SMS
CREATE TABLE IF NOT EXISTS sms_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  campaign_id INTEGER,
  sms_config_id INTEGER,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT DEFAULT 'pending',
  cost REAL DEFAULT 0,
  error_message TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (sms_config_id) REFERENCES sms_configs(id) ON DELETE SET NULL
);

-- Tabela de templates SMS
CREATE TABLE IF NOT EXISTS sms_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  category TEXT DEFAULT 'marketing',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configuracoes Email
CREATE TABLE IF NOT EXISTS email_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  host TEXT,
  port INTEGER,
  secure INTEGER DEFAULT 0,
  user TEXT,
  password TEXT,
  from_email TEXT,
  api_key TEXT,
  region TEXT,
  access_key_id TEXT,
  secret_access_key TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de historico Email
CREATE TABLE IF NOT EXISTS email_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  campaign_id INTEGER,
  email_config_id INTEGER,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME,
  bounce_type TEXT,
  is_in_quarantine INTEGER DEFAULT 0,
  quarantine_reason TEXT,
  quarantine_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (email_config_id) REFERENCES email_configs(id) ON DELETE SET NULL
);

-- Tabela de descadastros
CREATE TABLE IF NOT EXISTS unsubscribes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  channel TEXT NOT NULL,
  email_address TEXT,
  phone_number TEXT,
  reason TEXT,
  custom_message TEXT,
  unsubscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Tabela de templates de email
CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  variables TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configuracoes anti-blacklist
CREATE TABLE IF NOT EXISTS email_anti_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_config_id INTEGER,
  spf_record TEXT,
  dkim_record TEXT,
  dmarc_record TEXT,
  domain_verification TEXT,
  reputation_score INTEGER DEFAULT 100,
  last_check DATETIME,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_config_id) REFERENCES email_configs(id) ON DELETE CASCADE
);

-- Tabela de notificacoes
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de configuracoes da aplicacao
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT DEFAULT 'general',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_contact ON sms_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_contact ON email_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_contact ON unsubscribes(contact_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email_address);

-- Inserir usuario admin padrao
INSERT INTO users (name, email, password_hash, role)
SELECT 'Administrador', 'admin@crm.com', '$2b$10$YourHashHere', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@crm.com');

-- Inserir configuracoes padrao da Evolution API
INSERT INTO app_settings (key, value, category)
SELECT 'evolutionApiUrl', 'https://solitarybaboon-evolution.cloudfy.live', 'api'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'evolutionApiUrl');

INSERT INTO app_settings (key, value, category)
SELECT 'evolutionApiKey', '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc', 'api'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'evolutionApiKey');
