/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Header Component - Minimalist Luxury UI/UX
 * Strictly compliant with Top Bar Contract:
 * [Zone 1: Brand Wordmark] — [Zone 2: 6 Clean Nav Links] — [Zone 3: Admin, Search, Cart, Account]
 * Background image dynamically loaded from Admin-managed visual assets.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Package,
  GraduationCap,
  LogOut,
  ArrowRight,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  mockStyles,
  mockTechniques,
  mockProducts,
  mockCourses,
} from '../../data/mockData';
import {
  StyleModel,
  Technique,
  Product,
  Course,
  Article,
  CartItem,
} from '../../types/domain';
import { isUserAdminAuthenticated } from '../../utils/security';
import { GisaraEmblem } from '../common/GisaraEmblem';
import { prefetchRoute } from '../../utils/routePrefetch';

export const ASSET_KEYS = {
  HEADER_BG: 'shanyoon_header_custom_bg',
  HEADER_OPACITY: 'shanyoon_header_bg_opacity',
  HERO_IMAGE: 'shanyoon_hero_custom_image',
  SHOP_BANNER: 'shanyoon_shop_custom_banner',
  WORKSHOP_IMAGE: 'shanyoon_workshop_custom_image',
  CLASSIC_STYLE_IMAGE: 'shanyoon_classic_style_custom_image',
};

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onOpenMobileMenu: () => void;
  onOpenAdmin: () => void;
  onOpenConsultation?: () => void;
  onOpenOrderTracking?: () => void;
  userName?: string;
  userMobile?: string;
  cartItems?: CartItem[];
  onSelectStyle?: (style: StyleModel) => void;
  onSelectTechnique?: (technique: Technique) => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCourse?: (course: Course) => void;
  onSelectArticle?: (article: Article) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  cartCount,
  onOpenCart,
  onOpenAuth,
  isLoggedIn,
  isAdmin = false,
  onOpenMobileMenu,
  onOpenAdmin,
  onOpenConsultation,
  onOpenOrderTracking,
  userName = 'مهسا کاظمی',
  userMobile = '۰۹۱۲۱۲۳۴۵۶۷',
  onSelectStyle,
  onSelectTechnique,
  onSelectProduct,
  onSelectCourse,
  onLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Background Image state (Managed centrally from Admin Panel)
  const [bgImage, setBgImage] = useState<string | null>(() => {
    return localStorage.getItem(ASSET_KEYS.HEADER_BG) || null;
  });
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState<number>(() => {
    const saved = localStorage.getItem(ASSET_KEYS.HEADER_OPACITY);
    return saved ? Number(saved) : 85;
  });

  // Search Modal/Overlay State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Scroll detection for subtle elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Click outside to close profile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for visual asset updates dispatched from Admin Panel
  useEffect(() => {
    const handleAssetsUpdated = () => {
      setBgImage(localStorage.getItem(ASSET_KEYS.HEADER_BG) || null);
      const savedOpacity = localStorage.getItem(ASSET_KEYS.HEADER_OPACITY);
      if (savedOpacity) setBgOverlayOpacity(Number(savedOpacity));
    };
    window.addEventListener('shanyoon_assets_updated', handleAssetsUpdated);
    return () => window.removeEventListener('shanyoon_assets_updated', handleAssetsUpdated);
  }, []);

  // Nav links - clean, single-line
  const navLinks = [
    { label: 'مدل‌ها', route: 'styles' },
    { label: 'تکنیک‌ها', route: 'techniques' },
    { label: 'فروشگاه', route: 'shop' },
    { label: 'دوره‌ها', route: 'courses' },
    { label: 'مجله', route: 'mag' },
  ];

  // Live search filtering
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const styles = mockStyles
      .filter((s) => s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
      .slice(0, 3);
    const products = mockProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 3);
    const courses = mockCourses
      .filter((c) => c.name.toLowerCase().includes(q) || c.level.toLowerCase().includes(q))
      .slice(0, 2);
    const techniques = mockTechniques
      .filter((t) => t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q))
      .slice(0, 2);

    return { styles, products, courses, techniques, total: styles.length + products.length + courses.length + techniques.length };
  }, [searchQuery]);

  const handleSearchSubmit = (q: string) => {
    if (!q.trim()) return;
    setIsSearchOpen(false);
    onNavigate(`search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 relative border-b ${
          isScrolled
            ? 'shadow-xs border-[#EAE2D5]'
            : 'border-[#EAE2D5]/60'
        }`}
        style={
          bgImage
            ? {
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Optical Scrim / Overlay for perfect text legibility */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            bgImage ? '' : isScrolled ? 'bg-[#FFFCF8]/95 backdrop-blur-md' : 'bg-[#FFFCF8]'
          }`}
          style={
            bgImage
              ? {
                  backgroundColor: `rgba(255, 252, 248, ${bgOverlayOpacity / 100})`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }
              : undefined
          }
        />

        {/* -------------------------------------------------------------------- */}
        {/* ONE-ROW THREE-ZONE HEADER CONTAINER                                 */}
        {/* -------------------------------------------------------------------- */}
        <div className="max-w-[1240px] mx-auto px-2 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4 relative z-10">
          
          {/* ZONE 1: BRAND WORDMARK (Right in RTL) */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden min-w-[40px] min-h-[44px] flex items-center justify-center text-[#171614] hover:text-[#87553B] hover:bg-[#F4EFE7]/50 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none"
              aria-label="باز کردن منوی ناوبری اصلی"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 sm:gap-2.5 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none rounded-xl p-0.5 sm:p-1"
              aria-label="گیس‌آرا - صفحه اصلی"
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#87553B] to-[#381F13] text-white flex items-center justify-center shadow-xs border border-[#C59B63]/30 group-hover:scale-105 transition-transform shrink-0">
                <GisaraEmblem className="w-4.5 h-4.5 text-[#F5E3C9]" size={18} />
              </span>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-base sm:text-2xl font-black tracking-tight text-[#171614] group-hover:text-[#87553B] transition-colors whitespace-nowrap">
                    گیس‌آرا
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono text-[#C59B63] font-bold tracking-wider">
                    GisAra
                  </span>
                </div>
                <span className="hidden sm:inline-block text-[10px] text-[#87553B] font-medium leading-none whitespace-nowrap -mt-0.5">
                  آکادمی و مرجع استایل مو
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: 6 CLEAN NAV LINKS (Center in RTL) */}
          <nav
            className="hidden lg:flex items-center gap-6 lg:gap-8 text-sm font-medium text-[#59524A]"
            aria-label="ناوبری اصلی"
          >
            {navLinks.map((link) => {
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  type="button"
                  onClick={() => onNavigate(link.route)}
                  onMouseEnter={() => prefetchRoute(link.route)}
                  onFocus={() => prefetchRoute(link.route)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`transition-all duration-300 whitespace-nowrap cursor-pointer relative py-2 px-1 focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none rounded-lg ${
                    isActive
                      ? 'text-[#171614] font-bold'
                      : 'hover:text-[#87553B]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C59B63] rounded-full shadow-xs transition-all" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: ACTIONS (Left in RTL: Search, Cart, Account) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Clean Minimalist Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              onMouseEnter={() => prefetchRoute('search')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#59524A] hover:text-[#171614] hover:bg-[#F4EFE7] hover:scale-105 active:scale-95 rounded-xl transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none"
              aria-label="جستجو در سامانه"
              title="جستجو (⌘K)"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              onMouseEnter={() => prefetchRoute('cart')}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#59524A] hover:text-[#171614] hover:bg-[#F4EFE7] hover:scale-105 active:scale-95 rounded-xl transition-all duration-300 cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none"
              aria-label={`سبد خرید حاوی ${cartCount} آیتم`}
              title="سبد خرید"
            >
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#87553B] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Button */}
            <div ref={profileRef} className="relative">
              {isLoggedIn ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 px-3 min-h-[44px] text-xs sm:text-sm font-medium text-[#171614] bg-[#F4EFE7]/80 hover:bg-[#F4EFE7] rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#87553B] focus-visible:outline-none"
                    aria-expanded={isProfileOpen}
                    aria-label="منوی حساب کاربری"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#87553B] text-white text-xs font-bold flex items-center justify-center">
                      {userName.slice(0, 1)}
                    </div>
                    <span className="hidden sm:inline font-semibold">{userName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#59524A]" aria-hidden="true" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-[#FFFCF8] rounded-xl shadow-xl border border-[#EAE2D5] overflow-hidden z-50 text-right animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="p-3 bg-[#FAF6F0] border-b border-[#EAE2D5]/50">
                        <p className="text-xs font-bold text-[#171614] truncate">{userName}</p>
                        <p className="text-[11px] text-[#968A7C] tabular-nums dir-ltr text-right">
                          {userMobile}
                        </p>
                      </div>

                      <div className="p-1.5 space-y-0.5 text-xs text-[#59524A]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onNavigate('account');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F4EFE7]/60 hover:text-[#171614] transition-colors text-right cursor-pointer"
                        >
                          <User className="w-4 h-4 text-[#87553B]" />
                          <span>پیشخوان حساب کاربری</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onNavigate('account');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F4EFE7]/60 hover:text-[#171614] transition-colors text-right cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-[#87553B]" />
                          <span>سفارش‌ها و مرسولات</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onNavigate('account');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F4EFE7]/60 hover:text-[#171614] transition-colors text-right cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4 text-[#87553B]" />
                          <span>دوره‌های آموزشی من</span>
                        </button>

                        {(isAdmin || isUserAdminAuthenticated()) && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              onOpenAdmin();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#C59B63]/10 text-[#87553B] font-semibold transition-colors text-right cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#87553B]" />
                            <span>کنسول مدیریت سامانه</span>
                          </button>
                        )}

                        <div className="pt-1 border-t border-[#EAE2D5]/50">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              if (onLogout) onLogout();
                              else onNavigate('home');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors text-right cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>خروج از حساب</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-[#171614] bg-[#F4EFE7] hover:bg-[#EAE2D5] rounded-xl transition-colors cursor-pointer"
                  title="ورود / عضویت"
                  aria-label="ورود / عضویت"
                >
                  <User className="w-4 h-4 text-[#87553B]" />
                  <span className="hidden sm:inline">ورود / عضویت</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* MINIMALIST SPOTLIGHT SEARCH OVERLAY (Opens on search icon or ⌘K)     */}
      {/* -------------------------------------------------------------------- */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#FFFCF8] rounded-2xl shadow-2xl border border-[#EAE2D5] overflow-hidden text-right animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-label="جستجوی هوشمند در سامانه"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-[#EAE2D5] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#87553B] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit(searchQuery);
                }}
                placeholder="جستجو در بین مدل‌ها، تکنیک‌ها، دوره‌ها و محصولات..."
                className="w-full text-sm sm:text-base text-[#171614] placeholder-[#968A7C] bg-transparent outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-[#968A7C] hover:text-[#171614]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs text-[#968A7C] hover:text-[#171614] bg-[#F4EFE7] px-2.5 py-1 rounded-md cursor-pointer"
              >
                بستن (Esc)
              </button>
            </div>

            {/* Quick Suggestions or Live Filtered Results */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {!searchResults ? (
                <div>
                  <p className="text-xs font-semibold text-[#968A7C] mb-2.5">
                    پیشنهادهای پرطرفدار:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'شینیون خطی عروس',
                      'اسپری اوسیس شاین',
                      'تکنیک وزگیری و صیقل',
                      'ورکشاپ تخصصی تهران',
                      'بافت هلندی و فرانسوی',
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchQuery(term);
                          handleSearchSubmit(term);
                        }}
                        className="px-3 py-1.5 text-xs text-[#59524A] bg-[#F4EFE7]/70 hover:bg-[#F4EFE7] hover:text-[#171614] rounded-lg transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.total === 0 ? (
                <div className="py-8 text-center text-sm text-[#968A7C]">
                  موردی منطبق با «{searchQuery}» یافت نشد.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Matching Styles */}
                  {searchResults.styles.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#87553B] mb-1.5">مدل‌های شینیون</p>
                      <div className="space-y-1">
                        {searchResults.styles.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              if (onSelectStyle) onSelectStyle(s);
                              else onNavigate('style-detail');
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-[#F4EFE7]/60 rounded-lg text-right transition-colors cursor-pointer"
                          >
                            <img
                              src={s.primaryImage}
                              alt={s.name}
                              loading="lazy"
                              decoding="async"
                              className="w-9 h-9 rounded object-cover border border-[#EAE2D5]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#171614] truncate">{s.name}</p>
                              <p className="text-[11px] text-[#968A7C] truncate">{s.occasion} · {s.difficulty}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#EAE2D5]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Products */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#87553B] mb-1.5">محصولات و ابزار</p>
                      <div className="space-y-1">
                        {searchResults.products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              if (onSelectProduct) onSelectProduct(p);
                              else onNavigate('product-detail');
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-[#F4EFE7]/60 rounded-lg text-right transition-colors cursor-pointer"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              loading="lazy"
                              decoding="async"
                              className="w-9 h-9 rounded object-cover border border-[#EAE2D5]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#171614] truncate">{p.name}</p>
                              <p className="text-[11px] text-[#87553B] font-bold tabular-nums">
                                {p.priceToman.toLocaleString('fa-IR')} تومان
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#EAE2D5]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Courses */}
                  {searchResults.courses.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#87553B] mb-1.5">دوره‌های آنلاین</p>
                      <div className="space-y-1">
                        {searchResults.courses.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              if (onSelectCourse) onSelectCourse(c);
                              else onNavigate('course-detail');
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-[#F4EFE7]/60 rounded-lg text-right transition-colors cursor-pointer"
                          >
                            <img
                              src={c.heroImage}
                              alt={c.name}
                              loading="lazy"
                              decoding="async"
                              className="w-9 h-9 rounded object-cover border border-[#EAE2D5]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#171614] truncate">{c.name}</p>
                              <p className="text-[11px] text-[#968A7C] truncate">{c.level}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#EAE2D5]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Techniques */}
                  {searchResults.techniques.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#87553B] mb-1.5">تکنیک‌های آموزشی</p>
                      <div className="space-y-1">
                        {searchResults.techniques.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              if (onSelectTechnique) onSelectTechnique(t);
                              else onNavigate('technique-detail');
                            }}
                            className="w-full flex items-center justify-between p-2 hover:bg-[#F4EFE7]/60 rounded-lg text-right transition-colors cursor-pointer"
                          >
                            <p className="text-xs font-semibold text-[#171614] truncate">{t.name}</p>
                            <ArrowRight className="w-3.5 h-3.5 text-[#EAE2D5]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSearchSubmit(searchQuery)}
                    className="w-full py-2 bg-[#87553B] hover:bg-[#634C3D] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer mt-2"
                  >
                    مشاهده تمامی نتایج برای «{searchQuery}»
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
