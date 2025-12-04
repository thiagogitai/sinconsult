const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// URLs públicas para teste de mídia
const TEST_IMAGE_URL = 'https://picsum.photos/800/600';
const TEST_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4';
const TEST_NUMBER = '5565981173624';

async function getUAZAPIConfig() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT key, value FROM app_settings WHERE category = 'api' AND (key = 'uazapiUrl' OR key = 'uazapiKey')`, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            const config = {};
            rows.forEach(row => {
                config[row.key] = row.value;
            });

            resolve(config);
        });
    });
}

async function findConnectedInstance(client) {
    console.log('🔍 Buscando instâncias conectadas...\n');

    try {
        const response = await client.get('/instance/fetchInstances');
        const instances = response.data;

        console.log('📋 Instâncias encontradas:', JSON.stringify(instances, null, 2));

        // Procurar instância conectada
        let connectedInstance = null;

        if (Array.isArray(instances)) {
            connectedInstance = instances.find(inst => inst.status === 'connected' || inst.state === 'open');
        } else if (instances.data && Array.isArray(instances.data)) {
            connectedInstance = instances.data.find(inst => inst.status === 'connected' || inst.state === 'open');
        }

        if (connectedInstance) {
            console.log('✅ Instância conectada encontrada:', connectedInstance.name || connectedInstance.instance);
            return connectedInstance.name || connectedInstance.instance;
        }

        console.warn('⚠️  Nenhuma instância conectada encontrada. Usando primeira disponível...');
        if (Array.isArray(instances) && instances.length > 0) {
            return instances[0].name || instances[0].instance;
        } else if (instances.data && instances.data.length > 0) {
            return instances.data[0].name || instances.data[0].instance;
        }

        throw new Error('Nenhuma instância disponível');
    } catch (error) {
        console.error('❌ Erro ao buscar instâncias:', error.response?.data || error.message);
        throw error;
    }
}

async function testUAZAPI() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   TESTE COMPLETO UAZAPI - TODAS MÍDIAS ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Buscar configurações do banco
    console.log('📊 Carregando configurações do banco de dados...\n');
    const config = await getUAZAPIConfig();

    const UAZAPI_URL = config.uazapiUrl;
    const UAZAPI_KEY = config.uazapiKey;

    if (!UAZAPI_URL || !UAZAPI_KEY) {
        console.error('❌ Configurações da UAZAPI não encontradas no banco!');
        console.error('Configure em Settings → API');
        process.exit(1);
    }

    console.log(`🌐 URL: ${UAZAPI_URL}`);
    console.log(`🔑 API Key: ${UAZAPI_KEY.substring(0, 10)}...`);
    console.log(`📱 Número: ${TEST_NUMBER}\n`);

    const client = axios.create({
        baseURL: UAZAPI_URL,
        timeout: 60000,
        headers: {
            'Content-Type': 'application/json',
            'apikey': UAZAPI_KEY,
            'token': UAZAPI_KEY
        }
    });

    // Buscar instância conectada
    const INSTANCE_NAME = await findConnectedInstance(client);
    console.log(`📦 Usando instância: ${INSTANCE_NAME}\n`);

    let successCount = 0;
    let failCount = 0;

    // 1. TEXTO
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 1. ENVIANDO MENSAGEM DE TEXTO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const textPayload = {
            instance: INSTANCE_NAME,
            remotejid: TEST_NUMBER,
            body: '✅ Teste UAZAPI - Mensagem de Texto\n\nSe você recebeu esta mensagem, o envio de TEXTO está funcionando perfeitamente! 🎉',
            typing_time: 2,
            no_link_preview: false
        };

        const textResponse = await client.post('/send/text', textPayload);
        console.log('✅ TEXTO ENVIADO COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(textResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. IMAGEM
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️  2. ENVIANDO IMAGEM...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const imagePayload = {
            instance: INSTANCE_NAME,
            remotejid: TEST_NUMBER,
            media: TEST_IMAGE_URL,
            caption: '✅ Teste UAZAPI - Imagem\n\nEnvio de IMAGENS funcionando! 📸',
            type: 'image',
            fileName: 'teste.jpg'
        };

        const imageResponse = await client.post('/send/media', imagePayload);
        console.log('✅ IMAGEM ENVIADA COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(imageResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. ÁUDIO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 3. ENVIANDO ÁUDIO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const audioPayload = {
            instance: INSTANCE_NAME,
            remotejid: TEST_NUMBER,
            media: TEST_AUDIO_URL,
            type: 'audio',
            fileName: 'teste.mp3'
        };

        const audioResponse = await client.post('/send/media', audioPayload);
        console.log('✅ ÁUDIO ENVIADO COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(audioResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. VÍDEO
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 4. ENVIANDO VÍDEO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const videoPayload = {
            instance: INSTANCE_NAME,
            remotejid: TEST_NUMBER,
            media: TEST_VIDEO_URL,
            caption: '✅ Teste UAZAPI - Vídeo\n\nEnvio de VÍDEOS funcionando! 🎥',
            type: 'video',
            fileName: 'teste.mp4'
        };

        const videoResponse = await client.post('/send/media', videoPayload);
        console.log('✅ VÍDEO ENVIADO COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(videoResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO:', error.response?.data || error.message);
        failCount++;
    }

    // RESUMO
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║           RESUMO DO TESTE              ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`✅ Sucessos: ${successCount}/4`);
    console.log(`❌ Falhas: ${failCount}/4`);

    if (successCount === 4) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('A UAZAPI está funcionando perfeitamente! 🚀');
    } else if (successCount > 0) {
        console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
    } else {
        console.log('\n❌ Todos os testes falharam! Verifique a configuração.');
    }
    console.log('════════════════════════════════════════\n');

    db.close();
}

testUAZAPI().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    db.close();
    process.exit(1);
});
