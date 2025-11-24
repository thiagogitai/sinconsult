import axios from 'axios';

async function testEvolutionAPI() {
  try {
    // Test Evolution API connection directly
    console.log('Testing Evolution API connection...');
    
    const evolutionResponse = await axios.get('https://solitarybaboon-evolution.cloudfy.live/', {
      headers: {
        'apikey': '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc'
      }
    });
    
    console.log('Evolution API Status:', evolutionResponse.status);
    console.log('Evolution API Response:', evolutionResponse.data);
    
    // Test creating instance directly via Evolution API
    console.log('\nCreating instance via Evolution API...');
    
    const createResponse = await axios.post('https://solitarybaboon-evolution.cloudfy.live/instance/create', {
      instanceName: 'simconsult_test',
      integration: 'WHATSAPP-BAILEYS',
      number: '5511999999999'
    }, {
      headers: {
        'apikey': '0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Instance created:', createResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testEvolutionAPI();