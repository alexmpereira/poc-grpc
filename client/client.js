const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
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

// Determine gRPC server host from environment, default to localhost
const targetNode = process.env.GRPC_SERVER_HOST || 'localhost:50051';
const targetGo = process.env.GRPC_GO_SERVER_HOST || 'localhost:50052';

// Initialize the gRPC clients
const historyClient = new userActivityProto.HistoryService(targetNode, grpc.credentials.createInsecure());
const watchClient = new userActivityProto.WatchService(targetGo, grpc.credentials.createInsecure());

// Set up Express to expose an HTTP endpoint (API Gateway / BFF pattern)
const app = express();
app.use(express.json());

app.get('/api/history/:userId', (req, res) => {
  const userId = req.params.userId;
  
  console.log(`[Gateway] Chamando Node gRPC (HistoryService) para usuário: ${userId}`);
  
  historyClient.getAccountHistory({ user_id: userId }, (error, response) => {
    if (error) {
      console.error('[Gateway] Erro ao chamar Node gRPC:', error);
      return res.status(500).json({ error: 'Erro ao se comunicar com o servidor gRPC Node' });
    }
    
    console.log(`[Gateway] Resposta de histórico recebida`);
    res.json({
      success: true,
      source: 'Node.js',
      data: response.history
    });
  });
});

app.get('/api/watched/:userId', (req, res) => {
  const userId = req.params.userId;
  
  console.log(`[Gateway] Chamando Go gRPC (WatchService) para usuário: ${userId}`);
  
  watchClient.getWatchedMovies({ user_id: userId }, (error, response) => {
    if (error) {
      console.error('[Gateway] Erro ao chamar Go gRPC:', error);
      return res.status(500).json({ error: 'Erro ao se comunicar com o servidor gRPC em Go' });
    }
    
    console.log(`[Gateway] Resposta de filmes recebida`);
    res.json({
      success: true,
      source: 'Go',
      data: response.movies
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Gateway] Express API (BFF) escutando na porta ${port}`);
  console.log(`[Gateway] Conectado ao Node gRPC em ${targetNode}`);
  console.log(`[Gateway] Conectado ao Go gRPC em ${targetGo}`);
  console.log(`[Gateway] Teste o Histórico (Node): http://localhost:${port}/api/history/123`);
  console.log(`[Gateway] Teste os Filmes (Go):     http://localhost:${port}/api/watched/123`);
});
