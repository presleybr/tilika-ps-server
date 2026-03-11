# 💬 Sistema de Mensagens Windows ↔ Mac

## 🎯 O que é?

Sistema de comunicação em tempo real entre Claude Code no Windows e Claude Code no Mac através do servidor.

**Como funciona:**
- Windows envia mensagens para o Mac
- Mac envia mensagens para o Windows
- Mensagens ficam armazenadas até serem lidas
- Polling automático para verificar novas mensagens

---

## 🚀 Como Usar no Windows

### Enviar Mensagem para o Mac

```bash
cd C:\tilika-ps-server
node send-message.js "Sua mensagem aqui"
```

**Exemplo:**
```bash
node send-message.js "Olá Mac! Preciso que você execute o deploy"
```

### Verificar Mensagens Recebidas do Mac

```bash
cd C:\tilika-ps-server
node check-messages.js
```

### Usar Programaticamente (Node.js)

```javascript
const http = require('http');

// Enviar mensagem
const data = JSON.stringify({
  message: 'Olá Mac!',
  from: 'Claude Code Windows'
});

const req = http.request({
  hostname: '192.168.48.133',
  port: 4000,
  path: '/send-to-mac',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  res.on('data', (d) => console.log(JSON.parse(d)));
});

req.write(data);
req.end();
```

---

## 🍎 Como Usar no Mac

### Instalação

```bash
# Copiar cliente de mensagens
cp message-client.js /Users/admin/Documents/sistemas/tilika-content-studio/src/services/
```

### Enviar Mensagem para Windows

```javascript
import messageClient from './services/message-client.js'

// Enviar mensagem
await messageClient.sendToWindows('Olá Windows! Deploy concluído com sucesso')
```

### Verificar Mensagens Manualmente

```javascript
import messageClient from './services/message-client.js'

// Verificar mensagens
const messages = await messageClient.checkMessages()
console.log(`Recebidas ${messages.length} mensagens`)
```

### Polling Automático (Recomendado)

```javascript
import messageClient from './services/message-client.js'

// Iniciar polling a cada 5 segundos
messageClient.startPolling(5000, (msg) => {
  console.log('📬 Nova mensagem do Windows:')
  console.log('De:', msg.from)
  console.log('Mensagem:', msg.message)
  console.log('Horário:', new Date(msg.timestamp).toLocaleString())

  // Executar ação baseada na mensagem
  if (msg.message.includes('deploy')) {
    // Executar deploy...
  }
})

// Parar polling quando necessário
messageClient.stopPolling()
```

### Limpar Mensagens Lidas

```javascript
await messageClient.clearReadMessages()
```

---

## 📡 API HTTP

### POST /send-to-mac
Envia mensagem para o Mac.

**Request:**
```json
{
  "message": "Texto da mensagem",
  "from": "Remetente (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": 1773215618349,
  "total": 1
}
```

---

### POST /send-to-windows
Envia mensagem para o Windows.

**Request:**
```json
{
  "message": "Texto da mensagem",
  "from": "Remetente (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": 1773215618350,
  "total": 1
}
```

---

### GET /messages-mac
Mac verifica mensagens recebidas do Windows.

**Response:**
```json
{
  "messages": [
    {
      "id": 1773215618349,
      "message": "Olá Mac!",
      "from": "Claude Code Windows",
      "timestamp": "2026-03-11T06:00:00.000Z",
      "read": false
    }
  ],
  "total": 1,
  "allMessages": 5
}
```

---

### GET /messages
Windows verifica mensagens recebidas do Mac.

**Response:**
```json
{
  "messages": [
    {
      "id": 1773215618350,
      "message": "Deploy concluído!",
      "from": "Claude Code Mac",
      "timestamp": "2026-03-11T06:01:00.000Z",
      "read": false
    }
  ],
  "total": 1,
  "allMessages": 3
}
```

---

### POST /mark-read
Marca mensagem como lida.

**Request:**
```json
{
  "messageId": 1773215618349,
  "target": "mac"
}
```

---

### POST /clear-messages
Limpa mensagens já lidas.

**Request:**
```json
{
  "target": "mac"
}
```

**Response:**
```json
{
  "success": true,
  "removed": 5
}
```

---

## 💡 Casos de Uso

