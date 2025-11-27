const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configurações
const EVOLUTION_URL = 'https://solitarybaboon-evolution.cloudfy.live';
const API_KEY = 'bf3d1587038743979805991535454261';
const INSTANCE_NAME = 'simconsult';

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function fixInstance() {
    try {
        console.log('=== CORREÇÃO DE INSTÂNCIA ===');

        const headers = {
            'Content-Type': 'application/json',
            'apikey': API_KEY
        };

        // 1. Limpar banco local
        console.log('\n1. Limpando banco local...');
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM whatsapp_instances", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✓ Banco limpo');

        // 2. Criar instância (ou verificar se existe)
        console.log(`\n2. Criando/Verificando instância '${INSTANCE_NAME}'...`);
        try {
            const createRes = await axios.post(`${EVOLUTION_URL}/instance/create`, {
                instanceName: INSTANCE_NAME,
                integration: 'WHATSAPP-BAILEYS'
            }, { headers });
            console.log('✓ Instância criada:', createRes.data.instance.instanceName);
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.log('ℹ️ Instância já existe na API (OK)');
            } else {
                console.error('❌ Erro ao criar instância:', e.response ? e.response.data : e.message);
                // Não retornar, tentar conectar mesmo assim
            }
        }

        // 3. Salvar no banco local
        console.log('\n3. Salvando no banco local...');
        const dummyId = 'inst_' + Math.random().toString(36).substr(2, 9);
        await new Promise((resolve, reject) => {
            db.run(`
        INSERT INTO whatsapp_instances (name, instance_id, status, is_active)
        VALUES (?, ?, ?, ?)
      `, [INSTANCE_NAME, dummyId, 'connecting', 1], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✓ Salvo no banco');

        // 4. Obter QR Code
        console.log('\n4. Obtendo QR Code...');
        try {
            const connectRes = await axios.get(`${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`, { headers });

            if (connectRes.data.base64) {
                console.log('\n✅ QR CODE GERADO COM SUCESSO!');

                // Salvar QR Code em arquivo
                const base64Data = connectRes.data.base64.replace(/^data:image\/png;base64,/, "");
                fs.writeFileSync('qrcode.png', base64Data, 'base64');
                console.log('✅ QR Code salvo em: qrcode.png');
                console.log('👉 Abra este arquivo e escaneie com seu WhatsApp!');
            } else {
                console.log('⚠️ Instância já conectada ou sem QR Code disponível.');
                // Tentar verificar status
                try {
                    const statusRes = await axios.get(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`, { headers });
                    console.log('Status atual:', JSON.stringify(statusRes.data, null, 2));
                } catch (err) {
                    console.log('Erro ao verificar status:', err.message);
                }
            }
        } catch (e) {
            console.error('Erro ao obter QR Code:', e.message);
            if (e.response) console.error('Detalhes:', e.response.data);
        }

    } catch (error) {
        console.error('Erro geral:', error);
    } finally {
        db.close();
    }
}

fixInstance();
