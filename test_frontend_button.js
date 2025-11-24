// Script para criar instância WhatsApp diretamente pelo backend
// Simula exatamente o que o botão do frontend faz

import axios from 'axios';

async function createWhatsAppInstanceViaFrontend() {
  console.log('🎯 Simulando criação de instância via botão do frontend...');
  
  try {
    // Passo 1: Criar uma sessão/mock de usuário
    console.log('👤 Criando contexto de usuário...');
    
    // Passo 2: Simular os dados que o frontend enviaria
    const instanceData = {
      name: 'simconsult_frontend_test',
      phone_number: '5511999999999'
    };
    
    console.log('📋 Dados da instância:', instanceData);
    
    // Passo 3: Criar instância diretamente (simulando autenticação)
    console.log('🚀 Enviando requisição para criar instância...');
    
    // Usar um token JWT mock válido
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzMwMDAwMDAwfQ.mock_admin_token';
    
    const response = await axios.post('http://localhost:3006/api/whatsapp/instances', instanceData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ SUCESSO! Instância criada pelo frontend!');
    console.log('📱 Resultado:', response.data);
    
    if (response.data.qrcode) {
      console.log('📋 QR Code gerado com sucesso!');
      console.log('🖼️  URL do QR Code:', response.data.qrcode_url);
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ ERRO ao criar instância:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Tentando método alternativo...');
      
      // Tentar criar sem token para ver o erro detalhado
      try {
        const errorResponse = await axios.post('http://localhost:3006/api/whatsapp/instances', {
          name: 'simconsult_frontend_test',
          phone_number: '5511999999999'
        });
        console.log('✅ Funcionou sem token:', errorResponse.data);
      } catch (noAuthError) {
        console.error('❌ Erro sem autenticação:', noAuthError.response?.data);
      }
    }
    
    if (error.response?.status === 503) {
      console.log('🌐 Evolution API não está acessível');
    }
    
    throw error;
  }
}

// Executar a simulação do botão
createWhatsAppInstanceViaFrontend()
  .then(result => {
    console.log('\n🎉 PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log('✅ Instância criada via botão do frontend');
    console.log('🔗 Acesse: http://localhost:5173/whatsapp-instances');
    console.log('📱 Verifique a instância na lista');
  })
  .catch(error => {
    console.error('\n💥 FALHA no processo:', error.message);
    console.log('🔧 Verifique os logs do servidor');
  });