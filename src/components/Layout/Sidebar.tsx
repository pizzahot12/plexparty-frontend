import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SIDEBAR_ITEMS } from '@/lib/constants';
import { Home, Film, Tv, Users, DoorOpen, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Home,
  Film,
  Tv,
  Users,
  DoorOpen,
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 w-64 bg-[#1a1a1a]/95 backdrop-blur-md border-r border-white/5 z-30',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0 lg:w-20 xl:w-64'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Close button (mobile only) */}
          <div className="lg:hidden p-4 flex justify-end">
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = iconMap[item.icon];
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                    active
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    active && 'animate-pulse'
                  )} />
                  <span className={cn(
                    'font-medium whitespace-nowrap',
                    !isOpen && 'lg:hidden xl:block'
                  )}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section - User info */}
          <div className="p-4 border-t border-white/5">
            <div className={cn(
              'flex items-center gap-3 p-3 rounded-xl bg-white/5',
              !isOpen && 'lg:hidden xl:flex'
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8555] flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">PlexParty</p>
                <p className="text-white/50 text-xs">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