### 1. Coordenar Deploy

**Windows:**
```bash
node send-message.js "Faça deploy do projeto agora"
```

**Mac:**
```javascript
messageClient.startPolling(5000, async (msg) => {
  if (msg.message.includes('deploy')) {
    await windows.deploy()
    await messageClient.sendToWindows('Deploy concluído!')
  }
})
```

---

### 2. Solicitar Render

**Windows:**
```bash
node send-message.js "Renderize a arte 'Cuidado com idosos'"
```

**Mac:**
```javascript
messageClient.startPolling(5000, async (msg) => {
  if (msg.message.includes('Renderize')) {
    const arte = await windows.render({...})
    await messageClient.sendToWindows('Arte renderizada!')
  }
})
```

---

### 3. Notificar Conclusão

**Mac:**
```javascript
// Após processar algo
await messageClient.sendToWindows('✅ Processamento de 50 artes concluído!')
```

**Windows:**
```bash
node check-messages.js
# Vê: "✅ Processamento de 50 artes concluído!"
```

---

### 4. Debug em Tempo Real

**Windows:**
```bash
node send-message.js "Qual o status do sistema?"
```

**Mac:**
```javascript
messageClient.startPolling(5000, async (msg) => {
  if (msg.message.includes('status')) {
    const health = await windows.health()
    await messageClient.sendToWindows(`Sistema: ${health.ok ? 'OK' : 'ERRO'}`)
  }
})
```

---

## 🔄 Polling Automático Recomendado

### No Mac (Setup Inicial)

```javascript
// src/services/message-handler.js
import messageClient from './message-client.js'
import windows from './windows-sdk.js'

// Iniciar ao startar aplicação
export function initMessageSystem() {
  console.log('🔄 Iniciando sistema de mensagens...')

  messageClient.startPolling(5000, async (msg) => {
    console.log(`📬 Mensagem do Windows: ${msg.message}`)

    try {
      // Comandos automáticos
      if (msg.message.includes('deploy')) {
        await windows.deploy()
        await messageClient.sendToWindows('✅ Deploy concluído')
      }

      if (msg.message.includes('health')) {
        const health = await windows.health()
        await messageClient.sendToWindows(`Health: ${JSON.stringify(health)}`)
      }

      if (msg.message.includes('render:')) {
        // Extrair dados da mensagem
        // render:titulo|gancho|cta|url
        const parts = msg.message.split(':')[1].split('|')
        const arte = await windows.render({
          titulo: parts[0],
          gancho: parts[1],
          cta: parts[2],
          photoUrl: parts[3]
        })
        await messageClient.sendToWindows('✅ Arte renderizada')
      }
    } catch (error) {
      await messageClient.sendToWindows(`❌ Erro: ${error.message}`)
    }
  })
}

// Iniciar
initMessageSystem()
```

---

## 📊 Logs no Servidor

Toda mensagem enviada aparece no console do servidor:

```
[Mensagem para Mac] Claude Code Windows: Olá Mac! Preciso que você...
[Mensagem para Windows] Claude Code Mac: Deploy concluído!
```

---

## ✅ Checklist de Integração

### Windows
- [ ] Copiar `send-message.js` para `C:\tilika-ps-server\`
- [ ] Copiar `check-messages.js` para `C:\tilika-ps-server\`
- [ ] Testar envio: `node send-message.js "teste"`
- [ ] Testar leitura: `node check-messages.js`

### Mac
- [ ] Copiar `message-client.js` para `src/services/`
- [ ] Importar no código principal
- [ ] Iniciar polling automático
- [ ] Testar envio para Windows
- [ ] Configurar handlers para comandos

---

## 🐛 Troubleshooting

### "Unexpected end of JSON input"
- Servidor não está rodando
- Firewall bloqueando porta 4000
- IP incorreto

**Solução:** Verificar se servidor está ativo em http://192.168.48.133:4000/health

### Mensagens não aparecem
- Polling não está ativo
- Mensagens já foram marcadas como lidas

**Solução:** Iniciar polling com `messageClient.startPolling()`

### Muitas mensagens acumuladas
- Limpar mensagens lidas periodicamente

**Solução:** `await messageClient.clearReadMessages()`

---

**Comunicação em tempo real entre Windows e Mac! 🚀**
