const axios = require('axios');

// CONFIGURAÇÃO - PREENCHA AQUI
const UAZAPI_URL = 'https://api.uazapi.com'; // Exemplo, substitua pela sua URL
const UAZAPI_KEY = 'SUA_API_KEY'; // Substitua pela sua API Key
const INSTANCE_NAME = 'simcolsult02'; // Nome da sua instância
const TEST_NUMBER = '5565981173624'; // Seu número de teste

async function testUAZAPI() {
    console.log('=== TESTE UAZAPI ===');
    console.log(`URL: ${UAZAPI_URL}`);
    console.log(`Instância: ${INSTANCE_NAME}`);
    console.log(`Número: ${TEST_NUMBER}`);

    const client = axios.create({
        baseURL: UAZAPI_URL,
        headers: {
            'Content-Type': 'application/json',
            'apikey': UAZAPI_KEY,
            'token': UAZAPI_KEY // Enviando ambos para garantir compatibilidade v1/v2
        }
    });

    try {
        // 1. Teste de Conexão (Listar Instâncias)
        console.log('\n1. Verificando instâncias...');
        try {
            const instances = await client.get('/instance/fetchInstances');
            console.log('✅ Instâncias encontradas:', JSON.stringify(instances.data, null, 2));
        } catch (error) {
            console.error('❌ Erro ao listar instâncias:', error.response?.data || error.message);
        }

        // 2. Teste de Envio de Texto
        console.log('\n2. Enviando mensagem de texto...');
        try {
            const textPayload = {
                instance: INSTANCE_NAME,
                remotejid: TEST_NUMBER,
                body: 'Teste UAZAPI: Mensagem de texto via script',
                typing_time: 2,
                no_link_preview: false
            };
            const textResponse = await client.post('/send/text', textPayload);
            console.log('✅ Texto enviado:', JSON.stringify(textResponse.data, null, 2));
        } catch (error) {
            console.error('❌ Erro ao enviar texto:', error.response?.data || error.message);
        }

        // 3. Teste de Envio de Imagem (URL Pública)
        console.log('\n3. Enviando imagem...');
        try {
            const imagePayload = {
                instance: INSTANCE_NAME,
                remotejid: TEST_NUMBER,
                media: 'https://via.placeholder.com/150',
                caption: 'Teste UAZAPI: Imagem',
                type: 'image',
                fileName: 'test.jpg'
            };
            const imageResponse = await client.post('/send/media', imagePayload);
            console.log('✅ Imagem enviada:', JSON.stringify(imageResponse.data, null, 2));
        } catch (error) {
            console.error('❌ Erro ao enviar imagem:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Erro fatal no teste:', error.message);
    }
}

testUAZAPI();
