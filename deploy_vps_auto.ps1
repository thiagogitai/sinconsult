# Script PowerShell para deploy no VPS
$server = "root@167.88.33.24"
$password = "zMxn1029@@@@"

Write-Host "🚀 Preparando deploy no VPS..." -ForegroundColor Green
Write-Host "Servidor: $server" -ForegroundColor Yellow

# Comandos para resolver conflitos e fazer deploy
$commands = @"
cd ~/simconsult
rm -f test_instance.json
git stash || true
git pull origin main
git stash pop || true
npm install
npm run build:server
npm run build:frontend
pm2 restart simconsult
pm2 logs simconsult --lines 10
pm2 status
"@

Write-Host "`n📋 Comandos a executar:" -ForegroundColor Cyan
Write-Host $commands

Write-Host "`n🔑 Para executar manualmente:" -ForegroundColor Magenta
Write-Host "1. Conectar ao VPS: ssh $server" 
Write-Host "2. Digitar a senha: $password"
Write-Host "3. Executar os comandos acima"

# Tentar conexão automática com expect (se disponível)
Write-Host "`n🔄 Tentando conexão automática..." -ForegroundColor Green

# Criar script expect temporário
$expectScript = @"
#!/usr/bin/expect -f
set timeout 30
spawn ssh $server
expect "password:"
send "$password\r"
expect "#"
send "cd ~/simconsult\r"
send "rm -f test_instance.json\r"
send "git stash || true\r"
send "git pull origin main\r"
send "npm install\r"
send "npm run build:server\r"
send "npm run build:frontend\r"
send "pm2 restart simconsult\r"
send "pm2 logs simconsult --lines 10\r"
send "pm2 status\r"
send "exit\r"
expect eof
"@

# Salvar expect script
$expectScript | Out-File -FilePath "temp_deploy.expect" -Encoding UTF8

Write-Host "Script expect criado. Se tiver expect instalado, execute:"
Write-Host "expect temp_deploy.expect"

Write-Host "`n✅ Script de deploy preparado!" -ForegroundColor Green