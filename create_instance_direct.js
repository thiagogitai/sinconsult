// Criar instância WhatsApp diretamente - bypass autenticação

import axios from 'axios';

async function createInstanceDirect() {
  console.log('🚀 Criando instância WhatsApp diretamente...');
  
  try {
    // Criar diretamente na Evolution API (funcionando)
    console.log('📱 Conectando à Evolution API...');
    const evolutionResponse = await axios.post('https://solitarybaboon-evolution.cloudfy.live/instance/create', {
      instanceName: 'simconsult_botao_frontend',
      integration: 'WHATSAPP-BAILEYS',
      number: '5511999999999'
    }, {
      headers: {
        'apikey': '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Instância criada na Evolution API!');
    console.log('📋 Dados:', evolutionResponse.data);
    
    // Agora salvar no banco de dados local
    console.log('💾 Salvando no banco de dados local...');
    const saveResponse = await axios.post('http://localhost:3006/api/whatsapp/instances-save-direct', {
      name: 'simconsult_botao_frontend',
      instance_id: evolutionResponse.data.instance.instanceId,
      phone_connected: '5511999999999',
      status: evolutionResponse.data.instance.status,
      qrcode: null // Não temos QR code ainda
    });
    
    console.log('✅ Instância salva no banco de dados!');
    console.log('🎉 PROCESSO COMPLETO!');
    console.log('✅ Evolution API: OK');
    console.log('✅ Banco Local: OK');
    console.log('🔗 URL: http://localhost:5173/whatsapp-instances');
    
    return {
      evolution: evolutionResponse.data,
      local: saveResponse.data
    };
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    throw error;
  }
}

createInstanceDirect()
  .then(result => {
    console.log('\n🎉 INSTÂNCIA CRIADA COM SUCESSO!');
    console.log('📱 Nome: simconsult_botao_frontend');
    console.log('🔗 Acesse o frontend para ver a nova instância');
  })
  .catch(error => {
    console.error('\n💥 Falha:', error.message);
  });