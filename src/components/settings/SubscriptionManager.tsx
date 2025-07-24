import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/context/SubscriptionContext';
import { formatCurrency } from '@/lib/bet-utils';
import { 
  Check, 
  Crown, 
  Zap, 
  BrainCircuit, 
  Calculator,
  Infinity,
  Users,
  Calendar,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface PlanFeature {
  name: string;
  included: boolean;
  icon: React.ReactNode;
}

interface PlanInfo {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const SubscriptionManager: React.FC = () => {
  const { userPlan, planType, isPremium, refreshPlan } = useSubscription();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const plans: PlanInfo[] = [
    {
      name: 'Free',
      price: 'R$ 0',
      description: 'Ideal para começar a rastrear suas apostas',
      features: [
        { name: 'Calculadora Surebet', included: true, icon: <Calculator className="h-4 w-4" /> },
        { name: 'Até 60 apostas', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Dashboard básico', included: true, icon: <Check className="h-4 w-4" /> },
        { name: 'Análise com IA', included: false, icon: <BrainCircuit className="h-4 w-4" /> },
        { name: 'Apostas ilimitadas', included: false, icon: <Infinity className="h-4 w-4" /> },
      ],
    },
    {
      name: 'Premium',
      price: 'R$ 29,90',
      description: 'Para apostadores sérios que querem maximizar resultados',
      popular: true,
      features: [
        { name: 'Calculadora Surebet', included: true, icon: <Calculator className="h-4 w-4" /> },
        { name: 'Apostas ilimitadas', included: true, icon: <Infinity className="h-4 w-4" /> },
        { name: 'Dashboard completo', included: true, icon: <Check className="h-4 w-4" /> },
        { name: 'Análise com IA', included: true, icon: <BrainCircuit className="h-4 w-4" /> },
        { name: 'Suporte prioritário', included: true, icon: <Zap className="h-4 w-4" /> },
      ],
    },
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      toast.info('Redirecionando para o checkout...');
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NODE_ENV === 'production' 
            ? 'price_1RoRiwBicdRm3CCSd04BDS7Y' // PRICE ID DE PRODUÇÃO
            : 'price_1RoOv2BMwiYqcmYXDz446PzG', // ID de TESTE
          customerId: userPlan?.stripe_customer_id?.includes('simulated') ? null : userPlan?.stripe_customer_id,
          userId: user?.id, // CRUCIAL: Passar o user_id do Supabase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Erro ao iniciar upgrade:', error);
      toast.error('Erro ao processar upgrade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      // Verificar se a assinatura já foi cancelada
      if (!userPlan?.stripe_subscription_id || userPlan.subscription_status === 'canceled') {
        toast.error('Esta assinatura já foi cancelada.');
        return;
      }

      // Se é uma subscription simulada, usar endpoint de simulação
      if (userPlan.stripe_subscription_id?.includes('simulated')) {
        await simulateCancel();
        return;
      }

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: userPlan.stripe_subscription_id,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar assinatura');
      }

      // Aguardar para garantir que o webhook foi processado
      toast.info('⏳ Processando cancelamento...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await refreshPlan();
      
      // Verificar se realmente cancelou
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!isPremium) {
        toast.success('🎉 Assinatura cancelada com sucesso!');
      } else {
        toast.warning('⚠️ Cancelamento processado, mas interface não atualizou. Use o botão "Atualizar Status" acima.');
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função temporária para simular cancelamento (APENAS PARA TESTES)
  const simulateCancel = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/simulate-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao simular cancelamento');
      }

      if (data.success) {
        toast.success('✅ Cancelamento realizado com sucesso! Atualizando interface...');
        
        // Aguardar para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualizar o contexto
        await refreshPlan();
        
        // Aguardar e verificar se mudou
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se o contexto foi atualizado
        if (!isPremium) {
          toast.success('🎉 Plano cancelado com sucesso!');
        } else {
          toast.info('🔄 Recarregando página para atualizar interface...');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } else {
        throw new Error('Falha ao simular cancelamento');
      }
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Função temporária para simular webhook (APENAS PARA TESTES)
  const simulateWebhook = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao simular webhook');
      }

      if (data.success) {
        toast.success('✅ Upgrade realizado com sucesso! Atualizando interface...');
        
        // Aguardar para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Atualizar o contexto
        await refreshPlan();
        
        // Aguardar e verificar se mudou
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se o contexto foi atualizado
        if (isPremium) {
          toast.success('🎉 Plano atualizado com sucesso!');
        } else {
          toast.info('🔄 Recarregando página para atualizar interface...');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
              } else {
          throw new Error('Falha ao simular webhook');
        }
      } catch (error) {
        toast.error(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="space-y-6">
      {/* Status atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
                Plano Atual: {planType === 'premium' ? 'Premium' : 'Free'}
              </CardTitle>
              <CardDescription>
                {isPremium 
                  ? 'Você tem acesso a todos os recursos premium'
                  : 'Faça upgrade para desbloquear recursos avançados'
                }
              </CardDescription>
            </div>
            <Badge variant={isPremium ? "default" : "secondary"}>
              {isPremium ? 'Ativo' : 'Gratuito'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {userPlan && isPremium ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Renovação: {formatDate(userPlan.current_period_end)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Status: {userPlan.subscription_status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto"
                    onClick={() => window.open('https://billing.stripe.com/p/login', '_blank')}
                  >
                    Gerenciar cobrança
                  </Button>
                </div>
              </div>
              
              {/* Botão para atualizar status manualmente (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">🔄 Status não atualizado?</h4>
                      <p className="text-sm text-blue-700">
                        Se você cancelou no Stripe mas ainda aparece como Premium, clique para forçar cancelamento:
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={async () => {
                          setLoading(true);
                          await refreshPlan();
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          if (!isPremium) {
                            toast.success('✅ Status atualizado!');
                          } else {
                            toast.info('🔄 Recarregando página...');
                            setTimeout(() => window.location.reload(), 500);
                          }
                          setLoading(false);
                        }} 
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
                      >
                        {loading ? 'Atualizando...' : '🔄 Atualizar'}
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (!user?.id) return;
                          setLoading(true);
                          try {
                            const response = await fetch('/api/force-cancel', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id }),
                            });

                            if (response.ok) {
                              toast.success('✅ Plano cancelado forçadamente!');
                              await refreshPlan();
                              setTimeout(() => window.location.reload(), 1000);
                            } else {
                              throw new Error('Erro ao forçar cancelamento');
                            }
                          } catch (error) {
                            toast.error('❌ Erro ao forçar cancelamento');
                          }
                          setLoading(false);
                        }} 
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                      >
                        {loading ? 'Cancelando...' : '🚫 Forçar Cancelamento'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Botão para simular cancelamento em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && userPlan.stripe_subscription_id?.includes('simulated') && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">🧪 Teste do Sistema</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Para testar o cancelamento da assinatura simulada:
                  </p>
                  <Button 
                    onClick={simulateCancel} 
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                  >
                    {loading ? 'Cancelando...' : '🧪 Simular Cancelamento'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">💳 Teste de Pagamento Real</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Use o botão "Assinar Premium" abaixo para testar o fluxo completo com Stripe. Use cartão de teste: 4242 4242 4242 4242
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">🧪 Simulação Rápida</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Para testar rapidamente sem passar pelo Stripe, use este botão de simulação:
                    </p>
                    <Button 
                      onClick={simulateWebhook} 
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                    >
                      {loading ? 'Simulando...' : '🧪 Simular Upgrade Premium'}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Desenvolvimento:</strong> Ambos os métodos funcionam para teste</p>
                    <p><strong>Produção:</strong> Configure webhook público usando ngrok ou Stripe CLI</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparação de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {plan.name === planType && <Badge variant="outline">Atual</Badge>}
              </CardTitle>
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {plan.price}
                  {plan.name === 'Premium' && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${feature.included ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {feature.included ? <Check className="h-3 w-3" /> : feature.icon}
                    </div>
                    <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              {plan.name === 'Free' && planType === 'free' && (
                <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
                  {loading ? 'Processando...' : 'Fazer Upgrade'}
                </Button>
              )}
              
              {plan.name === 'Premium' && planType === 'free' && (
                <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
                  {loading ? 'Processando...' : 'Assinar Premium'}
                </Button>
              )}
              
              {plan.name === 'Premium' && planType === 'premium' && isPremium && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCancelSubscription}
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Cancelar Assinatura'}
                </Button>
              )}
              
              {plan.name === planType && !isPremium && (
                <Button className="w-full" disabled>
                  Plano Atual
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre os Planos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Plano Free</h4>
            <p className="text-sm text-muted-foreground">
              Perfeito para apostadores iniciantes. Inclui acesso à calculadora de Surebet 
              e permite o registro de até 60 apostas.
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Plano Premium</h4>
            <p className="text-sm text-muted-foreground">
              Para apostadores profissionais. Inclui análise avançada com IA, apostas ilimitadas,
              dashboard completo e suporte prioritário.
            </p>
          </div>
          
          <Separator />
          
          <div className="text-xs text-muted-foreground">
            <p>• Cancele a qualquer momento</p>
            <p>• Cobrança mensal via cartão de crédito</p>
            <p>• Suporte 24/7 para usuários Premium</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager; 