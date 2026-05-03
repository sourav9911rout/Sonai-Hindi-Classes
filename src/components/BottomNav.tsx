import { Home, PlayCircle, History, Trophy, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'practice', icon: PlayCircle, label: 'Practice' },
  { id: 'history', icon: History, label: 'Results' },
  { id: 'progress', icon: Trophy, label: 'Progress' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/50 backdrop-blur-3xl border-t border-white/30 px-6 pb-8 pt-3 z-50 flex justify-between items-center safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive ? "opacity-100" : "opacity-40"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              isActive ? "bg-pink-500 text-white shadow-lg shadow-pink-200" : "text-pink-900"
            )}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold text-pink-900 group-hover:scale-110 transition-transform">{tab.label.toUpperCase()}</span>
          </button>
        );
      })}
    </nav>
  );
}
