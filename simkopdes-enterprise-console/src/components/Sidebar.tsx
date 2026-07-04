import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Users, 
  Wallet, 
  Sparkles, 
  FileText, 
  Server, 
  Settings,
  Building2
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  stagnantCount: number;
}

export default function Sidebar({ currentTab, setTab, stagnantCount }: SidebarProps) {
  const menuItems = [
    { id: 'command-center', name: 'Command Center', icon: LayoutDashboard, category: 'Dashboard' },
    { id: 'inventory', name: 'Inventory', icon: Package, category: 'Dashboard', badge: stagnantCount },
    { id: 'sales', name: 'Sales', icon: TrendingUp, category: 'Dashboard' },
    
    { id: 'members', name: 'Members', icon: Users, category: 'Management' },
    { id: 'finance', name: 'Finance', icon: Wallet, category: 'Management' },
    { id: 'loyalty', name: 'Loyalty & SHU', icon: Building2, category: 'Management', hasPremiumTag: true },
    
    { id: 'ai-analytics', name: 'AI Analytics', icon: Sparkles, category: 'Intelligence', hasAiTag: true },
    { id: 'reports', name: 'Reports', icon: FileText, category: 'Intelligence' },
    
    { id: 'infrastructure', name: 'Infrastructure', icon: Server, category: 'System' },
    { id: 'administration', name: 'Administration', icon: Settings, category: 'System' }
  ];

  // Group menu items by category
  const categories = ['Dashboard', 'Management', 'Intelligence', 'System'];

  return (
    <aside id="sidebar-container" className="w-[280px] flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full z-20 shadow-sm">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] select-none">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <span className="font-bold text-lg text-[#0F172A] tracking-tight">SIMKOPDES</span>
        </div>
      </div>

      {/* Navigation items grouped by category */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-3">
        {categories.map(cat => {
          const items = menuItems.filter(item => item.category === cat);
          return (
            <div key={cat} className="flex flex-col gap-1">
              <div className="px-3 mb-1 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                {cat}
              </div>
              {items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setTab(item.id)}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                      isActive 
                        ? 'bg-[#EFF6FF] text-[#1D4ED8]' 
                        : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${item.hasAiTag ? 'text-[#8B5CF6]' : ''}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}

                    {item.hasAiTag && (
                      <span className="bg-[#8B5CF6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        AI
                      </span>
                    )}

                    {(item as any).hasPremiumTag && (
                      <span className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-sm">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
