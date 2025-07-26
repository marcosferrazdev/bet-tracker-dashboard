
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

// Componente auxiliar para texto com tooltip
const TruncatedText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`truncate ${className}`}>
          {text}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, className = '' }) => {
  return (
    <TooltipProvider>
      <div className={`bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border animate-slide-up card-hover ${className}`}>
        <div className="flex justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <TruncatedText 
              text={title} 
              className="text-sm sm:text-base font-medium text-muted-foreground"
            />
            <TruncatedText 
              text={String(value)} 
              className="text-xl sm:text-2xl lg:text-3xl font-semibold mt-2 text-card-foreground"
            />
            
            {trend && (
              <div className="flex items-center mt-2">
                <span 
                  className={`text-sm ${
                    trend.isPositive ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex-shrink-0 p-3 sm:p-4 rounded-full bg-blue-50 text-blue-600">
              {icon}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StatsCard;
