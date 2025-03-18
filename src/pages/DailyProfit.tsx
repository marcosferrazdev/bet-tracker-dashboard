import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useBets } from "@/context/BetContext";
import { formatCurrency, getProfitColorClass, normalizeDate } from "@/lib/bet-utils";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useEffect, useState } from "react";

const DailyProfit: React.FC = () => {
  const { dailyStats, bets } = useBets();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Garante que a data está no mesmo formato que as apostas no banco de dados
  const formattedDateKey = format(selectedDate, "yyyy-MM-dd");
  
  // Debug logs
  useEffect(() => {
    console.log("Data selecionada:", formattedDateKey);
    console.log("Todas as estatísticas diárias:", dailyStats);
    console.log("Todas as apostas:", bets);
    
    // Log detalhado da primeira aposta para verificar o formato da data
    if (bets.length > 0) {
      const firstBet = bets[0];
      console.log("Detalhes da primeira aposta:", {
        date: firstBet.date,
        normalizedDate: normalizeDate(firstBet.date),
        profitCurrency: firstBet.profitCurrency,
        result: firstBet.result
      });
    }
    
    const betsForSelectedDate = bets.filter(bet => {
      const normalizedBetDate = normalizeDate(bet.date);
      const matches = normalizedBetDate === formattedDateKey;
      console.log(`Comparando data da aposta ${normalizedBetDate} (original: ${bet.date}) com ${formattedDateKey}: ${matches}`);
      return matches;
    });
    
    console.log("Apostas para a data selecionada:", betsForSelectedDate);
    
    const statForSelectedDate = dailyStats.find(
      (stat) => stat.date === formattedDateKey
    );
    console.log("Estatística encontrada para a data:", statForSelectedDate);
  }, [selectedDate, dailyStats, bets, formattedDateKey]);
  
  // Procura as estatísticas para a data selecionada
  const statForSelectedDate = dailyStats.find(
    (stat) => stat.date === formattedDateKey
  );
  
  // Se encontrar estatísticas, usa o lucro delas, senão calcula das apostas do dia
  const betsForSelectedDate = bets.filter(bet => normalizeDate(bet.date) === formattedDateKey);
  const profit = statForSelectedDate ? statForSelectedDate.profitCurrency : 
                betsForSelectedDate.reduce((sum, bet) => sum + (bet.profitCurrency || 0), 0);

  // Define a classe de cor baseada no lucro
  let profitColorClass;
  if (profit > 0) {
    profitColorClass = "GREEN";
  } else if (profit < 0) {
    profitColorClass = "RED";
  } else {
    profitColorClass = "REEMBOLSO";
  }

  return (
    <div className="w-full flex justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>
            Lucro Diário -{" "}
            {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label className="mb-2 block text-center">Escolha o dia:</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(startOfDay(date))}
                locale={ptBR}
              />
            </div>
          </div>
          <div
            className={`text-2xl font-semibold ${getProfitColorClass(profitColorClass)}`}
          >
            {formatCurrency(profit)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyProfit;
