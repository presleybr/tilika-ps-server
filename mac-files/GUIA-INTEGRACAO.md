# 🚀 Guia de Integração - Mac ↔ Windows

## 📦 Arquivos Necessários

Copie para o projeto do Mac:

```
src/services/
├── api-types.ts          # Types TypeScript
├── windows-sdk.js        # SDK completo
└── API-REFERENCE.md      # Documentação (referência)
```

---

## ⚡ Quick Start

### 1. Importar SDK

```javascript
import windows from './services/windows-sdk.js'
```

### 2. Conectar automaticamente

```javascript
// Inicia reconexão automática
windows.startAutoReconnect()

// Aguarda até conectar
while (!windows.connected) {
  await new Promise(r => setTimeout(r, 1000))
}

console.log('✅ Windows conectado!')
```

### 3. Renderizar arte

```javascript
const arte = await windows.render({
  titulo: '5 sinais de que seu familiar precisa de cuidado',
  gancho: 'Descubra se está na hora de contratar uma enfermeira',
  cta: 'Chama no direct: vamos conversar',
  photoUrl: 'https://images.pexels.com/photos/123/foto.jpg'
})

// Salvar imagem
await windows.saveRender(arte.jpgBase64, './output/arte.png')
```

---

## 🎯 Exemplos Completos

### Renderizar com retry automático

```javascript
const arte = await windows.retry(async () => {
  return await windows.render({
    titulo: 'Meu título',
    gancho: 'Meu gancho',
    cta: 'Minha CTA',
    photoUrl: 'https://...'
  })
}, 3) // 3 tentativas

console.log('Arte renderizada:', arte.width, 'x', arte.height)
```

### Executar comando PowerShell

```javascript
// Ver processos do Photoshop
const result = await windows.exec(
  'Get-Process *photoshop* | Select-Object Id, CPU'
)

console.log('Processos:', result.stdout)
```

### Deploy automático

```javascript
await windows.deploy()
// Servidor atualiza e reinicia automaticamente
// SDK reconecta sozinho após ~5 segundos
```

### Health check

```javascript
const health = await windows.health()
console.log('Windows online:', health.ok)
console.log('PSD existe:', health.psd)
```

### Listar camadas do PSD

```javascript
const { layers } = await windows.getLayers()

layers.forEach(layer => {
  console.log(`${layer.path} (${layer.kind})`)
})
```

---

## 🔄 Tratamento de Erros

### Erro de validação

```javascript
try {
  await windows.render({
    titulo: 'Apenas título' // ERRO: faltam campos
  })
} catch (error) {
  console.error('Erro:', error.message)
  // "Campos obrigatórios: titulo, gancho, cta, photoUrl"
}
```

### Erro de timeout

```javascript
try {
  await windows.render({ ... })
} catch (error) {
  if (error.message.includes('Timeout')) {
    console.error('Photoshop demorou muito!')
  }
}
```

### Erro de conexão

```javascript
try {
  await windows.render({ ... })
} catch (error) {
  if (!windows.connected) {
    console.error('Windows offline! Aguarde reconexão automática...')
  }
}
```

---

## 🛠️ Configuração Avançada

### Customizar timeout

```javascript
import windows from './windows-sdk.js'

// Timeout personalizado para esta requisição
await windows.render({ ... }, { timeout: 180000 }) // 3 minutos
```

### Desabilitar reconexão automática

```javascript
windows.stopAutoReconnect()

// Reconectar manualmente
await windows.healthCheck()
```

### Usar token customizado

```javascript
windows.config.deployToken = 'meu-token-secreto'
```

---

## ✅ Checklist de Implementação

### Fase 1: Setup
- [ ] Copiar arquivos para `src/services/`
- [ ] Importar SDK no código
- [ ] Iniciar reconexão automática
- [ ] Testar health check

### Fase 2: Render
- [ ] Implementar render de arte
- [ ] Testar com dados reais
- [ ] Salvar imagem gerada
- [ ] Adicionar tratamento de erros

### Fase 3: Automação
- [ ] Configurar retry automático
- [ ] Implementar deploy quando necessário
- [ ] Adicionar logs de debug
- [ ] Testar reconexão após reinício

### Fase 4: Produção
- [ ] Timeout adequado (120s)
- [ ] Validação de campos
- [ ] Monitoramento de erros
- [ ] Fallback se Windows offline

---

## 🎓 Boas Práticas

### ✅ SEMPRE fazer:

```javascript
// 1. Aguardar conexão antes de usar
while (!windows.connected) {
  await new Promise(r => setTimeout(r, 1000))
}

// 2. Usar retry para operações críticas
await windows.retry(() => windows.render({ ... }))

// 3. Validar dados antes de enviar
if (!titulo || !gancho || !cta || !photoUrl) {
  throw new Error('Dados incompletos')
}

// 4. Tratar erros específicos
try {
  await windows.render({ ... })
} catch (error) {
  console.error('Erro no render:', error.message)
  // Notificar usuário, salvar log, etc
}
```

### ❌ NUNCA fazer:

```javascript
// ❌ Usar sem verificar conexão
await windows.render({ ... }) // Pode falhar!

// ❌ Ignorar erros
windows.render({ ... }) // Sem try/catch

// ❌ Hardcoded sem validação
await windows.render({
  titulo: undefined, // ERRO!
  gancho: null, // ERRO!
  cta: '', // ERRO!
  photoUrl: 'invalid' // ERRO!
})

// ❌ Timeout muito curto
await windows.render({ ... }, { timeout: 5000 }) // Vai falhar!
```

---

## 🐛 Troubleshooting

### "Windows não está conectado"
```javascript
// Verificar se servidor está rodando
const isOnline = await windows.healthCheck()
console.log('Windows online:', isOnline)

// Se offline, aguardar reconexão automática
while (!windows.connected) {
  await new Promise(r => setTimeout(r, 1000))
}
```

### "Timeout"
```javascript
// Aumentar timeout
await windows.render({ ... }, { timeout: 180000 }) // 3 min
```

### "Campos obrigatórios"
```javascript
// Validar todos os campos antes
const isValid = titulo && gancho && cta && photoUrl
if (!isValid) {
  throw new Error('Preencha todos os campos!')
}
```

---

## 📞 Suporte

Em caso de dúvida, consulte:
- `API-REFERENCE.md` - Documentação completa da API
- `api-types.ts` - Types e validações
- `windows-sdk.js` - Código do SDK (comentado)

---

**Nunca mais perde contexto! Tudo documentado e tipado.** 🚀
