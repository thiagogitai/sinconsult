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

        // Testar campanha 28 (primeira do teste de segmentos)
        const campaignId = 28;
        const statsRes = await axios.get(`${API_URL}/campaigns/${campaignId}/stats`, { headers });

        console.log('\n=== ESTATÍSTICAS DA CAMPANHA 28 ===\n');
        console.log('Totais:');
        console.log(`  Total Target: ${statsRes.data.total_target}`);
        console.log(`  Enviadas: ${statsRes.data.total_sent}`);
        console.log(`  Entregues: ${statsRes.data.total_delivered}`);
        console.log(`  Lidas: ${statsRes.data.total_read}`);
        console.log(`  Falhas: ${statsRes.data.total_failed}`);
        console.log(`  Pendentes: ${statsRes.data.total_pending}`);

        console.log('\nLista "Quem recebeu" (delivered):');
        console.log(`  Total de itens: ${statsRes.data.delivered.length}`);
        if (statsRes.data.delivered.length > 0) {
            console.log('  Itens:', JSON.stringify(statsRes.data.delivered, null, 2));
        } else {
            console.log('  ⚠️  Lista vazia!');
        }

    } catch (error) {
        console.error('Erro:', error.response?.data || error.message);
    }
}

testStats();
