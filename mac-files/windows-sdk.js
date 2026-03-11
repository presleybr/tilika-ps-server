/**
 * SDK Completo para Comunicação Mac → Windows
 * Fonte única da verdade - NUNCA PERDE CONTEXTO
 */

import { WINDOWS_CONFIG } from './api-types.js'

class WindowsSDK {
  constructor() {
    this.config = WINDOWS_CONFIG
    this.connected = false
    this.reconnectInterval = null
  }

  // ============================================================
  // CONEXÃO E RECONEXÃO AUTOMÁTICA
  // ============================================================

  async healthCheck() {
    try {
      const response = await this.request('GET', '/health', { timeout: 3000 })
      this.connected = response.ok && response.psd
      return this.connected
    } catch {
      this.connected = false
      return false
    }
  }

  startAutoReconnect(interval = 5000) {
    this.stopAutoReconnect()
    this.reconnectInterval = setInterval(async () => {
      if (!this.connected) {
        const connected = await this.healthCheck()
        if (connected) {
          console.log('✅ Reconectado ao Windows')
        }
      }
    }, interval)
  }

  stopAutoReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  // ============================================================
  // MÉTODO BASE DE REQUISIÇÃO
  // ============================================================

  async request(method, endpoint, options = {}) {
    const url = `${this.config.baseUrl}${endpoint}`
    const timeout = options.timeout || this.config.timeout

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error(`Timeout: ${method} ${endpoint} demorou mais de ${timeout}ms`)
      }

      this.connected = false
      throw error
    }
  }

  // ============================================================
  // ROTAS PÚBLICAS
  // ============================================================

  /**
   * Verifica se servidor está online
   * @returns {Promise<{ok: boolean, psd: boolean}>}
   */
  async health() {
    return this.request('GET', '/health')
  }

  /**
   * Lista todas as camadas do PSD
   * @returns {Promise<{layers: Array}>}
   */
  async getLayers() {
    return this.request('GET', '/layers')
  }

  /**
   * Retorna log de debug das camadas
   * @returns {Promise<string>}
   */
  async getLayerDebug() {
    const response = await fetch(`${this.config.baseUrl}/layerdebug`)
    return response.text()
  }

  /**
   * Retorna log de erros do Photoshop
   * @returns {Promise<string>}
   */
  async getErrorLog() {
    const response = await fetch(`${this.config.baseUrl}/errorlog`)
    return response.text()
  }

  /**
   * PRINCIPAL: Renderiza arte no Photoshop
   * @param {Object} data - Dados da arte
   * @param {string} data.titulo - Título da arte
   * @param {string} data.gancho - Gancho/descrição
   * @param {string} data.cta - Call to action
   * @param {string} data.photoUrl - URL da foto
   * @param {string} [data.pilar] - Categoria (opcional)
   * @returns {Promise<{success: true, jpgBase64: string, width: number, height: number}>}
   */
  async render({ titulo, gancho, cta, photoUrl, pilar }) {
    // Validação
    if (!titulo || !gancho || !cta || !photoUrl) {
      throw new Error('Campos obrigatórios: titulo, gancho, cta, photoUrl')
    }

    console.log('[Windows SDK] Renderizando:', titulo.slice(0, 40))

    const result = await this.request('POST', '/render', {
      body: { titulo, gancho, cta, photoUrl, pilar },
      timeout: 120000 // 2 minutos para render
    })

    console.log('[Windows SDK] ✅ Arte renderizada')
    return result
  }

  // ============================================================
  // ROTAS PROTEGIDAS (requerem token)
  // ============================================================

  /**
   * Atualiza servidor (git pull) e reinicia
   * @returns {Promise<{ok: boolean, msg: string}>}
   */
  async deploy() {
    console.log('[Windows SDK] Solicitando deploy...')

    const result = await this.request('POST', '/deploy', {
      body: { token: this.config.deployToken },
      timeout: 10000
    })

    console.log('[Windows SDK] Deploy iniciado, aguardando reinício...')

    // Aguarda servidor reiniciar (3-5 segundos)
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Reconecta
    await this.healthCheck()

    console.log('[Windows SDK] ✅ Deploy concluído e reconectado')
    return result
  }

  /**
   * Executa comando PowerShell no Windows
   * @param {string} cmd - Comando PowerShell
   * @returns {Promise<{stdout: string, stderr: string, code: number}>}
   */
  async exec(cmd) {
    if (!cmd) {
      throw new Error('Campo obrigatório: cmd')
    }

    console.log('[Windows SDK] Executando:', cmd.slice(0, 50))

    const result = await this.request('POST', '/exec', {
      body: { cmd, token: this.config.deployToken },
      timeout: 60000 // 1 minuto para comandos
    })

    if (result.code !== 0) {
      console.warn('[Windows SDK] ⚠️ Comando falhou:', result.stderr)
    }

    return result
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Converte base64 para Buffer
   * @param {string} base64 - String base64
   * @returns {Buffer}
   */
  base64ToBuffer(base64) {
    return Buffer.from(base64, 'base64')
  }

  /**
   * Salva imagem renderizada em arquivo
   * @param {string} base64 - Imagem em base64
   * @param {string} outputPath - Caminho do arquivo
   */
  async saveRender(base64, outputPath) {
    const fs = require('fs').promises
    const buffer = this.base64ToBuffer(base64)
    await fs.writeFile(outputPath, buffer)
    console.log('[Windows SDK] ✅ Imagem salva:', outputPath)
  }

  /**
   * Retry automático
   * @param {Function} fn - Função a executar
   * @param {number} attempts - Número de tentativas
   * @returns {Promise<any>}
   */
  async retry(fn, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === attempts - 1) throw error
        console.log(`[Windows SDK] Tentativa ${i + 1} falhou, retentando...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }
}

// Exporta instância singleton
export const windows = new WindowsSDK()
export default windows
