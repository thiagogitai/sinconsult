import axios from 'axios';

async function createWhatsAppInstanceFrontend() {
  try {
    console.log('🔄 Criando instância WhatsApp pelo frontend...');
    
    // Primeiro fazer login para obter token válido
    console.log('📱 Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3006/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado, token obtido');
    
    // Criar instância WhatsApp
    console.log('📲 Criando instância WhatsApp...');
    const instanceResponse = await axios.post('http://localhost:3006/api/whatsapp/instances', {
      name: 'simconsult_frontend',
      phone_number: '5511999999999'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Instância criada com sucesso!');
    console.log('📋 Dados da instância:', instanceResponse.data);
    
    if (instanceResponse.data.qrcode) {
      console.log('📱 QR Code disponível:', instanceResponse.data.qrcode_url);
    }
    
    return instanceResponse.data;
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔑 Tentando registrar novo usuário...');
      try {
        const registerResponse = await axios.post('http://localhost:3006/api/auth/register', {
          email: 'admin@example.com',
          password: 'admin123',
          name: 'Admin User'
        });
        console.log('✅ Usuário registrado:', registerResponse.data);
        return createWhatsAppInstanceFrontend(); // Tentar novamente
      } catch (registerError) {
        console.error('❌ Erro no registro:', registerError.response?.data || registerError.message);
      }
    }
    throw error;
  }
}

// Executar
createWhatsAppInstanceFrontend()
  .then(result => {
    console.log('🎉 Processo concluído com sucesso!');
    console.log('🔗 Acesse: http://localhost:5173/whatsapp-instances');
  })
  .catch(error => {
    console.error('💥 Falha no processo:', error.message);
  });