const WebSocket = require("ws");
const http = require("http");

// Porta do WebSocket (Render define process.env.PORT)
const PORT = process.env.PORT || 8080;
const API_PORT = process.env.API_PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });

let clients = [];

console.log("🚀 WebSocket ativo na porta:", PORT);

wss.on("connection", ws => {
    console.log("📡 Cliente conectado!");
    clients.push(ws);

    ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
        console.log("❌ Cliente desconectado");
    });
});

// Broadcast para todos os clientes conectados
function broadcast(data) {
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
}

// Servidor HTTP para receber notificações do PHP
http.createServer((req, res) => {
    if (req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                console.log("🔥 Atualização recebida:", body);
                const dados = JSON.parse(body);
                broadcast(dados);
            } catch (e) {
                console.log("❌ Erro ao processar dados:", e);
            }
        });
    }

    res.writeHead(200);
    res.end("OK");
}).listen(API_PORT, () => {
    console.log("🌐 API HTTP para PHP rodando na porta:", API_PORT);
});
