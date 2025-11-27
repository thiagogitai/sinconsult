const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Ver os dados atuais
    db.all('SELECT id, name, segment FROM contacts', [], (err, rows) => {
        if (err) {
            console.error('Erro:', err);
            return;
        }

        console.log('Contatos atuais:');
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Nome: ${row.name}, Segment: "${row.segment}"`);
        });

        // Limpar valores "[object Object]"
        db.run(`UPDATE contacts SET segment = '' WHERE segment = '[object Object]'`, function (err) {
            if (err) {
                console.error('Erro ao limpar:', err);
            } else {
                console.log(`\n✅ ${this.changes} registro(s) limpo(s)`);
            }

            // Mostrar resultado
            db.all('SELECT id, name, segment FROM contacts', [], (err, rows) => {
                if (err) {
                    console.error('Erro:', err);
                    return;
                }

                console.log('\nContatos após limpeza:');
                rows.forEach(row => {
                    console.log(`ID: ${row.id}, Nome: ${row.name}, Segment: "${row.segment}"`);
                });

                db.close();
            });
        });
    });
});
