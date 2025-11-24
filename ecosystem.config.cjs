// Configuração PM2 para produção na Hostinger (CommonJS)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [{
    name: 'simconsult',
    script: './dist-server/api/server.js',
    instances: 1,
    exec_mode: 'fork',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3006,
      JWT_SECRET: process.env.JWT_SECRET,
      FRONTEND_URL: process.env.FRONTEND_URL || 'https://certcrm.com.br',
      VITE_API_URL: process.env.VITE_API_URL || '/api',
      EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      ZENVIA_API_TOKEN: process.env.ZENVIA_API_TOKEN,
      ZENVIA_FROM: process.env.ZENVIA_FROM
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

