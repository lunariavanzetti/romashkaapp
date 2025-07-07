import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-dark dark:via-primary-purple dark:to-primary-green">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div className="flex-1 flex flex-col">
        <Header onSidebarToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-6 md:p-10 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 