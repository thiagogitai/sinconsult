// Script para testar as rotas da API
import http from 'http';

const BASE_URL = 'http://localhost:3006';

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

async function testRoutes() {
  console.log('🧪 Testando rotas da API...\n');

  // 1. Testar login
  console.log('1. Testando login...');
  try {
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@crm.com',
      password: 'admin123'
    });
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginRes.data, null, 2));
    
    if (loginRes.status !== 200) {
      console.error('❌ Login falhou!');
      return;
    }
    
    // O token pode estar em data.token ou data.data.token
    const token = loginRes.data.token || (loginRes.data.data && loginRes.data.data.token) || loginRes.data.data?.token;
    
    if (!token) {
      console.error('❌ Token não encontrado na resposta!');
      console.log('Resposta completa:', JSON.stringify(loginRes.data, null, 2));
      return;
    }
    console.log('✅ Login bem-sucedido!\n');

    // 2. Testar GET /api/segments
    console.log('2. Testando GET /api/segments...');
    const segmentsRes = await request('GET', '/api/segments', null, token);
    console.log('Status:', segmentsRes.status);
    console.log('Response:', JSON.stringify(segmentsRes.data, null, 2));
    if (segmentsRes.status === 200 || segmentsRes.status === 404) {
      console.log(segmentsRes.status === 200 ? '✅ OK' : '⚠️  404 (rota não encontrada)\n');
    } else {
      console.log('❌ Erro:', segmentsRes.status, '\n');
    }

    // 3. Testar GET /api/tts/files
    console.log('3. Testando GET /api/tts/files...');
    const ttsRes = await request('GET', '/api/tts/files', null, token);
    console.log('Status:', ttsRes.status);
    console.log('Response:', JSON.stringify(ttsRes.data, null, 2));
    if (ttsRes.status === 200 || ttsRes.status === 401) {
      console.log(ttsRes.status === 200 ? '✅ OK' : '⚠️  401 (não autorizado)\n');
    } else {
      console.log('❌ Erro:', ttsRes.status, '\n');
    }

    // 4. Testar GET /api/campaigns
    console.log('4. Testando GET /api/campaigns...');
    const campaignsGetRes = await request('GET', '/api/campaigns', null, token);
    console.log('Status:', campaignsGetRes.status);
    console.log('Response (primeiros 200 chars):', JSON.stringify(campaignsGetRes.data).substring(0, 200));
    if (campaignsGetRes.status === 200) {
      console.log('✅ OK\n');
    } else {
      console.log('❌ Erro:', campaignsGetRes.status, '\n');
    }

    // 5. Testar POST /api/campaigns (criar campanha)
    console.log('5. Testando POST /api/campaigns (criar campanha)...');
    const campaignData = {
      name: 'Teste Campanha ' + Date.now(),
      message_template: 'Mensagem de teste',
      message_type: 'text',
      channel: 'whatsapp'
    };
    
    const campaignsPostRes = await request('POST', '/api/campaigns', campaignData, token);
    console.log('Status:', campaignsPostRes.status);
    console.log('Response:', JSON.stringify(campaignsPostRes.data, null, 2));
    if (campaignsPostRes.status === 200 || campaignsPostRes.status === 201) {
      console.log('✅ Campanha criada com sucesso!\n');
    } else {
      console.log('❌ Erro ao criar campanha:', campaignsPostRes.status, '\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testRoutes();

