import PageHeader from '@/components/PageHeader';
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
import { AlertCircle, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';

interface Bet {
  odds: number;
  stake: number;
  profit: number;
  maxStake: number;
  commission: number;
}

const SurebetCalculator: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([
    { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 },
    { odds: 0, stake: 0, profit: 0, maxStake: 0, commission: 0 }
  ]);
  const [investment, setInvestment] = useState<number>(0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [surebetPercentage, setSurebetPercentage] = useState<number>(0);
  const [guaranteedProfit, setGuaranteedProfit] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Calcula a stake necessária na outra aposta quando uma stake máxima é definida
  const calculateRequiredStake = (bet: Bet, otherBet: Bet) => {
    if (bet.odds <= 1 || otherBet.odds <= 1 || bet.maxStake <= 0) return null;

    const percentage = (1 / bet.odds + 1 / otherBet.odds) * 100;
    if (percentage >= 100) return null;

    // Calcula o investimento total necessário baseado na proporção
    const totalRequired = bet.maxStake * (1 + (bet.odds / otherBet.odds));
    const requiredStake = totalRequired - bet.maxStake;

    return {
      requiredStake,
      totalRequired,
      profit: (bet.maxStake * bet.odds) - totalRequired
    };
  };

  // Atualiza cálculos quando a stake máxima da Aposta 1 muda
  const handleMaxStake1Change = (value: number) => {
    const newBet1 = { ...bets[0], maxStake: value };
    setBets([newBet1, bets[1]]);
    
    if (value > 0 && bets[1].odds > 1) {
      const result = calculateRequiredStake(newBet1, bets[1]);
      if (result) {
        setTotalInvestment(result.totalRequired);
        setBets([newBet1, { ...bets[1], stake: result.requiredStake }]);
        setGuaranteedProfit(result.profit);
        setInvestment(result.totalRequired);
      }
    }
  };

  // Atualiza cálculos quando a stake máxima da Aposta 2 muda
  const handleMaxStake2Change = (value: number) => {
    const newBet2 = { ...bets[1], maxStake: value };
    setBets([bets[0], newBet2]);
    
    if (value > 0 && bets[0].odds > 1) {
      const result = calculateRequiredStake(newBet2, bets[0]);
      if (result) {
        setTotalInvestment(result.totalRequired);
        setBets([{ ...bets[0], stake: result.requiredStake }, newBet2]);
        setGuaranteedProfit(result.profit);
        setInvestment(result.totalRequired);
      }
    }
  };

  // Calcula a odd efetiva considerando a comissão
  const getEffectiveOdds = (odds: number, commission: number) => {
    return odds * (1 - commission / 100);
  };

  const calculateSurebet = () => {
    setError('');
    
    // Filtra apostas com odds inválidas
    const validBets = bets.filter(bet => bet.odds > 1);
    
    if (validBets.length < 2) {
      setError('São necessárias pelo menos duas apostas com odds maiores que 1');
      return;
    }

    // Calcula a porcentagem de surebet considerando as comissões
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

    // Calcula o investimento necessário para cada R$1 de retorno
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

    // Encontra o menor ratio de stake máxima para ajustar todas as stakes proporcionalmente
    const minRatio = Math.min(...stakes.map(s => s.maxStakeRatio));
    const finalInvestment = minRatio === Infinity ? baseInvestment : baseInvestment * minRatio;

    // Ajusta as stakes para o investimento final
    stakes = stakes.map(stake => ({
      ...stake,
      stake: (stake.stake * finalInvestment) / baseInvestment
    }));

    // Calcula o investimento total
    const totalInv = stakes.reduce((sum, stake) => sum + stake.stake, 0);
    setTotalInvestment(totalInv);
    setInvestment(totalInv);

    // Atualiza as stakes e lucros de todas as apostas
    const updatedBets = bets.map((bet, index) => {
      if (index < stakes.length) {
        const stake = stakes[index];
        const potentialReturn = stake.stake * stake.effectiveOdds;
        return {
          ...bet,
          stake: stake.stake,
          profit: potentialReturn - totalInv
        };
      }
      return bet;
    });
    setBets(updatedBets);

    // Calcula o lucro garantido usando a primeira aposta como referência
    const profit = (stakes[0].stake * stakes[0].effectiveOdds) - totalInv;
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
    // Quando o valor for vazio ou NaN, define como 0
    newBets[index] = { ...newBets[index], [field]: value || 0 };
    setBets(newBets);
  };

  const isSurebetOpportunity = surebetPercentage > 0 && surebetPercentage < 100;

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

      <div className="flex justify-end mb-4">
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
            <CardContent className="space-y-4">
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
                    step="0.01"                    value={bet.commission === 0 ? '' : bet.commission}
                    onChange={(e) => updateBet(index, 'commission', parseFloat(e.target.value))}
                    placeholder="Comissão (opcional)"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              {bet.stake > 0 && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Resultados
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={calculateSurebet}
              className="w-full"
              size="lg"
              variant={isSurebetOpportunity ? "default" : "secondary"}
            >
              Calcular Surebet
            </Button>
            
            {surebetPercentage > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Porcentagem de Surebet
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deve ser menor que 100% para existir oportunidade de surebet</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <p className={`text-lg font-semibold ${surebetPercentage < 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {surebetPercentage.toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Investimento Total</Label>
                  <p className="text-lg font-semibold">R$ {totalInvestment.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Lucro Garantido</Label>
                  <p className={`text-lg font-semibold ${guaranteedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {guaranteedProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {isSurebetOpportunity && (
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Oportunidade de surebet encontrada! Siga as stakes recomendadas para garantir o lucro.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurebetCalculator;
