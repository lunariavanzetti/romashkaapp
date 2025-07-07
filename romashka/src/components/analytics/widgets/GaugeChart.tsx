import React from 'react';
import { cn } from '../../../utils/cn';

interface Threshold {
  value: number;
  color: string;
  label: string;
}

interface GaugeChartProps {
  title: string;
  value: number;
  min: number;
  max: number;
  thresholds?: Threshold[];
  className?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  value,
  min,
  max,
  thresholds = [],
  className
}) => {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const angle = (percentage / 100) * 180 - 90; // Convert to degrees, offset by -90

  const getColor = () => {
    if (thresholds.length === 0) return '#3b82f6';
    
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) {
        return thresholds[i].color;
      }
    }
    return thresholds[0]?.color || '#3b82f6';
  };

  return (
    <div className={cn('bg-white rounded-lg border p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background arc */}
            <path
              d="M 10 90 A 40 40 0 0 1 90 90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            
            {/* Value arc */}
            <path
              d={`M 10 90 A 40 40 0 0 1 ${50 + 40 * Math.cos((angle * Math.PI) / 180)} ${50 + 40 * Math.sin((angle * Math.PI) / 180)}`}
              fill="none"
              stroke={getColor()}
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Center point */}
            <circle cx="50" cy="50" r="3" fill={getColor()} />
          </svg>
          
          {/* Value text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {value.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">
                {percentage.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {thresholds.length > 0 && (
        <div className="mt-4 space-y-1">
          {thresholds.map((threshold, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: threshold.color }}
                ></div>
                <span className="text-gray-600">{threshold.label}</span>
              </div>
              <span className="text-gray-900 font-medium">{threshold.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 