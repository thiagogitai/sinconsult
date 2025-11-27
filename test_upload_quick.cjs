const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
    try {
        console.log('=== TESTE DE UPLOAD ===\n');

        // 1. Login
        console.log('1. Login...');
        const loginResponse = await axios.post('http://localhost:3006/api/auth/login', {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginResponse.data.token;
        console.log('✓ Login OK\n');

        // 2. Criar arquivo de teste
        console.log('2. Criando arquivo de teste...');
        const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync('test_upload.png', imageBuffer);
        console.log('✓ Arquivo criado\n');

        // 3. Upload
        console.log('3. Testando upload...');
        const form = new FormData();
        form.append('file', fs.createReadStream('test_upload.png'), {
            filename: 'test_upload.png',
            contentType: 'image/png'
        });

        const uploadResponse = await axios.post('http://localhost:3006/api/upload/media', form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        console.log('✅ UPLOAD SUCESSO!');
        console.log('Resposta:', JSON.stringify(uploadResponse.data, null, 2));

        // Limpar
        fs.unlinkSync('test_upload.png');

    } catch (error) {
        console.error('\n❌ ERRO:', error.response ? error.response.data : error.message);
        if (fs.existsSync('test_upload.png')) {
            fs.unlinkSync('test_upload.png');
        }
    }
}

testUpload();
