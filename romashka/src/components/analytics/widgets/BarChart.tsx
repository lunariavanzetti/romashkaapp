import React from 'react';
import { cn } from '../../../utils/cn';

interface BarChartProps {
  title: string;
  metric: string;
  dimension: string;
  showLegend?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  metric,
  dimension,
  showLegend = false,
  className
}) => {
  // Mock data for demonstration
  const mockData = [
    { channel: 'Website', volume: 45 },
    { channel: 'WhatsApp', volume: 32 },
    { channel: 'Email', volume: 28 },
    { channel: 'SMS', volume: 15 }
  ];

  const maxValue = Math.max(...mockData.map(d => d.volume));

  return (
    <div className={cn('bg-white rounded-lg border p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        {mockData.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">
              {item.channel}
            </div>
            <div className="flex-1">
              <div className="relative bg-gray-200 rounded-full h-6">
                <div
                  className="bg-blue-500 h-6 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.volume / maxValue) * 100}%`
                  }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {item.volume}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showLegend && (
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">{metric}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 