

## Plano: Comunidade / Rede Social entre Empresas

### Visão Geral
Criar um espaço social onde usuários de diferentes empresas possam compartilhar experiências, dúvidas e aprendizados sobre desenvolvimento humano, PDA e liderança -- tudo dentro da plataforma Flow.

### Estrutura de Dados (novas tabelas)

```text
community_posts
├── id (uuid, PK)
├── user_id (uuid, FK auth.users)
├── content (text)
├── category (text) — ex: "dica", "duvida", "case", "reflexao"
├── likes_count (integer, default 0)
├── comments_count (integer, default 0)
├── created_at / updated_at
└── is_anonymous (boolean, default false)

community_comments
├── id (uuid, PK)
├── post_id (uuid, FK community_posts)
├── user_id (uuid, FK auth.users)
├── content (text)
├── created_at
└── parent_comment_id (uuid, nullable — para respostas aninhadas)

community_likes
├── id (uuid, PK)
├── post_id (uuid, FK community_posts)
├── user_id (uuid, FK auth.users)
└── created_at
└── UNIQUE(post_id, user_id)
```

### Políticas de Segurança (RLS)
- **SELECT em posts e comentários**: todos os usuários autenticados podem ler (cross-company por design)
- **INSERT**: somente usuários autenticados, com `user_id = auth.uid()`
- **UPDATE/DELETE**: somente o autor (`user_id = auth.uid()`) ou admins
- **Likes**: insert/delete próprios, select aberto para autenticados

### Páginas e Componentes

1. **`/community`** — Feed principal
   - Lista de posts com filtro por categoria e busca por texto
   - Botão "Nova Publicação" abre dialog de criação
   - Cada post mostra: avatar, nome, empresa, cargo, data, conteúdo, contagem de likes/comentários
   - Botões de curtir e comentar inline

2. **`/community/:postId`** — Detalhe do post
   - Post completo com thread de comentários
   - Respostas aninhadas (1 nível)
   - Campo para novo comentário

3. **Componentes**:
   - `CommunityFeed` — listagem com scroll infinito ou paginação
   - `PostCard` — card individual do post
   - `NewPostDialog` — formulário de criação (categoria + conteúdo)
   - `CommentThread` — lista de comentários com campo de resposta
   - `LikeButton` — toggle de curtida com contagem

### Exibição de Perfil Cross-Company
- O nome, cargo (`job_title`) e empresa (`company`) do autor são exibidos junto a cada post/comentário
- Dados obtidos via join com a tabela `profiles` (as políticas de SELECT de profiles precisarão de uma nova policy para permitir leitura pública entre autenticados, apenas dos campos `full_name`, `company`, `job_title` e `avatar_url`)
- Alternativa mais segura: criar uma **view** `public_profiles` com apenas esses 4 campos + `user_id`, com `security_invoker=on`

### Navegação
- Novo item "Comunidade" no `AppSidebar` com ícone `Users` ou `MessageCircle`
- Novas rotas em `App.tsx`: `/community` e `/community/:postId`

### Moderação (admin)
- Admins podem excluir qualquer post ou comentário
- Possível extensão futura: denúncias/flags

### Etapas de Implementação

1. Criar migration com as 3 tabelas + RLS policies + view `public_profiles`
2. Criar página `Community.tsx` com feed e dialog de novo post
3. Criar página `CommunityPost.tsx` com detalhe e comentários
4. Criar componentes: `PostCard`, `NewPostDialog`, `CommentThread`, `LikeButton`
5. Adicionar rotas e item no sidebar
6. Testar interação cross-company

### Detalhes Técnicos

- **View pública de perfis** para evitar expor dados sensíveis:
```sql
CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
  SELECT user_id, full_name, company, job_title, avatar_url
  FROM public.profiles;
```

- **Contagem de likes** atualizada via trigger na tabela `community_likes` (incrementa/decrementa `likes_count` no post)
- **Paginação** via `.range()` do Supabase com order by `created_at desc`
- Possibilidade de **postagem anônima** (`is_anonymous = true`) onde nome/empresa não são exibidos

