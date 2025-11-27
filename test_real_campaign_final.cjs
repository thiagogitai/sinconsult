const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configurações
const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

async function runTest() {
    try {
        console.log('=== TESTE: Campanha Real com Imagem ===\n');

        // 1. Login
        console.log('1. Gerando token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Upload Imagem
        console.log('2. Fazendo upload da imagem...');
        const form = new FormData();
        // Criar imagem dummy
        const imgPath = path.join(__dirname, 'temp_test_img.png');
        fs.writeFileSync(imgPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/5+BFwAE/wJ/9kF6AAAAAElFTkSuQmCC', 'base64'));
        form.append('file', fs.createReadStream(imgPath));

        const uploadRes = await axios.post(`${API_URL}/upload/media`, form, {
            headers: { ...headers, ...form.getHeaders() }
        });
        const mediaUrl = uploadRes.data.url;
        console.log(`✓ Upload OK: ${mediaUrl}`);

        // 3. Criar Campanha
        console.log('\n3. Criando campanha real...');
        const campaignRes = await axios.post(`${API_URL}/campaigns`, {
            name: `Campanha Real Teste Final - ${new Date().toLocaleTimeString()}`,
            message: 'Teste final de envio de imagem',
            message_type: 'image',
            media_url: mediaUrl,
            scheduled_at: new Date().toISOString(),
            is_test: false // IMPORTANTE: Não é teste
        }, { headers });

        const campaignId = campaignRes.data.id;
        console.log(`✓ Campanha criada: ID ${campaignId}`);

        // 4. Iniciar Campanha
        console.log('\n4. Iniciando campanha...');
        const startRes = await axios.post(`${API_URL}/campaigns/${campaignId}/start`, {}, { headers });
        console.log('✓ Campanha iniciada!');
        console.log('  Status:', startRes.data.success ? 'SUCESSO' : 'FALHA');

        // 5. Verificar mensagens (aguardar um pouco)
        console.log('\n5. Aguardando processamento...');
        await new Promise(r => setTimeout(r, 3000));

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

runTest();
