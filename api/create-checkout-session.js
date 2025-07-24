const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

module.exports = async (req, res) => {
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
        price: priceId || 'price_1RoRiwBicdRm3CCSd04BDS7Y', // Price ID de produção
        quantity: 1,
      }],
      success_url: 'https://www.betracker.com.br/configuracoes?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.betracker.com.br/configuracoes',
      metadata: {
        user_id: userId || '',
      },
      ...(customerId && !customerId.includes('simulated') && { customer: customerId }),
    });

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('❌ Erro ao criar checkout session:', error);
    res.status(500).json({ 
      error: `Erro ao criar sessão de checkout: ${error.message}`
    });
  }
}; 