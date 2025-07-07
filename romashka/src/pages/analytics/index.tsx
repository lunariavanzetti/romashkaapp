import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import OverviewTab from './OverviewTab';
import ConversationsTab from './ConversationsTab';
import AIPerformanceTab from './AIPerformanceTab';

const tabLabels = ['Overview', 'Conversations', 'AI Performance'];

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState(0);
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
          <div className="flex overflow-x-auto">
            {tabLabels.map((label, index) => (
              <button
                key={label}
                onClick={() => setTab(index)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  tab === index
                    ? 'text-primary-pink border-b-2 border-primary-pink bg-primary-pink/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {tab === 0 && <OverviewTab />}
        {tab === 1 && <ConversationsTab />}
        {tab === 2 && <AIPerformanceTab />}
      </div>
    </DashboardLayout>
  );
} 