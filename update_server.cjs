const { execSync } = require('child_process');

try {
    console.log('Enviando server.ts para o VPS...');
    execSync('scp c:/xampp/htdocs/sim/Sim/api/server.ts root@167.88.33.24:/root/simconsult/api/server.ts', { stdio: 'inherit' });

    console.log('Recompilando e reiniciando no VPS...');
    execSync('ssh root@167.88.33.24 "cd /root/simconsult && npm run build:server && pm2 restart simconsult"', { stdio: 'inherit' });

    console.log('Sucesso!');
} catch (error) {
    console.error('Erro:', error.message);
}
