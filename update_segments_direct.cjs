const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Atualizar contatos
    db.run(`UPDATE contacts SET segment = 'teste 1' WHERE id = 1`, function (err) {
        if (err) {
            console.error('Erro ao atualizar ID 1:', err);
        } else {
            console.log('✅ Contato ID 1 atualizado para "teste 1"');
        }
    });

    db.run(`UPDATE contacts SET segment = 'teste' WHERE id = 2`, function (err) {
        if (err) {
            console.error('Erro ao atualizar ID 2:', err);
        } else {
            console.log('✅ Contato ID 2 atualizado para "teste"');
        }

        // Mostrar resultado
        db.all('SELECT id, name, segment FROM contacts', [], (err, rows) => {
            if (err) {
                console.error('Erro:', err);
                return;
            }

            console.log('\n📋 Contatos atualizados:');
            rows.forEach(row => {
                console.log(`ID: ${row.id}, Nome: ${row.name}, Segment: "${row.segment}"`);
            });

            db.close();
        });
    });
});
