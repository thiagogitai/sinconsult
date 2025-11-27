const axios = require('axios');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

// Vídeo pequeno de teste (Big Buck Bunny - 1MB)
const VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

async function createVideoCampaign() {
    try {
        console.log('=== Criando Campanha de Vídeo ===\n');

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Criar campanha de vídeo
        console.log('Criando campanha de vídeo...');
        console.log(`URL do vídeo: ${VIDEO_URL}\n`);

        const videoCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Vídeo Funcionando Final',
            message: 'Vídeo de teste Big Buck Bunny',
            message_type: 'video',
            media_url: VIDEO_URL,
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });

        console.log(`✅ Campanha criada: ID ${videoCampaign.data.id}`);

        // Iniciar campanha
        console.log('Iniciando campanha...');
        await axios.post(`${API_URL}/campaigns/${videoCampaign.data.id}/start`, {}, { headers });
        console.log('✅ Campanha iniciada!\n');

        // Aguardar processamento
        console.log('Aguardando 5 segundos para processar...');
        await new Promise(r => setTimeout(r, 5000));

        // Verificar status
        console.log('\n=== Verificando Status ===');
        const statsRes = await axios.get(`${API_URL}/campaigns/${videoCampaign.data.id}/stats`, { headers });

        console.log(`Total alvo: ${statsRes.data.total_target}`);
        console.log(`Enviadas: ${statsRes.data.total_sent}`);
        console.log(`Falhas: ${statsRes.data.total_failed}`);

        if (statsRes.data.total_sent > 0) {
            console.log('\n🎉 SUCESSO! Campanha de vídeo enviada!');
        } else if (statsRes.data.total_failed > 0) {
            console.log('\n❌ Falha ao enviar:');
            if (statsRes.data.failed && statsRes.data.failed.length > 0) {
                console.log(`Erro: ${statsRes.data.failed[0].error_message}`);
            }
        } else {
            console.log('\n⏳ Ainda processando...');
        }

    } catch (error) {
        console.error('\n❌ Erro:', error.response?.data || error.message);
    }
}

createVideoCampaign();
