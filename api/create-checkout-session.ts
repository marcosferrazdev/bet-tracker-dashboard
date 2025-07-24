import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, customerId, userId } = req.body;

    console.log('💳 Criando checkout session para usuário:', userId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId || 'price_1RoRiwBicdRm3CCSd04BDS7Y',
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracoes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracoes`,
      metadata: {
        user_id: userId || '',
      },
      ...(customerId && !customerId.includes('simulated') && { customer: customerId }),
    });

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar checkout session:', error);
    res.status(500).json({ 
      error: `Erro ao criar sessão de checkout: ${error.message}`
    });
  }
} 