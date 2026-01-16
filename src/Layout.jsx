import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { LayoutDashboard, Users, AlertCircle, Settings, Activity } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
    { name: 'Пользователи', icon: Users, path: 'Users' },
    { name: 'Репорты', icon: AlertCircle, path: 'Reports' },
    { name: 'Логи действий', icon: Activity, path: 'ActivityLog' },
    { name: 'Настройки', icon: Settings, path: 'Settings' },
    { name: 'Настройка бота', icon: Settings, path: 'BotSetup' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <style>{`
        :root {
          --bg-primary: #0a0a0a;
          --bg-secondary: #141414;
          --bg-tertiary: #1a1a1a;
          --border-color: #2a2a2a;
          --text-primary: #e5e5e5;
          --text-secondary: #a0a0a0;
          --accent: #3b82f6;
          --accent-hover: #2563eb;
        }
        
        body {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        * {
          border-color: var(--border-color);
        }
      `}</style>
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#141414] border-r border-[#2a2a2a]">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-8">TG Moderator</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]'
                      : 'text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}