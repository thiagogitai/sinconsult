const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3006/api';
const IMAGE_PATH = path.join(__dirname, 'public', 'logo.png');
// Segredo JWT alinhado com o servidor
const JWT_SECRET = 'super-secret-jwt-key-2025-simconsult-secure-token-change-in-production';

async function testSendImage() {
    try {
        console.log('=== TESTE: Envio de Campanha com Imagem ===\n');

        // 1. Gerar token manualmente
        console.log('1. Gerando token...');
        const token = jwt.sign(
            { userId: 1, email: 'admin@crm.com', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Upload da imagem
        console.log('2. Fazendo upload da imagem...');
        if (!fs.existsSync(IMAGE_PATH)) throw new Error('Imagem não encontrada');

        const form = new FormData();
        form.append('file', fs.createReadStream(IMAGE_PATH));

        const uploadResponse = await axios.post(`${API_URL}/upload/media`, form, {
            headers: { ...headers, ...form.getHeaders() }
        });
        console.log(`✓ Upload OK: ${uploadResponse.data.url}`);

        // 3. Criar campanha de teste
        console.log('\n3. Criando campanha de teste...');
        // IMPORTANTE: Usar um número de teste seguro ou dummy se não tiver um real
        const testPhone = '5511999999999';

        const campaignData = {
            name: `Teste Envio Imagem - ${new Date().toLocaleTimeString()}`,
            message: 'Teste de envio de imagem automático',
            message_type: 'image',
            media_url: uploadResponse.data.url,
            scheduled_at: null,
            status: 'draft',
            is_test: true,
            test_phone: testPhone
        };

        const campaignResponse = await axios.post(`${API_URL}/campaigns`, campaignData, { headers });
        const campaignId = campaignResponse.data.id;
        console.log(`✓ Campanha criada: ID ${campaignId}`);

        // 4. Iniciar campanha (Disparar envio)
        console.log('\n4. Iniciando campanha (Disparando envio)...');
        const startResponse = await axios.post(`${API_URL}/campaigns/${campaignId}/start`, {}, { headers });

        console.log('✓ Campanha iniciada!');
        console.log('  Status:', startResponse.data.success ? 'SUCESSO' : 'FALHA');

        console.log('\n✅ Teste concluído! Verifique os logs do servidor para confirmar o envio para a API Evolution.');

    } catch (error) {
        console.error('\n❌ ERRO:', error.response ? error.response.data : error.message);
    }
}

testSendImage();
