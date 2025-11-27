const axios = require('axios');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

async function testStats() {
    try {
        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // Testar campanha 23 (tem 1 sent e 2 failed)
        const campaignId = 23;
        const statsRes = await axios.get(`${API_URL}/campaigns/${campaignId}/stats`, { headers });

        console.log('\n=== ESTATÍSTICAS DA CAMPANHA 23 ===\n');
        console.log('Totais:');
        console.log(`  Total Target: ${statsRes.data.total_target}`);
        console.log(`  Enviadas: ${statsRes.data.total_sent}`);
        console.log(`  Entregues: ${statsRes.data.total_delivered}`);
        console.log(`  Falhas: ${statsRes.data.total_failed}`);

        console.log('\n📋 Lista "Quem recebeu" (delivered):');
        console.log(`  Total de itens: ${statsRes.data.delivered.length}`);
        if (statsRes.data.delivered.length > 0) {
            console.log('\n  ✅ Dados retornados:');
            statsRes.data.delivered.forEach((item, i) => {
                console.log(`  ${i + 1}. ${item.name} (${item.phone}) - Status: ${item.status}`);
            });
        } else {
            console.log('  ⚠️  Lista vazia! (Deveria ter 1 item com status sent)');
        }

    } catch (error) {
        console.error('\n❌ Erro:', error.response?.data || error.message);
    }
}

testStats();
