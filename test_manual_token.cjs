const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3006/api';
const IMAGE_PATH = path.join(__dirname, 'public', 'logo.png');
const JWT_SECRET = 'super-secret-jwt-key-2025-simconsult-secure-token-change-in-production';

async function testCampaignWithManualToken() {
    try {
        console.log('=== TESTE: Campanha com Token Manual ===\n');

        // 1. Gerar token manualmente
        console.log('1. Gerando token manual...');
        const token = jwt.sign(
            {
                userId: 1, // Assumindo ID 1 para admin
                email: 'admin@crm.com',
                role: 'admin'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('✓ Token gerado');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Verificar se imagem existe
        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Imagem não encontrada em: ${IMAGE_PATH}`);
        }
        console.log(`✓ Imagem encontrada: ${IMAGE_PATH}`);

        // 3. Upload da imagem
        console.log('\n3. Fazendo upload da imagem...');
        const form = new FormData();
        form.append('file', fs.createReadStream(IMAGE_PATH));

        const uploadResponse = await axios.post(`${API_URL}/upload/media`, form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            }
        });

        console.log('✓ Upload OK');
        console.log(`  URL: ${uploadResponse.data.url}`);
        console.log(`  Tipo: ${uploadResponse.data.type}`);

        // 4. Criar campanha
        console.log('\n4. Criando campanha com a imagem...');
        const campaignData = {
            name: `Campanha Imagem Manual - ${new Date().toLocaleTimeString()}`,
            message: 'Esta é uma campanha de teste com token manual.',
            message_type: uploadResponse.data.type,
            media_url: uploadResponse.data.url,
            scheduled_at: null,
            status: 'draft',
            segment_id: null
        };

        const campaignResponse = await axios.post(`${API_URL}/campaigns`, campaignData, { headers });

        console.log('✓ Campanha criada com sucesso!');
        console.log(`  ID: ${campaignResponse.data.id}`);
        console.log(`  Nome: ${campaignResponse.data.name}`);

        console.log('\n✅ SUCESSO TOTAL!');

    } catch (error) {
        console.error('\n❌ ERRO:', error.response ? error.response.data : error.message);
    }
}

testCampaignWithManualToken();
