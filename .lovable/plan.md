

## Plano: Restaurar Toda a Estrutura do Banco de Dados

O banco de dados Supabase está completamente vazio. Todas as 33 migrações precisam ser executadas para criar a estrutura necessária.

### Estrutura que Será Criada

**Tabelas Principais:**
1. `profiles` - Perfis de usuários (com campos password_changed, last_password_change)
2. `modules` - Os 6 módulos do curso PDA com vídeos e thumbnails
3. `user_progress` - Progresso do usuário em cada módulo
4. `matriz_9box` - Dados da Matriz 9-Box (escala 0-100)
5. `profile_evolution` - Evolução do perfil PDA (com employee_name)

**Sistema de PDI:**
6. `pdis` - PDIs principais com 5 etapas
7. `pdi_mentors` - Mentores dos PDIs
8. `pdi_actions` - Ações com metodologia SMART
9. `pdi_checkins` - Check-ins de acompanhamento
10. `pdi_closures` - Fechamento dos PDIs

**Sistema de Administração:**
11. `user_roles` - Roles de usuários (enum app_role: admin/user)
12. `user_invites` - Convites de usuários
13. `audit_logs` - Logs de auditoria
14. `module_materials` - Materiais dos módulos

**Base de Conhecimento:**
15. `knowledge_base` - Base de conhecimento da Nanda

**Storage:**
- Bucket `module-materials` para arquivos

**Funções:**
- `update_updated_at_column()` - Trigger para updated_at
- `handle_new_user()` - Criação automática de perfil no signup
- `has_role()` - Verificação de roles
- `log_user_action()` - Logging de auditoria

**Dados Iniciais dos Módulos:**

| Módulo | Título | Descrição | Vídeo |
|--------|--------|-----------|-------|
| 1 | Fundamentos do PDA e Autoconhecimento | Teoria de Marston, leitura e interpretação de relatórios | youtube.com/embed/3bWBK32N-PY |
| 2 | Seleção e Onboarding Inteligente | Como o PDA auxilia em processo seletivo assertivo | - |
| 3 | Desenvolvimento e Engajamento | PDI e estratégias de engajamento | - |
| 4 | Demandas de Equipe e Cultura Organizacional | Leitura comportamental para resultados | - |
| 5 | Desenvolvendo Líderes com o PDA | Do potencial à performance | - |
| 6 | RH como Consultor Interno | Transformando dados em decisões estratégicas | - |

### Passos da Implementação

1. **Criar SQL Consolidado**
   - Consolidar todas as 33 migrações em um único script SQL
   - Incluir tratamento para dependências entre tabelas
   - Adicionar dados iniciais dos 6 módulos

2. **Executar no Supabase SQL Editor**
   - Acessar o SQL Editor do Supabase
   - Colar e executar o script consolidado
   - Verificar se todas as tabelas foram criadas

3. **Verificar Storage Bucket**
   - Confirmar criação do bucket `module-materials`

4. **Testar Funcionalidade**
   - Matriz 9Box funcionará após criação da tabela
   - Módulos aparecerão com os vídeos corretos
   - Sistema de PDI estará operacional

### Resultado Esperado

Após a execução:
- A Matriz 9Box funcionará normalmente
- Os 6 módulos aparecerão com vídeos e descrições
- O sistema de PDI estará completo
- A base de conhecimento da Nanda estará populada
- O sistema de administração (roles, logs) estará ativo

