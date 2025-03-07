import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { useBets } from "@/context/BetContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/bet-utils";
import { getProfitColorClass } from "./BetList";

const DailyProfit: React.FC = () => {
  const { dailyStats } = useBets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Formata a data para o mesmo padrão armazenado no dailyStats (ex: "yyyy-MM-dd")
  const formattedDateKey = format(selectedDate, "yyyy-MM-dd");

  // Encontra a estatística do dia escolhido (se existir)
  const statForSelectedDate = dailyStats.find(
    (stat) => stat.date === formattedDateKey
  );
  const profit = statForSelectedDate ? statForSelectedDate.profitCurrency : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Lucro Diário - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label>Escolha o dia:</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="mt-2"
          />
        </div>
        <div
          className={`text-2xl font-semibold ${getProfitColorClass(
            profit > 0 ? "GREEN" : profit < 0 ? "RED" : "REEMBOLSO"
          )}`}
        >
          {formatCurrency(profit)}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyProfit;
