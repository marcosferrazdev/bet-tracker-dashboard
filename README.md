# Bet Tracker Dashboard

Um dashboard para gerenciamento e acompanhamento de apostas esportivas.

## Recursos

- **Autenticação de Usuário**: Login e registro com email/senha e integração com Google.
- **Dashboard Responsivo**: Interface intuitiva para desktop e dispositivos móveis.
- **Gerenciamento de Apostas**: Acompanhe suas apostas, ganhos e perdas.

## Tecnologias Utilizadas

- React
- TypeScript
- Vite
- Supabase (Autenticação)
- Shadcn UI
- Tailwind CSS

## Configuração

1. Clone o repositório:
   ```
   git clone <URL_DO_REPOSITORIO>
   cd bet-tracker-dashboard
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e adicione suas credenciais do Supabase.

4. Configure o Supabase:
   - Leia o arquivo `SUPABASE_SETUP.md` para instruções detalhadas de configuração da autenticação.
   - Leia o arquivo `RLS_GUIDE.md` para instruções de configuração da segurança (Row Level Security).

5. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

6. Acesse a aplicação em: `http://localhost:5173`

## Configuração do RLS (Row Level Security) no Supabase

Para configurar o RLS e garantir que cada usuário tenha acesso apenas aos seus próprios dados:

1. **Ative o RLS** nas seguintes tabelas no painel do Supabase:
   - bets
   - combo_games
   - tipsters
   - markets
   - teams
   - bookmakers
   - unit_values

2. **Adicione campo user_id** a todas as tabelas e **crie políticas RLS** para cada uma:
   - Siga as instruções completas no arquivo [RLS_GUIDE.md](./RLS_GUIDE.md)
   - Ou execute os comandos SQL no arquivo [rls_setup.sql](./rls_setup.sql) para configurar tudo automaticamente

3. **Atualização da aplicação**:
   - Todas as operações CRUD (Create, Read, Update, Delete) agora verificam o usuário autenticado
   - O valor da unidade (unitValue) é salvo no Supabase vinculado ao usuário
   - Times e casas de apostas agora podem ser adicionados/editados com vinculação ao usuário

## Solução de Problemas

### Erro ao adicionar Times, Casas ou Mercados

Se você receber um erro ao tentar adicionar itens nas abas de configuração (times, casas de apostas, mercados), verifique:

1. **Ativação do RLS**: Certifique-se de que o RLS está ativado em todas as tabelas no Supabase
2. **Campo user_id**: Confirme se o campo `user_id` foi adicionado a todas as tabelas
3. **Políticas**: Verifique se todas as políticas foram criadas corretamente
4. **Autenticação**: Verifique se você está logado na aplicação

### Erro com o Valor da Unidade (unitValue)

Se o valor da unidade não estiver sendo salvo ou recuperado corretamente:

1. **Tabela unit_values**: Verifique se a tabela existe no seu banco Supabase
2. **Estrutura**: A tabela deve ter os campos `id`, `value` e `user_id`
3. **Políticas RLS**: Confirme se as políticas para unit_values foram criadas

## Resolução de Problemas Comuns

### Erro "Signups not allowed for this instance"

Este erro ocorre quando os cadastros estão desabilitados no Supabase. Para resolver:

1. Acesse o painel do Supabase
2. Vá para Authentication > Providers > Email
3. Ative a opção "Enable Sign Up"
4. Salve as alterações

Para mais detalhes, consulte o arquivo `SUPABASE_SETUP.md`.

### Erro ao adicionar ou editar apostas após habilitar RLS

Se você habilitou o Row Level Security (RLS) no Supabase e está tendo problemas para adicionar ou editar apostas, siga estas etapas:

1. Verifique se está autenticado no aplicativo
2. Configure as políticas RLS conforme o arquivo `RLS_GUIDE.md`
3. Certifique-se de que as tabelas existentes tenham o campo `user_id` preenchido

Para mais detalhes, consulte o arquivo `RLS_GUIDE.md`.

## Em Desenvolvimento 🚧

Este projeto está em desenvolvimento ativo. Novos recursos e melhorias estão sendo implementados regularmente.
