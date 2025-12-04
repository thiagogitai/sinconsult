const axios = require('axios');

// ============================================
// CONFIGURAÇÃO - PREENCHA AQUI COM SEUS DADOS
// ============================================
const UAZAPI_URL = 'SUA_URL_AQUI'; // Exemplo: https://api.uazapi.com
const UAZAPI_KEY = 'SUA_API_KEY_AQUI'; // Sua chave de API
const INSTANCE_NAME = 'SUA_INSTANCIA'; // Nome da sua instância
const TEST_NUMBER = '5565981173624'; // Número de teste

// URLs públicas para teste de mídia
const TEST_IMAGE_URL = 'https://picsum.photos/800/600';
const TEST_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
const TEST_VIDEO_URL = 'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4';

async function testUAZAPI() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   TESTE COMPLETO UAZAPI - TODAS MÍDIAS ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log(`📱 Número: ${TEST_NUMBER}`);
    console.log(`🌐 URL: ${UAZAPI_URL}`);
    console.log(`📦 Instância: ${INSTANCE_NAME}\n`);

    const client = axios.create({
        baseURL: UAZAPI_URL,
        timeout: 60000,
        headers: {
            'Content-Type': 'application/json',
            'apikey': UAZAPI_KEY,
            'token': UAZAPI_KEY // Enviando ambos para compatibilidade
        }
    });

    let successCount = 0;
    let failCount = 0;

    // ==========================================
    // 1. TESTE DE TEXTO
    // ==========================================
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

        console.log('Payload:', JSON.stringify(textPayload, null, 2));
        const textResponse = await client.post('/send/text', textPayload);
        console.log('✅ TEXTO ENVIADO COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(textResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO AO ENVIAR TEXTO:');
        console.error('Status:', error.response?.status);
        console.error('Dados:', JSON.stringify(error.response?.data, null, 2));
        console.error('Mensagem:', error.message);
        failCount++;
    }

    console.log('\n⏳ Aguardando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ==========================================
    // 2. TESTE DE IMAGEM
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖼️  2. ENVIANDO IMAGEM...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const imagePayload = {
            instance: INSTANCE_NAME,
            remotejid: TEST_NUMBER,
            media: TEST_IMAGE_URL,
            caption: '✅ Teste UAZAPI - Imagem\n\nSe você vê esta imagem, o envio de IMAGENS está funcionando! 📸',
            type: 'image',
            fileName: 'teste.jpg'
        };

        console.log('Payload:', JSON.stringify(imagePayload, null, 2));
        const imageResponse = await client.post('/send/media', imagePayload);
        console.log('✅ IMAGEM ENVIADA COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(imageResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO AO ENVIAR IMAGEM:');
        console.error('Status:', error.response?.status);
        console.error('Dados:', JSON.stringify(error.response?.data, null, 2));
        console.error('Mensagem:', error.message);
        failCount++;
    }

    console.log('\n⏳ Aguardando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ==========================================
    // 3. TESTE DE ÁUDIO
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

        console.log('Payload:', JSON.stringify(audioPayload, null, 2));
        const audioResponse = await client.post('/send/media', audioPayload);
        console.log('✅ ÁUDIO ENVIADO COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(audioResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO AO ENVIAR ÁUDIO:');
        console.error('Status:', error.response?.status);
        console.error('Dados:', JSON.stringify(error.response?.data, null, 2));
        console.error('Mensagem:', error.message);
        failCount++;
    }

    console.log('\n⏳ Aguardando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ==========================================
    // 4. TESTE DE VÍDEO
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 4. ENVIANDO VÍDEO...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const videoPayload = {
            instance: INSTANCE_NAME,
            remotejid: TEST_NUMBER,
            media: TEST_VIDEO_URL,
            caption: '✅ Teste UAZAPI - Vídeo\n\nSe você vê este vídeo, o envio de VÍDEOS está funcionando! 🎥',
            type: 'video',
            fileName: 'teste.mp4'
        };

        console.log('Payload:', JSON.stringify(videoPayload, null, 2));
        const videoResponse = await client.post('/send/media', videoPayload);
        console.log('✅ VÍDEO ENVIADO COM SUCESSO!');
        console.log('Resposta:', JSON.stringify(videoResponse.data, null, 2));
        successCount++;
    } catch (error) {
        console.error('❌ ERRO AO ENVIAR VÍDEO:');
        console.error('Status:', error.response?.status);
        console.error('Dados:', JSON.stringify(error.response?.data, null, 2));
        console.error('Mensagem:', error.message);
        failCount++;
    }

    // ==========================================
    // RESUMO FINAL
    // ==========================================
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║           RESUMO DO TESTE              ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`✅ Sucessos: ${successCount}/4`);
    console.log(`❌ Falhas: ${failCount}/4`);

    if (successCount === 4) {
        console.log('\n🎉 PARABÉNS! Todos os testes passaram!');
        console.log('A UAZAPI está funcionando perfeitamente! 🚀');
    } else if (successCount > 0) {
        console.log('\n⚠️  Alguns testes falharam.');
        console.log('Verifique os erros acima para mais detalhes.');
    } else {
        console.log('\n❌ Todos os testes falharam!');
        console.log('Verifique:');
        console.log('  1. URL da UAZAPI está correta?');
        console.log('  2. API Key está correta?');
        console.log('  3. Nome da instância está correto?');
        console.log('  4. A instância está conectada?');
    }
    console.log('════════════════════════════════════════\n');
}

// Executar teste
testUAZAPI().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    process.exit(1);
});
