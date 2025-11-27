const axios = require('axios');

async function testUpdateContact() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:3006/api/auth/login', {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        // 2. Atualizar contato ID 1 com segment "teste 1"
        console.log('\n📝 Atualizando contato ID 1...');
        const updateRes1 = await axios.put('http://localhost:3006/api/contacts/1', {
            name: 'THIAGO luiz BARBOSA',
            phone: '5565981173624',
            email: 'thiagosprits@gmail.com',
            segment: 'teste 1'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Resposta:', updateRes1.data);

        // 3. Atualizar contato ID 2 com segment "teste"
        console.log('\n📝 Atualizando contato ID 2...');
        const updateRes2 = await axios.put('http://localhost:3006/api/contacts/2', {
            name: 'THIAGO luiz BARBOSAqqqq',
            phone: '556598117362433',
            email: 'thiagosprits@gmail.com',
            segment: 'teste'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Resposta:', updateRes2.data);

        // 4. Listar contatos para verificar
        console.log('\n📋 Listando contatos...');
        const listRes = await axios.get('http://localhost:3006/api/contacts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        listRes.data.forEach(contact => {
            console.log(`\nID: ${contact.id}`);
            console.log(`Nome: ${contact.name}`);
            console.log(`Segment/Tags: "${contact.tags}"`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

testUpdateContact();
