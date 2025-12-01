// websocket_server.js
const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// Lista de clientes conectados
const clientes = [];

// Cria servidor WebSocket
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', ws => {
    console.log('Cliente conectado');
    clientes.push(ws);

    ws.on('close', () => {
        console.log('Cliente desconectado');
        const index = clientes.indexOf(ws);
        if(index > -1) clientes.splice(index, 1);
    });
});

// Função para notificar todos os clientes
function notificarAtualizacao() {
    console.log('Enviando atualização para clientes...');
    clientes.forEach(ws => {
        if(ws.readyState === WebSocket.OPEN){
            ws.send('atualizar'); // TV vai receber esta mensagem
        }
    });
}

// Cria servidor HTTP para receber notificações do PHP
const server = http.createServer((req, res) => {
    if(req.url === '/atualizar') {
        notificarAtualizacao();
        res.writeHead(200, {'Content-Type':'text/plain'});
        res.end('Atualização enviada!');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Integrar HTTP + WebSocket
server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor HTTP + WS rodando em porta ${PORT}`);
    console.log(`WebSocket URL: wss://pedidos-producao.onrender.com`);
});
