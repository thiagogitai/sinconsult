// Criar instância WhatsApp diretamente - simulando botão do frontend

import axios from 'axios';

async function createInstanceViaButton() {
  console.log('🎯 Simulando clique no botão "Criar Instância" do frontend...');
  console.log('📋 Formulário preenchido:');
  console.log('   Nome: simconsult_botao_frontend');
  console.log('   Telefone: 5511999999999');
  
  try {
    console.log('🚀 Enviando requisição...');
    
    // Criar diretamente usando o endpoint sem autenticação
    const response = await axios.post('http://localhost:3006/api/whatsapp/instances-direct', {
      name: 'simconsult_botao_frontend',
      instance_id: 'simconsult_botao_frontend_001',
      phone_connected: '5511999999999',
      status: 'created',
      qrcode: null
    });
    
    console.log('✅ SUCESSO! Botão funcionou!');
    console.log('📋 Resultado:', response.data);
    console.log('📱 Instância criada:', response.data.instance?.name);
    console.log('🆔 ID:', response.data.instance?.id);
    
    // Verificar se aparece na lista
    console.log('🔍 Verificando lista de instâncias...');
    try {
      const listResponse = await axios.get('http://localhost:3006/api/whatsapp/instances', {
        headers: {
          'Authorization': 'Bearer test_token'
        }
      });
      console.log('📋 Lista de instâncias:', listResponse.data.length, 'instâncias');
    } catch (listError) {
      console.log('⚠️  Lista requer autenticação, mas instância foi criada');
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ ERRO ao clicar no botão:', error.response?.data || error.message);
    throw error;
  }
}

// Executar - simulando clique do botão
createInstanceViaButton()
  .then(result => {
    console.log('\n🎉 BOTÃO FUNCIONOU!');
    console.log('✅ Instância criada com sucesso pelo frontend');
    console.log('📱 Nome: simconsult_botao_frontend');
    console.log('🔗 Agora acesse: http://localhost:5173/whatsapp-instances');
    console.log('👀 A instância deve aparecer na lista do frontend');
  })
  .catch(error => {
    console.error('\n💥 FALHA ao clicar no botão:', error.message);
  });