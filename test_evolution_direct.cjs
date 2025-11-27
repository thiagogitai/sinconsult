const axios = require('axios');

// Configurações (ajuste conforme necessário)
const EVOLUTION_URL = 'https://solitarybaboon-evolution.cloudfy.live';
const API_KEY = 'bf3d1587038743979805991535454261'; // Peguei do banco de dados ou .env se possível, mas vou usar o que vi nos logs ou assumir que está no banco
const INSTANCE_NAME = 'SimConsult'; // Nome da instância que vi no banco ou assumindo padrão
const TEST_NUMBER = '5565981173624'; // Número do Thiago

async function testEvolutionDirect() {
    try {
        console.log('=== TESTE DIRETO EVOLUTION API ===');
        console.log(`URL: ${EVOLUTION_URL}`);
        console.log(`Instância: ${INSTANCE_NAME}`);
        console.log(`Número: ${TEST_NUMBER}`);

        const headers = {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        };

        // 1. Verificar Status da Instância
        console.log('\n1. Verificando status da instância...');
        try {
            const statusRes = await axios.get(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`, { headers });
            console.log('Status:', JSON.stringify(statusRes.data, null, 2));
        } catch (e) {
            console.error('Erro ao verificar status:', e.message);
            if (e.response) console.error('Detalhes:', e.response.data);
        }

        // 2. Enviar Texto Simples
        console.log('\n2. Enviando texto simples...');
        try {
            const textPayload = {
                number: TEST_NUMBER,
                text: 'Teste direto do script de debug (Texto)'
            };
            const textRes = await axios.post(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, textPayload, { headers });
            console.log('Envio Texto OK:', JSON.stringify(textRes.data, null, 2));
        } catch (e) {
            console.error('Erro ao enviar texto:', e.message);
            if (e.response) console.error('Detalhes:', e.response.data);
        }

        // 3. Enviar Imagem (URL Pública)
        console.log('\n3. Enviando imagem (URL Pública)...');
        try {
            const mediaPayload = {
                number: TEST_NUMBER,
                mediatype: 'image',
                mimetype: 'image/png',
                media: 'https://via.placeholder.com/150',
                caption: 'Teste direto (Imagem URL)'
            };
            const mediaRes = await axios.post(`${EVOLUTION_URL}/message/sendMedia/${INSTANCE_NAME}`, mediaPayload, { headers });
            console.log('Envio Imagem OK:', JSON.stringify(mediaRes.data, null, 2));
        } catch (e) {
            console.error('Erro ao enviar imagem:', e.message);
            if (e.response) console.error('Detalhes:', e.response.data);
        }

    } catch (error) {
        console.error('Erro geral:', error.message);
    }
}

testEvolutionDirect();
