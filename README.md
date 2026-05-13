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

## Muito Além do Hello World: Casos de Uso Reais

Enquanto nossa POC utiliza um exemplo simples do tipo Unário (uma requisição = uma resposta), o verdadeiro poder do gRPC aparece em cenários de arquiteturas distribuídas, alta volumetria e que demandam streaming. Aqui estão exemplos arquiteturais reais de como o gRPC é utilizado nas grandes empresas:

### 1. API Gateway para Microsserviços (BFF - Backend For Frontend)
O caso de uso mais popular é ter uma API Edge "pública" (em Node.js, GraphQL, etc) recebendo requisições HTTP REST padrão de navegadores ou aplicativos mobile. Esse Gateway converte a requisição em chamadas binárias (Protobuf) e aciona diversos microsserviços internos via gRPC, que são "invisíveis" para a internet. 
* **Exemplo Real:** O usuário acessa a tela do Netflix. O Gateway principal recebe o request HTTP REST, e então dispara internamente dezenas de chamadas gRPC concorrentes: uma para o "Serviço de Histórico", outra pro "Serviço de Recomendações" (em Go) e outra pro "Serviço de Perfis" (em Java). Em milissegundos o Gateway recebe tudo, consolida num JSON e devolve pra tela. A redução de latência (tempo de resposta) e o não-uso do "peso" do JSON na rede interna da empresa salvam milhões de dólares em processamento.

### 2. Streaming de Dados (Tempo Real)
O gRPC roda nativamente em cima do HTTP/2, que permite que as conexões fiquem abertas recebendo ou enviando um fluxo ininterrupto de dados.
* **Server Streaming:** O cliente manda uma única requisição ("Extrair base de dados em CSV") e o servidor começa a enviar as milhares de linhas de volta "pedaço por pedaço" via stream, sem sobrecarregar a memória do servidor com o arquivo inteiro de uma vez só.
* **Client Streaming:** Um dispositivo de IoT, ou o app do motorista em um app de mobilidade, enviando pacotes minúsculos com suas coordenadas GPS a cada meio segundo para o servidor, enquanto a conexão permanece a mesma e sem gerar o peso extra dos cabeçalhos HTTP convencionais a cada envio.
* **Bidirectional Streaming (Chat/Jogos):** Tanto o cliente quanto o servidor enviam e recebem dados mutuamente por uma única conexão TCP contínua e sempre aberta. Ideal para processamentos colaborativos em tempo real, chats interativos ou streaming de áudio/vídeo corporativo.

### 3. Padronização Estrita entre Times (Schema-Driven)
Em empresas de médio e grande porte, com dezenas de Squads, depender de JSON/REST frequentemente causa problemas: se o "Time A" mudar o nome do campo de um JSON (ex: de `clientId` para `client_id`), a aplicação do "Time B" repentinamente quebra. 
No gRPC, a empresa inteira compartilha um repositório centralizado com os arquivos `.proto`. Quando há uma mudança nesses arquivos, todas as linguagens (Node, Go, C#) regeram suas interfaces tipadas. Dessa forma, é impossível escrever uma linha de código mandando parâmetros errados, pois seu projeto nem chegará a compilar. É o que chamamos de *type-safety* ou "Segurança de Tipo" cross-plataforma.

---

## Estrutura da POC

Esta POC é composta por quatro partes principais:

1.  **`proto/`:** Contém o arquivo `user_activity.proto`, que define os contratos para buscar "Histórico de Conta" e "Filmes Assistidos".
2.  **`server/`:** Uma aplicação Node.js que implementa o servidor gRPC principal (`HistoryService`), simulando o retorno de dados de conta e pagamentos. Roda na porta `50051`.
3.  **`go-server/`:** Um microsserviço em Go que implementa o serviço gRPC secundário (`WatchService`), simulando a busca do progresso de filmes de um usuário na Netflix. Roda na porta `50052`.
4.  **`client/`:** Uma aplicação Node.js (com Express) que age como API Gateway/BFF. Ela expõe uma API REST na porta `3000` para facilitar nossos testes. Ela direciona requisições de histórico para o Node e de filmes para o Go em backend.

## Como Executar a POC

Certifique-se de ter o **Docker** e o **Docker Compose** instalados na sua máquina.

1.  No diretório raiz da POC, suba os contêineres:
    ```bash
    docker compose up --build
    ```
    *Dica: adicione `-d` no final se quiser rodar em background.*

2.  Você verá nos logs (caso não use `-d`) que os serviços `grpc-server` (Node), `grpc-go-server` (Go) e `grpc-client` estarão rodando simultaneamente. O Node escuta na porta 50051, o Go na 50052, e a API REST do cliente na porta 3000.

## Como Testar

Para testar a comunicação gRPC de forma simplificada, faremos requisições HTTP para a nossa API Gateway `client` (porta 3000). Dependendo da rota acessada, ela fará uma chamada binária gRPC rápida para o servidor Node ou Go responsável pela funcionalidade.

Abra o seu navegador ou terminal e acesse as seguintes URLs, trocando `123` pelo ID de usuário que desejar:

**Testando o Servidor Node.js (Consulta de Histórico):**
```bash
# Usando cURL no terminal
curl http://localhost:3000/api/history/123

# Ou no navegador
http://localhost:3000/api/history/123
```

**Testando o Servidor Go (Filmes Assistidos):**
```bash
# Usando cURL no terminal
curl http://localhost:3000/api/watched/123

# Ou no navegador
http://localhost:3000/api/watched/123
```

**Resultados Esperados:**

No **Histórico da Conta** (Servidor Node.js), você receberá:
```json
{
  "success": true,
  "source": "Node.js",
  "data": [
    { "action": "Login efetuado (Web)", "date": "2026-05-07T10:00:00Z" },
    { "action": "Plano atualizado para Premium", "date": "2026-05-06T15:30:00Z" },
    { "action": "Cartão de crédito adicionado", "date": "2026-05-01T09:12:00Z" }
  ]
}
```

Nos **Filmes Assistidos** (Servidor Go), você receberá:
```json
{
  "success": true,
  "source": "Go",
  "data": [
    { "title": "Matrix", "progressPercent": 100 },
    { "title": "Inception", "progressPercent": 45 },
    { "title": "Interstellar", "progressPercent": 10 }
  ]
}
```

Nos logs do Docker, você também verá o rastreamento das chamadas gRPC passando pelos diferentes contêineres:
```
poc-grpc-client     | [Gateway] Chamando Go gRPC (WatchService) para usuário: 123
poc-grpc-go-server  | 2026/05/07 15:00:00 [Go Server] Buscando filmes assistidos para o usuário: 123
poc-grpc-client     | [Gateway] Resposta de filmes recebida
```