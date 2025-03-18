import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Email ou senha inválidos');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro no login com Google:', error);
      toast.error('Falha ao fazer login com Google');
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (signUpError) throw signUpError;

      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Falha ao criar conta');
    }
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      onGoogleLogin={handleGoogleLogin}
      onRegister={handleRegister}
    />
  );
}
