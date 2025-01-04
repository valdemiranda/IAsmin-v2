# IAsmin-v2

IAsmin-v2 é um bot do Telegram que integra diferentes modelos de IA para fornecer respostas inteligentes e gerar imagens. O bot mantém o contexto das conversas, permite escolher diferentes modelos de IA e inclui um sistema de autorização de usuários.

## Funcionalidades

- 🤖 Integração com múltiplos modelos de IA (via OpenAI e OpenRouter)
- 🎨 Geração de imagens com DALL-E
- 🔄 Manutenção de contexto nas conversas
- 👥 Sistema de autorização de usuários
- 🔄 Suporte a respostas encadeadas
- 📸 Processamento de imagens nas conversas

## Tecnologias

- TypeScript
- Node.js
- Prisma (ORM)
- PostgreSQL
- Telegram Bot API
- OpenAI API
- OpenRouter API

## Estrutura do Projeto

```
src/
├── config/         # Configurações do projeto
├── database/       # Inicialização do banco de dados
├── handlers/       # Handlers de comandos e mensagens
├── repositories/   # Camada de acesso ao banco de dados
├── services/       # Serviços externos (Telegram, OpenAI, OpenRouter)
└── types/          # Definições de tipos TypeScript

prisma/
├── schema.prisma   # Schema do banco de dados
└── migrations/     # Migrações do banco de dados
```

## Configuração

### Requisitos

- Node.js 18 ou superior
- PostgreSQL 15 ou superior

### Passos

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente em um arquivo `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/iasmin"
TELEGRAM_BOT_TOKEN="seu-token-do-telegram"
OPENAI_API_KEY="sua-chave-da-openai"
OPENROUTER_API_KEY="sua-chave-do-openrouter"
```

4. Execute as migrações do banco de dados:

```bash
npx prisma migrate deploy
```

5. Inicie o bot:

```bash
npm start
```

## Comandos do Bot

- `/start` - Iniciar o bot e registrar usuário
- `/model` - Escolher ou visualizar o modelo atual de IA
- `/generate` - Iniciar geração de imagem com DALL-E
- `/help` - Mostrar ajuda sobre os comandos

## Banco de Dados

O projeto utiliza PostgreSQL com Prisma como ORM. O schema inclui:

- `User` - Informações dos usuários e suas preferências
- `Model` - Modelos de IA disponíveis
- `Context` - Contextos de conversas (chat ou geração de imagem)
- `Message` - Mensagens trocadas em cada contexto

## Desenvolvimento

O projeto segue os princípios de Modular Functional Programming:

- Single Responsibility Principle (SRP)
- Functional Composition
- Pure Functions
- Module Pattern
- Separation of Concerns

Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request
