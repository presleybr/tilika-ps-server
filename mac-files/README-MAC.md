# Conexão Automática Mac → Windows Photoshop Server

## 📦 Instalação

Copie os arquivos para o projeto do Mac:

```bash
# No projeto tilika-content-studio no Mac
cp windows-server-config.js src/services/
cp windows-connection.js src/services/
```

## 🚀 Uso

### 1. Iniciar conexão automática

```javascript
import windowsConnection from './services/windows-connection.js'

// Conecta e inicia reconexão automática
await windowsConnection.connect()
windowsConnection.startAutoReconnect()
```

### 2. Executar comandos PowerShell no Windows

```javascript
const result = await windowsConnection.execCommand(
  'Get-Process Photoshop | Select-Object Id, CPU'
)
console.log(result)
```

### 3. Renderizar arte no Photoshop

```javascript
const art = await windowsConnection.renderArt({
  titulo: 'Meu título',
  gancho: 'Texto do gancho',
  cta: 'Call to action',
  photoUrl: 'https://...',
  stamp: 8
})

console.log('Arte gerada:', art.outputPath)
```

### 4. Deploy automático (git pull + restart)

```javascript
await windowsConnection.deploy()
// Servidor Windows atualiza e reinicia automaticamente
```

## ⚙️ Configuração

Edite `windows-server-config.js` para ajustar:

- **host**: IP do Windows (padrão: 192.168.48.133)
- **timeout**: Tempo máximo para operações (padrão: 120s)
- **reconnectInterval**: Intervalo entre tentativas (padrão: 5s)

## 🔄 Reconexão Automática

O sistema tenta reconectar automaticamente a cada 5 segundos quando:
- Windows liga depois do Mac
- Servidor Windows reinicia
- Conexão de rede cai e volta

## 🐛 Debug

```javascript
// Ver status da conexão
console.log(windowsConnection.isConnected) // true/false

// Parar reconexão automática
windowsConnection.stopAutoReconnect()

// Health check manual
const isOnline = await windowsConnection.healthCheck()
```

## 📊 Dados do Servidor Windows

- **IP**: 192.168.48.133
- **Porta**: 4000
- **URL**: http://192.168.48.133:4000
- **PSD**: C:\Users\Victor\Documents\lilika\Arte_Feed.psd

## ✅ Tudo Pronto!

Quando ambos os computadores estiverem ligados, a conexão acontece automaticamente! 🚀
