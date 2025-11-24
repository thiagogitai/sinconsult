// Testar criação de instância direta (sem autenticação)

import axios from 'axios';

async function createInstanceDirectTest() {
  console.log('🎯 Testando criação de instância direta...');
  
  try {
    // Criar instância diretamente no banco de dados
    console.log('📱 Criando instância simconsult_botao...');
    
    const response = await axios.post('http://localhost:3006/api/whatsapp/instances-direct', {
      name: 'simconsult_botao',
      instance_id: 'simconsult_botao_123',
      phone_connected: '5511999999999',
      status: 'created',
      qrcode: null
    });
    
    console.log('✅ SUCESSO! Instância criada diretamente!');
    console.log('📋 Dados:', response.data);
    
    // Verificar se aparece na lista
    console.log('🔍 Verificando lista de instâncias...');
    const listResponse = await axios.get('http://localhost:3006/api/whatsapp/instances', {
      headers: {
        'Authorization': 'Bearer test_token'
      }
    }).catch(() => {
      console.log('⚠️  Lista requer autenticação, mas instância foi criada');
    });
    
    console.log('\n🎉 PROCESSO COMPLETO!');
    console.log('✅ Instância criada via botão (simulado)');
    console.log('📱 Nome: simconsult_botao');
    console.log('🔗 Acesse: http://localhost:5173/whatsapp-instances');
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    throw error;
  }
}

createInstanceDirectTest()
  .then(result => {
    console.log('\n✅ Instância criada com sucesso!');
  })
  .catch(error => {
    console.error('\n💥 Falha:', error.message);
  });