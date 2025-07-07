import React from 'react';
import { cn } from '../../../utils/cn';

interface LineChartProps {
  title: string;
  metric: string;
  timeRange: any;
  showLegend?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  metric,
  timeRange,
  showLegend = false,
  className
}) => {
  // Mock data for demonstration
  const mockData = [
    { date: '2024-01-01', value: 45 },
    { date: '2024-01-02', value: 52 },
    { date: '2024-01-03', value: 48 },
    { date: '2024-01-04', value: 61 },
    { date: '2024-01-05', value: 55 },
    { date: '2024-01-06', value: 58 },
    { date: '2024-01-07', value: 62 }
  ];

  const maxValue = Math.max(...mockData.map(d => d.value));
  const minValue = Math.min(...mockData.map(d => d.value));

  return (
    <div className={cn('bg-white rounded-lg border p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={200 - (percent / 100) * 200}
              x2="400"
              y2={200 - (percent / 100) * 200}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={mockData.map((point, index) => {
              const x = (index / (mockData.length - 1)) * 400;
              const y = 200 - ((point.value - minValue) / (maxValue - minValue)) * 200;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {mockData.map((point, index) => {
            const x = (index / (mockData.length - 1)) * 400;
            const y = 200 - ((point.value - minValue) / (maxValue - minValue)) * 200;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
              />
            );
          })}
        </svg>
      </div>
      
      {showLegend && (
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{metric}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 