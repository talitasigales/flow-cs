

## Chat entre Usuários — Plano de Implementação

### Estrutura de Dados

```text
chat_conversations
├── id (uuid, PK)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── type (text) — "direct" (1:1) ou "group" (futuro)

chat_participants
├── id (uuid, PK)
├── conversation_id (uuid, FK chat_conversations)
├── user_id (uuid)
├── joined_at (timestamptz)
├── last_read_at (timestamptz) — controle de "não lidas"
└── UNIQUE(conversation_id, user_id)

chat_messages
├── id (uuid, PK)
├── conversation_id (uuid, FK chat_conversations)
├── sender_id (uuid)
├── content (text)
├── created_at (timestamptz)
└── edited_at (timestamptz, nullable)
```

### Segurança (RLS)
- SELECT/INSERT em mensagens e participantes: apenas quem participa da conversa
- Função `is_participant(conversation_id, user_id)` como security definer para evitar recursão

### Tempo Real
- **Supabase Realtime** (canal por conversa) para receber mensagens instantaneamente sem polling
- Subscribe em `chat_messages` filtrado por `conversation_id`

### Páginas e Componentes

1. **`/messages`** — Lista de conversas com último trecho e contagem de não lidas
2. **`/messages/:conversationId`** — Tela de chat com scroll de mensagens e input
3. **Iniciar conversa** — Botão no perfil público ou nos posts da comunidade ("Enviar mensagem")
4. Componentes: `ConversationList`, `ChatWindow`, `MessageBubble`, `NewConversationDialog`

### Etapas de Implementação

1. Criar migration com as 3 tabelas + RLS + função `is_participant`
2. Habilitar Realtime na tabela `chat_messages`
3. Criar página `/messages` com lista de conversas (join com `public_profiles` para nome/avatar)
4. Criar página `/messages/:id` com chat em tempo real
5. Adicionar botão "Enviar mensagem" nos posts/perfis da comunidade
6. Adicionar item "Mensagens" no sidebar com badge de não lidas
7. Adicionar rotas no `App.tsx`

### Considerações Técnicas

- **Realtime do Supabase** é o componente-chave — sem ele, seria necessário polling, o que degrada a experiência
- O plano atual do Supabase conectado ao projeto precisa ter Realtime habilitado (está disponível em todos os planos)
- Para notificações de novas mensagens fora da tela de chat, um listener global no `AuthProvider` pode atualizar um contador
- Não é necessária nenhuma edge function nova — tudo funciona via client SDK + RLS + Realtime

