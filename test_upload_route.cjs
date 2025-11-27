const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
    try {
        // Login
        console.log('Fazendo login...');
        const loginResponse = await axios.post('http://localhost:3006/api/auth/login', {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('Login OK');

        // Criar arquivo dummy
        fs.writeFileSync('test_image.png', 'fake image content');

        // Upload
        console.log('Testando upload...');
        const form = new FormData();
        form.append('file', fs.createReadStream('test_image.png'), {
            filename: 'test_image.png',
            contentType: 'image/png',
        });

        const uploadResponse = await axios.post('http://localhost:3006/api/upload/media', form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        console.log('Upload Response:', uploadResponse.data);

        // Limpar
        fs.unlinkSync('test_image.png');

    } catch (error) {
        console.error('Erro:', error.response ? error.response.data : error.message);
    }
}

testUpload();
