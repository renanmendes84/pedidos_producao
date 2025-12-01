const WebSocket = require('ws');
const http = require('http');

const wss = new WebSocket.Server({ port: 8080 });
const clientes = [];

wss.on('connection', ws => {
    clientes.push(ws);
    ws.on('close', () => {
        const index = clientes.indexOf(ws);
        if(index > -1) clientes.splice(index, 1);
    });
});

function notificarAtualizacao() {
    clientes.forEach(ws => {
        if(ws.readyState === WebSocket.OPEN){
            ws.send('atualizar');
        }
    });
}

const server = http.createServer((req, res) => {
    if(req.url === '/atualizar') {
        notificarAtualizacao();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Atualização enviada!');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(process.env.PORT || 8080);
