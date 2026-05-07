# POC gRPC com Node.js, Go e Docker

Este repositório contém uma Prova de Conceito (POC) para demonstrar o uso prático e a arquitetura do **gRPC**. Ele foi construído pensando em um cenário onde um Tech Lead precisa avaliar a adoção e o funcionamento dessa tecnologia.

## O que é o gRPC?
O **gRPC** (gRPC Remote Procedure Calls) é um framework de código aberto de alto desempenho, desenvolvido inicialmente pelo Google. Ele permite que aplicações desenvolvidas em diferentes linguagens e ambientes se comuniquem de forma eficiente, como se fossem chamadas de métodos locais.

Ao invés do tradicional JSON sobre HTTP/1.1 utilizado nas APIs REST, o gRPC utiliza o **Protocol Buffers (Protobuf)** como sua linguagem de definição de interface (IDL) e formato de troca de mensagens. A comunicação ocorre de forma nativa via **HTTP/2**, o que possibilita multiplexação, streaming bidirecional e menor latência.

## Quando utilizar o gRPC?
O gRPC brilha em cenários onde performance, eficiência de rede e contratos rígidos são essenciais:

*   **Comunicação entre Microsserviços (Server-to-Server):** Reduz significativamente a latência e o consumo de rede entre microsserviços.
*   **Sistemas Poliglotas:** Quando seu ecossistema possui serviços em várias linguagens (ex: Node, Go, Java, Python), o gRPC (através do Protobuf) gera as classes e interfaces do cliente e servidor automaticamente para todas as pontas.
*   **Redes de Baixa Largura de Banda / Alta Latência:** A compressão binária do Protobuf torna o payload muito menor do que o JSON.
*   **Aplicações que Exigem Streaming Real-time:** O suporte nativo do HTTP/2 a streaming (Client, Server, ou Bidirectional) facilita a implementação de chats, processamento em tempo real, telemetria, etc.

*Evite utilizar gRPC para:* APIs públicas voltadas para browsers (onde REST ou GraphQL ainda reinam), pois o suporte a gRPC nativo em navegadores exige o uso do `grpc-web`, que adiciona complexidade.

## Pontos Positivos e Negativos

### Pontos Positivos
*   **Performance:** Uso de mensagens binárias compactas e HTTP/2, resultando em menor latência e maior throughput.
*   **Contratos Rígidos (Schema-driven):** O arquivo `.proto` define as mensagens e serviços. É impossível que um cliente envie algo que o servidor não entenda, garantindo *type-safety*.
*   **Geração Automática de Código:** Ferramentas geram o esqueleto do servidor e os stubs do cliente automaticamente para mais de 10 linguagens.
*   **Streaming Nativo:** Suporte a diferentes tipos de comunicação: unária, stream do servidor, stream do cliente, e stream bidirecional.

### Pontos Negativos
*   **Curva de Aprendizado:** Requer entender Protobuf e a mecânica de compilação, diferentemente do simples formato JSON.
*   **Não "Human-Readable":** Mensagens em binário (Protobuf) dificultam a depuração nativa (você não pode simplesmente usar a aba de Network do browser de forma legível sem ferramentas específicas).
*   **Suporte em Browser:** Requer proxies (`grpc-web` ou Envoy) para chamadas diretas do front-end/browser, o que o torna menos atrativo como API Edge para clientes web.

---

## Estrutura da POC

Esta POC é composta por quatro partes principais:

1.  **`proto/`:** Contém o arquivo `greeter.proto`, que define o contrato do serviço `SayHello`.
2.  **`server/`:** Uma aplicação Node.js que implementa o servidor gRPC principal, rodando na porta `50051`.
3.  **`go-server/`:** Um microsserviço em Go que implementa o mesmo serviço gRPC para demonstrar um ambiente poliglota realista, rodando na porta `50052`.
4.  **`client/`:** Uma aplicação Node.js (com Express) que age como cliente gRPC para ambos os servidores. Ela expõe uma API REST na porta `3000` para facilitar os nossos testes, direcionando requisições para o Node ou para o Go em backend.

## Como Executar a POC

Certifique-se de ter o **Docker** e o **Docker Compose** instalados na sua máquina.

1.  No diretório raiz da POC, suba os contêineres:
    ```bash
    docker compose up --build
    ```
    *Dica: adicione `-d` no final se quiser rodar em background.*

2.  Você verá nos logs (caso não use `-d`) que os serviços `grpc-server` (Node), `grpc-go-server` (Go) e `grpc-client` estarão rodando simultaneamente. O Node escuta na porta 50051, o Go na 50052, e a API REST do cliente na porta 3000.

## Como Testar

Para testar a comunicação gRPC de forma simplificada, faremos requisições HTTP para o serviço `client` (porta 3000). O cliente acionará o servidor Node ou o servidor Go via gRPC, dependendo da rota acessada.

Abra o seu navegador ou terminal e acesse as seguintes URLs, trocando `Alex` pelo nome que desejar:

**Testando o Servidor Node.js:**
```bash
# Usando cURL no terminal
curl http://localhost:3000/api/greet/Alex

# Ou no navegador
http://localhost:3000/api/greet/Alex
```

**Testando o Servidor Go:**
```bash
# Usando cURL no terminal
curl http://localhost:3000/api/greet-go/Alex

# Ou no navegador
http://localhost:3000/api/greet-go/Alex
```

**Resultados Esperados:**
Você receberá um JSON de resposta da API do cliente. Repare como as mensagens variam levemente para evidenciar qual servidor respondeu:
```json
{
  "success": true,
  "data": "Olá, Alex! Bem-vindo ao mundo gRPC."
}
```

```json
{
  "success": true,
  "data": "Olá, Alex! Bem-vindo ao mundo gRPC com Go."
}
```

Nos logs do Docker, você também verá o rastreamento das chamadas passando pelos diferentes serviços:
```
poc-grpc-client     | [Client] Calling Go gRPC Server for name: Alex
poc-grpc-go-server  | 2026/05/07 15:00:00 [Go Server] Received request for name: Alex
poc-grpc-client     | [Client Go] Received response: Olá, Alex! Bem-vindo ao mundo gRPC com Go.
```