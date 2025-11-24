const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'api', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function createAdminUser() {
  try {
    const email = 'admin@simconsult.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT OR IGNORE INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['Admin', email, hashedPassword, 'admin', 1],
      function(err) {
        if (err) {
          console.error('Erro ao criar usuário:', err);
        } else if (this.changes > 0) {
          console.log('✅ Usuário admin criado com sucesso!');
          console.log('Email:', email);
          console.log('Senha:', password);
        } else {
          console.log('ℹ️ Usuário admin já existe');
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    db.close();
  }
}

createAdminUser();