#!/usr/bin/env node
/**
 * Verifica mensagens recebidas do Mac
 * Uso: node check-messages.js
 */

const http = require('http');

const options = {
  hostname: '192.168.48.133',
  port: 4000,
  path: '/messages',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(body);

    console.log('\n📬 MENSAGENS DO MAC:');
    console.log('─'.repeat(50));

    if (result.total === 0) {
      console.log('📭 Nenhuma mensagem não lida');
    } else {
      result.messages.forEach((msg, i) => {
        console.log(`\n[${i + 1}] De: ${msg.from}`);
        console.log(`⏰ ${new Date(msg.timestamp).toLocaleString('pt-BR')}`);
        console.log(`💬 ${msg.message}`);
        console.log('─'.repeat(50));
      });

      console.log(`\n📊 Total: ${result.total} não lidas | ${result.allMessages} total`);
    }

    console.log('\n');
  });
});

req.on('error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  console.log('💡 Certifique-se de que o servidor está rodando na porta 4000');
});

req.end();
