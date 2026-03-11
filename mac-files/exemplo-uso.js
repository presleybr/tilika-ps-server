/**
 * EXEMPLO DE USO - Reconexão automática sem tokens
 */

import autoReconnect from './auto-reconnect.js'

// ✅ PRONTO! Já conecta automaticamente quando importar

// Aguarda até estar conectado
async function aguardarConexao() {
  while (!autoReconnect.connected) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  console.log('✅ Windows conectado!')
}

// Renderizar arte
async function renderizarArte() {
  await aguardarConexao()

  const resultado = await autoReconnect.request('/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Meu título',
      gancho: 'Texto do gancho',
      cta: 'Call to action',
      photoUrl: 'https://...',
      stamp: 8
    })
  })

  console.log('Arte gerada:', resultado)
}

// Executar comando PowerShell
async function executarComando() {
  await aguardarConexao()

  const resultado = await autoReconnect.request('/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'Get-Process Photoshop'
    })
  })

  console.log('Resultado:', resultado)
}

// Deploy (git pull + restart)
async function deploy() {
  await aguardarConexao()

  await autoReconnect.request('/deploy', {
    method: 'POST'
  })

  console.log('Deploy executado! Aguardando reconexão...')
  await aguardarConexao()
  console.log('Windows reconectado após deploy!')
}

export { renderizarArte, executarComando, deploy }
