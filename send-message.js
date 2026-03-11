#!/usr/bin/env node
/**
 * Envia mensagem para o Claude Code no Mac
 * Uso: node send-message.js "Sua mensagem aqui"
 */

const message = process.argv.slice(2).join(' ');

if (!message) {
  console.log('❌ Erro: Você precisa fornecer uma mensagem');
  console.log('Uso: node send-message.js "Sua mensagem aqui"');
  process.exit(1);
}

const http = require('http');

const data = JSON.stringify({
  message,
  from: 'Claude Code Windows'
});

const options = {
  hostname: '192.168.48.133',
  port: 4000,
  path: '/send-to-mac',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(body);
    if (result.success) {
      console.log(`✅ Mensagem enviada para o Mac!`);
      console.log(`📝 ID: ${result.messageId}`);
      console.log(`📊 Total de mensagens: ${result.total}`);
    } else {
      console.log('❌ Erro ao enviar mensagem:', result.error);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  console.log('💡 Certifique-se de que o servidor está rodando na porta 4000');
});

req.write(data);
req.end();
