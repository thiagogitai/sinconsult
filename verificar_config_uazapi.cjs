const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando configurações da UAZAPI e instâncias no banco...\n');

// 1. Buscar configurações da UAZAPI
db.all(`SELECT key, value FROM app_settings WHERE category = 'api'`, [], (err, rows) => {
    if (err) {
        console.error('❌ Erro ao buscar configurações:', err);
        return;
    }

    console.log('📊 CONFIGURAÇÕES DA API:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    rows.forEach(row => {
        if (row.key.includes('Key') || row.key.includes('key')) {
            console.log(`${row.key}: ${row.value.substring(0, 20)}...`);
        } else {
            console.log(`${row.key}: ${row.value}`);
        }
    });

    // 2. Buscar instâncias do WhatsApp
    console.log('\n📱 INSTÂNCIAS DO WHATSAPP:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    db.all(`SELECT * FROM whatsapp_instances`, [], (err, instances) => {
        if (err) {
            console.error('❌ Erro ao buscar instâncias:', err);
            db.close();
            return;
        }

        if (instances.length === 0) {
            console.log('⚠️  Nenhuma instância encontrada no banco');
        } else {
            instances.forEach(inst => {
                console.log(`\nID: ${inst.id}`);
                console.log(`Nome: ${inst.name}`);
                console.log(`Instance ID: ${inst.instance_id}`);
                console.log(`Status: ${inst.status}`);
                console.log(`Telefone: ${inst.phone_connected || 'N/A'}`);
                console.log(`QR Code: ${inst.qr_code ? 'Sim' : 'Não'}`);
                console.log(`Criado em: ${inst.created_at}`);
                console.log(`Atualizado em: ${inst.updated_at}`);
            });
        }

        db.close();
    });
});
