# Instruções para Claude Code Windows

Você roda no Windows. Seu Mac parceiro é Claude Code Mac em 192.168.48.133 (ou via PhantomBridge).

## Seu papel
- Controlar o servidor Photoshop (porta 4000)
- Executar tarefas enviadas pelo Mac
- Manter tunnel ativa e registrada no PhantomBridge
- Editar server.js quando necessário
- Responder mensagens do Mac

## Como verificar mensagens do Mac
```powershell
# Ver mensagens pendentes
curl http://localhost:4000/messages

# Ou via PowerShell
Invoke-RestMethod http://localhost:4000/messages
```

## Como responder pro Mac
```powershell
# Via PowerShell (sem acentos para evitar encoding)
$body = '{"message":"sua resposta aqui","from":"Claude Windows"}'
Invoke-RestMethod -Uri "http://localhost:4000/send-to-mac" -Method POST -Body $body -ContentType "application/json"
```

## Como executar comandos locais
Use o Bash tool do Claude Code diretamente. Ou via endpoint do servidor:
```powershell
$body = '{"cmd":"node --version"}'
Invoke-RestMethod -Uri "http://localhost:4000/exec" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-deploy-token"="tilika-secret-2025"}
```

## Como editar server.js
Use as ferramentas Read + Edit do Claude Code diretamente.
Arquivo: `C:\tilika-ps-server\server.js`
Após editar: reiniciar servidor (via Task Manager ou `taskkill /F /IM node.exe && node server.js`)

## Como registrar tunnel no PhantomBridge
Após PhantomBridge ser deployado no Render:
```powershell
# Pega a URL atual do tunnel
$tunnel = (Invoke-RestMethod http://localhost:4000/tunnel-url).url

# Registra no PhantomBridge
$body = "{`"url`":`"$tunnel`"}"
Invoke-RestMethod -Uri "https://phantom-bridge.onrender.com/register" -Method POST -Body $body -ContentType "application/json" -Headers @{"x-bridge-token"="phantom-secret-2025"}
```

## Tasks automáticas da fila
O servidor processa tasks da fila automaticamente.
Mac pode enviar: `POST /task { cmd: "comando aqui" }`
Resultado volta como mensagem pro Mac automaticamente.

## Workflow padrão ao iniciar
1. Verificar se servidor está rodando: `curl http://localhost:4000/health`
2. Verificar tunnel: `curl http://localhost:4000/tunnel-url`
3. Ler mensagens do Mac: `curl http://localhost:4000/messages`
4. Responder e executar tarefas pendentes

## Arquivos importantes
- Servidor: `C:\tilika-ps-server\server.js`
- PSD Arte: `C:\Users\Victor\Documents\lilika\Arte_Feed.psd`
- Output: `C:\tilika-ps-server\output\`
- Logs tunnel: `C:\tilika-ps-server\tunnel.log`

## Token de acesso
- Server: `x-deploy-token: tilika-secret-2025`
- PhantomBridge: `x-bridge-token: phantom-secret-2025`
