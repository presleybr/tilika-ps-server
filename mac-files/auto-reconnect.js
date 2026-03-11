/**
 * Sistema de reconexão automática SEM TOKENS
 * Funciona mesmo quando Mac ou Windows reinicia
 */

const WINDOWS_IP = '192.168.48.133'
const WINDOWS_PORT = 4000
const RETRY_INTERVAL = 3000 // 3 segundos
const MAX_RETRIES = 0 // 0 = infinito

class AutoReconnect {
  constructor() {
    this.connected = false
    this.retries = 0
    this.checkInterval = null
  }

  /**
   * Tenta conectar sem precisar de token
   */
  async tryConnect() {
    try {
      const response = await fetch(`http://${WINDOWS_IP}:${WINDOWS_PORT}/health`, {
        method: 'GET',
        timeout: 2000
      })

      if (response.ok) {
        this.connected = true
        this.retries = 0
        console.log(`✅ [${new Date().toLocaleTimeString()}] Conectado ao Windows`)
        return true
      }
    } catch (error) {
      this.connected = false
      return false
    }
  }

  /**
   * Inicia reconexão automática em loop
   * Funciona mesmo que Windows reinicie
   */
  start() {
    console.log('🔄 Sistema de reconexão automática iniciado')
    console.log(`📡 Monitorando: http://${WINDOWS_IP}:${WINDOWS_PORT}`)

    this.checkInterval = setInterval(async () => {
      if (!this.connected) {
        this.retries++

        if (MAX_RETRIES > 0 && this.retries > MAX_RETRIES) {
          console.log('⚠️ Limite de tentativas atingido')
          this.stop()
          return
        }

        const isConnected = await this.tryConnect()

        if (!isConnected) {
          console.log(`⏳ [${new Date().toLocaleTimeString()}] Aguardando Windows... (tentativa ${this.retries})`)
        }
      } else {
        // Verifica se ainda está conectado
        const stillConnected = await this.tryConnect()
        if (!stillConnected) {
          console.log(`❌ [${new Date().toLocaleTimeString()}] Conexão perdida, tentando reconectar...`)
        }
      }
    }, RETRY_INTERVAL)
  }

  /**
   * Para monitoramento
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      console.log('⏸️ Reconexão automática pausada')
    }
  }

  /**
   * Envia requisição quando conectado
   */
  async request(endpoint, options = {}) {
    if (!this.connected) {
      throw new Error('Windows não está conectado. Aguarde reconexão automática.')
    }

    try {
      const response = await fetch(`http://${WINDOWS_IP}:${WINDOWS_PORT}${endpoint}`, {
        ...options,
        timeout: options.timeout || 60000
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      // Se falhou, marca como desconectado
      this.connected = false
      throw error
    }
  }
}

// Exporta instância única
export const autoReconnect = new AutoReconnect()

// Inicia automaticamente quando importar
autoReconnect.start()

export default autoReconnect
