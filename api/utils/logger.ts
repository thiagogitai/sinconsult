import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Função para formatar data
const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

// Função para escrever no arquivo de log
const writeLog = (level: string, message: string, meta?: any): void => {
  const timestamp = formatDate(new Date());
  const logMessage = `[${timestamp}] [${level}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
  
  // Escrever no console
  console.log(logMessage.trim());
  
  // Escrever no arquivo
  const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage, 'utf8');
};

export const logger = {
  info: (message: string, meta?: any): void => {
    writeLog('INFO', message, meta);
  },
  
  warn: (message: string, meta?: any): void => {
    writeLog('WARN', message, meta);
  },
  
  error: (message: string, meta?: any): void => {
    writeLog('ERROR', message, meta);
  },
  
  debug: (message: string, meta?: any): void => {
    if (process.env.NODE_ENV === 'development') {
      writeLog('DEBUG', message, meta);
    }
  }
};

