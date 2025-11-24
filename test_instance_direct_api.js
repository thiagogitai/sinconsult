import axios from 'axios';

async function testCreateInstanceDirectly() {
  try {
    console.log('🔄 Testando criação de instância diretamente...');
    
    // Testar criar instância sem autenticação (endpoint de teste)
    console.log('📲 Testando endpoint de teste...');
    const testResponse = await axios.get('http://localhost:3006/api/whatsapp/test-connection');
    console.log('✅ Endpoint de teste funcionando:', testResponse.data);
    
    // Testar criar instância com dados mockados
    console.log('📱 Criando instância com token mock...');
    const instanceResponse = await axios.post('http://localhost:3006/api/whatsapp/instances', {
      name: 'simconsult_botao',
      phone_number: '5511999999999'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzMwMDAwMDAwfQ.mock_token_test'
      }
    });
    
    console.log('✅ Instância criada com sucesso!');
    console.log('📋 Dados da instância:', instanceResponse.data);
    
    if (instanceResponse.data.qrcode) {
      console.log('📱 QR Code disponível!');
    }
    
    return instanceResponse.data;
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔑 Token inválido, tentando sem token...');
      // Tentar criar sem token para ver o erro exato
      try {
        const response = await axios.post('http://localhost:3006/api/whatsapp/instances', {
          name: 'simconsult_botao',
          phone_number: '5511999999999'
        });
        console.log('✅ Funcionou sem token:', response.data);
      } catch (noTokenError) {
        console.error('❌ Erro sem token:', noTokenError.response?.data || noTokenError.message);
      }
    }
    throw error;
  }
}

// Executar
testCreateInstanceDirectly()
  .then(result => {
    console.log('🎉 Processo concluído com sucesso!');
    console.log('🔗 Acesse o frontend para ver a instância criada');
  })
  .catch(error => {
    console.error('💥 Falha no processo:', error.message);
  });