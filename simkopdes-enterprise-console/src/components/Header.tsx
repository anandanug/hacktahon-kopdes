import React, { useState } from 'react';
import { Search, Sparkles, Cloud, Bell } from 'lucide-react';

interface HeaderProps {
  onSearchChange: (query: string) => void;
  onSparklesClick: () => void;
  queueCount: number;
}

export default function Header({ onSearchChange, onSparklesClick, queueCount }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange(val);
  };

  return (
    <header id="top-nav-header" className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0 z-10 select-none">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] w-5 h-5" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-[#F1F5F9] border-transparent rounded-lg text-sm focus:bg-white focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all outline-none"
            placeholder="Search resources, products, members..."
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* AI Sparkles Interactive Action */}
        <button
          onClick={onSparklesClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3FF] text-[#6D28D9] rounded-lg border border-[#DDD6FE] hover:bg-[#EDE9FE] transition-colors text-xs font-semibold cursor-pointer shadow-sm group"
        >
          <Sparkles className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
          <span>AI Sparkles</span>
        </button>

        <div className="h-6 w-px bg-[#E2E8F0]"></div>

        {/* Sync Status */}
        <div className="flex items-center gap-2 text-[#475569] text-xs font-semibold">
          <Cloud className="w-4 h-4 text-[#10B981]" />
          <span>Sync: Online</span>
        </div>

        <div className="h-6 w-px bg-[#E2E8F0]"></div>

        {/* Notifications Icon with Badge */}
        <button className="relative text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white box-content">
            3
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 ml-2 pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm select-none shadow-inner">
            AK
          </div>
          <div className="hidden md:block text-left">
            <div className="font-semibold text-[#0F172A] text-sm leading-tight">Admin Koperasi</div>
            <div className="text-[#64748B] text-[11px]">Superadmin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
