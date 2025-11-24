import axios from 'axios';

async function testCreateInstanceDirectly() {
  try {
    // Test creating WhatsApp instance with a mock token (bypassing auth for testing)
    console.log('Creating WhatsApp instance...');
    const instanceResponse = await axios.post('http://localhost:3006/api/whatsapp/instances', {
      name: 'simconsult',
      phone: '5511999999999'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-bypass'
      }
    });
    
    console.log('Success:', instanceResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('Authentication failed - checking if user exists...');
      // Try to register a new user
      try {
        const registerResponse = await axios.post('http://localhost:3006/api/auth/register', {
          email: 'test@example.com',
          password: 'test123',
          name: 'Test User'
        });
        console.log('Registered user:', registerResponse.data);
      } catch (registerError) {
        console.error('Registration error:', registerError.response?.data || registerError.message);
      }
    }
  }
}

testCreateInstanceDirectly();