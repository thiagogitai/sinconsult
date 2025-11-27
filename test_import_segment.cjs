const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function testImport() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:3006/api/auth/login', {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // Create Excel file WITHOUT segment column
        const data = [
            { Nome: "Teste Import 1", Telefone: "5511999999991" },
            { Nome: "Teste Import 2", Telefone: "5511999999992" }
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Contatos");
        const filePath = path.join(__dirname, 'test_import.xlsx');
        XLSX.writeFile(wb, filePath);

        // Import with global tag
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('tag', 'SegmentoTesteGlobal');

        const importRes = await axios.post('http://localhost:3006/api/contacts/import', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Import response:', importRes.data);

        // Verify if contacts were created with the segment
        const contactsRes = await axios.get('http://localhost:3006/api/contacts?search=Teste Import', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contacts = contactsRes.data; // or contactsRes.data.data depending on API
        console.log('Contacts found:', contacts.length);

        const importedContact = contacts.find(c => c.phone.includes('999999991'));
        if (importedContact) {
            console.log(`Contact segment: ${importedContact.segment} (Expected: SegmentoTesteGlobal)`);
            if (importedContact.segment === 'SegmentoTesteGlobal') {
                console.log('✅ Importação com fallback de segmento funcionando!');
            } else {
                console.log('❌ Falha na segmentação global.');
            }
        } else {
            console.log('❌ Contato importado não encontrado.');
        }

        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Test failed:', error.code || error.message);
        if (error.response) console.error('Response data:', error.response.data);
    }
}

testImport();
