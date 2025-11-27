const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configurações
const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';
const DB_PATH = path.resolve(__dirname, 'database.sqlite');

async function runTest() {
    try {
        console.log('=== TESTE: Filtro de Segmento ===\n');

        // 1. Login
        console.log('1. Gerando token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Criar Campanha com Segmento 'teste 1'
        console.log('\n2. Criando campanha para segmento "teste 1"...');
        const campaignRes = await axios.post(`${API_URL}/campaigns`, {
            name: `Campanha Segmento Teste - ${new Date().toLocaleTimeString()}`,
            message: 'Teste de segmento',
            message_type: 'text',
            target_segment: 'teste 1', // Segmento específico
            scheduled_at: new Date().toISOString(),
            is_test: false
        }, { headers });

        const campaignId = campaignRes.data.id;
        console.log(`✓ Campanha criada: ID ${campaignId}`);

        // 3. Iniciar Campanha
        console.log('\n3. Iniciando campanha...');
        const startRes = await axios.post(`${API_URL}/campaigns/${campaignId}/start`, {}, { headers });
        console.log('✓ Campanha iniciada!');

        // 4. Verificar mensagens no banco
        console.log('\n4. Verificando mensagens no banco...');
        await new Promise(r => setTimeout(r, 3000));

        const db = new sqlite3.Database(DB_PATH);
        db.all(`SELECT id, contact_id, status, message_type FROM messages WHERE campaign_id = ${campaignId}`, (err, messages) => {
            if (err) { console.error(err); return; }

            console.log(`Total de mensagens: ${messages.length}`);
            console.table(messages);

            // Validação
            const contactIds = messages.map(m => m.contact_id);
            const expectedContactId = 1; // ID do contato com segmento 'teste 1'

            if (messages.length === 1 && contactIds.includes(expectedContactId)) {
                console.log('🎉 SUCESSO: Enviou apenas para o contato do segmento correto!');
            } else {
                console.log('❌ FALHA: Enviou para contatos incorretos ou quantidade errada.');
                console.log(`Esperado: [${expectedContactId}], Recebido: [${contactIds.join(', ')}]`);
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
