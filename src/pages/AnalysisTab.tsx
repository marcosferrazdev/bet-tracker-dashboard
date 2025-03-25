import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBets } from "@/context/BetContext";
import { formatCurrency } from "@/lib/bet-utils";
import { Bet } from "@/types";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  TooltipItem,
  ArcElement,
} from "chart.js";
import { format, subDays, isWithinInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowDown, 
  ArrowUp, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Percent, 
  Target, 
  TrendingUp,
  Calendar,
  PieChart,
  Download,
  BarChart2,
  CircleDollarSign
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface GroupedData {
  key: string;
  GREEN: number;
  RED: number;
  REEMBOLSO: number;
  Pendente: number;
  total: number;
  profit: number;
  roi: number;
}

const groupOptions = [
  { value: "homeTeam", label: "Time Mandante" },
  { value: "awayTeam", label: "Time Visitante" },
  { value: "market", label: "Mercado" },
  { value: "bookmaker", label: "Casa de Apostas" },
  { value: "competition", label: "Competição" },
];

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const AnalysisTab: React.FC = () => {
  const { bets, stats } = useBets();
  const [groupBy, setGroupBy] = useState<string>("homeTeam");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "key", direction: "asc" });
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Filtra apostas por período
  const filteredData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(selectedPeriod));

    const filteredBets = bets.filter(bet => {
      const betDate = new Date(bet.date);
      return isWithinInterval(betDate, { start: startDate, end: endDate });
    });

    // Calcula estatísticas do período
    const totalStake = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = filteredBets.reduce((sum, bet) => sum + (bet.profitCurrency || 0), 0);
    const avgStake = totalStake / filteredBets.length || 0;
    const avgOdds = filteredBets.reduce((sum, bet) => sum + bet.odds, 0) / filteredBets.length || 0;

    // Calcula lucro/prejuízo por dia
    const dailyProfits: { [key: string]: number } = {};
    filteredBets.forEach(bet => {
      const date = format(new Date(bet.date), 'dd/MM', { locale: ptBR });
      dailyProfits[date] = (dailyProfits[date] || 0) + (bet.profitCurrency || 0);
    });

    // Calcula distribuição de apostas do período
    const betDistribution = {
      wonBets: filteredBets.filter(bet => bet.result === "GREEN").length,
      lostBets: filteredBets.filter(bet => bet.result === "RED").length,
      refundedBets: filteredBets.filter(bet => bet.result === "REEMBOLSO").length,
      pendingBets: filteredBets.filter(bet => !bet.result).length,
    };

    return {
      bets: filteredBets,
      totalStake,
      totalProfit,
      avgStake,
      avgOdds,
      dailyProfits,
      betDistribution
    };
  }, [bets, selectedPeriod]);

  // Dados para o gráfico de distribuição de apostas
  const betDistributionData = {
    labels: ["Ganhas", "Perdidas", "Reembolsadas", "Pendentes"],
    datasets: [{
      data: [
        filteredData.betDistribution.wonBets,
        filteredData.betDistribution.lostBets,
        filteredData.betDistribution.refundedBets,
        filteredData.betDistribution.pendingBets
      ],
      backgroundColor: [
        "rgba(34, 197, 94, 0.8)",
        "rgba(239, 68, 68, 0.8)",
        "rgba(59, 130, 246, 0.8)",
        "rgba(168, 162, 158, 0.8)"
      ],
      borderColor: [
        "rgba(34, 197, 94, 1)",
        "rgba(239, 68, 68, 1)",
        "rgba(59, 130, 246, 1)",
        "rgba(168, 162, 158, 1)"
      ],
      borderWidth: 1
    }]
  };

  // Configuração do gráfico de desempenho diário
  const dailyChartData = {
    labels: Object.keys(filteredData.dailyProfits),
    datasets: [
      {
        label: "Lucro Diário",
        data: Object.values(filteredData.dailyProfits),
        backgroundColor: Object.values(filteredData.dailyProfits).map(profit =>
          profit >= 0 ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)"
        ),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Object.values(filteredData.dailyProfits).map(profit =>
          profit >= 0 ? "rgba(34, 197, 94, 1)" : "rgba(239, 68, 68, 1)"
        ),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
            weight: "normal" as const
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold" as const
        },
        bodyFont: {
          size: 13
        },
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
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 0
        },
        ticks: {
          padding: 8,
          font: {
            size: 11
          },
          callback: function (value: number) {
            return formatCurrency(value);
          },
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          padding: 8,
          font: {
            size: 11
          }
        }
      }
    },
  };

  // Agrupa as apostas com base na coluna selecionada e calcula os totais
  const groupedData: GroupedData[] = useMemo(() => {
    const groups: { [key: string]: GroupedData } = {};
    filteredData.bets.forEach((bet) => {
      const key = (bet[groupBy as keyof Bet] as string) || "N/A";
      if (!groups[key]) {
        groups[key] = {
          key,
          GREEN: 0,
          RED: 0,
          REEMBOLSO: 0,
          Pendente: 0,
          total: 0,
          profit: 0,
          roi: 0
        };
      }
      groups[key].total += 1;
      if (bet.result === "GREEN") groups[key].GREEN += 1;
      else if (bet.result === "RED") groups[key].RED += 1;
      else if (bet.result === "REEMBOLSO") groups[key].REEMBOLSO += 1;
      else groups[key].Pendente += 1;

      groups[key].profit += bet.profitCurrency || 0;
      const totalStake = bet.stake || 0;
      groups[key].roi = totalStake ? (groups[key].profit / totalStake) * 100 : 0;
    });
    return Object.values(groups);
  }, [filteredData.bets, groupBy]);

  // Função para alternar a ordenação
  const handleSort = (columnKey: string) => {
    if (sortConfig.key === columnKey) {
      setSortConfig({
        key: columnKey,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key: columnKey, direction: "asc" });
    }
  };

  // Aplica a ordenação
  const sortedData = useMemo(() => {
    return [...groupedData].sort((a, b) => {
      const key = sortConfig.key;
      if (key === "key") {
        return a.key.localeCompare(b.key) * (sortConfig.direction === "asc" ? 1 : -1);
      }
      const aVal = a[key as keyof GroupedData] as number;
      const bVal = b[key as keyof GroupedData] as number;
      return (aVal - bVal) * (sortConfig.direction === "asc" ? 1 : -1);
    });
  }, [groupedData, sortConfig]);

  const getProfitColorClass = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-neutral-600";
  };

  const handleExportData = () => {
    // Ordena as apostas por data em ordem crescente
    const sortedBets = [...filteredData.bets].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    const csvContent = [
      ["Data", "Lucro/Prejuízo", "Stake", "Odds"],
      ...sortedBets.map(bet => [
        format(new Date(bet.date), "dd/MM/yyyy"),
        bet.profitCurrency?.toFixed(2) || "0",
        bet.stake?.toFixed(2) || "0",
        bet.odds?.toFixed(2) || "0"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `apostas_${selectedPeriod}_dias.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Filtros */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-neutral-500" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Métricas do Período */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <CircleDollarSign className="h-5 w-5 text-neutral-500" />
              <span className="text-sm text-neutral-500">Volume Apostado</span>
            </div>
            <span className="text-xl font-semibold">
              {formatCurrency(filteredData.totalStake)}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-neutral-500" />
              <span className="text-sm text-neutral-500">Lucro/Prejuízo</span>
            </div>
            <span className={`text-xl font-semibold ${getProfitColorClass(filteredData.totalProfit)}`}>
              {formatCurrency(filteredData.totalProfit)}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-neutral-500" />
              <span className="text-sm text-neutral-500">Stake Médio</span>
            </div>
            <span className="text-xl font-semibold">
              {formatCurrency(filteredData.avgStake)}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-5 w-5 text-neutral-500" />
              <span className="text-sm text-neutral-500">Odds Média</span>
            </div>
            <span className="text-xl font-semibold">
              {filteredData.avgOdds.toFixed(2)}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Pizza - Distribuição de Apostas */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-neutral-500" />
            Distribuição de Apostas
          </h2>
          <div className="h-64">
            <Pie data={betDistributionData} />
          </div>
        </Card>

        {/* Métricas Adicionais */}
        <Card className="p-6 col-span-2">
          <h2 className="text-lg font-medium mb-4">Métricas do Período</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-500">Volume Apostado</p>
              <p className="text-xl font-semibold mt-1">{formatCurrency(filteredData.totalStake)}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-500">Média Diária</p>
              <p className="text-xl font-semibold mt-1">
                {formatCurrency(filteredData.totalProfit / parseInt(selectedPeriod))}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-500">Maior Lucro</p>
              <p className="text-xl font-semibold mt-1 text-success-600">
                {formatCurrency(Math.max(...Object.values(filteredData.dailyProfits)))}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-500">Maior Prejuízo</p>
              <p className="text-xl font-semibold mt-1 text-danger-600">
                {formatCurrency(Math.min(...Object.values(filteredData.dailyProfits)))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Desempenho */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-neutral-500" />
            Desempenho Diário
          </h2>
          <div className="h-80">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Análise */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Análise Detalhada</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize os resultados agrupados por diferentes critérios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label>Agrupar por:</Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("key")}
                  >
                    {groupOptions.find(opt => opt.value === groupBy)?.label}
                    {sortConfig.key === "key" && (
                      sortConfig.direction === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead className="text-right">Ganhas</TableHead>
                  <TableHead className="text-right">Perdidas</TableHead>
                  <TableHead className="text-right">Reembolsadas</TableHead>
                  <TableHead className="text-right">Pendentes</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("profit")}
                  >
                    Lucro/Prejuízo
                    {sortConfig.key === "profit" && (
                      sortConfig.direction === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("roi")}
                  >
                    ROI
                    {sortConfig.key === "roi" && (
                      sortConfig.direction === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.key}</TableCell>
                    <TableCell className="text-right text-success-600">{row.GREEN}</TableCell>
                    <TableCell className="text-right text-danger-600">{row.RED}</TableCell>
                    <TableCell className="text-right">{row.REEMBOLSO}</TableCell>
                    <TableCell className="text-right">{row.Pendente}</TableCell>
                    <TableCell className={`text-right ${getProfitColorClass(row.profit)}`}>
                      {formatCurrency(row.profit)}
                    </TableCell>
                    <TableCell className={`text-right ${getProfitColorClass(row.roi)}`}>
                      {row.roi.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisTab;