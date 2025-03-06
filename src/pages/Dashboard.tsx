
import React from 'react';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import { useBets } from '@/context/BetContext';
import { formatCurrency } from '@/lib/bet-utils';
import { BarChart2, TrendingUp, CircleDollarSign, PercentCircle, Clock } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const { stats, dailyStats, monthlyStats, isLoading } = useBets();

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const lineChartData = {
    labels: dailyStats.map(stat => format(parseISO(stat.date), 'dd/MM', { locale: ptBR })),
    datasets: [
      {
        label: 'Lucro Diário',
        data: dailyStats.map(stat => stat.profitCurrency),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: monthlyStats.map(stat => stat.month),
    datasets: [
      {
        label: 'Lucro Mensal',
        data: monthlyStats.map(stat => stat.profitCurrency),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Acompanhe o desempenho das suas apostas"
      />
      
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <h2 className="text-lg font-medium mb-4">Desempenho Diário</h2>
          <div className="h-80">
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <h2 className="text-lg font-medium mb-4">Desempenho Mensal</h2>
          <div className="h-80">
            <Bar options={barChartOptions} data={barChartData} />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 mb-8">
        <h2 className="text-lg font-medium mb-4">Resumo de Apostas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Ganhas</span>
            <span className="text-success-600 font-semibold text-xl">{stats.wonBets}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Perdidas</span>
            <span className="text-danger-600 font-semibold text-xl">{stats.lostBets}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Reembolsadas</span>
            <span className="text-neutral-600 font-semibold text-xl">{stats.refundedBets}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-neutral-500 text-sm">Pendentes</span>
            <span className="text-neutral-600 font-semibold text-xl">{stats.pendingBets}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
