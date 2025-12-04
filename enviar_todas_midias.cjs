const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const TEST_IMAGE_URL = 'https://picsum.photos/800/600';
const TEST_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4';
const TEST_NUMBER = '5565981173624';

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

            // Buscar instância conectada
            db.get(`SELECT instance_id FROM whatsapp_instances WHERE status = 'connected' LIMIT 1`, [], (err, instance) => {
                if (instance) {
                    config.instanceId = instance.instance_id;
                }
                resolve(config);
            });
        });
    });
}

async function testEnvio() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   TESTE COMPLETO - TODAS AS MÍDIAS     ║');
    console.log('╚════════════════════════════════════════╝\n');

    const config = await getConfig();

    // Usar UAZAPI se configurado, senão Evolution
    const API_URL = config.uazapiUrl || config.evolutionApiUrl;
    const API_KEY = config.uazapiKey || config.evolutionApiKey;
    const INSTANCE = config.instanceId || 'simconsult';

    console.log(`🌐 URL: ${API_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
    console.log(`📦 Instância: ${INSTANCE}`);
    console.log(`📱 Número: ${TEST_NUMBER}\n`);

    const client = axios.create({
        baseURL: API_URL,
        timeout: 60000,
        headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
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
            instance: INSTANCE,
            remotejid: TEST_NUMBER,
            body: '✅ Teste - Mensagem de Texto\n\nTexto funcionando! 🎉',
            typing_time: 2
        };

        const response = await client.post('/send/text', payload);
        console.log('✅ SUCESSO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 2. IMAGEM
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️  2. ENVIANDO IMAGEM...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            instance: INSTANCE,
            remotejid: TEST_NUMBER,
            media: TEST_IMAGE_URL,
            caption: '✅ Teste - Imagem\n\nImagem funcionando! 📸',
            type: 'image',
            fileName: 'teste.jpg'
        };

        const response = await client.post('/send/media', payload);
        console.log('✅ SUCESSO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 3. ÁUDIO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 3. ENVIANDO ÁUDIO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            instance: INSTANCE,
            remotejid: TEST_NUMBER,
            media: TEST_AUDIO_URL,
            type: 'audio',
            fileName: 'teste.mp3'
        };

        const response = await client.post('/send/media', payload);
        console.log('✅ SUCESSO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 4. VÍDEO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 4. ENVIANDO VÍDEO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const payload = {
            instance: INSTANCE,
            remotejid: TEST_NUMBER,
            media: TEST_VIDEO_URL,
            caption: '✅ Teste - Vídeo\n\nVídeo funcionando! 🎥',
            type: 'video',
            fileName: 'teste.mp4'
        };

        const response = await client.post('/send/media', payload);
        console.log('✅ SUCESSO!', response.data);
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║              RESUMO                    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`✅ Sucessos: ${successCount}/4`);
    console.log(`❌ Falhas: ${failCount}/4\n`);

    db.close();
}

testEnvio().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    db.close();
    process.exit(1);
});
