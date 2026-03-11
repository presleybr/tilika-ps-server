# 📦 COMPARTILHAR COM CLAUDE CODE NO MAC

Cole este arquivo no Claude Code do Mac para ele ter TODO O CONTEXTO.

---

## 📍 LOCALIZAÇÃO DOS ARQUIVOS

**No Windows:** `C:\tilika-ps-server\mac-files\`

**15 arquivos criados:**
1. README.md
2. GUIA-INTEGRACAO.md
3. API-REFERENCE.md
4. windows-sdk.js
5. api-types.ts
6. auto-reconnect.js
7. windows-connection.js
8. windows-server-config.js
9. exemplo-uso.js
10. README-MAC.md
11. SOLUCAO-RECONEXAO.md
12. start-server.bat
13. start-server-hidden.vbs
14. liberar-firewall.bat
15. criar-tarefa-automatica.bat

---

## 🎯 INSTRUÇÕES PARA CLAUDE CODE NO MAC

### 1. Baixar arquivos do Windows

```bash
# No Mac, clone o repositório:
cd /Users/admin/Documents/sistemas
git clone https://github.com/presleybr/tilika-ps-server.git

# Ou se já existe:
cd /Users/admin/Documents/sistemas/tilika-ps-server
git pull
```

### 2. Copiar arquivos para tilika-content-studio

```bash
# Copiar documentação
cp tilika-ps-server/mac-files/README.md tilika-content-studio/docs/windows-integration/
cp tilika-ps-server/mac-files/GUIA-INTEGRACAO.md tilika-content-studio/docs/windows-integration/
cp tilika-ps-server/mac-files/API-REFERENCE.md tilika-content-studio/docs/windows-integration/

# Copiar código
cp tilika-ps-server/mac-files/windows-sdk.js tilika-content-studio/src/services/
cp tilika-ps-server/mac-files/api-types.ts tilika-content-studio/src/services/
cp tilika-ps-server/mac-files/windows-server-config.js tilika-content-studio/src/config/
```

### 3. Commit e Push

```bash
cd tilika-content-studio

git add .
git commit -m "feat: adiciona SDK Windows + documentação completa

- SDK completo para comunicação Mac → Windows
- TypeScript types e validações
- API Reference completa
- Reconexão automática
- Exemplos prontos

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push
```

---

## 🔗 LINKS IMPORTANTES

- **Repositório Windows Server:** https://github.com/presleybr/tilika-ps-server
- **IP Windows:** 192.168.48.133
- **Porta:** 4000
- **Token Deploy:** tilika-secret-2025
- **PSD:** C:\Users\Victor\Documents\lilika\Arte_Feed.psd

---

## 📚 RESUMO DO QUE FOI CRIADO

### SDK Completo (windows-sdk.js)
Classe JavaScript com:
- ✅ Reconexão automática
- ✅ Retry integrado
- ✅ Validação de campos
- ✅ Tratamento de erros
- ✅ Helpers (saveRender, base64ToBuffer)

**Métodos principais:**
- `windows.health()` - Health check
- `windows.render({titulo, gancho, cta, photoUrl})` - Renderizar arte
- `windows.exec(cmd)` - Executar PowerShell
- `windows.deploy()` - Atualizar servidor
- `windows.getLayers()` - Listar camadas PSD

### TypeScript Types (api-types.ts)
- Interfaces para todos os requests/responses
- Validadores
- Erros customizados
- Configuração tipada

### Documentação Completa
- **API-REFERENCE.md:** Todas as rotas com exemplos
- **GUIA-INTEGRACAO.md:** Tutorial passo a passo
- **README.md:** Visão geral + quick start

---

## 💻 EXEMPLO DE USO NO MAC

```javascript
import windows from './services/windows-sdk.js'

// 1. Inicia reconexão automática
windows.startAutoReconnect()

// 2. Aguarda conexão
while (!windows.connected) {
  await new Promise(r => setTimeout(r, 1000))
}

// 3. Renderiza arte
const arte = await windows.render({
  titulo: '5 sinais de que seu familiar precisa de cuidado',
  gancho: 'Descubra se está na hora de contratar uma enfermeira',
  cta: 'Chama no direct: vamos conversar',
  photoUrl: 'https://images.pexels.com/photos/123/foto.jpg'
})

// 4. Salva imagem
await windows.saveRender(arte.jpgBase64, './output/arte.png')

console.log('✅ Arte gerada com sucesso!')
```

---

## 🔄 ROTAS DA API

### GET /health
```javascript
const { ok, psd } = await windows.health()
```

### POST /render ⭐ (PRINCIPAL)
```javascript
const arte = await windows.render({
  titulo: string,    // Obrigatório
  gancho: string,    // Obrigatório
  cta: string,       // Obrigatório
  photoUrl: string,  // Obrigatório
  pilar: string      // Opcional
})
// Retorna: { success: true, jpgBase64: string, width: 1080, height: 1350 }
```

### POST /exec (requer token)
```javascript
const { stdout, stderr, code } = await windows.exec(
  'Get-Process Photoshop | Select-Object Id, CPU'
)
```

### POST /deploy (requer token)
```javascript
await windows.deploy()
// Atualiza (git pull) e reinicia servidor
```

### GET /layers
```javascript
const { layers } = await windows.getLayers()
// Lista todas as camadas do PSD
```

---

## ✅ CHECKLIST DE INTEGRAÇÃO

### No Mac (Claude Code):
- [ ] Clonar/Pull tilika-ps-server
- [ ] Copiar arquivos para tilika-content-studio
- [ ] Criar pasta docs/windows-integration/ se não existir
- [ ] Criar pasta src/config/ se não existir
- [ ] Importar SDK no código principal
- [ ] Testar health check
- [ ] Testar render
- [ ] Fazer commit e push

### No código:
- [ ] Importar: `import windows from './services/windows-sdk.js'`
- [ ] Iniciar reconexão: `windows.startAutoReconnect()`
- [ ] Aguardar conexão: `while (!windows.connected) await sleep(1000)`
- [ ] Usar render: `await windows.render({...})`
- [ ] Tratar erros: `try/catch`

---

## 🎓 INFORMAÇÕES ADICIONAIS

### Timeouts
- Health check: 3s
- Render: 120s (2 minutos)
- Exec: 60s (1 minuto)
- Deploy: 10s

### Reconexão Automática
- Intervalo: 5s
- Tentativas: Infinitas
- Automático ao ligar Mac ou Windows

### Validação de Campos
Campos obrigatórios para render:
- ✅ titulo (string, não vazio)
- ✅ gancho (string, não vazio)
- ✅ cta (string, não vazio)
- ✅ photoUrl (string, URL válida)

### Tratamento de Erros
```javascript
try {
  await windows.render({...})
} catch (error) {
  if (error.message.includes('Timeout')) {
    // Timeout - Photoshop demorou muito
  } else if (error.message.includes('obrigatórios')) {
    // Validação - Falta campo
  } else if (!windows.connected) {
    // Offline - Windows desconectado
  } else {
    // Outro erro
  }
}
```

---

## 📞 COMANDOS ÚTEIS

### Verificar status do servidor Windows
```bash
# No Mac, via SSH ou remotamente:
curl http://192.168.48.133:4000/health
```

### Testar render direto
```bash
curl -X POST http://192.168.48.133:4000/render \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Teste",
    "gancho": "Teste gancho",
    "cta": "Teste CTA",
    "photoUrl": "https://images.pexels.com/photos/3825539/pexels-photo-3825539.jpeg"
  }'
```

---

**Pronto! Claude Code no Mac terá TODO O CONTEXTO necessário!** 🚀
