/**
 * Configuração do servidor Photoshop no Windows
 * Copie este arquivo para o projeto do Mac
 */

export const WINDOWS_SERVER = {
  // IP do Windows (atualizar se mudar)
  host: '192.168.48.133',
  port: 4000,
  baseUrl: 'http://192.168.48.133:4000',

  // Configurações de reconexão automática
  autoReconnect: true,
  reconnectInterval: 5000, // Tentar reconectar a cada 5 segundos
  maxReconnectAttempts: 0, // 0 = infinito

  // Timeouts
  timeout: 120000, // 2 minutos para operações pesadas (screenshots, renders)
  healthCheckTimeout: 3000, // 3 segundos para health check

  // Retry
  retryAttempts: 3,
  retryDelay: 2000,
}

export default WINDOWS_SERVER
