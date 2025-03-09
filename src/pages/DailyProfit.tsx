import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useBets } from "@/context/BetContext";
import { formatCurrency, getProfitColorClass } from "@/lib/bet-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useState } from "react";

const DailyProfit: React.FC = () => {
  const { dailyStats } = useBets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formattedDateKey = format(selectedDate, "yyyy-MM-dd");
  const statForSelectedDate = dailyStats.find(
    (stat) => stat.date === formattedDateKey
  );
  const profit = statForSelectedDate ? statForSelectedDate.profitCurrency : 0;

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
            {/* Contêiner flex para centralizar o calendário */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
              />
            </div>
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
    </div>
  );
};

export default DailyProfit;
