import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('VITE_STRIPE_PUBLISHABLE_KEY não encontrada nas variáveis de ambiente');
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}; 