const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configurações
const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';
const DB_PATH = path.resolve(__dirname, 'database.sqlite');

async function runTest() {
    try {
        console.log('=== TESTE ABRANGENTE DE SEGMENTOS ===\n');

        // 1. Login
        console.log('1. Gerando token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Cenários de Teste
        const scenarios = [
            { name: 'Segmento "teste 1"', segment: 'teste 1', expectedIds: [1] },
            { name: 'Segmento "teste"', segment: 'teste', expectedIds: [2] },
            { name: 'Sem Segmento (Todos)', segment: '', expectedIds: [1, 2, 3] }
        ];

        for (const scenario of scenarios) {
            console.log(`\n--- Testando: ${scenario.name} ---`);

            // Criar Campanha
            const campaignRes = await axios.post(`${API_URL}/campaigns`, {
                name: `Teste Segmento: ${scenario.name} - ${new Date().toLocaleTimeString()}`,
                message: `Teste para ${scenario.name}`,
                message_type: 'text',
                target_segment: scenario.segment,
                scheduled_at: new Date().toISOString(),
                is_test: false
            }, { headers });

            const campaignId = campaignRes.data.id;
            console.log(`✓ Campanha criada: ID ${campaignId}`);

            // Iniciar Campanha
            await axios.post(`${API_URL}/campaigns/${campaignId}/start`, {}, { headers });
            console.log('✓ Campanha iniciada!');

            // Aguardar processamento
            await new Promise(r => setTimeout(r, 3000));

            // Verificar mensagens
            await verifyMessages(campaignId, scenario.expectedIds);
        }

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

function verifyMessages(campaignId, expectedIds) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.all(`SELECT contact_id FROM messages WHERE campaign_id = ${campaignId}`, (err, rows) => {
            db.close();
            if (err) return reject(err);

            const contactIds = rows.map(r => r.contact_id).sort((a, b) => a - b);
            const expected = expectedIds.sort((a, b) => a - b);

            console.log(`  Mensagens geradas para contatos: [${contactIds.join(', ')}]`);

            const isEqual = JSON.stringify(contactIds) === JSON.stringify(expected);
            if (isEqual) {
                console.log(`  ✅ SUCESSO: Corresponde ao esperado [${expected.join(', ')}]`);
            } else {
                console.log(`  ❌ FALHA: Esperado [${expected.join(', ')}], mas obteve [${contactIds.join(', ')}]`);
            }
            resolve();
        });
    });
}

runTest();
