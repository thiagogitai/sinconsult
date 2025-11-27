const axios = require('axios');

// Configurações
const EVOLUTION_URL = 'https://solitarybaboon-evolution.cloudfy.live';
const API_KEY = '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc'; // API Key correta do banco
const INSTANCE_NAME = 'simcolsult02'; // Nome correto informado pelo usuário
const TEST_NUMBER = '5565981173624'; // Thiago

async function testEvolutionDirect() {
    try {
        console.log(`=== TESTE DIRETO EVOLUTION API (${INSTANCE_NAME}) ===`);

        const headers = {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        };

        // 1. Verificar Status
        console.log('\n1. Verificando status...');
        try {
            const statusRes = await axios.get(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`, { headers });
            console.log('Status:', JSON.stringify(statusRes.data, null, 2));
        } catch (e) {
            console.error('Erro ao verificar status:', e.message);
            if (e.response) console.error('Detalhes:', e.response.data);
        }

        // 2. Enviar Texto
        console.log('\n2. Enviando texto...');
        try {
            const textPayload = {
                number: TEST_NUMBER,
                text: 'Teste de envio SimConsult 02'
            };
            const textRes = await axios.post(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, textPayload, { headers });
            console.log('Envio Texto OK:', JSON.stringify(textRes.data, null, 2));
        } catch (e) {
            console.error('Erro ao enviar texto:', e.message);
            if (e.response) console.error('Detalhes:', e.response.data);
        }

    } catch (error) {
        console.error('Erro geral:', error.message);
    }
}

testEvolutionDirect();
