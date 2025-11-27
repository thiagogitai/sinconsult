const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://solitarybaboon-evolution.cloudfy.live';
const EVOLUTION_API_KEY = '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc';
const INSTANCE_NAME = 'simcolsult02';

// IMPORTANTE: Como a Evolution API está em servidor externo e você está rodando localmente,
// você precisa usar uma URL pública acessível pela Evolution API.
// Use ngrok ou similar para expor seu localhost:3006
const WEBHOOK_URL = 'http://localhost:3006/api/webhooks/evolution';

async function configureWebhook() {
    try {
        console.log('=== Configurando Webhook na Evolution API ===\n');
        console.log(`Instância: ${INSTANCE_NAME}`);
        console.log(`Webhook URL: ${WEBHOOK_URL}\n`);

        const headers = {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
        };

        // Configurar webhook (formato Evolution API v2)
        const webhookConfig = {
            webhook: {
                url: WEBHOOK_URL,
                webhook_by_events: false,
                webhook_base64: false,
                events: [
                    'MESSAGES_UPDATE',
                    'MESSAGES_UPSERT',
                    'SEND_MESSAGE'
                ]
            }
        };

        console.log('Enviando configuração...');
        const response = await axios.post(
            `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
            webhookConfig,
            { headers }
        );

        console.log('\n✅ Webhook configurado com sucesso!');
        console.log('Resposta:', JSON.stringify(response.data, null, 2));

        // Verificar configuração
        console.log('\n--- Verificando configuração ---');
        const checkResponse = await axios.get(
            `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
            { headers }
        );

        console.log('Configuração atual:');
        console.log(JSON.stringify(checkResponse.data, null, 2));

    } catch (error) {
        console.error('\n❌ Erro ao configurar webhook:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }

        console.log('\n💡 IMPORTANTE:');
        console.log('A Evolution API está em um servidor externo e não consegue acessar localhost.');
        console.log('\nVocê tem 2 opções:');
        console.log('\n1. Usar ngrok (recomendado para testes):');
        console.log('   npm install -g ngrok');
        console.log('   ngrok http 3006');
        console.log('   Copie a URL https://xxx.ngrok.io e altere WEBHOOK_URL neste script');
        console.log('\n2. Configurar manualmente na Evolution API:');
        console.log('   Acesse: https://solitarybaboon-evolution.cloudfy.live');
        console.log('   Configure o webhook com a URL pública do seu servidor');
        console.log('\nPor enquanto, as mensagens não receberão confirmação de entrega automática.');
        console.log('Mas o envio e as estatísticas básicas funcionam normalmente.');
    }
}

configureWebhook();
