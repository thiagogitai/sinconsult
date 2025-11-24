// Testar criação de instância sem autenticação - apenas para debug

import axios from 'axios';

async function testInstanceWithoutAuth() {
  console.log('🧪 Testando criação de instância sem autenticação...');
  
  try {
    // Testar endpoint de teste (sem autenticação)
    console.log('1️⃣ Testando endpoint de teste...');
    const testResponse = await axios.get('http://localhost:3006/api/whatsapp/test-connection');
    console.log('✅ Endpoint de teste:', testResponse.data);
    
    // Testar endpoint de debug (com autenticação básica)
    console.log('2️⃣ Testando endpoint de debug...');
    const debugResponse = await axios.post('http://localhost:3006/api/whatsapp/instances-debug', {
      name: 'simconsult_test_debug',
      phone: '5511999999999'
    });
    console.log('✅ Endpoint de debug:', debugResponse.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    
    // Tentar criar diretamente na Evolution API
    console.log('🌐 Tentando criar diretamente na Evolution API...');
    try {
      const evolutionResponse = await axios.post('https://solitarybaboon-evolution.cloudfy.live/instance/create', {
        instanceName: 'simconsult_direct',
        integration: 'WHATSAPP-BAILEYS',
        number: '5511999999999'
      }, {
        headers: {
          'apikey': '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Evolution API:', evolutionResponse.data);
    } catch (evoError) {
      console.error('❌ Evolution API erro:', evoError.response?.data || evoError.message);
    }
  }
}

testInstanceWithoutAuth();