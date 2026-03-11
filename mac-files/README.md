# 📚 SDK Completo - Mac → Windows Photoshop Server

## 🎯 NUNCA MAIS PERDE CONTEXTO!

Esta pasta contém **TUDO** que você precisa para integrar o Mac com o servidor Windows do Photoshop.

---

## 📁 Arquivos (por ordem de importância)

### 1. 🚀 **GUIA-INTEGRACAO.md** ← **COMECE AQUI**
Guia passo a passo com exemplos prontos para copiar e colar.

**Quando usar:** Primeira vez integrando ou precisa lembrar como usar.

---

### 2. 📖 **API-REFERENCE.md** ← **FONTE DA VERDADE**
Documentação completa de todas as rotas, parâmetros e responses.

**Quando usar:**
- Não lembra quais campos são obrigatórios
- Quer ver exemplo de request/response
- Precisa saber timeouts e códigos de erro

**Rotas disponíveis:**
- `GET /health` - Verificar conexão
- `GET /layers` - Listar camadas do PSD
- `POST /render` ⭐ - Renderizar arte (PRINCIPAL)
- `POST /exec` - Executar comando PowerShell
- `POST /deploy` - Atualizar servidor

---

### 3. 💻 **windows-sdk.js** ← **CÓDIGO PRONTO**
SDK JavaScript completo com todas as funções necessárias.

**Funcionalidades:**
- ✅ Reconexão automática
- ✅ Retry automático
- ✅ Validação de campos
- ✅ Tratamento de erros
- ✅ Type-safe (com api-types.ts)

**Como usar:**
```javascript
import windows from './windows-sdk.js'

// Conecta automaticamente
windows.startAutoReconnect()

// Renderiza arte
const arte = await windows.render({
  titulo: 'Título',
  gancho: 'Gancho',
  cta: 'CTA',
  photoUrl: 'https://...'
})

// Salva imagem
await windows.saveRender(arte.jpgBase64, './arte.png')
```

---

### 4. 📝 **api-types.ts** ← **TYPES TYPESCRIPT**
Types e validações para garantir que os dados estejam sempre corretos.

**Garante:**
- ✅ Autocompletar no VS Code
- ✅ Validação em tempo de desenvolvimento
- ✅ Documentação inline
- ✅ Zero bugs de tipo

---

### 5. 🔄 **auto-reconnect.js** (Opcional)
Sistema de reconexão automática standalone.

**Quando usar:** Se não quiser usar o SDK completo.

---

### 6. 📘 **windows-connection.js** (Opcional)
Cliente HTTP com reconexão, versão anterior do SDK.

**Quando usar:** Implementação customizada.

---

## 🚀 Quick Start (5 minutos)

### Passo 1: Copiar arquivos
```bash
cd /Users/admin/Documents/sistemas/tilika-content-studio

# Copiar SDK e types
cp /path/to/windows-sdk.js src/services/
cp /path/to/api-types.ts src/services/

# Copiar documentação (referência)
cp /path/to/API-REFERENCE.md docs/
cp /path/to/GUIA-INTEGRACAO.md docs/
```

### Passo 2: Importar e usar
```javascript
import windows from './services/windows-sdk.js'

// Inicia reconexão automática
windows.startAutoReconnect()

// Renderiza
const arte = await windows.render({
  titulo: 'Meu título',
  gancho: 'Meu gancho',
  cta: 'Minha CTA',
  photoUrl: 'https://images.pexels.com/photos/123.jpg'
})

console.log('✅ Arte gerada!', arte.jpgBase64)
```

### Passo 3: Profit! 🎉
Pronto! Agora Mac e Windows conversam automaticamente.

---

## 🔍 Estrutura da Comunicação

