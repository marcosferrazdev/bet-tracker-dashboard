import { AlertCircle, HelpCircle } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface ResultsContentProps {
  surebetPercentage: number;
  totalInvestment: number;
  guaranteedProfit: number;
  isSurebetOpportunity: boolean;
}

const ResultsContent: React.FC<ResultsContentProps> = ({
  surebetPercentage,
  totalInvestment,
  guaranteedProfit,
  isSurebetOpportunity,
}) => {
  if (surebetPercentage === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <HelpCircle className="h-12 w-12 mb-4" />
        <p className="text-lg">Adicione as odds das apostas acima para calcular sua surebet</p>
        <p className="text-sm">Os resultados aparecerão automaticamente aqui</p>
      </div>
    );
  }

  const roi = (guaranteedProfit / totalInvestment) * 100;

  return (
    <>
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
          <p className="text-sm text-muted-foreground">
            ROI: {roi.toFixed(2)}%
          </p>
        </div>
      </div>

      {isSurebetOpportunity && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Oportunidade de surebet encontrada! Siga as stakes recomendadas para garantir o lucro.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default ResultsContent;
