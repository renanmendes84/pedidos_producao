// websocket_server.js
const http = require('http');
const WebSocket = require('ws');

// Usa a porta definida pelo Render ou 8080 como fallback
const PORT = process.env.PORT || 8080;

// Cria um servidor HTTP simples (necessário para WebSocket no Render)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Servidor WebSocket rodando!');
});

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ server });

// Array para manter todos os clientes conectados
const clients = [];

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado!');
  clients.push(ws);

  ws.on('message', (message) => {
    console.log('Mensagem recebida:', message);

    // Envia a mensagem para todos os clientes conectados
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
    // Remove o cliente da lista
    const index = clients.indexOf(ws);
    if (index > -1) clients.splice(index, 1);
  });

  ws.on('error', (err) => {
    console.error('Erro no WebSocket:', err);
  });
});

// Inicia o servidor HTTP + WebSocket
server.listen(PORT, () => {
  console.log(`Servidor WebSocket rodando em https://localhost:${PORT} (Render ajusta automaticamente)`);
});
