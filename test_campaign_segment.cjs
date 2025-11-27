const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'http://localhost:3006/api';

async function testCampaignWithSegment() {
    try {
        console.log('=== TESTE: Campanha com Segmento ===\n');

        // 1. Login
        console.log('1. Fazendo login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('✓ Login OK\n');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Listar segmentos disponíveis
        console.log('2. Listando segmentos...');
        const segmentsResponse = await axios.get(`${API_URL}/segments`, { headers });
        const segments = segmentsResponse.data;
        console.log(`✓ Segmentos encontrados: ${segments.length}`);
        segments.forEach(s => console.log(`  - ${s.name} (ID: ${s.id})`));
        console.log();

        // 3. Criar arquivo de imagem dummy
        console.log('3. Criando arquivo de teste...');
        const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync('test_campaign_image.png', imageBuffer);
        console.log('✓ Arquivo criado\n');

        // 4. Upload da imagem
        console.log('4. Fazendo upload da imagem...');
        const form = new FormData();
        form.append('file', fs.createReadStream('test_campaign_image.png'), {
            filename: 'test_campaign_image.png',
            contentType: 'image/png'
        });

        const uploadResponse = await axios.post(`${API_URL}/upload/media`, form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            }
        });

        console.log('✓ Upload OK');
        console.log(`  URL: ${uploadResponse.data.url}`);
        console.log(`  Tipo detectado: ${uploadResponse.data.type}\n`);

        // 5. Criar campanha com segmento específico
        const segmentId = segments.length > 0 ? segments[0].id : null;

        console.log('5. Criando campanha com segmento...');
        const campaignData = {
            name: `Teste Segmento - ${new Date().toLocaleString()}`,
            message: 'Mensagem de teste para segmento específico',
            message_type: uploadResponse.data.type,
            media_url: uploadResponse.data.url,
            segment_id: segmentId,
            scheduled_at: null,
            status: 'draft'
        };

        console.log(`  Segmento selecionado: ${segmentId || 'NENHUM'}`);

        const campaignResponse = await axios.post(`${API_URL}/campaigns`, campaignData, { headers });

        console.log('✓ Campanha criada');
        console.log(`  ID: ${campaignResponse.data.id}`);
        console.log(`  Nome: ${campaignResponse.data.name}`);
        console.log(`  Segmento salvo: ${campaignResponse.data.target_segment || 'NENHUM'}\n`);

        // 6. Verificar se o segmento foi salvo corretamente
        if (campaignResponse.data.target_segment === segmentId) {
            console.log('✅ SUCESSO: Segmento foi salvo corretamente!');
        } else {
            console.log('❌ ERRO: Segmento não foi salvo!');
            console.log(`  Esperado: ${segmentId}`);
            console.log(`  Recebido: ${campaignResponse.data.target_segment}`);
        }

        // Limpar
        fs.unlinkSync('test_campaign_image.png');

    } catch (error) {
        console.error('\n❌ ERRO:', error.response ? error.response.data : error.message);
        if (fs.existsSync('test_campaign_image.png')) {
            fs.unlinkSync('test_campaign_image.png');
        }
    }
}

testCampaignWithSegment();
