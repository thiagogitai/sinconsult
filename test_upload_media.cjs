const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        // Login first to get token
        const loginRes = await axios.post('http://localhost:3006/api/auth/login', {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token obtained');

        // Create a dummy image file
        const imagePath = path.join(__dirname, 'test_image.png');
        fs.writeFileSync(imagePath, 'fake image content');

        const form = new FormData();
        form.append('media', fs.createReadStream(imagePath));

        const uploadRes = await axios.post('http://localhost:3006/api/upload/media', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload response:', uploadRes.data);

        if (uploadRes.data.success) {
            console.log('✅ Upload de mídia funcionando!');
        } else {
            console.log('❌ Upload de mídia falhou:', uploadRes.data);
        }

        fs.unlinkSync(imagePath);

    } catch (error) {
        console.error('Test failed:', error.code || error.message);
        if (error.response) console.error('Response data:', error.response.data);
    }
}

testUpload();
