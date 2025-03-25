import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from 'dotenv';
import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar a chave da API
const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// Plugin personalizado para adicionar a API do ChatGPT
function chatGptPlugin() {
  return {
    name: 'vite-plugin-chatgpt',
    configureServer(server: ViteDevServer) {
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
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    chatGptPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
