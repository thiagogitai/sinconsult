const axios = require('axios');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

async function testStats() {
    try {
        // 1. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Pegar stats da última campanha (ID 30)
        const campaignId = 30;
        const statsRes = await axios.get(`${API_URL}/campaigns/${campaignId}/stats`, { headers });

        console.log('\n=== ESTATÍSTICAS DA CAMPANHA 30 ===\n');
        console.log(JSON.stringify(statsRes.data, null, 2));

    } catch (error) {
        console.error('Erro:', error.response?.data || error.message);
    }
}

testStats();
