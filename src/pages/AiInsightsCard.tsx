"use client"; // Se estiver usando Next.js 13 com app router
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, RefreshCw, ArrowRight, RotateCcw, X } from "lucide-react";
import { useBets } from "@/context/BetContext";
import { formatCurrency } from "@/lib/bet-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Componente que exibe um card com campo de texto para perguntas
 * e mostra a resposta da IA via ChatGPT.
 */
const AiInsightsCard: React.FC = () => {
  const { stats, bets } = useBets();
  const [userPrompt, setUserPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAskAi = useCallback(async (questionPrompt = userPrompt) => {
    if (!questionPrompt.trim()) {
      setError("Por favor, digite uma pergunta.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Criar um prompt enriquecido com os dados das apostas
      const last30Days = bets
        .filter(bet => {
          const betDate = new Date(bet.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return betDate >= thirtyDaysAgo;
        })
        .length;

      // Calcular odds média real
      const oddsTotal = bets.reduce((sum, bet) => sum + (bet.odds || 0), 0);
      const oddsMedia = bets.length > 0 ? oddsTotal / bets.length : 0;

      // Calcular lucro diário para informar a IA
      const dailyProfits: { [key: string]: { profit: number, date: Date, formattedDate: string } } = {};
      
      // Primeiro passo: agrupar apostas por dia
      bets.forEach(bet => {
        if (bet.date && bet.profitCurrency !== undefined) {
          const date = new Date(bet.date);
          // Normaliza a data para considerar apenas o dia, sem horas/minutos
          const dateKey = format(date, 'yyyy-MM-dd');
          const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
          
          if (!dailyProfits[dateKey]) {
            dailyProfits[dateKey] = { 
              profit: 0, 
              date: date,
              formattedDate: formattedDate
            };
          }
          
          dailyProfits[dateKey].profit += bet.profitCurrency;
        }
      });

      // Encontrar o melhor dia de lucro
      let bestDay = '';
      let bestDayFormatted = '';
      let bestProfit = -Infinity;

      // Encontrar o pior dia (maior prejuízo)
      let worstDay = '';
      let worstDayFormatted = '';
      let worstProfit = Infinity;

      Object.entries(dailyProfits).forEach(([dateKey, data]) => {
        // Melhor dia
        if (data.profit > bestProfit) {
          bestProfit = data.profit;
          bestDay = dateKey;
          bestDayFormatted = data.formattedDate;
        }
        
        // Pior dia
        if (data.profit < worstProfit) {
          worstProfit = data.profit;
          worstDay = dateKey;
          worstDayFormatted = data.formattedDate;
        }
      });

      // Incluir todas as apostas do melhor dia no prompt
      const betsFromBestDay = bets
        .filter(bet => {
          if (!bet.date) return false;
          const betDate = new Date(bet.date);
          const betDateKey = format(betDate, 'yyyy-MM-dd');
          return betDateKey === bestDay;
        })
        .map(bet => `- ${bet.market || 'Mercado não especificado'}: ${formatCurrency(bet.profitCurrency || 0)} (Odds: ${bet.odds?.toFixed(2) || "N/A"})`);

      // Incluir todas as apostas do pior dia no prompt
      const betsFromWorstDay = bets
        .filter(bet => {
          if (!bet.date) return false;
          const betDate = new Date(bet.date);
          const betDateKey = format(betDate, 'yyyy-MM-dd');
          return betDateKey === worstDay;
        })
        .map(bet => `- ${bet.market || 'Mercado não especificado'}: ${formatCurrency(bet.profitCurrency || 0)} (Odds: ${bet.odds?.toFixed(2) || "N/A"})`);

      // Formatar informações sobre lucro diário para o prompt
      const top5DaysInfo = Object.entries(dailyProfits)
        .sort((a, b) => b[1].profit - a[1].profit)
        .slice(0, 5)
        .map(([dateKey, data]) => `- ${data.formattedDate}: ${formatCurrency(data.profit)}`)
        .join('\n');

      // Formatar informações sobre prejuízo diário para o prompt
      const worst5DaysInfo = Object.entries(dailyProfits)
        .sort((a, b) => a[1].profit - b[1].profit)
        .slice(0, 5)
        .map(([dateKey, data]) => `- ${data.formattedDate}: ${formatCurrency(data.profit)}`)
        .join('\n');

      const enrichedPrompt = `
Contexto das minhas apostas:
- Lucro Total: ${formatCurrency(stats.profitCurrency)}
- ROI: ${stats.roi}%
- Taxa de Acerto: ${stats.hitRate}%
- Total de Apostas: ${stats.totalBets}
- Apostas nos últimos 30 dias: ${last30Days}
- Apostas ganhas: ${stats.wonBets}
- Apostas perdidas: ${stats.lostBets}
- Odd média: ${oddsMedia.toFixed(2)}

Informações detalhadas sobre lucro diário:
- Melhor dia de lucro: ${bestDayFormatted} com lucro de ${formatCurrency(bestProfit)}
- Apostas do melhor dia:
${betsFromBestDay.join('\n')}

- Pior dia de prejuízo: ${worstDayFormatted} com prejuízo de ${formatCurrency(worstProfit)}
- Apostas do pior dia:
${betsFromWorstDay.join('\n')}

- Top 5 dias com maior lucro:
${top5DaysInfo}

- Top 5 dias com maior prejuízo:
${worst5DaysInfo}

Minha pergunta: ${questionPrompt}
`;
      
      const res = await fetch("/api/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: enrichedPrompt }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro na requisição: ${res.status}. ${errorText}`);
      }

      const data = await res.json();
      setAiResponse(data.response || "Não houve resposta.");
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setAiResponse("");
    } finally {
      setLoading(false);
    }
  }, [bets, stats, userPrompt]);

  // Lidar com clique em sugestão
  const handleSuggestionClick = (question: string) => {
    setUserPrompt(question);
    handleAskAi(question);
  };

  // Limpar a resposta e voltar para as sugestões
  const handleClearResponse = () => {
    setAiResponse("");
  };

  // Customize a pergunta baseada no contexto das apostas
  const getDefaultPrompt = () => {
    return "Analise minhas apostas recentes e me dê dicas para melhorar meus resultados.";
  };

  // Exemplos de perguntas que o usuário pode fazer
  const exampleQuestions = [
    "Qual foi meu melhor dia de lucro?",
    "Qual mercado tem melhor ROI?",
    "Como melhorar minha estratégia em apostas de futebol?",
    "Quais dias da semana tenho mais sucesso?"
  ];

  // Componente de skeleton para carregamento
  const ResponseSkeleton = () => (
    <div className="mt-3 p-3 bg-white rounded-lg border border-neutral-100 animate-pulse min-h-[200px]">
      <div className="h-3 w-20 bg-neutral-200 rounded mb-3"></div>
      <div className="space-y-3">
        <div className="h-2 bg-neutral-200 rounded w-full"></div>
        <div className="h-2 bg-neutral-200 rounded w-5/6"></div>
        <div className="h-2 bg-neutral-200 rounded w-4/6"></div>
        <div className="h-2 bg-neutral-200 rounded w-full"></div>
        <div className="h-2 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-2 bg-neutral-200 rounded w-5/6"></div>
        <div className="h-2 bg-neutral-200 rounded w-full"></div>
        <div className="h-2 bg-neutral-200 rounded w-2/3"></div>
        <div className="h-2 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-2 bg-neutral-200 rounded w-4/5"></div>
      </div>
    </div>
  );

  return (
    <div className="border border-neutral-100 rounded-lg p-4 bg-neutral-50">
      <div className="flex items-center gap-2 mb-2">
        <BrainCircuit className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Consultor de IA</h3>
      </div>
      
      <textarea
        className="w-full p-3 border rounded-md mb-2 text-sm bg-white"
        rows={2}
        placeholder="Pergunte sobre estratégias de apostas, análise de desempenho..."
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        onFocus={() => {
          if (!userPrompt) {
            setUserPrompt(getDefaultPrompt());
          }
        }}
      />
      
      <div className="flex justify-between items-center">
        <Button 
          onClick={() => handleAskAi()} 
          disabled={loading || !userPrompt.trim()}
          className="flex items-center gap-2"
          size="sm"
        >
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          {loading ? "Consultando IA..." : "Perguntar IA"}
        </Button>
        
        {error && (
          <p className="text-sm text-red-500 ml-2">{error}</p>
        )}
      </div>

      {loading ? (
        <ResponseSkeleton />
      ) : aiResponse ? (
        <div className="mt-3 bg-white rounded-lg border border-neutral-100">
          <div className="flex justify-between items-center p-3 pb-2 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">Resposta:</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearResponse} 
              className="h-7 w-7 p-0"
              title="Limpar resposta"
            >
              <RotateCcw className="h-4 w-4 text-neutral-500" />
            </Button>
          </div>
          <div className="text-sm whitespace-pre-line max-h-60 overflow-y-auto p-3 pt-2">
            {aiResponse}
          </div>
        </div>
      ) : !error && (
        <div className="mt-3 p-4 bg-white rounded-lg border border-primary-50">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <BrainCircuit className="h-5 w-5" />
            <h4 className="font-medium">Como posso ajudar você?</h4>
          </div>
          <p className="text-sm text-neutral-600 mb-3">
            Tenho acesso a todos os dados das suas apostas e posso analisar seu desempenho, 
            identificar padrões e oferecer insights personalizados para melhorar seus resultados.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-500">Experimente perguntar:</p>
            {exampleQuestions.map((question, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-neutral-50 hover:text-primary transition-colors cursor-pointer"
                onClick={() => handleSuggestionClick(question)}
              >
                <ArrowRight className="h-3 w-3 text-primary" />
                <span>{question}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiInsightsCard;
