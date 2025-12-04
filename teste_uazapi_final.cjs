const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const TEST_IMAGE_URL = 'https://picsum.photos/800/600';
const TEST_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4';
const TEST_NUMBER = '5565981173624';
const CHAT_ID = `${TEST_NUMBER}@c.us`; // Formato UAZAPI

async function getConfig() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT key, value FROM app_settings WHERE category = 'api'`, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            const config = {};
            rows.forEach(row => {
                config[row.key] = row.value;
            });

            db.get(`SELECT instance_id FROM whatsapp_instances WHERE status = 'connected' LIMIT 1`, [], (err, instance) => {
                if (instance) {
                    config.instanceId = instance.instance_id;
                }
                resolve(config);
            });
        });
    });
}

async function testUAZAPI() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║      TESTE UAZAPI - TODAS AS MÍDIAS    ║');
    console.log('╚════════════════════════════════════════╝\n');

    const config = await getConfig();

    const API_URL = config.uazapiUrl || config.evolutionApiUrl;
    const API_KEY = config.uazapiKey || config.evolutionApiKey;
    const INSTANCE = config.instanceId || 'simconsult';

    console.log(`🌐 URL: ${API_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
    console.log(`📦 Instância: ${INSTANCE}`);
    console.log(`📱 Chat ID: ${CHAT_ID}\n`);

    const client = axios.create({
        baseURL: API_URL,
        timeout: 60000,
        headers: {
            'Content-Type': 'application/json',
            'token': API_KEY
        }
    });

    let successCount = 0;
    let failCount = 0;

    // 1. TEXTO
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 1. ENVIANDO TEXTO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            chatID: CHAT_ID,
            body: '✅ Teste UAZAPI - Mensagem de Texto\n\nSe você recebeu esta mensagem, o envio de TEXTO está funcionando perfeitamente! 🎉'
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));
        const response = await client.post('/messages', payload);
        console.log('✅ TEXTO ENVIADO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.status, error.response?.data || error.message);
        failCount++;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 2. IMAGEM
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️  2. ENVIANDO IMAGEM...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            chatID: CHAT_ID,
            type: 'image',
            image: {
                link: TEST_IMAGE_URL
            },
            caption: '✅ Teste UAZAPI - Imagem\n\nImagem funcionando! 📸'
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));
        const response = await client.post('/messages', payload);
        console.log('✅ IMAGEM ENVIADA!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.status, error.response?.data || error.message);
        failCount++;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 3. ÁUDIO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 3. ENVIANDO ÁUDIO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            chatID: CHAT_ID,
            type: 'audio',
            audio: {
                link: TEST_AUDIO_URL
            }
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));
        const response = await client.post('/messages', payload);
        console.log('✅ ÁUDIO ENVIADO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.status, error.response?.data || error.message);
        failCount++;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 4. VÍDEO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 4. ENVIANDO VÍDEO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            chatID: CHAT_ID,
            type: 'video',
            video: {
                link: TEST_VIDEO_URL
            },
            caption: '✅ Teste UAZAPI - Vídeo\n\nVídeo funcionando! 🎥'
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));
        const response = await client.post('/messages', payload);
        console.log('✅ VÍDEO ENVIADO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.status, error.response?.data || error.message);
        failCount++;
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║              RESUMO                    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`✅ Sucessos: ${successCount}/4`);
    console.log(`❌ Falhas: ${failCount}/4\n`);

    if (successCount === 4) {
        console.log('🎉 TODOS OS TESTES PASSARAM! UAZAPI funcionando perfeitamente! 🚀\n');
    }

    db.close();
}

testUAZAPI().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    db.close();
    process.exit(1);
});
