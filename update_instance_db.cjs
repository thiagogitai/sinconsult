const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const NEW_INSTANCE = 'simconsult02';

db.serialize(() => {
    console.log(`=== Atualizando Instância para: ${NEW_INSTANCE} ===`);

    // 1. Limpar instâncias antigas
    db.run("DELETE FROM whatsapp_instances", (err) => {
        if (err) console.error('Erro ao limpar:', err);
        else console.log('✓ Instâncias antigas removidas');
    });

    // 2. Inserir nova instância conectada
    const dummyId = 'inst_' + Math.random().toString(36).substr(2, 9);
    db.run(`
    INSERT INTO whatsapp_instances (name, instance_id, status, is_active, last_connection)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [NEW_INSTANCE, dummyId, 'connected', 1], (err) => {
        if (err) console.error('Erro ao inserir:', err);
        else console.log(`✓ Instância '${NEW_INSTANCE}' inserida como CONECTADA`);
    });

    // 3. Verificar
    db.all("SELECT * FROM whatsapp_instances", (err, rows) => {
        console.log('\nEstado Atual do Banco:');
        console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
