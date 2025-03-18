# Configuração de Row Level Security (RLS) no Supabase

Este guia explica como configurar o Row Level Security (RLS) no Supabase para garantir que os usuários só possam acessar seus próprios dados.

## O que é RLS?

Row Level Security (Segurança em Nível de Linha) é um recurso que permite controlar quais linhas em uma tabela um usuário pode acessar. Com RLS, você pode garantir que os usuários só vejam e modifiquem seus próprios dados, mesmo compartilhando o mesmo banco de dados.

## Passos para configurar o RLS no Supabase

### 1. Ativar RLS nas tabelas

Primeiro, ative o RLS para cada tabela no painel do Supabase:

1. Acesse o dashboard do Supabase
2. Vá para "Table Editor" (Editor de Tabela)
3. Selecione cada tabela na lista (bets, combo_games, tipsters, markets, teams, bookmakers, unit_values)
4. Ative a opção "Enable RLS" (Habilitar RLS)

### 2. Adicionar o campo `user_id` às tabelas

Execute o script SQL abaixo no Editor SQL do Supabase para adicionar um campo `user_id` em cada tabela e referenciar o ID do usuário autenticado:

```sql
-- 1. Adicionar campo user_id às tabelas existentes
ALTER TABLE bets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE combo_games ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tipsters ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE bookmakers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE unit_values ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
```

### 3. Preencher os dados existentes com seu ID de usuário

Se você já tem dados nas tabelas, precisa atribuí-los ao seu usuário:

1. Obtenha seu ID de usuário em "Authentication" > "Users" no painel do Supabase
2. Execute o seguinte SQL, substituindo `SEU_ID_DE_USUARIO` pelo seu ID:

```sql
-- 2. Preencher os campos user_id existentes com o seu ID de usuário
UPDATE bets SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
UPDATE combo_games SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
UPDATE tipsters SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
UPDATE markets SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
UPDATE teams SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
UPDATE bookmakers SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
UPDATE unit_values SET user_id = 'SEU_ID_DE_USUARIO' WHERE user_id IS NULL;
```

### 4. Criar políticas RLS para cada tabela

Execute o SQL abaixo para criar políticas RLS que permitam aos usuários acessar apenas seus próprios dados:

```sql
-- 3. Criar políticas RLS para cada tabela

-- Políticas para tabela 'bets'
CREATE POLICY "Usuários podem ver suas próprias apostas" 
ON bets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias apostas" 
ON bets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias apostas" 
ON bets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias apostas" 
ON bets FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela 'combo_games'
CREATE POLICY "Usuários podem ver seus próprios combo_games" 
ON combo_games FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios combo_games" 
ON combo_games FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios combo_games" 
ON combo_games FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios combo_games" 
ON combo_games FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela 'tipsters'
CREATE POLICY "Usuários podem ver seus próprios tipsters" 
ON tipsters FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios tipsters" 
ON tipsters FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios tipsters" 
ON tipsters FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios tipsters" 
ON tipsters FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela 'markets'
CREATE POLICY "Usuários podem ver seus próprios markets" 
ON markets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios markets" 
ON markets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios markets" 
ON markets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios markets" 
ON markets FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela 'teams'
CREATE POLICY "Usuários podem ver seus próprios teams" 
ON teams FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios teams" 
ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios teams" 
ON teams FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios teams" 
ON teams FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela 'bookmakers'
CREATE POLICY "Usuários podem ver seus próprios bookmakers" 
ON bookmakers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios bookmakers" 
ON bookmakers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios bookmakers" 
ON bookmakers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios bookmakers" 
ON bookmakers FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela 'unit_values'
CREATE POLICY "Usuários podem ver seus próprios unit_values" 
ON unit_values FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios unit_values" 
ON unit_values FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios unit_values" 
ON unit_values FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios unit_values" 
ON unit_values FOR DELETE USING (auth.uid() = user_id);
```

## Verificação

Após configurar o RLS, você deve fazer login na aplicação para que o Supabase identifique corretamente seu usuário. O aplicativo foi atualizado para:

1. Adicionar automaticamente seu `user_id` em todos os novos registros
2. Filtrar dados para mostrar apenas seus próprios registros
3. Verificar autenticação antes de qualquer operação de banco de dados

## Solução de problemas

Se você ainda tiver problemas:

1. Verifique se está conectado (logado) no aplicativo
2. Confirme que o RLS está habilitado em cada tabela
3. Verifique se as políticas foram criadas corretamente
4. Confirme que todos os registros existentes têm o `user_id` correto

Para desativar temporariamente o RLS (não recomendado para produção):

1. Acesse o painel do Supabase
2. Vá para Table Editor
3. Desative a opção "Enable RLS" para cada tabela

## Considerações de segurança

Lembre-se que o RLS é uma camada importante de segurança para seu aplicativo. Ele garante que:

- Usuários não possam acessar dados de outros usuários
- Requests maliciosos sejam bloqueados mesmo com credenciais válidas
- Sua aplicação mantenha a privacidade dos dados de cada usuário
