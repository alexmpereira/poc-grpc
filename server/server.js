const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
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

// Implement the SayHello RPC method
function sayHello(call, callback) {
  console.log(`[Server] Received request for name: ${call.request.name}`);
  callback(null, { message: `Olá, ${call.request.name}! Bem-vindo ao mundo gRPC.` });
}

// Start the gRPC server
function main() {
  const server = new grpc.Server();
  server.addService(greeterProto.Greeter.service, { sayHello: sayHello });
  
  const port = process.env.PORT || 50051;
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`[Server] gRPC Server running on port ${boundPort}`);
  });
}

main();
