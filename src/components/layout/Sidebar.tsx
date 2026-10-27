import React from 'react';
import { NavigationSection, SupportedChain } from '../../types/crypto';
import {
  LayoutDashboard,
  Search,
  Radar,
  Flame,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  BarChart3,
  Settings,
  Compass,
  X,
} from 'lucide-react';

interface Props {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  watchlistCount: number;
  alertsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentSection,
  onNavigate,
  watchlistCount,
  alertsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: {
    id: NavigationSection;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'token-tracker',
      label: 'Token Tracker',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'dex-scanner',
      label: 'DEX Scanner',
      icon: <Radar className="w-4 h-4" />,
    },
    {
      id: 'trending',
      label: 'Trending Tokens',
      icon: <Flame className="w-4 h-4 text-[#F5A623]" />,
    },
    {
      id: 'new-pairs',
      label: 'New Pairs',
      icon: <Sparkles className="w-4 h-4 text-[#78AFCB]" />,
    },
    {
      id: 'top-gainers',
      label: 'Top Gainers',
      icon: <TrendingUp className="w-4 h-4 text-[#69B99A]" />,
    },
    {
      id: 'top-losers',
      label: 'Top Losers',
      icon: <TrendingDown className="w-4 h-4 text-[#D98282]" />,
    },
    {
      id: 'holder-analytics',
      label: 'Holder Analytics',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: <Star className="w-4 h-4 text-[#F5A623]" />,
      badge: watchlistCount > 0 ? watchlistCount : undefined,
    },
    {
      id: 'market-overview',
      label: 'Market Overview',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (id: NavigationSection) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#DCE8F0] flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand */}
        <div className="p-5 border-b border-[#DCE8F0] flex items-center justify-between bg-[#F9FCFE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#78AFCB] to-[#A2CCE0] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#243B53] block leading-none">
                OceanScan
              </span>
              <span className="text-[10px] font-semibold text-[#71869A] uppercase tracking-wider mt-0.5 block">
                Multi-Chain DEX Tracker
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#71869A] hover:text-[#243B53] rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#71869A]">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#E8F3FA] text-[#243B53] shadow-xs border border-[#DCE8F0]'
                    : 'text-[#71869A] hover:text-[#243B53] hover:bg-[#F2F8FC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#78AFCB]' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#78AFCB] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-[#DCE8F0] bg-[#F9FCFE]">
          <div className="p-3 bg-white rounded-xl border border-[#DCE8F0] shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#243B53]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#69B99A] animate-ping" />
                <span>Live Feed Active</span>
              </span>
              <span className="text-[#71869A]">3 Chains</span>
            </div>
            <div className="mt-1 text-[10px] text-[#71869A]">
              Solana • Base • BSC
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
