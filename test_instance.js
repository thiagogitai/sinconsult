import axios from 'axios';

async function testCreateInstance() {
  try {
    const response = await axios.post('http://localhost:3006/api/whatsapp/instances', {
      name: 'simconsult',
      phone: '5511999999999'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAwfQ.mock_token'
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCreateInstance();