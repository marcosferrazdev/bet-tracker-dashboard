import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import { useBets } from "@/context/BetContext";
import { formatCurrency } from "@/lib/bet-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart2,
  CircleDollarSign,
  PercentCircle,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { Bar } from "react-chartjs-2";

import {
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  Title,
  Tooltip as ChartTooltip,
  TooltipItem,
} from "chart.js"; // Importando tipos adicionais
import DailyProfit from "./DailyProfit";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const Dashboard: React.FC = () => {
  const { stats, dailyStats, monthlyStats, isLoading } = useBets();

  // Configuração do gráfico de desempenho diário
  const dailyChartData: ChartData<"bar"> = {
    labels: dailyStats.map((stat) => stat.date),
    datasets: [
      {
        label: "Lucro Diário",
        data: dailyStats.map((stat) => stat.profitCurrency),
        backgroundColor: dailyStats.map((stat) =>
          stat.profitCurrency >= 0
            ? "rgba(34, 197, 94, 0.7)"
            : "rgba(239, 68, 68, 0.7)"
        ), // Verde para lucro, vermelho para prejuízo
        borderRadius: 4,
      },
    ],
  };

  const dailyChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number) {
            return formatCurrency(value);
          },
        },
      },
    },
  };  // Função auxiliar para extrair mês e ano da string
  const getMonthAndYear = (monthString: string) => {
    // Separa o mês e o ano (exemplo: "março 2025" -> ["março", "2025"])
    const parts = monthString.split(' ');
    const month = parts[0];
    const year = parts[1];

    const months = {
      'Janeiro': 1,
      'Fevereiro': 2,
      'Março': 3,
      'Abril': 4,
      'Maio': 5,
      'Junho': 6,
      'Julho': 7,
      'Agosto': 8,
      'Setembro': 9,
      'Outubro': 10,
      'Novembro': 11,
      'Dezembro': 12
    };
    
    const monthNumber = months[month as keyof typeof months] || 1;
    return {
      month: monthNumber,
      year: parseInt(year || new Date().getFullYear().toString(), 10)
    };
  };

  // Ordenar os dados mensais
  const sortedMonthlyStats = [...monthlyStats].sort((a, b) => {
    const dateA = getMonthAndYear(a.month);
    const dateB = getMonthAndYear(b.month);
    
    // Primeiro compara o ano, depois o mês
    const yearComparison = dateA.year - dateB.year;
    if (yearComparison !== 0) {
      return yearComparison;
    }
    return dateA.month - dateB.month;
  });

  // Configuração do gráfico de desempenho mensal
  const barChartData: ChartData<"bar"> = {
    labels: sortedMonthlyStats.map((stat) => stat.month),
    datasets: [
      {
        label: "Lucro Mensal",
        data: sortedMonthlyStats.map((stat) => stat.profitCurrency),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">Carregando...</div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Acompanhe o desempenho das suas apostas"
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Lucro Total"
          value={formatCurrency(stats.profitCurrency)}
          icon={<CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatsCard
          title="ROI"
          value={`${stats.roi}%`}
          icon={<PercentCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatsCard
          title="Taxa de Acerto"
          value={`${stats.hitRate}%`}
          icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatsCard
          title="Total de Apostas"
          value={stats.totalBets}
          icon={<BarChart2 className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </div>

      {/* Componente para visualizar o lucro diário */}
      <div className="mb-8">
        <DailyProfit />
      </div>

      {/* Gráfico de Desempenho Diário */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">Desempenho Diário</h2>
        <div className="h-80">
          <Bar data={dailyChartData} options={dailyChartOptions} />
        </div>
      </div>

      {/* Gráfico de Desempenho Mensal */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">Desempenho Mensal</h2>
        <div className="h-80">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Resumo de Apostas */}
      <div className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border mb-8">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">Resumo de Apostas</h2>
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs sm:text-sm">Ganhas</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-success font-semibold text-lg sm:text-xl truncate">
                    {stats.wonBets}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.wonBets} apostas ganhas</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs sm:text-sm">Perdidas</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-danger font-semibold text-lg sm:text-xl truncate">
                    {stats.lostBets}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.lostBets} apostas perdidas</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs sm:text-sm">Reembolsadas</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-neutral font-semibold text-lg sm:text-xl truncate">
                    {stats.refundedBets}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.refundedBets} apostas reembolsadas</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs sm:text-sm">Pendentes</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-neutral font-semibold text-lg sm:text-xl truncate">
                    {stats.pendingBets}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stats.pendingBets} apostas pendentes</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Dashboard;