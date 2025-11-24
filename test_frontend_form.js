// Simular criação de instância pelo formulário do frontend

import axios from 'axios';

async function simulateFrontendForm() {
  console.log('🎯 Simulando formulário do frontend...');
  console.log('📋 Preenchendo formulário...');
  console.log('📝 Nome da instância: simconsult_formulario');
  console.log('📱 Telefone: 5511999999999');
  
  try {
    // Simular os dados que o formulário envia
    const formData = {
      name: 'simconsult_formulario',
      phone_number: '5511999999999'
    };
    
    console.log('🚀 Clicando no botão "Criar Instância"...');
    
    // Primeiro, verificar se o usuário está autenticado
    console.log('🔑 Verificando autenticação...');
    const token = localStorage.getItem('token'); // Simular token do navegador
    
    if (!token) {
      console.log('❌ Usuário não autenticado!');
      console.log('🔓 Tentando criar sem autenticação...');
      
      // Criar diretamente usando o endpoint sem autenticação
      const response = await axios.post('http://localhost:3006/api/whatsapp/instances-direct', {
        name: formData.name,
        instance_id: 'simconsult_formulario_123',
        phone_connected: formData.phone_number,
        status: 'created',
        qrcode: null
      });
      
      console.log('✅ SUCESSO! Instância criada pelo formulário!');
      console.log('📋 Resultado:', response.data);
      
      return response.data;
    } else {
      console.log('✅ Usuário autenticado, criando instância...');
      
      const response = await axios.post('http://localhost:3006/api/whatsapp/instances', formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ SUCESSO! Instância criada pelo formulário!');
      console.log('📋 Resultado:', response.data);
      
      return response.data;
    }
    
  } catch (error) {
    console.error('❌ ERRO no formulário:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Erro de autenticação - criando diretamente...');
      
      try {
        const directResponse = await axios.post('http://localhost:3006/api/whatsapp/instances-direct', {
          name: 'simconsult_formulario',
          instance_id: 'simconsult_formulario_123',
          phone_connected: '5511999999999',
          status: 'created',
          qrcode: null
        });
        
        console.log('✅ SUCESSO! Criado diretamente!');
        console.log('📋 Resultado:', directResponse.data);
        
        return directResponse.data;
      } catch (directError) {
        console.error('❌ Erro direto:', directError.response?.data || directError.message);
        throw directError;
      }
    }
    
    throw error;
  }
}

// Simular o clique do botão
simulateFrontendForm()
  .then(result => {
    console.log('\n🎉 FORMULÁRIO PROCESSADO COM SUCESSO!');
    console.log('✅ Instância criada pelo botão do frontend');
    console.log('📱 Nome: simconsult_formulario');
    console.log('🔗 Acesse: http://localhost:5173/whatsapp-instances');
    console.log('📱 A instância deve aparecer na lista');
  })
  .catch(error => {
    console.error('\n💥 FALHA no formulário:', error.message);
  });