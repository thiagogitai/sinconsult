const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'api', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }
  console.log('Tabelas encontradas:');
  rows.forEach(row => {
    console.log(`- ${row.name}`);
  });
  db.close();
});