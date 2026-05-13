const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../proto/user_activity.proto');

// Load the protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userActivityProto = grpc.loadPackageDefinition(packageDefinition).useractivity;

// Implement the GetAccountHistory RPC method
function getAccountHistory(call, callback) {
  const userId = call.request.user_id;
  console.log(`[Node Server] Buscando histórico para o usuário: ${userId}`);
  
  // Simulando dados de banco de dados
  const historyData = [
    { action: "Login efetuado (Web)", date: "2026-05-07T10:00:00Z" },
    { action: "Plano atualizado para Premium", date: "2026-05-06T15:30:00Z" },
    { action: "Cartão de crédito adicionado", date: "2026-05-01T09:12:00Z" }
  ];
  
  callback(null, { history: historyData });
}

// Start the gRPC server
function main() {
  const server = new grpc.Server();
  server.addService(userActivityProto.HistoryService.service, { getAccountHistory: getAccountHistory });
  
  const port = process.env.PORT || 50051;
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`[Node Server] gRPC HistoryService rodando na porta ${boundPort}`);
  });
}

main();
