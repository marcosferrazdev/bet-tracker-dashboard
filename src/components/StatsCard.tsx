
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
      <div className={`bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border animate-slide-up card-hover ${className}`}>
        <div className="flex justify-between items-start sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <TruncatedText 
              text={title} 
              className="text-xs sm:text-sm font-medium text-muted-foreground"
            />
            <TruncatedText 
              text={String(value)} 
              className="text-lg sm:text-xl lg:text-2xl font-semibold mt-1 text-card-foreground"
            />
            
            {trend && (
              <div className="flex items-center mt-1">
                <span 
                  className={`text-xs ${
                    trend.isPositive ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex-shrink-0 p-2 sm:p-3 rounded-full bg-blue-50 text-blue-600">
              {icon}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StatsCard;
