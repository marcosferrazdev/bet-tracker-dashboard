# Configuração do Supabase para Autenticação

Este guia vai ajudar você a configurar seu projeto Supabase para funcionar corretamente com a autenticação implementada neste aplicativo.

## 1. Pré-requisitos

- Ter uma conta no [Supabase](https://supabase.com)
- Ter criado um projeto no Supabase

## 2. Configuração das Variáveis de Ambiente

1. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`:

   ```
   cp .env.example .env
   ```

2. Acesse seu projeto no Supabase e vá para Configurações > API

3. Copie os valores de:
   - Project URL (URL do projeto)
   - Project API Keys > anon public (chave anônima pública)

4. Cole esses valores no arquivo `.env`:

   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

## 3. Habilitar Registro de Usuários

Se você está recebendo o erro "Signups not allowed for this instance", siga estes passos:

1. No painel do Supabase, vá para **Authentication** > **Providers**
2. Clique em **Email**
3. Certifique-se de que a opção **Enable Sign Up** está ATIVADA
4. Clique em **Save** para salvar as alterações

![Habilitar Registro](https://supabase.com/docs/img/auth-email-enable-signup.png)

## 4. Configurar Autenticação com Google

1. No painel do Supabase, vá para **Authentication** > **Providers**
2. Encontre e clique em **Google**
3. Ative o provedor Google
4. Você precisará fornecer:
   - **Client ID** e **Client Secret** do Google Cloud Platform
   - **Authorized Redirect URI**: Copie este URI para configurar no console do Google

### 4.1 Criar Credenciais no Google Cloud Platform

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth Client ID**
5. Selecione **Web Application** como tipo de aplicativo
6. Adicione o URI de redirecionamento do Supabase em **Authorized Redirect URIs**
7. Copie o **Client ID** e **Client Secret** gerados e cole-os no painel do Supabase

## 5. Testando a Autenticação

Após completar todas as configurações:

1. Reinicie o servidor de desenvolvimento do seu aplicativo
2. Acesse a página de login em `/login`
3. Tente fazer login ou criar uma nova conta
4. Verifique se consegue fazer login com Google

## 6. Resolução de Problemas Comuns

### Erro "Signups not allowed for this instance"
- Verifique se a opção **Enable Sign Up** está ativada nas configurações do Email Provider no Supabase.

### Não consegue fazer login com Google
- Certifique-se de que as credenciais OAuth do Google estão configuradas corretamente
- Verifique se o URI de redirecionamento está exatamente igual ao fornecido pelo Supabase
- Verifique se a API Google+ está ativada no Google Cloud Console

### Não recebe emails de confirmação
- Verifique a seção **Authentication** > **Email Templates** no Supabase 
- Certifique-se de que os modelos de email estão configurados corretamente

## 7. Criando um Primeiro Usuário Admin Manualmente

Se preferir, você pode criar um usuário admin diretamente pelo painel do Supabase:

1. No painel do Supabase, vá para **Authentication** > **Users**
2. Clique em **+ Add User**
3. Preencha o email e a senha do usuário admin
4. Marque a opção **Email Confirmed** para que o usuário já esteja confirmado
5. Clique em **Save** para criar o usuário

Este usuário poderá fazer login imediatamente sem precisar passar pelo processo de confirmação de email.

---

Para mais informações, consulte a [documentação oficial do Supabase sobre autenticação](https://supabase.com/docs/guides/auth).
