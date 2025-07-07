import React from 'react';
import { cn } from '../../../utils/cn';

interface KPICardProps {
  title: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: number;
  format?: 'number' | 'percentage' | 'seconds' | 'currency';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend = 'neutral',
  changePercent,
  format = 'number',
  className
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'seconds':
        return `${Math.round(val)}s`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
        </div>
        {changePercent !== undefined && (
          <div className={cn('flex items-center space-x-1', getTrendColor())}>
            <span className="text-sm font-medium">{getTrendIcon()}</span>
            <span className="text-sm font-medium">
              {Math.abs(changePercent).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      {changePercent !== undefined && (
        <div className="mt-2">
          <div className={cn('text-xs', getTrendColor())}>
            {trend === 'up' ? 'Increased' : trend === 'down' ? 'Decreased' : 'No change'} from last period
          </div>
        </div>
      )}
    </div>
  );
}; 