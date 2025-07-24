import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { UserPlan, PlanType, PLAN_LIMITS, PlanLimits } from '@/types';
import { toast } from 'sonner';

interface SubscriptionContextType {
  userPlan: UserPlan | null;
  planType: PlanType;
  planLimits: PlanLimits;
  isLoading: boolean;
  isPremium: boolean;
  canCreateBet: (currentBetsCount: number) => boolean;
  upgradeRequired: () => void;
  refreshPlan: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

      const planType: PlanType = userPlan?.plan_type || 'free';
    const planLimits = PLAN_LIMITS[planType];
    const isPremium = planType === 'premium' && userPlan?.subscription_status === 'active';
    
    // Se a assinatura foi cancelada, tratar como free
    const effectivePlanType: PlanType = userPlan?.subscription_status === 'canceled' ? 'free' : planType;
    const effectivePlanLimits = PLAN_LIMITS[effectivePlanType];
    const effectiveIsPremium = effectivePlanType === 'premium' && userPlan?.subscription_status === 'active';

      // Debug logs removidos para produção

  const loadUserPlan = async () => {
    if (!user) {
      setUserPlan(null);
      setIsLoading(false);
      return;
    }

          try {
        // Forçar uma busca fresh sem cache
        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }) // Pegar o mais recente
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error;
        }

        if (data) {
          setUserPlan(data);
        } else {
          // Criar plano free para usuário novo
          const newPlan: Omit<UserPlan, 'id' | 'created_at' | 'updated_at'> = {
            user_id: user.id,
            plan_type: 'free',
            subscription_status: 'inactive',
          };

          const { data: createdPlan, error: createError } = await supabase
            .from('user_plans')
            .insert([newPlan])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setUserPlan(createdPlan);
        }
      } catch (error) {
        console.error('Erro ao carregar plano do usuário:', error);
        toast.error('Erro ao carregar informações da assinatura');
      } finally {
        setIsLoading(false);
      }
  };

      const refreshPlan = async () => {
      setIsLoading(true);
      
      // Forçar uma busca fresh sem cache
      if (user) {
        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!error) {
          setUserPlan(data);
        }
      }
      
      setIsLoading(false);
    };

  const canCreateBet = (currentBetsCount: number): boolean => {
    if (effectiveIsPremium) return true;
    if (effectivePlanLimits.maxBets === null) return true;
    return currentBetsCount < effectivePlanLimits.maxBets;
  };

  const upgradeRequired = () => {
    toast.error('Esta funcionalidade está disponível apenas no plano Premium!', {
      action: {
        label: 'Atualizar Plano',
        onClick: () => {
          // Redirecionar para página de assinatura
          window.location.href = '/configuracoes#assinatura';
        }
      }
    });
  };

  useEffect(() => {
    loadUserPlan();
  }, [user]);

  const value = {
    userPlan,
    planType: effectivePlanType,
    planLimits: effectivePlanLimits,
    isLoading,
    isPremium: effectiveIsPremium,
    canCreateBet,
    upgradeRequired,
    refreshPlan,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 