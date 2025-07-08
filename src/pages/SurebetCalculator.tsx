import PageHeader from '@/components/PageHeader';
import ResultsContent from '@/components/ResultsContent';
import ShareSurebetImage from '@/components/ShareSurebetImage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, HelpCircle, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Bet {
  odds: number;
  stake: number;
  profit: number;
  maxStake: number;
  commission: number;
}

interface SurebetShare {
  bets: Bet[];
  surebetPercentage: number;
  totalInvestment: number;
  guaranteedProfit: number;
  date: string;
}

const SurebetCalculator: React.FC = () => {
  const getInitialState = () => {
    const saved = localStorage.getItem('surebet-calculator');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          bets: parsed.bets || [
            { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 },
            { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 }
          ],
          desiredInvestment: parsed.desiredInvestment || 0
        };
      } catch {
        // Se der erro, retorna padrão
        return {
          bets: [
            { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 },
            { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 }
          ],
          desiredInvestment: 0
        };
      }
    }
    return {
      bets: [
        { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 },
        { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 }
      ],
      desiredInvestment: 0
    };
  };
  const initial = getInitialState();
  const [bets, setBets] = useState<Bet[]>(initial.bets);
  const [shareData, setShareData] = useState<SurebetShare | null>(null);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [desiredInvestment, setDesiredInvestment] = useState<number>(initial.desiredInvestment);
  const [surebetPercentage, setSurebetPercentage] = useState<number>(0);
  const [guaranteedProfit, setGuaranteedProfit] = useState<number>(0);
  const [error, setError] = useState<string>('');
  // Removido arredondamento

  useEffect(() => {
    const hasOdds = bets.some(bet => bet.odds > 1);
    if (hasOdds) {
      calculateSurebet();
    }
  }, [bets.map(bet => bet.odds).join(','), bets.map(bet => bet.commission).join(','), bets.map(bet => bet.maxStake).join(',')]);


  useEffect(() => {
    localStorage.setItem('surebet-calculator', JSON.stringify({ bets, desiredInvestment }));
  }, [bets, desiredInvestment]);

  const getEffectiveOdds = (odds: number, commission: number) => {
    return odds * (1 - commission / 100);
  };


  const calculateSurebet = () => {
    setError('');
    
    const validBets = bets.filter(bet => bet.odds > 1);
    
    if (validBets.length < 2) {
      setError('São necessárias pelo menos duas apostas com odds maiores que 1');
      return;
    }

    const percentage = validBets.reduce((sum, bet) => {
      const effectiveOdds = getEffectiveOdds(bet.odds, bet.commission);
      return sum + (1 / effectiveOdds);
    }, 0) * 100;

    setSurebetPercentage(percentage);

    if (percentage >= 100) {
      setError('Não há oportunidade de surebet. A soma das probabilidades é maior que 100%.');
      setGuaranteedProfit(0);
      setTotalInvestment(0);
      setBets(bets.map(bet => ({ ...bet, stake: 0, profit: 0 })));
      return;
    }

    const baseInvestment = 1000; // Usamos um valor base para calcular as proporções
    let stakes = validBets.map(bet => {
      const effectiveOdds = getEffectiveOdds(bet.odds, bet.commission);
      const stake = (baseInvestment * (1 / effectiveOdds)) / (percentage / 100);
      return {
        stake,
        effectiveOdds,
        maxStakeRatio: bet.maxStake > 0 ? bet.maxStake / stake : Infinity
      };
    });

    const minRatio = Math.min(...stakes.map(s => s.maxStakeRatio));
    const finalInvestment = minRatio === Infinity ? baseInvestment : baseInvestment * minRatio;

    stakes = stakes.map(stake => ({
      ...stake,
      stake: (stake.stake * finalInvestment) / baseInvestment
    }));

    const totalInv = stakes.reduce((sum, stake) => sum + stake.stake, 0);
    setTotalInvestment(totalInv);

    if (desiredInvestment > 0 && totalInv > desiredInvestment) {
      let adjustedStakes = stakes.map((stake, i) => {
        const ratio = desiredInvestment / totalInv;
        let newStake = stake.stake * ratio;
        if (bets[i].maxStake > 0 && newStake > bets[i].maxStake) {
          newStake = bets[i].maxStake;
        }
        return {
          ...stake,
          stake: newStake
        };
      });
      let newTotal = adjustedStakes.reduce((sum, s) => sum + s.stake, 0);
      if (newTotal < desiredInvestment - 0.01) {
        setError('Não é possível distribuir o investimento desejado respeitando as stakes máximas.');
      }
      stakes = adjustedStakes;
      setTotalInvestment(newTotal);
    } else {
      setTotalInvestment(totalInv);
    }

    const updatedBets = bets.map((bet, index) => {
      if (index < stakes.length) {
        const stake = stakes[index];
        const potentialReturn = stake.stake * stake.effectiveOdds;
        return {
          ...bet,
          stake: stake.stake,
          profit: potentialReturn - (desiredInvestment > 0 ? desiredInvestment : totalInv)
        };
      }
      return bet;
    });
    setBets(updatedBets);

    const profit = (stakes[0].stake * stakes[0].effectiveOdds) - (desiredInvestment > 0 ? desiredInvestment : totalInv);
    setGuaranteedProfit(profit);
  };

  const addNewBet = () => {
    setBets([...bets, { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 }]);
  };

  const removeBet = (index: number) => {
    if (bets.length > 2) {
      const newBets = [...bets];
      newBets.splice(index, 1);
      setBets(newBets);
    }
  };
  const updateBet = (index: number, field: keyof Bet, value: number) => {
    const newBets = [...bets];
    newBets[index] = { ...newBets[index], [field]: value || 0 };
    setBets(newBets);
  };

  const isSurebetOpportunity = surebetPercentage > 0 && surebetPercentage < 100;

  const clearAll = () => {
    setBets([
      { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 },
      { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 }
    ]);
    setTotalInvestment(0);
    setDesiredInvestment(0);
    setSurebetPercentage(0);
    setGuaranteedProfit(0);
    setError('');
    setShareData(null);
    localStorage.removeItem('surebet-calculator');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Calculadora de Surebet"
        subtitle="Calcule apostas com lucro garantido"
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={clearAll} variant="outline" className="text-red-500 hover:text-red-700">
          Limpar Tudo
        </Button>
        <Button onClick={addNewBet} variant="outline">
          Adicionar Aposta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {bets.map((bet, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Aposta {index + 1}
                {index >= 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeBet(index)}
                  >
                    Remover
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`odds${index}`}>Odd</Label>
                  <Input
                    id={`odds${index}`}
                    type="number"
                    step="0.01"
                    value={bet.odds || ''}
                    onChange={(e) => updateBet(index, 'odds', parseFloat(e.target.value))}
                    placeholder="Digite a odd"
                    min="1.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`maxStake${index}`} className="flex items-center gap-2">
                    Stake Máxima
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Valor máximo permitido pela casa de apostas (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id={`maxStake${index}`}
                    type="number"
                    step="0.01"
                    value={bet.maxStake || ''}
                    onChange={(e) => updateBet(index, 'maxStake', parseFloat(e.target.value))}
                    placeholder="Stake máxima (opcional)"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`commission${index}`} className="flex items-center gap-2">
                    Comissão (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Comissão cobrada pela casa de apostas (opcional)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id={`commission${index}`}
                    type="number"
                    step="0.01"
                    value={bet.commission === 0 ? '' : bet.commission}
                    onChange={(e) => updateBet(index, 'commission', parseFloat(e.target.value))}
                    placeholder="Comissão (opcional)"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              {bet.stake > 0 && (
                <div className="space-y-2 p-4 bg-muted rounded-lg mt-4">
                  <Label>Stake Recomendada</Label>
                  <p className="text-lg font-semibold">R$ {bet.stake.toFixed(2)}</p>
                  <Label>Retorno Potencial</Label>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {(bet.stake * bet.odds * (1 - bet.commission / 100)).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>Resultados</div>
              <div className="flex items-center gap-2">
                {isSurebetOpportunity && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareData({
                      bets,
                      surebetPercentage,
                      totalInvestment,
                      guaranteedProfit,
                      date: new Date().toISOString(),
                    })}
                  >
                    <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                  </Button>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resultados do cálculo da surebet</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="desiredInvestment">Investimento Total Desejado (R$)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="desiredInvestment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={desiredInvestment || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setDesiredInvestment(value);
                  }}
                  placeholder="Digite o valor total que deseja investir"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={calculateSurebet}
                  disabled={desiredInvestment <= 0}
                >
                  Recalcular
                </Button>
              </div>
              {desiredInvestment > 0 && (
                <span className="text-xs text-muted-foreground">Após alterar o valor, clique em "Recalcular" para atualizar as stakes.</span>
              )}
            </div>
            <ResultsContent
              surebetPercentage={surebetPercentage}
              totalInvestment={totalInvestment}
              guaranteedProfit={guaranteedProfit}
              isSurebetOpportunity={isSurebetOpportunity}
            />
          </CardContent>
        </Card>
      </div>

      {shareData && (
        <ShareSurebetImage data={shareData} onClose={() => setShareData(null)} />
      )}
    </div>
  );
};

export default SurebetCalculator;
