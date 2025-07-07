import React from 'react';
import { cn } from '../../../utils/cn';

interface PieChartProps {
  title: string;
  metric: string;
  dimension: string;
  showLegend?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  title,
  metric,
  dimension,
  showLegend = false,
  className
}) => {
  // Mock data for demonstration
  const mockData = [
    { rating: 'Excellent (5)', value: 45, color: '#10b981' },
    { rating: 'Good (4)', value: 30, color: '#3b82f6' },
    { rating: 'Average (3)', value: 15, color: '#f59e0b' },
    { rating: 'Poor (1-2)', value: 10, color: '#ef4444' }
  ];

  const total = mockData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('bg-white rounded-lg border p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {mockData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const startAngle = mockData
                .slice(0, index)
                .reduce((sum, d) => sum + (d.value / total) * 360, 0);
              const endAngle = startAngle + (item.value / total) * 360;
              
              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      </div>
      
      {showLegend && (
        <div className="mt-4 space-y-2">
          {mockData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600">{item.rating}</span>
              <span className="text-sm font-medium text-gray-900">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 