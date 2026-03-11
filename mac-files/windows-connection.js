/**
 * Gerenciador de conexão com servidor Windows
 * Reconexão automática quando ambos PCs estão ligados
 */

import WINDOWS_SERVER from './windows-server-config.js'

class WindowsConnection {
  constructor() {
    this.isConnected = false
    this.reconnectTimer = null
    this.reconnectAttempts = 0
  }

  /**
   * Verifica se o servidor Windows está disponível
   */
  async healthCheck() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), WINDOWS_SERVER.healthCheckTimeout)

      const response = await fetch(`${WINDOWS_SERVER.baseUrl}/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Conecta ao servidor Windows
   */
  async connect() {
    const isAvailable = await this.healthCheck()

    if (isAvailable) {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.log('✅ Conectado ao servidor Windows:', WINDOWS_SERVER.baseUrl)
      return true
    } else {
      this.isConnected = false
      console.log('❌ Servidor Windows não disponível')
      return false
    }
  }

  /**
   * Inicia reconexão automática
   */
  startAutoReconnect() {
    if (!WINDOWS_SERVER.autoReconnect) return

    console.log('🔄 Reconexão automática ativada')

    this.reconnectTimer = setInterval(async () => {
      if (!this.isConnected) {
        this.reconnectAttempts++

        if (WINDOWS_SERVER.maxReconnectAttempts > 0 &&
            this.reconnectAttempts > WINDOWS_SERVER.maxReconnectAttempts) {
          console.log('⚠️ Limite de tentativas de reconexão atingido')
          this.stopAutoReconnect()
          return
        }

        console.log(`🔄 Tentando reconectar... (${this.reconnectAttempts})`)
        await this.connect()
      }
    }, WINDOWS_SERVER.reconnectInterval)
  }

  /**
   * Para reconexão automática
   */
  stopAutoReconnect() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = null
      console.log('⏸️ Reconexão automática pausada')
    }
  }

  /**
   * Envia comando PowerShell para o Windows
   */
  async execCommand(command) {
    if (!this.isConnected) {
      throw new Error('Não conectado ao servidor Windows')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WINDOWS_SERVER.timeout)

    try {
      const response = await fetch(`${WINDOWS_SERVER.baseUrl}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('Timeout: Operação demorou muito')
      }

      // Se falhou, marca como desconectado para tentar reconectar
      this.isConnected = false
      throw error
    }
  }

  /**
   * Solicita render de arte no Photoshop
   */
  async renderArt(data) {
    if (!this.isConnected) {
      throw new Error('Não conectado ao servidor Windows')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WINDOWS_SERVER.timeout)

    try {
      const response = await fetch(`${WINDOWS_SERVER.baseUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('Timeout: Render demorou muito')
      }

      this.isConnected = false
      throw error
    }
  }

  /**
   * Solicita deploy (git pull + restart)
   */
  async deploy() {
    if (!this.isConnected) {
      throw new Error('Não conectado ao servidor Windows')
    }

    try {
      const response = await fetch(`${WINDOWS_SERVER.baseUrl}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      // Aguarda servidor reiniciar
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Reconecta
      return await this.connect()
    } catch (error) {
      this.isConnected = false
      throw error
    }
  }
}

// Exporta instância singleton
export const windowsConnection = new WindowsConnection()
export default windowsConnection
