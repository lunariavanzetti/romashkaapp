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
  ChevronRight,
  Puzzle,
  Brain,
  Phone,
  TestTube,
  FileText,
  UserCheck
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const navLinks = [
  { label: 'Dashboard', icon: <Home size={20} />, to: '/dashboard' },
  { label: 'Conversations', icon: <MessageCircle size={20} />, to: '/dashboard/conversations' },
  { label: 'ROMASHKA AGENT', icon: <Brain size={20} />, to: '/agent-setup', highlight: true },
  { label: 'Analytics', icon: <BarChart2 size={20} />, to: '/dashboard/analytics' },
  { label: 'Knowledge Base', icon: <Book size={20} />, to: '/knowledge' },
  { label: 'Integrations', icon: <Puzzle size={20} />, to: '/integrations' },
  { label: 'Personality', icon: <UserCheck size={20} />, to: '/personality' },
  { label: 'Channels', icon: <Phone size={20} />, to: '/channels' },
  { label: 'Playground', icon: <TestTube size={20} />, to: '/playground' },
  { label: 'Templates', icon: <FileText size={20} />, to: '/templates' },
  { label: 'Settings', icon: <Settings size={20} />, to: '/settings' },
  { label: 'Billing', icon: <CreditCard size={20} />, to: '/billing' },
];

const Sidebar: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
                    : link.highlight
                    ? 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-purple-25 border border-purple-200 dark:border-purple-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${!open && 'justify-center'}
                `}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                {open && (
                  <span className="text-sm font-semibold">
                    {link.label}
                    {link.highlight && <span className="ml-1 text-xs">✨</span>}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleLogout}
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