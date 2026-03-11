# 📚 API Reference - Servidor Photoshop Windows

**Base URL:** `http://192.168.48.133:4000`
**Token de Deploy:** `tilika-secret-2025`

---

## 🔓 Rotas Públicas (sem autenticação)

### GET /health

Verifica se o servidor está online e se o PSD existe.

**Request:**
```javascript
GET http://192.168.48.133:4000/health
```

**Response:**
```json
{
  "ok": true,
  "psd": true
}
```

---

### GET /layers

Lista todas as camadas do arquivo PSD para debug.

**Request:**
```javascript
GET http://192.168.48.133:4000/layers
```

**Response:**
```json
{
  "layers": [
    { "name": "Camada 1", "kind": "LayerKind.TEXT", "path": "Camada 1" },
    { "name": "Camada 2", "kind": "LayerKind.SMARTOBJECT", "path": "Grupo/Camada 2" }
  ]
}
```

---

### GET /layerdebug

Retorna log de debug das camadas do último render.

**Request:**
```javascript
GET http://192.168.48.133:4000/layerdebug
```

**Response:**
```
texto do log...
```

---

### GET /errorlog

Retorna log de erros do Photoshop.

**Request:**
```javascript
GET http://192.168.48.133:4000/errorlog
```

**Response:**
```
texto dos erros...
```

---

### POST /render ⭐

**ROTA PRINCIPAL** - Renderiza arte no Photoshop.

**Request:**
```javascript
POST http://192.168.48.133:4000/render
Content-Type: application/json

{
  "titulo": "5 sinais de que seu familiar precisa de cuidado",
  "gancho": "Descubra se está na hora de contratar uma enfermeira",
  "cta": "Chama no direct: vamos conversar",
  "photoUrl": "https://example.com/foto.jpg"
}
```

**Campos:**
- `titulo` (string, obrigatório): Texto do título
- `gancho` (string, obrigatório): Texto do gancho/descrição
- `cta` (string, obrigatório): Call to action
- `photoUrl` (string, obrigatório): URL da foto a ser inserida
- `pilar` (string, opcional): Categoria/pilar do conteúdo

**Response (sucesso):**
```json
{
  "success": true,
  "jpgBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "width": 1080,
  "height": 1350
}
```

**Response (erro):**
```json
{
  "error": "Photoshop não gerou o arquivo. Camada não encontrada"
}
```

**Tempo estimado:** 5-15 segundos

---

## 🔐 Rotas Protegidas (requerem token)

### POST /deploy

Atualiza o servidor (git pull) e reinicia automaticamente.

**Request:**
```javascript
POST http://192.168.48.133:4000/deploy
Content-Type: application/json
Authorization: Bearer tilika-secret-2025

// ou no body:
{
  "token": "tilika-secret-2025"
}
```

**Response:**
```json
{
  "ok": true,
  "msg": "Pulling e reiniciando..."
}
```

⚠️ **Importante:** Servidor reinicia em ~3 segundos. Aguarde reconexão.

---

### POST /exec

Executa comando PowerShell no Windows remotamente.

**Request:**
```javascript
POST http://192.168.48.133:4000/exec
Content-Type: application/json
Authorization: Bearer tilika-secret-2025

{
  "token": "tilika-secret-2025",
  "cmd": "Get-Process Photoshop | Select-Object Id, CPU"
}
```

**Campos:**
- `cmd` (string, obrigatório): Comando PowerShell a executar
- `token` (string, obrigatório): Token de autenticação

**Response:**
```json
{
  "stdout": "Id    CPU\n--    ---\n12345 125.5\n",
  "stderr": "",
  "code": 0
}
```

**Timeout:** 30 segundos

**Exemplos de comandos úteis:**

```javascript
// Ver processos do Photoshop
{ "cmd": "Get-Process *photoshop*" }

// Listar arquivos gerados
{ "cmd": "dir C:\\tilika-ps-server\\output" }

// Screenshot da tela
{ "cmd": "Add-Type -Assembly System.Windows.Forms; [Windows.Forms.Screen]::PrimaryScreen.Bounds" }

// Ver informações do sistema
{ "cmd": "Get-ComputerInfo | Select WindowsVersion, TotalPhysicalMemory" }
```

---

## ⚡ Códigos de Status HTTP

- `200` - Sucesso
- `400` - Requisição inválida (falta campo obrigatório)
- `401` - Não autorizado (token inválido)
- `500` - Erro no servidor ou Photoshop

---

## 🔄 Fluxo de Render

```
1. Mac envia POST /render com dados
   ↓
2. Windows baixa foto da URL
   ↓
3. Windows gera script ExtendScript (.jsx)
   ↓
4. Windows executa script via VBScript (controla Photoshop)
   ↓
5. Photoshop:
   - Abre PSD
   - Substitui textos (titulo, gancho, cta)
   - Insere foto
   - Exporta PNG
   - Fecha PSD
   ↓
6. Windows lê PNG e converte para base64
   ↓
7. Windows retorna JSON com imagem em base64
   ↓
8. Mac recebe e salva/exibe imagem
```

---

## 📁 Arquivos no Windows

- **PSD:** `C:\Users\Victor\Documents\lilika\Arte_Feed.psd`
- **Output:** `C:\tilika-ps-server\output\` (PNGs gerados)
- **Temp:** `C:\tilika-ps-server\temp\` (fotos baixadas, scripts)
- **Servidor:** `C:\tilika-ps-server\server.js`

---

## 🐛 Troubleshooting

### Erro: "Photoshop não gerou o arquivo"
- Camada não encontrada no PSD
- Photoshop não está aberto
- Versão do Photoshop incompatível
- Ver /errorlog para mais detalhes

### Erro: "timeout"
- Photoshop travou
- Foto muito grande para download
- Aumentar timeout no cliente

### Erro: 400 Bad Request
- Falta campo obrigatório (titulo, gancho, cta, photoUrl)
- JSON malformado

### Erro: 401 Unauthorized
- Token inválido em /deploy ou /exec
- Token correto: `tilika-secret-2025`

---

## ✅ Checklist de Integração

- [ ] Health check funcionando (`GET /health`)
- [ ] Render retorna imagem base64 (`POST /render`)
- [ ] Token de deploy configurado
- [ ] Reconexão automática implementada
- [ ] Tratamento de erros HTTP
- [ ] Timeout adequado (120s para render)
- [ ] Retry em caso de falha temporária
