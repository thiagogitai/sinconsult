const axios = require('axios');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

// Link direto do Google Drive (convertido do link de visualização)
// Original: https://drive.google.com/file/d/1Lr0ykX8e-OHB6Nx3J45us6HmXBZ7mPJz/view?usp=sharing
// Direto: https://drive.google.com/uc?export=download&id=1Lr0ykX8e-OHB6Nx3J45us6HmXBZ7mPJz
const AUDIO_URL = 'https://drive.google.com/uc?export=download&id=1Lr0ykX8e-OHB6Nx3J45us6HmXBZ7mPJz';

async function createAudioCampaign() {
    try {
        console.log('=== Criando Campanha de Áudio com Google Drive ===\n');

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Criar campanha de áudio
        console.log('Criando campanha de áudio...');
        console.log(`URL do áudio: ${AUDIO_URL}\n`);

        const audioCampaign = await axios.post(`${API_URL}/campaigns`, {
            name: 'Campanha Áudio Google Drive',
            message: 'Áudio de teste do Google Drive',
            message_type: 'audio',
            media_url: AUDIO_URL,
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString()
        }, { headers });

        console.log(`✅ Campanha criada: ID ${audioCampaign.data.id}`);

        // Iniciar campanha
        console.log('Iniciando campanha...');
        await axios.post(`${API_URL}/campaigns/${audioCampaign.data.id}/start`, {}, { headers });
        console.log('✅ Campanha iniciada!\n');

        // Aguardar processamento
        console.log('Aguardando 5 segundos para processar...');
        await new Promise(r => setTimeout(r, 5000));

        // Verificar status
        console.log('\n=== Verificando Status ===');
        const statsRes = await axios.get(`${API_URL}/campaigns/${audioCampaign.data.id}/stats`, { headers });

        console.log(`Total alvo: ${statsRes.data.total_target}`);
        console.log(`Enviadas: ${statsRes.data.total_sent}`);
        console.log(`Falhas: ${statsRes.data.total_failed}`);

        if (statsRes.data.total_sent > 0) {
            console.log('\n🎉 SUCESSO! Campanha de áudio enviada!');
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

createAudioCampaign();
