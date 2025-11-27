import axios from 'axios';

async function testSendImage() {
    try {
        const API_URL = 'http://localhost:3006/api';
        const PHONE = '5565981173624';

        console.log('Autenticando...');
        const login = await axios.post(API_URL + '/auth/login', {
            username: 'admin',
            password: 'password'
        });
        const token = login.data.token;
        console.log('Token obtido.');

        console.log('Buscando instancias...');
        const instances = await axios.get(API_URL + '/whatsapp', {
            headers: { Authorization: 'Bearer ' + token }
        });

        const activeInstance = instances.data.find(i => i.status === 'connected' || i.status === 'open');
        if (!activeInstance) {
            console.error('Nenhuma instancia conectada encontrada!');
            return;
        }
        console.log('Usando instancia: ' + activeInstance.name + ' (' + activeInstance.instance_id + ')');

        console.log('Verificando contato...');
        let contactId;
        try {
            const contacts = await axios.get(API_URL + '/contacts', {
                headers: { Authorization: 'Bearer ' + token }
            });
            const contact = contacts.data.find(c => c.phone.includes(PHONE));
            if (contact) {
                contactId = contact.id;
                console.log('Contato existente encontrado: ID ' + contactId);
            } else {
                console.log('Criando novo contato...');
                const newContact = await axios.post(API_URL + '/contacts', {
                    name: 'Teste Manual',
                    phone: PHONE
                }, {
                    headers: { Authorization: 'Bearer ' + token }
                });
                contactId = newContact.data.id;
                console.log('Novo contato criado: ID ' + contactId);
            }
        } catch (e) {
            console.error('Erro ao gerenciar contato:', e.message);
            return;
        }

        console.log('Enviando imagem para ' + PHONE + ' (ID: ' + contactId + ')...');
        const sendResponse = await axios.post(API_URL + '/messages/send', {
            instance_id: activeInstance.instance_id,
            contact_id: contactId,
            message_type: 'image',
            content: 'Teste de envio de imagem via API (Base64 Fix)',
            media_url: 'https://via.placeholder.com/300.png/09f/fff'
        }, {
            headers: { Authorization: 'Bearer ' + token }
        });

        console.log('Resposta do envio:', JSON.stringify(sendResponse.data, null, 2));

    } catch (error) {
        console.error('Erro no teste:', error);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testSendImage();
