/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MobileBottomNav - Ergonomic Mobile Bottom Navigation Bar (< md screens)
 * Gives an ultra-fixed, responsive, mobile-app native experience with thumb-reachable tabs.
 */

import React from 'react';
import { Home, Sparkles, BookOpen, ShoppingBag, User } from 'lucide-react';
import { prefetchRoute } from '../../utils/routePrefetch';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  cartCount,
  onOpenCart,
}) => {
  const tabs = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
      action: () => onNavigate('home'),
      isActive: currentRoute === 'home',
    },
    {
      id: 'styles',
      label: 'ژورنال',
      icon: Sparkles,
      action: () => onNavigate('styles'),
      isActive: currentRoute === 'styles' || currentRoute === 'style-detail',
    },
    {
      id: 'courses',
      label: 'آکادمی',
      icon: BookOpen,
      action: () => onNavigate('courses'),
      isActive: currentRoute === 'courses' || currentRoute === 'course-detail' || currentRoute === 'learn-player',
    },
    {
      id: 'shop',
      label: 'فروشگاه',
      icon: ShoppingBag,
      action: () => onNavigate('shop'),
      isActive: currentRoute === 'shop' || currentRoute === 'product-detail' || currentRoute === 'checkout',
      badge: cartCount,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFCF8]/95 backdrop-blur-md border-t border-[#EAE2D5] py-2 px-3 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      aria-label="ناوبری پایین صفحه موبایل"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={tab.action}
            onMouseEnter={() => prefetchRoute(tab.id)}
            onTouchStart={() => prefetchRoute(tab.id)}
            aria-label={tab.label}
            aria-current={tab.isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative cursor-pointer min-w-[64px] min-h-[44px] ${
              tab.isActive
                ? 'text-[#87553B] font-bold'
                : 'text-[#968A7C] hover:text-[#171614]'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${tab.isActive ? 'scale-110' : ''}`} />
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#87553B] text-white text-xs font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-0.5 font-medium whitespace-nowrap">
              {tab.label}
            </span>
            {tab.isActive && (
              <span className="w-1 h-1 rounded-full bg-[#87553B] mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
