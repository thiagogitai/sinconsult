const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const sqlite3 = require('sqlite3').verbose();

// Configurações
const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';
const DB_PATH = path.resolve(__dirname, 'database.sqlite');

async function runTest() {
    try {
        console.log('=== TESTE: Campanha Real com Vídeo ===\n');

        // 1. Login
        console.log('1. Gerando token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Upload Vídeo
        console.log('2. Fazendo upload do vídeo...');
        const form = new FormData();
        const videoPath = path.join(__dirname, 'temp_test_video.mp4');
        if (!fs.existsSync(videoPath)) {
            fs.writeFileSync(videoPath, Buffer.from('DUMMY VIDEO CONTENT'), 'utf8');
        }
        form.append('file', fs.createReadStream(videoPath));

        const uploadRes = await axios.post(`${API_URL}/upload/media`, form, {
            headers: { ...headers, ...form.getHeaders() }
        });
        const mediaUrl = uploadRes.data.url;
        console.log(`✓ Upload OK: ${mediaUrl}`);

        // 3. Criar Campanha
        console.log('\n3. Criando campanha de vídeo...');
        const campaignRes = await axios.post(`${API_URL}/campaigns`, {
            name: `Campanha Vídeo Teste - ${new Date().toLocaleTimeString()}`,
            message: 'Vídeo de teste',
            message_type: 'video',
            media_url: mediaUrl,
            scheduled_at: new Date().toISOString(),
            is_test: false
        }, { headers });

        const campaignId = campaignRes.data.id;
        console.log(`✓ Campanha criada: ID ${campaignId}`);

        // 4. Iniciar Campanha
        console.log('\n4. Iniciando campanha...');
        const startRes = await axios.post(`${API_URL}/campaigns/${campaignId}/start`, {}, { headers });
        console.log('✓ Campanha iniciada!');
        console.log('  Status:', startRes.data.success ? 'SUCESSO' : 'FALHA');

        // 5. Verificar mensagens no banco
        console.log('\n5. Verificando mensagens no banco...');
        await new Promise(r => setTimeout(r, 3000));

        const db = new sqlite3.Database(DB_PATH);
        db.all(`SELECT id, contact_id, status, message_type, sent_at, error_message FROM messages WHERE campaign_id = ${campaignId}`, (err, messages) => {
            if (err) { console.error(err); return; }

            if (messages.length === 0) {
                console.log('⚠️ Nenhuma mensagem encontrada.');
            } else {
                console.log(`Total de mensagens: ${messages.length}`);
                console.table(messages);
                const sent = messages.filter(m => m.status === 'sent').length;
                console.log(`✅ Enviadas: ${sent}`);
                if (sent > 0) console.log('🎉 SUCESSO TOTAL!');
            }
            db.close();
        });

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

runTest();
