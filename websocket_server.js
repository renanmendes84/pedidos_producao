const WebSocket = require('ws');
const mysql = require('mysql2');

// Conexão com MySQL local
const db = mysql.createConnection({
  host: 'localhost',   // localhost
  user: 'root',        // seu usuário MySQL
  password: '',        // sua senha MySQL
  database: 'controle_tecnicos',
  port: 3306
});

// Testa a conexão
db.connect(err => {
  if(err){
    console.error('Erro ao conectar no MySQL:', err);
    process.exit(1);
  } else {
    console.log('Conectado ao MySQL com sucesso!');
  }
});

// Cria WebSocket server
const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket rodando em ws://localhost:8080');
});

// Função para buscar pedidos
function buscarPedidos(callback){
  let pedidos = { producao: [], finalizados: [] };

  // Pedidos em produção
  db.query(`
    SELECT pp.*, 
           COUNT(pi.id) AS itens_total,
           SUM(CASE WHEN pi.status = 'finalizado' THEN 1 ELSE 0 END) AS itens_ok,
           SUM(pi.quantidade) AS total_maq
    FROM producao_pedidos pp
    LEFT JOIN producao_itens pi ON pi.pedido_id = pp.id
    WHERE pp.status = 'em_producao'
    GROUP BY pp.id
    ORDER BY pp.data_pedido ASC
  `, (err, results) => {
    if(err) console.error(err);
    pedidos.producao = results;

    // Pedidos finalizados
    db.query(`
      SELECT pp.*, SUM(pi.quantidade) AS total_maq
      FROM producao_pedidos pp
      LEFT JOIN producao_itens pi ON pi.pedido_id = pp.id
      WHERE pp.status = 'finalizado'
      GROUP BY pp.id
      ORDER BY pp.data_finalizado DESC
    `, (err2, results2) => {
      if(err2) console.error(err2);
      pedidos.finalizados = results2;
      callback(pedidos);
    });
  });
}

// Quando um cliente conecta
wss.on('connection', ws => {
  console.log('Cliente conectado');

  // Envia pedidos a cada 5s
  const interval = setInterval(() => {
    buscarPedidos(data => {
      ws.send(JSON.stringify(data));
    });
  }, 5000);

  ws.on('close', () => {
    console.log('Cliente desconectado');
    clearInterval(interval);
  });
});



