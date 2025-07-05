import React from 'react';
import { Home, Star, BarChart3, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Dashboard',
      description: 'View your stocks'
    },
    {
      path: '/watchlists',
      icon: Star,
      label: 'Watchlists',
      description: 'Manage watchlists'
    },
    {
      path: '/chat',
      icon: MessageSquare,
      label: 'AI Assistant',
      description: 'Full AI chat experience'
    }
  ];

  return (
    <div className={`bg-white shadow-lg h-screen transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4">
        {/* Header with toggle button */}
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 truncate">ASX Portfolio Tracker</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-lg transition-colors group relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-sm text-gray-500 truncate">{item.description}</div>
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="text-xs text-gray-300">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
