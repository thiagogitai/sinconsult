const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:3006/api';
const IMAGE_PATH = path.join(__dirname, 'public', 'logo.png');

async function testCampaignWithRealImage() {
    try {
        console.log('=== TESTE: Campanha com Imagem Real ===\n');

        // 1. Login
        console.log('1. Fazendo login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('✓ Login OK');

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
        console.log(`  Mime: ${uploadResponse.data.mimetype}`);

        // 4. Criar campanha
        console.log('\n4. Criando campanha com a imagem...');
        const campaignData = {
            name: `Campanha Imagem Real - ${new Date().toLocaleTimeString()}`,
            message: 'Esta é uma campanha de teste com imagem real.',
            message_type: uploadResponse.data.type, // Deve ser 'image'
            media_url: uploadResponse.data.url,
            scheduled_at: null,
            status: 'draft',
            segment_id: null // Opcional
        };

        const campaignResponse = await axios.post(`${API_URL}/campaigns`, campaignData, { headers });

        console.log('✓ Campanha criada com sucesso!');
        console.log(`  ID: ${campaignResponse.data.id}`);
        console.log(`  Nome: ${campaignResponse.data.name}`);
        console.log(`  Tipo Mensagem: ${campaignResponse.data.message_type}`);
        console.log(`  Media URL: ${campaignResponse.data.media_url}`);

        if (campaignResponse.data.message_type === 'image' && campaignResponse.data.media_url) {
            console.log('\n✅ SUCESSO TOTAL: Campanha criada com imagem corretamente!');
        } else {
            console.log('\n⚠️ AVISO: Algo não parece certo com os dados da campanha.');
        }

    } catch (error) {
        console.error('\n❌ ERRO:', error.response ? error.response.data : error.message);
    }
}

testCampaignWithRealImage();
