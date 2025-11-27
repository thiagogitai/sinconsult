const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Deletar todos os contatos
    db.run('DELETE FROM contacts', function (err) {
        if (err) {
            console.error('❌ Erro ao deletar contatos:', err.message);
        } else {
            console.log(`✅ ${this.changes} contato(s) deletado(s) com sucesso!`);
        }

        // Resetar o contador de ID (opcional)
        db.run("DELETE FROM sqlite_sequence WHERE name='contacts'", function (err) {
            if (err) {
                console.log('⚠️ Aviso: Não foi possível resetar o contador de IDs');
            } else {
                console.log('✅ Contador de IDs resetado');
            }
            db.close();
        });
    });
});
