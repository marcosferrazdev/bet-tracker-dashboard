import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SpinnerIcon, GoogleIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin, onGoogleLogin, onRegister }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        await onRegister(formData.name, formData.email, formData.password);
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você já pode fazer login com suas credenciais.',
        });
        setIsRegistering(false);
      } else {
        await onLogin(formData.email, formData.password);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await onGoogleLogin();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao fazer login com o Google.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isRegistering ? 'Criar conta' : 'Bem-vindo de volta'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering
              ? 'Preencha os dados abaixo para criar sua conta'
              : 'Entre com suas credenciais para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {!isRegistering && (
                <div className="text-sm text-right">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                    type="button"
                    onClick={() => window.location.href = '/recuperar-senha'}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && (
                <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isRegistering ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full"
          >
            {isLoading ? (
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
          <Button
            variant="link"
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full"
          >
            {isRegistering
              ? 'Já tem uma conta? Faça login'
              : 'Não tem uma conta? Cadastre-se'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 