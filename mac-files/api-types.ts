/**
 * TypeScript Types - API Servidor Windows
 * Garante type safety na comunicação Mac → Windows
 */

// ============================================================
// CONFIGURAÇÃO
// ============================================================

export interface WindowsServerConfig {
  host: string
  port: number
  baseUrl: string
  deployToken: string
  timeout: number
  retryAttempts: number
}

export const WINDOWS_CONFIG: WindowsServerConfig = {
  host: '192.168.48.133',
  port: 4000,
  baseUrl: 'http://192.168.48.133:4000',
  deployToken: 'tilika-secret-2025',
  timeout: 120000, // 2 minutos
  retryAttempts: 3,
}

// ============================================================
// REQUESTS
// ============================================================

export interface RenderRequest {
  titulo: string
  gancho: string
  cta: string
  photoUrl: string
  pilar?: string
}

export interface ExecRequest {
  cmd: string
  token: string
}

export interface DeployRequest {
  token: string
}

// ============================================================
// RESPONSES
// ============================================================

export interface HealthResponse {
  ok: boolean
  psd: boolean
}

export interface Layer {
  name: string
  kind: string
  path: string
}

export interface LayersResponse {
  layers: Layer[]
}

export interface RenderResponse {
  success: true
  jpgBase64: string
  width: number
  height: number
}

export interface ExecResponse {
  stdout: string
  stderr: string
  code: number
}

export interface DeployResponse {
  ok: boolean
  msg: string
}

export interface ErrorResponse {
  error: string
}

// ============================================================
// UNION TYPES
// ============================================================

export type ApiResponse<T> = T | ErrorResponse

// ============================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response.error === 'string'
}

export function validateRenderRequest(data: Partial<RenderRequest>): data is RenderRequest {
  return !!(
    data.titulo &&
    data.gancho &&
    data.cta &&
    data.photoUrl &&
    typeof data.titulo === 'string' &&
    typeof data.gancho === 'string' &&
    typeof data.cta === 'string' &&
    typeof data.photoUrl === 'string'
  )
}

export function validateExecRequest(data: Partial<ExecRequest>): data is ExecRequest {
  return !!(
    data.cmd &&
    data.token &&
    typeof data.cmd === 'string' &&
    typeof data.token === 'string'
  )
}

// ============================================================
// ERROS CUSTOMIZADOS
// ============================================================

export class WindowsServerError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'WindowsServerError'
  }
}

export class TimeoutError extends WindowsServerError {
  constructor(operation: string) {
    super(`Timeout na operação: ${operation}`, 408)
    this.name = 'TimeoutError'
  }
}

export class ValidationError extends WindowsServerError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}
