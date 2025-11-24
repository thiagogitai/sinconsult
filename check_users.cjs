const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'api', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT email, name, role FROM users LIMIT 5', (err, rows) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }
  console.log('Usuários encontrados:');
  rows.forEach(row => {
    console.log(`Email: ${row.email}, Nome: ${row.name}, Role: ${row.role}`);
  });
  db.close();
});