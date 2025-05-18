import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import { useBets } from "@/context/BetContext";
import { formatCurrency } from "@/lib/bet-utils";
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
  Tooltip,
  TooltipItem,
} from "chart.js"; // Importando tipos adicionais
import DailyProfit from "./DailyProfit";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Lucro Total"
          value={formatCurrency(stats.profitCurrency)}
          icon={<CircleDollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="ROI"
          value={`${stats.roi}%`}
          icon={<PercentCircle className="h-6 w-6" />}
        />
        <StatsCard
          title="Taxa de Acerto"
          value={`${stats.hitRate}%`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Total de Apostas"
          value={stats.totalBets}
          icon={<BarChart2 className="h-6 w-6" />}
        />
      </div>

      {/* Componente para visualizar o lucro diário */}
      <div className="mb-8">
        <DailyProfit />
      </div>

      {/* Gráfico de Desempenho Diário */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 mb-8">
        <h2 className="text-lg font-medium mb-4">Desempenho Diário</h2>
        <div className="h-80">
          <Bar data={dailyChartData} options={dailyChartOptions} />
        </div>
      </div>

      {/* Gráfico de Desempenho Mensal */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 mb-8">
        <h2 className="text-lg font-medium mb-4">Desempenho Mensal</h2>
        <div className="h-80">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Resumo de Apostas */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 mb-8">
        <h2 className="text-lg font-medium mb-4">Resumo de Apostas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Ganhas</span>
            <span className="text-success-600 font-semibold text-xl">
              {stats.wonBets}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Perdidas</span>
            <span className="text-danger-600 font-semibold text-xl">
              {stats.lostBets}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Reembolsadas</span>
            <span className="text-neutral-600 font-semibold text-xl">
              {stats.refundedBets}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Pendentes</span>
            <span className="text-neutral-600 font-semibold text-xl">
              {stats.pendingBets}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;