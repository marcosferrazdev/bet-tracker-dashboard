import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useBets } from "@/context/BetContext";
import { formatCurrency, getProfitColorClass, normalizeDate } from "@/lib/bet-utils";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useState } from "react";

const DailyProfit: React.FC = () => {
  const { dailyStats, bets } = useBets();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Garante que a data está no mesmo formato que as apostas no banco de dados
  const formattedDateKey = format(selectedDate, "yyyy-MM-dd");
  
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
