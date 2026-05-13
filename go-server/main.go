package main

import (
	"context"
	"log"
	"net"
	"os"

	pb "go-server/pb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type server struct {
	pb.UnimplementedWatchServiceServer
}

func (s *server) GetWatchedMovies(ctx context.Context, in *pb.UserRequest) (*pb.WatchedMoviesResponse, error) {
	log.Printf("[Go Server] Buscando filmes assistidos para o usuário: %v", in.GetUserId())
	
	// Simulando dados vindos de um banco de dados
	movies := []*pb.Movie{
		{Title: "Matrix", ProgressPercent: 100},
		{Title: "Inception", ProgressPercent: 45},
		{Title: "Interstellar", ProgressPercent: 10},
	}
	
	return &pb.WatchedMoviesResponse{Movies: movies}, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50052"
	}
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterWatchServiceServer(s, &server{})
	reflection.Register(s)
	log.Printf("[Go Server] gRPC WatchService rodando na porta %v", port)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
