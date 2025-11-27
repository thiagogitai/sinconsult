const axios = require('axios');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

// URLs públicas de teste
const TEST_IMAGE_URL = 'https://picsum.photos/800/600';
const TEST_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4';

async function createWorkingCampaigns() {
    try {
        console.log('=== Criando Campanhas com URLs Públicas ===\n');

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Campanha de IMAGEM
        console.log('1. Criando campanha de IMAGEM...');
        const imageCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Imagem Funcionando',
            message: 'Imagem de teste com URL pública',
            message_type: 'image',
            media_url: TEST_IMAGE_URL,
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });
        console.log(`✅ Campanha criada: ID ${imageCampaign.data.id}`);

        await axios.post(`${API_URL}/campaigns/${imageCampaign.data.id}/start`, {}, { headers });
        console.log('   Iniciada!\n');

        // Aguardar 2s
        await new Promise(r => setTimeout(r, 2000));

        // 2. Campanha de ÁUDIO
        console.log('2. Criando campanha de ÁUDIO...');
        const audioCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Áudio Funcionando',
            message: 'Áudio de teste',
            message_type: 'audio',
            media_url: TEST_AUDIO_URL,
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });
        console.log(`✅ Campanha criada: ID ${audioCampaign.data.id}`);

        await axios.post(`${API_URL}/campaigns/${audioCampaign.data.id}/start`, {}, { headers });
        console.log('   Iniciada!\n');

        // Aguardar 2s
        await new Promise(r => setTimeout(r, 2000));

        // 3. Campanha de VÍDEO
        console.log('3. Criando campanha de VÍDEO...');
        const videoCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Vídeo Funcionando',
            message: 'Vídeo de teste',
            message_type: 'video',
            media_url: TEST_VIDEO_URL,
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });
        console.log(`✅ Campanha criada: ID ${videoCampaign.data.id}`);

        await axios.post(`${API_URL}/campaigns/${videoCampaign.data.id}/start`, {}, { headers });
        console.log('   Iniciada!\n');

        console.log('=== CONCLUÍDO ===');
        console.log('✅ 3 campanhas criadas com URLs públicas');
        console.log('Aguarde alguns segundos e verifique o status em:');
        console.log('http://localhost:3006/campaigns');

    } catch (error) {
        console.error('\n❌ Erro:', error.response?.data || error.message);
    }
}

createWorkingCampaigns();
