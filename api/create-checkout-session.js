const Stripe = require('stripe');

module.exports = async (req, res) => {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se a chave do Stripe existe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY não encontrada');
      return res.status(500).json({ error: 'Configuração do Stripe não encontrada' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });

    const { priceId, customerId, userId } = req.body;

    console.log('💳 Criando checkout session para usuário:', userId);
    console.log('🔑 Stripe Key configurada:', !!process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId || 'price_1RoRiwBicdRm3CCSd04BDS7Y',
        quantity: 1,
      }],
      success_url: 'https://www.betracker.com.br/configuracoes?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.betracker.com.br/configuracoes',
      metadata: {
        user_id: userId || '',
      },
      ...(customerId && !customerId.includes('simulated') && { customer: customerId }),
    });

    console.log('✅ Checkout session criada:', session.id);

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('❌ Erro ao criar checkout session:', error);
    
    // Retornar erro detalhado
    res.status(500).json({ 
      error: `Erro ao criar sessão de checkout: ${error.message}`,
      details: error.toString()
    });
  }
}; 