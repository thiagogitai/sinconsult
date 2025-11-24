const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'api', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, rows) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }
  console.log('Tabelas encontradas:');
  rows.forEach(row => {
    console.log(`- ${row.name}`);
  });
  
  // Verificar dados da tabela users
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err) {
      console.error('Erro ao contar users:', err);
    } else {
      console.log(`Total de usuários: ${result.count}`);
    }
    db.close();
  });
});