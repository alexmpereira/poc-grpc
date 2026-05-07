FROM golang:1.22-alpine AS builder

# Install protoc and plugins
RUN apk add --no-cache protobuf-dev protoc
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

WORKDIR /usr/src/app

# Copy proto files
COPY proto/ ./proto/

# Copy Go server code
COPY go-server/ ./go-server/

WORKDIR /usr/src/app/go-server

# Initialize go mod and download dependencies
RUN go mod init go-server
RUN go get google.golang.org/grpc
RUN go get google.golang.org/protobuf
RUN go mod tidy

# Generate proto
RUN mkdir -p pb
RUN protoc --go_out=pb --go_opt=paths=source_relative \
    --go-grpc_out=pb --go-grpc_opt=paths=source_relative \
    -I ../proto ../proto/greeter.proto

# Build the application
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /usr/src/app/go-server/main .

EXPOSE 50052
CMD ["./main"]
