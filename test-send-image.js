// Script para testar envio de imagem
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3006';
const TEST_PHONE = '65981173624';

// Função para fazer requisições
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Função para fazer upload de arquivo
function uploadFile(path, filePath, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    let contentType = 'image/jpeg';
    
    if (fileExt === '.png') contentType = 'image/png';
    else if (fileExt === '.gif') contentType = 'image/gif';
    else if (fileExt === '.webp') contentType = 'image/webp';

    const formData = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="media"; filename="${fileName}"`,
      `Content-Type: ${contentType}`,
      '',
      fileContent.toString('binary'),
      `--${boundary}--`
    ].join('\r\n');

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(Buffer.from(formData, 'binary'));
    req.end();
  });
}

async function testSendImage() {
  console.log('🧪 Testando envio de imagem...\n');

  // 0. Verificar se servidor está rodando
  console.log('0. Verificando se servidor está rodando...');
  try {
    const healthRes = await request('GET', '/api/health', null, null);
    console.log('✅ Servidor está respondendo\n');
  } catch (error) {
    console.error('❌ Servidor não está respondendo!');
    console.error('   Certifique-se de que o servidor está rodando em', BASE_URL);
    console.error('   Execute: npm run start:ts');
    return;
  }

  // 1. Login
  console.log('1. Fazendo login...');
  let loginRes;
  try {
    loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@crm.com',
      password: 'admin123'
    });
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    return;
  }

  if (loginRes.status !== 200) {
    console.error('❌ Login falhou!');
    return;
  }

  const token = loginRes.data.token || (loginRes.data.data && loginRes.data.data.token);
  if (!token) {
    console.error('❌ Token não encontrado!');
    return;
  }
  console.log('✅ Login bem-sucedido!\n');

  // 2. Usar rota de teste simplificada
  console.log(`2. Enviando imagem de teste para ${TEST_PHONE}...`);
  console.log('   (A rota de teste buscará automaticamente uma instância conectada e uma imagem)');

  const sendRes = await request('POST', '/api/test/send-image', {
    phone_number: TEST_PHONE
  }, token);

  console.log('\n📊 Resultado:');
  console.log('Status:', sendRes.status);
  console.log('Response:', JSON.stringify(sendRes.data, null, 2));

  if (sendRes.status === 200 || sendRes.status === 201) {
    console.log('\n✅ Mensagem com imagem enviada com sucesso!');
    if (sendRes.data.data) {
      console.log(`   Instância: ${sendRes.data.data.instance}`);
      console.log(`   Mídia: ${sendRes.data.data.media_url}`);
    }
  } else {
    console.log('\n❌ Erro ao enviar mensagem');
  }
}

testSendImage().catch(error => {
  console.error('❌ Erro:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
});

