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
const target = process.env.GRPC_SERVER_HOST || 'localhost:50051';

// Initialize the gRPC client
const client = new greeterProto.Greeter(target, grpc.credentials.createInsecure());

// Set up Express to expose an HTTP endpoint
const app = express();
app.use(express.json());

app.get('/api/greet/:name', (req, res) => {
  const name = req.params.name;
  
  console.log(`[Client] Calling gRPC Server for name: ${name}`);
  
  // Call the gRPC method
  client.sayHello({ name: name }, (error, response) => {
    if (error) {
      console.error('[Client] Error calling gRPC:', error);
      return res.status(500).json({ error: 'Erro ao se comunicar com o servidor gRPC' });
    }
    
    console.log(`[Client] Received response: ${response.message}`);
    res.json({
      success: true,
      data: response.message
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Client] Express API listening on port ${port}`);
  console.log(`[Client] Connecting to gRPC server at ${target}`);
  console.log(`[Client] Test with: http://localhost:${port}/api/greet/Alex`);
});
