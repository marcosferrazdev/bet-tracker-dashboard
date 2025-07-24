import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { ViteDevServer } from 'vite';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar a chave da API
const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Plugin personalizado para adicionar a API do ChatGPT e Stripe
function apiPlugin() {
  return {
    name: 'vite-plugin-api',
    configureServer(server: ViteDevServer) {
      // Endpoint do ChatGPT
      server.middlewares.use('/api/chatgpt', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const { prompt } = body;
              
              if (!prompt) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Prompt é obrigatório' }));
                return;
              }
              
              try {
                // Chama a API usando fetch diretamente
                const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500
                  })
                });
                
                const responseData = await apiResponse.json() as any;
                
                if (!apiResponse.ok) {
                  throw new Error(`API respondeu com status ${apiResponse.status}: ${JSON.stringify(responseData)}`);
                }
                
                const content = responseData.choices?.[0]?.message?.content;
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  response: content || "Sem resposta da API"
                }));
              } catch (error: unknown) {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                  error: `Erro ao chamar a API da OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                }));
              }
            } catch (error: unknown) {
              res.statusCode = 400;
              res.end(JSON.stringify({ 
                error: `Erro ao processar a solicitação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
              }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Método não permitido' }));
        }
      });

      // Endpoint para criar sessão de checkout do Stripe
      server.middlewares.use('/api/create-checkout-session', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method === 'POST') {
          try {
            if (!stripeSecretKey) {
              throw new Error('STRIPE_SECRET_KEY não encontrada');
            }

            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            
            req.on('end', async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString());
                const { priceId, customerId, userId } = body;

                console.log('💳 Criando checkout session para usuário:', userId);

                // Criar sessão de checkout
                const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${stripeSecretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                                  body: new URLSearchParams({
                  'mode': 'subscription',
                  'payment_method_types[]': 'card',
                  'line_items[0][price]': priceId || 'price_1234567890', // ID do preço do produto no Stripe
                  'line_items[0][quantity]': '1',
                  'success_url': process.env.NODE_ENV === 'production' 
                    ? `https://bettracker-dashboard.vercel.app/configuracoes?session_id={CHECKOUT_SESSION_ID}`
                    : `http://localhost:5173/configuracoes?session_id={CHECKOUT_SESSION_ID}`,
                  'cancel_url': process.env.NODE_ENV === 'production'
                    ? `https://bettracker-dashboard.vercel.app/configuracoes`
                    : `http://localhost:5173/configuracoes`,
                  'metadata[user_id]': userId || '', // CRUCIAL: Passar o user_id como metadata
                  ...(customerId && !customerId.includes('simulated') && { 'customer': customerId }),
                }),
                });

                const session = await checkoutResponse.json() as any;

                if (!checkoutResponse.ok) {
                  throw new Error(`Stripe API respondeu com status ${checkoutResponse.status}: ${JSON.stringify(session)}`);
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  url: session.url,
                  sessionId: session.id
                }));
              } catch (error: unknown) {
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                  error: `Erro ao criar sessão de checkout: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                }));
              }
            });
          } catch (error: unknown) {
            res.statusCode = 500;
            res.end(JSON.stringify({ 
              error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
            }));
          }
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Método não permitido' }));
        }
      });

      

            // Endpoint para cancelar assinatura
            server.middlewares.use('/api/cancel-subscription', async (req: IncomingMessage, res: ServerResponse) => {
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', (chunk: Buffer) => chunks.push(chunk));

                req.on('end', async () => {
                  try {
                    const body = JSON.parse(Buffer.concat(chunks).toString());
                    const { subscriptionId, userId } = body;

                    // Para desenvolvimento local com assinaturas simuladas
                    if (subscriptionId && subscriptionId.includes('simulated')) {
                      // Cancelamento simulado - atualizar plano para free
                      const { createClient } = await import('@supabase/supabase-js');
                      const supabaseUrl = process.env.VITE_SUPABASE_URL;
                      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                      
                      if (!supabaseUrl || !supabaseKey) {
                        throw new Error('Variáveis do Supabase não encontradas');
                      }
                      
                      const supabase = createClient(supabaseUrl, supabaseKey);
                      
                      // Atualizar plano para free
                      const { error: updateError } = await supabase
                        .from('user_plans')
                        .update({
                          plan_type: 'free',
                          subscription_status: 'canceled',
                          current_period_end: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscriptionId);
                      
                      if (updateError) {
                        throw updateError;
                      }

                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ success: true, message: 'Assinatura simulada cancelada' }));
                    } else {
                      // Para produção real, cancelar no Stripe
                      const stripe = (await import('stripe')).default;
                      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
                        apiVersion: '2025-06-30.basil',
                      });

                      try {
                        await stripeInstance.subscriptions.cancel(subscriptionId);
                      } catch (stripeError: any) {
                        // Se a subscription já foi cancelada, atualizar localmente mesmo assim
                        if (stripeError.code === 'resource_missing' || stripeError.message?.includes('No such subscription')) {
                          console.log('🔄 Subscription já cancelada no Stripe, atualizando localmente...');
                          
                          const { createClient } = await import('@supabase/supabase-js');
                          const supabaseUrl = process.env.VITE_SUPABASE_URL;
                          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                          
                          if (supabaseUrl && supabaseKey) {
                            const supabase = createClient(supabaseUrl, supabaseKey);
                            
                            await supabase
                              .from('user_plans')
                              .update({
                                plan_type: 'free',
                                subscription_status: 'canceled',
                                current_period_end: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                              })
                              .eq('stripe_subscription_id', subscriptionId);
                            
                            console.log('✅ Plano atualizado localmente após Stripe reportar não existir');
                          }
                        } else {
                          throw stripeError;
                        }
                      }

                      res.statusCode = 200;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ success: true, message: 'Assinatura cancelada no Stripe' }));
                    }
                  } catch (error: unknown) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: `Erro ao cancelar assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                    }));
                  }
                });
              } else {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Método não permitido' }));
              }
            });

            // Endpoint para simular cancelamento (APENAS PARA TESTES)
            server.middlewares.use('/api/simulate-cancel', async (req: IncomingMessage, res: ServerResponse) => {
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', (chunk: Buffer) => chunks.push(chunk));

                req.on('end', async () => {
                  try {
                    const body = JSON.parse(Buffer.concat(chunks).toString());
                    const { userId } = body;

                    // Simular cancelamento diretamente aqui
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseUrl = process.env.VITE_SUPABASE_URL;
                    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    
                    if (!supabaseUrl || !supabaseKey) {
                      throw new Error('Variáveis do Supabase não encontradas');
                    }
                    
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    
                    // Atualizar plano para free (cancelado)
                    const { error: updateError } = await supabase
                      .from('user_plans')
                      .update({
                        plan_type: 'free',
                        subscription_status: 'canceled',
                        current_period_end: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      })
                      .eq('user_id', userId);
                    
                    if (updateError) {
                      throw updateError;
                    }
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, message: 'Cancelamento simulado com sucesso' }));
                  } catch (error: unknown) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: `Erro ao simular cancelamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                    }));
                  }
                });
              } else {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Método não permitido' }));
              }
            });

            // Endpoint para forçar cancelamento quando webhook não funciona
            server.middlewares.use('/api/force-cancel', async (req: IncomingMessage, res: ServerResponse) => {
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                req.on('data', (chunk: Buffer) => chunks.push(chunk));

                req.on('end', async () => {
                  try {
                    const body = JSON.parse(Buffer.concat(chunks).toString());
                    const { userId } = body;

                    console.log('🚫 Forçando cancelamento para usuário:', userId);

                    // Forçar cancelamento diretamente
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseUrl = process.env.VITE_SUPABASE_URL;
                    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    
                    if (!supabaseUrl || !supabaseKey) {
                      throw new Error('Variáveis do Supabase não encontradas');
                    }
                    
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    
                    // Forçar cancelamento independente do status atual
                    const { error: updateError } = await supabase
                      .from('user_plans')
                      .update({
                        plan_type: 'free',
                        subscription_status: 'canceled',
                        current_period_end: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      })
                      .eq('user_id', userId);
                    
                    if (updateError) {
                      console.error('❌ Erro ao forçar cancelamento:', updateError);
                      throw updateError;
                    }
                    
                    console.log('✅ Cancelamento forçado com sucesso!');
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, message: 'Cancelamento forçado com sucesso' }));
                  } catch (error: unknown) {
                    console.error('❌ Erro ao forçar cancelamento:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: `Erro ao forçar cancelamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                    }));
                  }
                });
              } else {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Método não permitido' }));
              }
            });

            // Endpoint para simular webhook (APENAS PARA TESTES)
            server.middlewares.use('/api/simulate-webhook', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          
          req.on('end', async () => {
                              try {
                    const body = JSON.parse(Buffer.concat(chunks).toString());
                    const { userId } = body;

                    // Simular webhook diretamente aqui
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabaseUrl = process.env.VITE_SUPABASE_URL;
                    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    
                    if (!supabaseUrl || !supabaseKey) {
                      throw new Error('Variáveis do Supabase não encontradas');
                    }
                    
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    
                    // Verificar se o usuário existe
                    const { data: existingPlan, error: searchError } = await supabase
                      .from('user_plans')
                      .select('*')
                      .eq('user_id', userId)
                      .maybeSingle();
                    
                    if (searchError) {
                      throw searchError;
                    }
                    
                    if (!existingPlan) {
                      // Criar plano Premium
                      const { data: newPlan, error: createError } = await supabase
                        .from('user_plans')
                        .insert([{
                          user_id: userId,
                          plan_type: 'premium',
                          subscription_status: 'active',
                          stripe_customer_id: 'cus_simulated_' + Date.now(),
                          stripe_subscription_id: 'sub_simulated_' + Date.now(),
                          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        }])
                        .select()
                        .single();
                      
                      if (createError) {
                        throw createError;
                      }
                    } else {
                      // Atualizar plano para Premium
                      const updateData = {
                        plan_type: 'premium',
                        subscription_status: 'active',
                        stripe_customer_id: 'cus_simulated_' + Date.now(),
                        stripe_subscription_id: 'sub_simulated_' + Date.now(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                      };
                      
                      const { error: updateError } = await supabase
                        .from('user_plans')
                        .update(updateData)
                        .eq('user_id', userId);
                      
                      if (updateError) {
                        throw updateError;
                      }
                    }
                    
                    const success = true;
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success }));
            } catch (error: unknown) {
              console.error('❌ Erro ao simular webhook:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                error: `Erro ao simular webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
              }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Método não permitido' }));
        }
      });

      // Webhook do Stripe
      server.middlewares.use('/api/webhook/stripe', async (req: IncomingMessage, res: ServerResponse) => {
        console.log('🔔 Webhook recebido do Stripe!');
        
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks);
              const signature = req.headers['stripe-signature'] as string;
              
              console.log('📋 Headers do webhook:', req.headers);
              console.log('🔐 Signature:', signature);
              
              // Parse do evento do Stripe
              const event = JSON.parse(body.toString());
              console.log('📨 Tipo de evento:', event.type);
              console.log('📄 Dados do evento:', JSON.stringify(event, null, 2));
              
              // Processar eventos do Stripe diretamente aqui para evitar problemas de import
              console.log('Processando evento do Stripe:', event.type);
              
                              // Importar Supabase dinamicamente
                const { createClient } = await import('@supabase/supabase-js');
                const supabaseUrl = process.env.VITE_SUPABASE_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
              
              if (!supabaseUrl || !supabaseKey) {
                throw new Error('Variáveis do Supabase não encontradas');
              }
              
              const supabase = createClient(supabaseUrl, supabaseKey);
              
              // Processar eventos importantes
              if (event.type === 'checkout.session.completed') {
                console.log('🎯 Processando checkout.session.completed');
                const session = event.data.object;
                const { customer, subscription, metadata } = session;
                
                if (customer && subscription && metadata?.user_id) {
                  console.log('📝 Atualizando plano para Premium...');
                  
                  const { error } = await supabase
                    .from('user_plans')
                    .update({
                      plan_type: 'premium',
                      stripe_subscription_id: subscription,
                      stripe_customer_id: customer,
                      subscription_status: 'active',
                      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', metadata.user_id);
                  
                  if (error) {
                    console.error('❌ Erro ao atualizar plano:', error);
                  } else {
                    console.log('✅ Plano atualizado para Premium com sucesso!');
                  }
                } else {
                  console.log('❌ Dados insuficientes no checkout.session.completed');
                }
              }
              
              else if (event.type === 'customer.subscription.created') {
                console.log('🎯 Processando customer.subscription.created');
                const subscription = event.data.object;
                const { id, customer, status, current_period_end, metadata } = subscription;
                
                // Buscar usuário pelo customer_id ou metadata
                let userPlan = null;
                
                // Tentar buscar pelo customer_id primeiro
                const { data: planByCustomer } = await supabase
                  .from('user_plans')
                  .select('*')
                  .eq('stripe_customer_id', customer)
                  .maybeSingle();
                
                if (planByCustomer) {
                  userPlan = planByCustomer;
                } else if (metadata?.user_id) {
                  // Buscar pelo user_id do metadata
                  const { data: planByUserId } = await supabase
                    .from('user_plans')
                    .select('*')
                    .eq('user_id', metadata.user_id)
                    .maybeSingle();
                  
                  userPlan = planByUserId;
                }
                
                if (userPlan) {
                  console.log('📝 Atualizando plano via subscription.created...');
                  
                  const { error } = await supabase
                    .from('user_plans')
                    .update({
                      plan_type: 'premium',
                      stripe_subscription_id: id,
                      stripe_customer_id: customer,
                      subscription_status: status,
                      current_period_end: new Date(current_period_end * 1000).toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', userPlan.id);
                  
                  if (error) {
                    console.error('❌ Erro ao atualizar plano:', error);
                  } else {
                    console.log('✅ Plano atualizado para Premium via subscription.created!');
                  }
                } else {
                  console.log('❌ Usuário não encontrado para subscription.created');
                }
              }
              
              else if (event.type === 'customer.subscription.deleted') {
                console.log('🎯 Processando customer.subscription.deleted');
                const subscription = event.data.object;
                const { id, customer } = subscription;
                
                // Buscar usuário pelo subscription_id ou customer_id
                let userPlan = null;
                
                // Tentar buscar pelo subscription_id primeiro
                const { data: planBySubscription } = await supabase
                  .from('user_plans')
                  .select('*')
                  .eq('stripe_subscription_id', id)
                  .maybeSingle();
                
                if (planBySubscription) {
                  userPlan = planBySubscription;
                } else {
                  // Buscar pelo customer_id
                  const { data: planByCustomer } = await supabase
                    .from('user_plans')
                    .select('*')
                    .eq('stripe_customer_id', customer)
                    .maybeSingle();
                  
                  userPlan = planByCustomer;
                }
                
                if (userPlan) {
                  console.log('📝 Cancelando plano via subscription.deleted...');
                  
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
                    console.log('✅ Plano cancelado e revertido para Free!');
                  }
                } else {
                  console.log('❌ Usuário não encontrado para subscription.deleted');
                }
              }
              
              else if (event.type === 'customer.subscription.updated') {
                console.log('🎯 Processando customer.subscription.updated');
                const subscription = event.data.object;
                const { id, customer, status, cancel_at_period_end, current_period_end } = subscription;
                
                // Buscar usuário pelo subscription_id ou customer_id
                let userPlan = null;
                
                // Tentar buscar pelo subscription_id primeiro
                const { data: planBySubscription } = await supabase
                  .from('user_plans')
                  .select('*')
                  .eq('stripe_subscription_id', id)
                  .maybeSingle();
                
                if (planBySubscription) {
                  userPlan = planBySubscription;
                } else {
                  // Buscar pelo customer_id
                  const { data: planByCustomer } = await supabase
                    .from('user_plans')
                    .select('*')
                    .eq('stripe_customer_id', customer)
                    .maybeSingle();
                  
                  userPlan = planByCustomer;
                }
                
                if (userPlan) {
                  console.log('📝 Atualizando status da assinatura...');
                  
                  // Se foi cancelada mas ainda está ativa até o fim do período
                  let planType = userPlan.plan_type;
                  let subscriptionStatus = status;
                  
                  // Se foi cancelada imediatamente ou está expirada
                  if (status === 'canceled' || (cancel_at_period_end && new Date() > new Date(current_period_end * 1000))) {
                    planType = 'free';
                    subscriptionStatus = 'canceled';
                  }
                  
                  const { error } = await supabase
                    .from('user_plans')
                    .update({
                      plan_type: planType,
                      subscription_status: subscriptionStatus,
                      current_period_end: new Date(current_period_end * 1000).toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', userPlan.id);
                  
                  if (error) {
                    console.error('❌ Erro ao atualizar status da assinatura:', error);
                  } else {
                    console.log('✅ Status da assinatura atualizado!');
                  }
                } else {
                  console.log('❌ Usuário não encontrado para subscription.updated');
                }
              }
              
              else {
                console.log(`Evento não processado: ${event.type}`);
              }
              
              console.log('✅ Webhook processado com sucesso!');
              res.statusCode = 200;
              res.end(JSON.stringify({ received: true }));
            } catch (error: unknown) {
              console.error('❌ Erro no webhook:', error);
              res.statusCode = 400;
              res.end(JSON.stringify({ 
                error: `Erro ao processar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
              }));
            }
          });
        } else {
          console.log('❌ Método não permitido no webhook:', req.method);
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Método não permitido' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
