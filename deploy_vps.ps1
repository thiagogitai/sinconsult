# Script para deploy no VPS
$server = "root@167.88.33.24"
$password = "zMxn1029@@@@"

# Comandos para executar no VPS
$commands = @"
cd ~/simconsult
git pull origin main
npm install
npm run build:server
npm run build:frontend
pm2 restart simconsult
pm2 logs simconsult --lines 20
"@

# Criar script temporário com os comandos
$scriptContent = @"
#!/bin/bash
echo "$password" | sudo -S bash -c '
$commands
'
"@

# Salvar script temporário
$scriptContent | Out-File -FilePath "temp_deploy.sh" -Encoding UTF8

# Executar via SSH com expect (se disponível)
Write-Host "Executando deploy no VPS..."
Write-Host "Servidor: $server"
Write-Host "Comandos:"
Write-Host $commands

# Alternativa: mostrar comandos para execução manual
Write-Host "`nPor favor, execute manualmente no VPS:"
Write-Host "ssh $server"
Write-Host "# Digite a senha: $password"
Write-Host "$commands"