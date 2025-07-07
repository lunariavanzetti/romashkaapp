import React, { useState } from 'react';
import { cn } from '../../../utils/cn';

interface TableWidgetProps {
  title: string;
  columns: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  className?: string;
}

export const TableWidget: React.FC<TableWidgetProps> = ({
  title,
  columns,
  sortBy,
  sortOrder = 'desc',
  className
}) => {
  const [sortColumn, setSortColumn] = useState(sortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortOrder);

  // Mock data for demonstration
  const mockData = [
    { name: 'John Smith', activeConversations: 5, avgResponseTime: 45, satisfactionScore: 4.8 },
    { name: 'Sarah Johnson', activeConversations: 3, avgResponseTime: 52, satisfactionScore: 4.6 },
    { name: 'Mike Wilson', activeConversations: 7, avgResponseTime: 38, satisfactionScore: 4.9 },
    { name: 'Lisa Davis', activeConversations: 4, avgResponseTime: 61, satisfactionScore: 4.3 },
    { name: 'Tom Brown', activeConversations: 6, avgResponseTime: 42, satisfactionScore: 4.7 }
  ];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...mockData].sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const formatValue = (value: any, column: string): string => {
    if (column === 'avgResponseTime') {
      return `${value}s`;
    }
    if (column === 'satisfactionScore') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  return (
    <div className={cn('bg-white rounded-lg border p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column}
                  className="text-left py-3 px-4 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span className="capitalize">
                      {column.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {sortColumn === column && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td key={column} className="py-3 px-4 text-sm text-gray-900">
                    {formatValue(row[column as keyof typeof row], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing {sortedData.length} of {sortedData.length} agents
      </div>
    </div>
  );
}; 