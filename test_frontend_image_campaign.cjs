const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3006/api';
const LOGIN_EMAIL = 'admin@crm.com';
const LOGIN_PASS = 'admin123';

async function testImageCampaign() {
    try {
        console.log('=== TESTE: Criar Campanha com Imagem (Simulando Frontend) ===\n');

        // 1. Login
        console.log('1. Fazendo login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASS
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✓ Token obtido');

        // 2. Upload de imagem (simulando)
        console.log('\n2. Simulando upload de imagem...');
        // Como não temos uma imagem real, vamos usar uma URL de exemplo
        const fakeImageUrl = 'http://localhost:3006/uploads/test-image.jpg';
        console.log(`✓ URL da imagem: ${fakeImageUrl}`);

        // 3. Criar campanha com imagem
        console.log('\n3. Criando campanha com imagem...');
        const campaignData = {
            name: `Campanha Imagem Teste - ${new Date().toLocaleTimeString()}`,
            message: 'Legenda da imagem',
            message_type: 'image',
            media_url: fakeImageUrl,
            target_segment: 'teste 1',
            scheduled_at: new Date().toISOString(),
            is_test: false
        };

        console.log('Payload:', JSON.stringify(campaignData, null, 2));

        const campaignRes = await axios.post(`${API_URL}/campaigns`, campaignData, { headers });

        console.log('\n✅ SUCESSO! Campanha criada:');
        console.log(JSON.stringify(campaignRes.data, null, 2));

    } catch (error) {
        console.error('\n❌ ERRO:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testImageCampaign();
