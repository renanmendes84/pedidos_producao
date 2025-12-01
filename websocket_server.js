// websocket_server.js
const WebSocket = require('ws');
const mysql = require('mysql2/promise');

// Configuração do MySQL
const dbConfig = {
    host: '127.0.0.1',      // Se o MySQL estiver no mesmo Render, troque para '127.0.0.1'
    user: 'root',
    password: '',           // Sua senha
    database: 'controle_tecnicos'
};

// Porta do WebSocket (Render define automaticamente PORT)
const PORT = process.env.PORT || 8080;

// Criar servidor WebSocket
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket rodando na porta ${PORT}`);
});

// Função para buscar pedidos do banco
async function buscarPedidos() {
    const connection = await mysql.createConnection(dbConfig);

    // PEDIDOS EM PRODUÇÃO
    const [producao] = await connection.execute(`
        SELECT pp.id, pp.cliente, pp.data_pedido, 
               COUNT(pi.id) AS itens_total, 
               SUM(CASE WHEN pi.status='finalizado' THEN 1 ELSE 0 END) AS itens_ok
        FROM producao_pedidos pp
        LEFT JOIN producao_itens pi ON pi.pedido_id = pp.id
        WHERE pp.status='em_producao'
        GROUP BY pp.id
        ORDER BY pp.data_pedido ASC
    `);

    // PEDIDOS FINALIZADOS
    const [finalizados] = await connection.execute(`
        SELECT pp.id, pp.cliente, pp.data_finalizado, 
               SUM(pi.quantidade) AS total_maq
        FROM producao_pedidos pp
        LEFT JOIN producao_itens pi ON pi.pedido_id = pp.id
        WHERE pp.status='finalizado'
        GROUP BY pp.id
        ORDER BY pp.data_finalizado DESC
    `);

    await connection.end();
    return { producao, finalizados };
}

// Envia pedidos para todos os clientes conectados
async function enviarPedidos() {
    const dados = await buscarPedidos();
    const mensagem = JSON.stringify(dados);

    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN){
            client.send(mensagem);
        }
    });
}

// Atualiza os clientes a cada 5 segundos
setInterval(enviarPedidos, 5000);

// Evento de conexão
wss.on('connection', ws => {
    console.log('Novo cliente conectado');
    // Enviar pedidos imediatamente ao conectar
    enviarPedidos();

    ws.on('close', () => console.log('Cliente desconectado'));
    ws.on('error', err => console.error('WebSocket erro:', err));
});

