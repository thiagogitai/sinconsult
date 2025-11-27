const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

async function createCampaigns() {
    try {
        console.log('=== Criando Campanhas Restantes ===\n');

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Campanha de IMAGEM
        console.log('2. Criando campanha de IMAGEM...');
        const imageCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Imagem Teste Frontend',
            message: 'Esta é uma imagem de teste',
            message_type: 'image',
            media_url: 'http://localhost:3006/uploads/test-image.jpg',
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });
        console.log(`✅ Campanha de imagem criada: ID ${imageCampaign.data.id}`);

        // Iniciar
        await axios.post(`${API_URL}/campaigns/${imageCampaign.data.id}/start`, {}, { headers });
        console.log('   Campanha iniciada!\n');

        // 3. Campanha de ÁUDIO
        console.log('3. Criando campanha de ÁUDIO...');
        const audioCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Áudio Teste Frontend',
            message: 'Áudio de teste',
            message_type: 'audio',
            media_url: 'http://localhost:3006/uploads/test-audio.mp3',
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });
        console.log(`✅ Campanha de áudio criada: ID ${audioCampaign.data.id}`);

        // Iniciar
        await axios.post(`${API_URL}/campaigns/${audioCampaign.data.id}/start`, {}, { headers });
        console.log('   Campanha iniciada!\n');

        // 4. Campanha de VÍDEO
        console.log('4. Criando campanha de VÍDEO...');
        const videoCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Vídeo Teste Frontend',
            message: 'Vídeo de teste',
            message_type: 'video',
            media_url: 'http://localhost:3006/uploads/test-video.mp4',
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });
        console.log(`✅ Campanha de vídeo criada: ID ${videoCampaign.data.id}`);

        // Iniciar
        await axios.post(`${API_URL}/campaigns/${videoCampaign.data.id}/start`, {}, { headers });
        console.log('   Campanha iniciada!\n');

        console.log('=== RESUMO ===');
        console.log('✅ Campanha TEXTO: Criada pelo frontend (browser)');
        console.log(`✅ Campanha IMAGEM: ID ${imageCampaign.data.id}`);
        console.log(`✅ Campanha ÁUDIO: ID ${audioCampaign.data.id}`);
        console.log(`✅ Campanha VÍDEO: ID ${videoCampaign.data.id}`);
        console.log('\nTodas as 4 campanhas foram criadas e iniciadas com sucesso!');
        console.log('Acesse http://localhost:3006/campaigns para ver todas.');

    } catch (error) {
        console.error('Erro:', error.response?.data || error.message);
    }
}

createCampaigns();
