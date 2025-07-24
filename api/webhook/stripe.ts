import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const signature = req.headers['stripe-signature'] as string;

    console.log('🔔 Webhook recebido do Stripe!');

    // Verificar assinatura do webhook
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('📨 Tipo de evento:', event.type);

    // Processar eventos
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { customer, subscription, metadata } = session;
      
      if (customer && subscription && metadata?.user_id) {
        console.log('📝 Atualizando plano para Premium...');
        
        const { error } = await supabase
          .from('user_plans')
          .update({
            plan_type: 'premium',
            stripe_subscription_id: subscription as string,
            stripe_customer_id: customer as string,
            subscription_status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', metadata.user_id);
        
        if (error) {
          console.error('❌ Erro ao atualizar plano:', error);
        } else {
          console.log('✅ Plano atualizado para Premium!');
        }
      }
    }
    
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const { id, customer } = subscription;
      
      // Buscar usuário pelo subscription_id ou customer_id
      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('*')
        .or(`stripe_subscription_id.eq.${id},stripe_customer_id.eq.${customer}`)
        .maybeSingle();
      
      if (userPlan) {
        console.log('📝 Cancelando plano...');
        
        const { error } = await supabase
          .from('user_plans')
          .update({
            plan_type: 'free',
            subscription_status: 'canceled',
            current_period_end: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userPlan.id);
        
        if (error) {
          console.error('❌ Erro ao cancelar plano:', error);
        } else {
          console.log('✅ Plano cancelado!');
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
    res.status(400).json({ 
      error: `Erro ao processar webhook: ${error.message}`
    });
  }
} 