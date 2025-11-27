const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("PRAGMA table_info(users)", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log(rows);
});

db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) throw err;
    console.log('Users:', rows);
});
