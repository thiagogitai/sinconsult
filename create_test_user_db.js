import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

// Conectar ao banco de dados
const db = new sqlite3.Database('./database.sqlite');

async function createTestUser() {
  try {
    // Criar usuário de teste
    const email = 'test@example.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`, 
        [email, hashedPassword, 'Test User', 'admin'], 
        function(err) {
          if (err) {
            console.error('❌ Erro ao criar usuário:', err);
            reject(err);
          } else {
            console.log('✅ Usuário de teste criado com sucesso!');
            console.log('📧 Email:', email);
            console.log('🔑 Senha:', password);
            resolve({ email, password });
          }
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    db.close();
  }
}

createTestUser();