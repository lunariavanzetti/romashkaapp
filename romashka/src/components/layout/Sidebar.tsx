import React from 'react';
import {
  Home,
  BarChart2,
  MessageCircle,
  Zap,
  Settings,
  Book,
  Users,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Dashboard', icon: <Home size={20} />, to: '/dashboard' },
  { label: 'Conversations', icon: <MessageCircle size={20} />, to: '/dashboard/conversations' },
  { label: 'Analytics', icon: <BarChart2 size={20} />, to: '/dashboard/analytics' },
  { label: 'Knowledge Base', icon: <Book size={20} />, to: '/knowledge' },
  { label: 'Automation', icon: <Zap size={20} />, to: '/automation' },
  { label: 'Team', icon: <Users size={20} />, to: '/team' },
  { label: 'Settings', icon: <Settings size={20} />, to: '/settings' },
  { label: 'Billing', icon: <CreditCard size={20} />, to: '/billing' },
];

const Sidebar: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => {
  const location = useLocation();

  return (
    <aside className={`
      transition-all duration-300
      bg-white/95 dark:bg-gray-800/95
      backdrop-blur-glass
      border-r border-gray-200 dark:border-gray-700
      h-screen sticky top-0 z-30
      ${open ? 'w-64' : 'w-16'}
      flex flex-col
      shadow-elevation-1
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className={`flex items-center gap-3 ${!open && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-button flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            {open && (
              <span className="text-primary-deep-blue dark:text-white font-heading text-lg font-bold">
                ROMASHKA
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {open ? (
              <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {navLinks.map(link => {
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium
                  ${isActive
                    ? 'bg-gradient-button text-white shadow-elevation-1'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${!open && 'justify-center'}
                `}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                {open && <span className="text-sm">{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium w-full
            text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
            ${!open && 'justify-center'}
          `}
        >
          <LogOut size={20} />
          {open && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 