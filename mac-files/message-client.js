/**
 * Cliente de Mensagens para Mac
 * Comunicação Mac ↔ Windows via servidor
 */

const SERVER_URL = 'http://192.168.48.133:4000';

class MessageClient {
  constructor() {
    this.pollingInterval = null;
    this.onMessageCallback = null;
  }

  /**
   * Envia mensagem para o Windows
   */
  async sendToWindows(message, from = 'Claude Code Mac') {
    try {
      const response = await fetch(`${SERVER_URL}/send-to-windows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, from })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Mensagem enviada para Windows (ID: ${result.messageId})`);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      throw error;
    }
  }

  /**
   * Verifica mensagens recebidas do Windows
   */
  async checkMessages() {
    try {
      const response = await fetch(`${SERVER_URL}/messages-mac`);
      const result = await response.json();

      if (result.total > 0) {
        console.log(`📬 ${result.total} mensagem(ns) não lida(s) do Windows:`);

        result.messages.forEach((msg, i) => {
          console.log(`\n[${i + 1}] De: ${msg.from}`);
          console.log(`⏰ ${new Date(msg.timestamp).toLocaleString('pt-BR')}`);
          console.log(`💬 ${msg.message}`);

          // Callback se configurado
          if (this.onMessageCallback) {
            this.onMessageCallback(msg);
          }

          // Marcar como lida
          this.markAsRead(msg.id);
        });
      }

      return result.messages || [];
    } catch (error) {
      console.error('❌ Erro ao verificar mensagens:', error.message);
      return [];
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(messageId) {
    try {
      await fetch(`${SERVER_URL}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, target: 'mac' })
      });
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error.message);
    }
  }

  /**
   * Inicia polling automático para verificar mensagens
   */
  startPolling(interval = 5000, callback) {
    if (callback) {
      this.onMessageCallback = callback;
    }

    console.log(`🔄 Polling de mensagens iniciado (intervalo: ${interval}ms)`);

    this.pollingInterval = setInterval(async () => {
      await this.checkMessages();
    }, interval);
  }

  /**
   * Para polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏸️ Polling de mensagens pausado');
    }
  }

  /**
   * Limpa mensagens lidas
   */
  async clearReadMessages() {
    try {
      const response = await fetch(`${SERVER_URL}/clear-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'mac' })
      });

      const result = await response.json();
      console.log(`🗑️ ${result.removed} mensagem(ns) lida(s) removida(s)`);
      return result;
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error.message);
    }
  }
}

// Exporta instância singleton
export const messageClient = new MessageClient();
export default messageClient;

// ── EXEMPLO DE USO ─────────────────────────────────────────

/*

// 1. Enviar mensagem para Windows
await messageClient.sendToWindows('Olá Windows! Tudo funcionando?');

// 2. Verificar mensagens manualmente
const messages = await messageClient.checkMessages();

// 3. Polling automático com callback
messageClient.startPolling(5000, (msg) => {
  console.log('Nova mensagem:', msg.message);
  // Fazer algo com a mensagem...
});

// 4. Parar polling
messageClient.stopPolling();

// 5. Limpar mensagens lidas
await messageClient.clearReadMessages();

*/