```
Mac                          Windows (192.168.48.133:4000)
│                                    │
├─ windows.health()          →   GET /health
├─ windows.render({...})     →   POST /render
├─ windows.exec(cmd)         →   POST /exec
├─ windows.deploy()          →   POST /deploy
└─ windows.getLayers()       →   GET /layers
                                    ↓
                              Photoshop CS/CC/2021+
                                    ↓
                              C:\Users\Victor\Documents\lilika\Arte_Feed.psd
```

---

## 📊 Dados Importantes

### Servidor Windows
- **IP:** 192.168.48.133
- **Porta:** 4000
- **URL:** http://192.168.48.133:4000
- **Token:** tilika-secret-2025

### Arquivos Windows
- **PSD:** `C:\Users\Victor\Documents\lilika\Arte_Feed.psd`
- **Output:** `C:\tilika-ps-server\output\`
- **Temp:** `C:\tilika-ps-server\temp\`

### Timeouts
- **Health check:** 3s
- **Render:** 120s (2 min)
- **Exec:** 60s (1 min)
- **Deploy:** 10s

### Reconexão
- **Intervalo:** 5s
- **Tentativas:** Infinitas
- **Automático:** Sim

---

## ✅ Checklist de Integração

### Setup Inicial
- [ ] Copiar `windows-sdk.js` para `src/services/`
- [ ] Copiar `api-types.ts` para `src/services/`
- [ ] Importar SDK no código
- [ ] Iniciar reconexão automática (`windows.startAutoReconnect()`)

### Testes
- [ ] Health check funciona (`await windows.health()`)
- [ ] Render retorna imagem (`await windows.render({...})`)
- [ ] Imagem é salva corretamente (`await windows.saveRender(...)`)
- [ ] Reconexão funciona (reiniciar Windows e testar)

### Produção
- [ ] Tratamento de erros implementado
- [ ] Retry configurado
- [ ] Logs de debug adicionados
- [ ] Fallback se Windows offline

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Windows não está conectado" | Aguarde reconexão automática ou verifique se servidor está rodando |
| "Timeout" | Aumente timeout: `windows.request(..., { timeout: 180000 })` |
| "Campos obrigatórios" | Valide campos antes: `titulo && gancho && cta && photoUrl` |
| "HTTP 500" | Veja logs: `await windows.getErrorLog()` |
| "Photoshop não gerou" | Veja debug: `await windows.getLayerDebug()` |

---

## 📞 Referência Rápida

### Renderizar Arte
```javascript
const arte = await windows.render({
  titulo: string,      // Obrigatório
  gancho: string,      // Obrigatório
  cta: string,         // Obrigatório
  photoUrl: string,    // Obrigatório (URL válida)
  pilar: string        // Opcional
})

// Retorna: { success: true, jpgBase64: string, width: 1080, height: 1350 }
```

### Executar Comando
```javascript
const result = await windows.exec('Get-Process Photoshop')
// Retorna: { stdout: string, stderr: string, code: number }
```

### Deploy
```javascript
await windows.deploy()
// Atualiza (git pull) e reinicia servidor automaticamente
```

### Health Check
```javascript
const health = await windows.health()
// Retorna: { ok: true, psd: true }
```

---

## 🎓 Documentação Completa

1. **GUIA-INTEGRACAO.md** - Tutorial passo a passo
2. **API-REFERENCE.md** - Todas as rotas e parâmetros
3. **Este README** - Visão geral e quick start

---

## ✨ Benefícios

✅ **Nunca mais perde contexto** - Tudo documentado
✅ **Type-safe** - TypeScript types incluídos
✅ **Auto-reconecta** - Funciona mesmo após reiniciar
✅ **Retry automático** - Tenta novamente em caso de falha
✅ **Validação** - Erros claros antes de enviar
✅ **Logs** - Debug fácil
✅ **Exemplos** - Copiar e colar

---

**Pronto para usar! 🚀**

Qualquer dúvida, consulte:
- `GUIA-INTEGRACAO.md` para tutoriais
- `API-REFERENCE.md` para detalhes técnicos
- `windows-sdk.js` para ver o código (comentado)
