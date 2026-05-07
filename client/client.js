const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../proto/greeter.proto');

// Load the protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const greeterProto = grpc.loadPackageDefinition(packageDefinition).greeter;

// Determine gRPC server host from environment, default to localhost
const targetNode = process.env.GRPC_SERVER_HOST || 'localhost:50051';
const targetGo = process.env.GRPC_GO_SERVER_HOST || 'localhost:50052';

// Initialize the gRPC clients
const clientNode = new greeterProto.Greeter(targetNode, grpc.credentials.createInsecure());
const clientGo = new greeterProto.Greeter(targetGo, grpc.credentials.createInsecure());

// Set up Express to expose an HTTP endpoint
const app = express();
app.use(express.json());

app.get('/api/greet/:name', (req, res) => {
  const name = req.params.name;
  
  console.log(`[Client] Calling Node gRPC Server for name: ${name}`);
  
  // Call the Node gRPC method
  clientNode.sayHello({ name: name }, (error, response) => {
    if (error) {
      console.error('[Client] Error calling gRPC:', error);
      return res.status(500).json({ error: 'Erro ao se comunicar com o servidor gRPC' });
    }
    
    console.log(`[Client Node] Received response: ${response.message}`);
    res.json({
      success: true,
      data: response.message
    });
  });
});

app.get('/api/greet-go/:name', (req, res) => {
  const name = req.params.name;
  
  console.log(`[Client] Calling Go gRPC Server for name: ${name}`);
  
  // Call the Go gRPC method
  clientGo.sayHello({ name: name }, (error, response) => {
    if (error) {
      console.error('[Client] Error calling Go gRPC:', error);
      return res.status(500).json({ error: 'Erro ao se comunicar com o servidor gRPC em Go' });
    }
    
    console.log(`[Client Go] Received response: ${response.message}`);
    res.json({
      success: true,
      data: response.message
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Client] Express API listening on port ${port}`);
  console.log(`[Client] Connecting to Node gRPC server at ${targetNode}`);
  console.log(`[Client] Connecting to Go gRPC server at ${targetGo}`);
  console.log(`[Client] Test Node with: http://localhost:${port}/api/greet/Alex`);
  console.log(`[Client] Test Go with:   http://localhost:${port}/api/greet-go/Alex`);
});
