import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
} from "chart.js";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, DollarSign, Percent, Target, TrendingUp } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const { bets } = useBets();
  const [groupBy, setGroupBy] = useState<string>("homeTeam");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "key", direction: "asc" });
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Filtra apostas por período
  const filteredBets = useMemo(() => {
    if (selectedPeriod === "all") return bets;

    const now = new Date();
    const periods = {
      "7d": new Date(now.setDate(now.getDate() - 7)),
      "30d": new Date(now.setDate(now.getDate() - 30)),
      "90d": new Date(now.setDate(now.getDate() - 90)),
    };

    return bets.filter(bet => {
      const betDate = new Date(bet.date);
      return betDate >= periods[selectedPeriod as keyof typeof periods];
    });
  }, [bets, selectedPeriod]);

  // Calcula métricas gerais
  const metrics = useMemo(() => {
    const finishedBets = filteredBets.filter(bet => bet.result !== null);
    const totalStake = filteredBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
    const totalProfit = filteredBets.reduce((sum, bet) => sum + (bet.profitCurrency || 0), 0);
    const greenBets = filteredBets.filter(bet => bet.result === "GREEN").length;
    const totalFinishedBets = finishedBets.length;

    return {
      totalBets: filteredBets.length,
      totalStake,
      totalProfit,
      roi: totalStake ? (totalProfit / totalStake) * 100 : 0,
      hitRate: totalFinishedBets ? (greenBets / totalFinishedBets) * 100 : 0,
      avgStake: filteredBets.length ? totalStake / filteredBets.length : 0,
      avgOdds: filteredBets.length ? filteredBets.reduce((sum, bet) => sum + (bet.odds || 0), 0) / filteredBets.length : 0
    };
  }, [filteredBets]);

  // Agrupa as apostas com base na coluna selecionada e calcula os totais
  const groupedData: GroupedData[] = useMemo(() => {
    const groups: { [key: string]: GroupedData } = {};
    filteredBets.forEach((bet) => {
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
  }, [filteredBets, groupBy]);

  // Calcula o lucro/prejuízo por dia
  const profitByDay = useMemo(() => {
    const dailyProfits: { [key: string]: number } = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final do dia atual

    filteredBets
      .filter(bet => new Date(bet.date) <= today)
      .forEach(bet => {
        const date = format(new Date(bet.date), 'dd/MM/yyyy');
        dailyProfits[date] = (dailyProfits[date] || 0) + (bet.profitCurrency || 0);
      });

    // Ordenar as entradas por data
    return Object.entries(dailyProfits)
      .sort((a, b) => {
        const dateA = new Date(a[0].split('/').reverse().join('-'));
        const dateB = new Date(b[0].split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      })
      .reduce((acc, [date, profit]) => {
        acc[date] = profit;
        return acc;
      }, {} as { [key: string]: number });
  }, [filteredBets]);

  // Configuração do gráfico de desempenho diário
  const dailyChartData = {
    labels: Object.keys(profitByDay),
    datasets: [
      {
        label: "Lucro Diário",
        data: Object.values(profitByDay),
        backgroundColor: Object.values(profitByDay).map(profit =>
          profit >= 0 ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.7)"
        ),
        borderRadius: 4,
      },
    ],
  };

  const dailyChartOptions = {
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

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Período:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColorClass(metrics.totalProfit)}`}>
              {formatCurrency(metrics.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI: {metrics.roi.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.hitRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalBets} apostas {selectedPeriod !== 'all' ? 'no período' : 'totais'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stake Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.avgStake)}
            </div>
            <p className="text-xs text-muted-foreground">
              Odd média: {metrics.avgOdds.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Apostado</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalStake)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total investido {selectedPeriod !== 'all' ? 'no período' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="groupBy" className="block mb-1">
                  Agrupar por:
                </Label>
                <Select value={groupBy} onValueChange={(val) => setGroupBy(val)}>
                  <SelectTrigger id="groupBy">
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("key")}
                      >
                        {groupOptions.find((o) => o.value === groupBy)?.label}
                        {sortConfig.key === "key" && (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="inline-block ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline-block ml-1 h-4 w-4" />
                          )
                        )}
                      </TableHead>
                      {["GREEN", "RED", "REEMBOLSO", "Pendente", "total"].map((col) => (
                        <TableHead
                          key={col}
                          className="cursor-pointer"
                          onClick={() => handleSort(col)}
                        >
                          {col === "total" ? "Total" : col}
                          {sortConfig.key === col && (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp className="inline-block ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline-block ml-1 h-4 w-4" />
                            )
                          )}
                        </TableHead>
                      ))}
                      <TableHead
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("profit")}
                      >
                        Lucro/Prejuízo
                        {sortConfig.key === "profit" && (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="inline-block ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline-block ml-1 h-4 w-4" />
                          )
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer text-right"
                        onClick={() => handleSort("roi")}
                      >
                        ROI
                        {sortConfig.key === "roi" && (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="inline-block ml-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline-block ml-1 h-4 w-4" />
                          )
                        )}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((group) => (
                      <TableRow key={group.key}>
                        <TableCell>{group.key}</TableCell>
                        <TableCell>{group.GREEN}</TableCell>
                        <TableCell>{group.RED}</TableCell>
                        <TableCell>{group.REEMBOLSO}</TableCell>
                        <TableCell>{group.Pendente}</TableCell>
                        <TableCell>{group.total}</TableCell>
                        <TableCell
                          className={`text-right ${getProfitColorClass(group.profit)}`}
                        >
                          {formatCurrency(group.profit)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${getProfitColorClass(group.roi)}`}
                        >
                          {group.roi.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="grid gap-4">
            {/* Gráfico */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Lucro/Prejuízo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <Bar data={dailyChartData} options={dailyChartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Lucro/Prejuízo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(profitByDay).map(([date, profit]) => (
                        <TableRow key={date}>
                          <TableCell className="font-medium">{date}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${getProfitColorClass(profit)}`}
                          >
                            {formatCurrency(profit)}
                          </TableCell>
                          <TableCell>
                            {profit > 0 ? (
                              <ArrowUp className="h-4 w-4 text-green-600" />
                            ) : profit < 0 ? (
                              <ArrowDown className="h-4 w-4 text-red-600" />
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisTab;