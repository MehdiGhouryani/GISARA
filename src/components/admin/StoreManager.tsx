/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StoreManager - Dedicated Store, Inventory & Commercial Management Center
 * Part of Shanyoon Admin Console Segmented Architecture
 */

import { ConfirmDialog } from '../common/ConfirmDialog';
import React, { useState, useMemo } from 'react';
import { Product, Coupon } from '../../types/domain';
import { VisualAssetsManager } from './VisualAssetsManager';
import { ImageUploader } from '../common/ImageUploader';
import {
  Package,
  Tag,
  ImageIcon,
  Plus,
  Minus,
  PlusCircle,
  Search,
  Filter,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Flame,
  X,
  Sparkles,
  ShoppingBag,
  Pencil,
} from 'lucide-react';

interface StoreManagerProps {
  products: Product[];
  coupons: Coupon[];
  onUpdateProductStock: (productId: string, newStock: number, note: string) => void;
  onAddNewProduct: (product: Omit<Product, 'id'>) => void;
  onAddNewCoupon?: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  onToggleCouponStatus?: (couponId: string) => void;
  onDeleteCoupon?: (couponId: string) => void;
  onUpdateCoupon?: (coupon: Coupon) => void;
  activeSubTab?: 'INVENTORY' | 'COUPONS' | 'ASSETS';
  onSubTabChange?: (tab: 'INVENTORY' | 'COUPONS' | 'ASSETS') => void;
}

export const StoreManager: React.FC<StoreManagerProps> = ({
  products,
  coupons,
  onUpdateProductStock,
  onAddNewProduct,
  onAddNewCoupon,
  onToggleCouponStatus,
  onDeleteCoupon,
  onUpdateCoupon,
  activeSubTab = 'INVENTORY',
  onSubTabChange,
}) => {
  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);
  const [currentTab, setCurrentTab] = useState<'INVENTORY' | 'COUPONS' | 'ASSETS'>(activeSubTab);

  React.useEffect(() => {
    if (activeSubTab && activeSubTab !== currentTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'INVENTORY' | 'COUPONS' | 'ASSETS') => {
    setCurrentTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Products filtering & search
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // New Product Modal State
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('Osis+ Professional');
  const [newProdCategory, setNewProdCategory] = useState<'تثبیت‌کننده‌ها' | 'گیره و تقسیم‌بندی' | 'کش و سنجاق' | 'ابزار دستی' | 'کیت و ست'>('تثبیت‌کننده‌ها');
  const [newProdPrice, setNewProdPrice] = useState(350000);
  const [newProdStock, setNewProdStock] = useState(20);
  const [newProdSku, setNewProdSku] = useState('OSIS-TXT-01');
  const [newProdImage, setNewProdImage] = useState('/assets/products/hairspray.jpg');

  // New Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState(20);
  const [couponMaxToman, setCouponMaxToman] = useState(500000);
  const [couponMinOrder, setCouponMinOrder] = useState(1000000);
  const [couponDesc, setCouponDesc] = useState('');
  const [couponExpires, setCouponExpires] = useState('1405/12/29');

  // Edit Coupon Modal State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCouponCode, setEditCouponCode] = useState('');
  const [editCouponPercent, setEditCouponPercent] = useState(15);
  const [editCouponMaxToman, setEditCouponMaxToman] = useState<number | undefined>(undefined);
  const [editCouponMinOrder, setEditCouponMinOrder] = useState<number | undefined>(undefined);
  const [editCouponExpires, setEditCouponExpires] = useState('');
  const [editCouponDesc, setEditCouponDesc] = useState('');
  const [editCouponIsActive, setEditCouponIsActive] = useState(true);

  // Low stock products count
  const lowStockProducts = products.filter((p) => p.stock <= 15);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory = categoryFilter === 'ALL' || prod.category === categoryFilter;
      const query = productSearch.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesSearch =
        prod.name.toLowerCase().includes(query) ||
        prod.brand.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, productSearch]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const prodImg = newProdImage || '/assets/products/hairspray.jpg';

    onAddNewProduct({
      name: newProdName.trim(),
      slug: newProdName.trim().toLowerCase().replace(/\s+/g, '-'),
      category: newProdCategory,
      brand: newProdBrand,
      priceToman: newProdPrice,
      sku: newProdSku || `SKU-${Date.now().toString().slice(-4)}`,
      stock: newProdStock,
      rating: 5.0,
      reviewsCount: 1,
      image: prodImg,
      images: [prodImg],
      summary: 'محصول باکیفیت استاندارد آرایشگاهی با تضمین اصالت کالا.',
      description: 'این محصول توسط دپارتمان ابزار شنیون مو تست و تایید شده است.',
      specifications: {
        'نوع': newProdCategory,
        'گارانتی': 'سلامت فیزیکی',
        'مبدا': 'وارداتی اورجینال',
      },
      status: 'PUBLISHED',
    });

    setIsNewProductModalOpen(false);
    setNewProdName('');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    if (onAddNewCoupon) {
      onAddNewCoupon({
        code: couponCode.trim().toUpperCase(),
        discountPercent: couponPercent,
        maxDiscountToman: couponMaxToman || undefined,
        minOrderToman: couponMinOrder || 0,
        description: couponDesc.trim() || 'کد تخفیف ویژه فروشگاه',
        isActive: true,
        expiresAtJalali: couponExpires.trim() || undefined,
      });
    }

    setIsCouponModalOpen(false);
    setCouponCode('');
    setCouponDesc('');
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditCouponCode(coupon.code || '');
    setEditCouponPercent(coupon.discountPercent || 15);
    setEditCouponMaxToman(coupon.maxDiscountToman);
    setEditCouponMinOrder(coupon.minOrderToman);
    setEditCouponExpires(coupon.expiresAtJalali || '');
    setEditCouponDesc(coupon.description || '');
    setEditCouponIsActive(coupon.isActive);
  };

  const handleSaveEditCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon || !editCouponCode.trim()) return;

    if (onUpdateCoupon) {
      onUpdateCoupon({
        ...editingCoupon,
        code: editCouponCode.trim().toUpperCase(),
        discountPercent: Number(editCouponPercent) || 10,
        maxDiscountToman: editCouponMaxToman ? Number(editCouponMaxToman) : undefined,
        minOrderToman: editCouponMinOrder ? Number(editCouponMinOrder) : undefined,
        expiresAtJalali: editCouponExpires.trim() || undefined,
        description: editCouponDesc.trim(),
        isActive: editCouponIsActive,
      });
    }
    setEditingCoupon(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs Navigation */}
      <div className="bg-[#141211] p-5 sm:p-6 rounded-2xl border border-[#26211e] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                مدیریت فروشگاه و انبارداری کالاها
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                کنترل موجودی انبار کالاها، تنظیم جشنواره‌ها و کدهای تخفیف، و پیکربندی تصاویر و بنرهای ژورنالی ویترین.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lowStockProducts.length > 0 && (
              <span className="px-3 py-1.5 bg-rose-500/15 text-rose-300 border border-rose-500/25 rounded-xl text-xs font-bold tabular-nums flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{lowStockProducts.length} کالا رو به اتمام</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsNewProductModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت محصول جدید</span>
            </button>
          </div>
        </div>

        {/* Segmented Sub-Tab Switcher - Native Touch Scrolling on Mobile */}
        <div className="flex items-center gap-1.5 bg-[#0a0908] p-1.5 rounded-xl border border-[#26211e] overflow-x-auto scrollbar-none w-full sm:max-w-2xl shrink-0">
          <button
            type="button"
            onClick={() => handleTabSwitch('INVENTORY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'INVENTORY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <Package className="w-4 h-4 text-amber-500" />
            <span>کاتالوگ و انبارداری کالاها</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] tabular-nums font-bold ${
              currentTab === 'INVENTORY' ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-300'
            }`}>
              {products.length} کالا
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('COUPONS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'COUPONS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-500" />
            <span>کدهای تخفیف و جشنواره‌ها</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] tabular-nums font-bold ${
              currentTab === 'COUPONS' ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-300'
            }`}>
              {coupons.length} فعال
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('ASSETS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              currentTab === 'ASSETS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>بنرها و هویت بصری ویترین</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] tabular-nums font-bold ${
              currentTab === 'ASSETS' ? 'bg-white/20 text-white' : 'bg-stone-900 text-stone-300'
            }`}>
              ۵ جایگاه
            </span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: INVENTORY & PRODUCTS */}
      {currentTab === 'INVENTORY' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-[#FFFCF8] p-4 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#968A7C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="جستجو در نام محصول، برند، یا شناسه SKU انبار..."
                className="w-full pr-10 pl-4 py-2.5 bg-white border border-[#EAE2D5] rounded-xl text-xs text-[#171614] placeholder-[#968A7C] focus:outline-hidden focus:border-[#87553B]"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter - Native Horizontal Swipe on Mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-[#F4EFE7]/50 border border-[#EAE2D5] rounded-xl text-xs shrink-0">
              {['ALL', 'تثبیت‌کننده‌ها', 'گیره و تقسیم‌بندی', 'کش و سنجاق', 'ابزار دستی', 'کیت و ست'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#171614] text-white shadow-xs'
                      : 'text-[#59524A] hover:bg-[#F4EFE7]'
                  }`}
                >
                  {cat === 'ALL' ? 'همه دسته‌ها' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View (>= md screens) */}
          <div className="hidden md:block bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5] shadow-xs overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[700px]">
              <thead className="bg-[#F4EFE7]/60 text-[#59524A]">
                <tr>
                  <th className="p-3.5 font-bold">کالا و تصویر</th>
                  <th className="p-3.5 font-bold">SKU انبار</th>
                  <th className="p-3.5 font-bold">دسته‌بندی</th>
                  <th className="p-3.5 font-bold">برند</th>
                  <th className="p-3.5 font-bold">قیمت (تومان)</th>
                  <th className="p-3.5 font-bold">موجودی فعلی</th>
                  <th className="p-3.5 font-bold text-center">عملیات انبار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE2D5]/50">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#F4EFE7]/20 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 object-cover rounded-lg border border-[#EAE2D5]"
                        />
                        <div>
                          <div className="font-bold text-[#171614]">{prod.name}</div>
                          <div className="text-[10px] text-[#968A7C]">{prod.summary}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[#59524A]">{prod.sku}</td>
                    <td className="p-3.5 text-[#59524A]">{prod.category}</td>
                    <td className="p-3.5 text-[#59524A]">{prod.brand}</td>
                    <td className="p-3.5 font-bold text-[#87553B] tabular-nums">
                      {prod.priceToman.toLocaleString('fa-IR')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-md font-bold tabular-nums inline-block ${
                          prod.stock <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : prod.stock <= 15
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {prod.stock} عدد
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateProductStock(prod.id, prod.stock + 5, 'شارژ ورودی محموله جدید')
                          }
                          className="p-1.5 bg-[#F4EFE7] hover:bg-[#EAE2D5] text-[#171614] rounded-lg cursor-pointer"
                          title="افزایش ۵ عدد ورود به انبار"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={prod.stock <= 0}
                          onClick={() =>
                            onUpdateProductStock(prod.id, Math.max(0, prod.stock - 1), 'کسر دستی انبار')
                          }
                          className="p-1.5 bg-[#F4EFE7] hover:bg-[#EAE2D5] text-[#171614] rounded-lg cursor-pointer disabled:opacity-30"
                          title="کاهش ۱ عدد"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Optimized Product Inventory Cards (< md screens) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#59524A] bg-[#FFFCF8] rounded-2xl border border-[#EAE2D5]">
                هیچ کالایی مطابق با فیلتر یا جستجو یافت نشد.
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#FFFCF8] p-4 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-14 object-cover rounded-xl border border-[#EAE2D5] shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-bold text-[#171614] text-xs leading-snug line-clamp-2">
                        {prod.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#59524A]">
                        <span>برند: {prod.brand}</span>
                        <span>·</span>
                        <span className="font-mono text-[#87553B] font-semibold">{prod.sku}</span>
                      </div>
                      <div className="text-xs font-bold text-[#87553B] tabular-nums">
                        {prod.priceToman.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>
                  </div>

                  {/* Stock Status & Quick Adjustment Controls */}
                  <div className="pt-2.5 border-t border-[#EAE2D5]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#59524A]">موجودی انبار:</span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums ${
                          prod.stock <= 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : prod.stock <= 15
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {prod.stock} عدد
                      </span>
                    </div>

                    {/* Big Touch-Friendly Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProductStock(prod.id, prod.stock + 5, 'شارژ سریع ورودی انبار')
                        }
                        className="min-h-[38px] px-2.5 py-1.5 bg-[#F4EFE7] hover:bg-[#EAE2D5] active:bg-[#E2D8CA] text-[#171614] text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="شارژ ۵ عدد"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>۵+</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProductStock(prod.id, prod.stock + 1, 'شارژ تک‌عدد')
                        }
                        className="min-h-[38px] w-9 flex items-center justify-center bg-[#F4EFE7] hover:bg-[#EAE2D5] active:bg-[#E2D8CA] text-[#171614] rounded-xl cursor-pointer transition-colors shadow-2xs"
                        title="افزایش ۱ عدد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={prod.stock <= 0}
                        onClick={() =>
                          onUpdateProductStock(prod.id, Math.max(0, prod.stock - 1), 'کسر انبار')
                        }
                        className="min-h-[38px] w-9 flex items-center justify-center bg-[#F4EFE7] hover:bg-[#EAE2D5] active:bg-[#E2D8CA] text-[#171614] rounded-xl cursor-pointer transition-colors disabled:opacity-30 shadow-2xs"
                        title="کاهش ۱ عدد"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: COUPONS & DISCOUNTS */}
      {currentTab === 'COUPONS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#171614]">مدیریت کدهای تخفیف و جشنواره‌ها</h2>
              <p className="text-xs text-[#59524A] mt-1">
                کدهای تخفیف با درصد تخفیف، سقف ریالی و حداقل خرید در سبد خرید مشتریان به صورت بلادرنگ اعمال می‌شوند.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2 bg-[#87553B] hover:bg-[#6E422C] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تعریف کد تخفیف جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-[#171614] text-white font-mono font-bold text-xs rounded-lg tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleCouponStatus && onToggleCouponStatus(coupon.id)}
                      className="cursor-pointer"
                      title={coupon.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      {coupon.isActive ? (
                        <ToggleRight className="w-6 h-6 text-[#167C55]" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-stone-400" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#87553B] tabular-nums">
                      {coupon.discountPercent}٪
                    </span>
                    <span className="text-xs font-bold text-[#171614]">تخفیف روی سبد خرید</span>
                  </div>

                  <p className="text-xs text-[#59524A] mt-2">{coupon.description}</p>
                </div>

                <div className="pt-3 border-t border-[#EAE2D5]/60 space-y-2 text-xs text-[#59524A]">
                  <div className="flex justify-between">
                    <span>حداقل سبد خرید:</span>
                    <strong className="tabular-nums text-[#171614]">
                      {(coupon.minOrderToman || 0).toLocaleString('fa-IR')} تومان
                    </strong>
                  </div>
                  {coupon.maxDiscountToman && (
                    <div className="flex justify-between">
                      <span>حداکثر سقف تخفیف:</span>
                      <strong className="tabular-nums text-[#171614]">
                        {coupon.maxDiscountToman.toLocaleString('fa-IR')} تومان
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>دفعات استفاده:</span>
                    <strong className="tabular-nums text-[#87553B]">
                      {coupon.usageCount} بار
                    </strong>
                  </div>
                  {coupon.expiresAtJalali && (
                    <div className="flex justify-between text-[11px] text-[#968A7C]">
                      <span>انقضا:</span>
                      <span>{coupon.expiresAtJalali}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-[#EAE2D5]/50 mt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCoupon(coupon)}
                      className="text-[#87553B] hover:text-[#6E422C] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>ویرایش کد</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCouponToDelete(coupon)}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف کد</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: VISUAL ASSETS */}
      {currentTab === 'ASSETS' && <VisualAssetsManager />}

      {/* MODAL: NEW PRODUCT */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF8] rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE2D5] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="text-base font-bold text-[#171614]">ثبت محصول جدید در کاتالوگ فروشگاه</h3>
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">نام محصول:</label>
                <input
                  type="text"
                  placeholder="مثال: اسپری شاین و فیکساتور ماندگار"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">برند:</label>
                  <input
                    type="text"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">دسته‌بندی:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  >
                    <option value="تثبیت‌کننده‌ها">تثبیت‌کننده‌ها</option>
                    <option value="گیره و تقسیم‌بندی">گیره و تقسیم‌بندی</option>
                    <option value="کش و سنجاق">کش و سنجاق</option>
                    <option value="ابزار دستی">ابزار دستی</option>
                    <option value="کیت و ست">کیت و ست</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">قیمت به تومان:</label>
                  <input
                    type="number"
                    step={10000}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">موجودی انبار:</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">کد SKU انبارداری:</label>
                <input
                  type="text"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-mono"
                  required
                />
              </div>

              <ImageUploader
                label="تصویر اصلی محصول (Drag & Drop یا انتخاب از آرشیو):"
                value={newProdImage}
                onChange={setNewProdImage}
              />

              <div className="pt-3 border-t border-[#EAE2D5] flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#171614] hover:bg-[#87553B] text-white font-bold rounded-xl cursor-pointer"
                >
                  ثبت و انتشار کالا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW COUPON */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFCF8] rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE2D5] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="text-base font-bold text-[#171614]">تعریف کد تخفیف جدید</h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">کد کوپن (حروف انگلیسی):</label>
                <input
                  type="text"
                  placeholder="مثال: NOWRUZ1405"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-mono uppercase font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">درصد تخفیف (٪):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={couponPercent}
                    onChange={(e) => setCouponPercent(parseInt(e.target.value) || 10)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">سقف تخفیف (تومان):</label>
                  <input
                    type="number"
                    step={50000}
                    value={couponMaxToman}
                    onChange={(e) => setCouponMaxToman(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">حداقل سفارش (تومان):</label>
                  <input
                    type="number"
                    step={100000}
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">تاریخ انقضا (شمسی):</label>
                  <input
                    type="text"
                    placeholder="۱۴۰۵/۱۲/۲۹"
                    value={couponExpires}
                    onChange={(e) => {
                      const englishDigits = e.target.value
                        .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728))
                        .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632));
                      setCouponExpires(englishDigits);
                    }}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-mono text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">توضیحات و مناسبت:</label>
                <input
                  type="text"
                  placeholder="مثال: تخفیف ویژه بهار برای پکیج‌های ابزار و گیره"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#EAE2D5] flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#87553B] hover:bg-[#6E422C] text-white font-bold rounded-xl cursor-pointer"
                >
                  ایجاد و فعال‌سازی کد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COUPON */}
      {editingCoupon && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCoupon(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-[#FFFCF8] rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE2D5] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
              <h3 className="text-base font-bold text-[#171614] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#87553B]" />
                <span>ویرایش کد تخفیف «{editingCoupon.code}»</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">کد کوپن (حروف انگلیسی):</label>
                <input
                  type="text"
                  placeholder="مثال: NOWRUZ1405"
                  value={editCouponCode}
                  onChange={(e) => setEditCouponCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-mono uppercase font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">درصد تخفیف (٪):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editCouponPercent}
                    onChange={(e) => setEditCouponPercent(parseInt(e.target.value) || 10)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">سقف تخفیف (تومان):</label>
                  <input
                    type="number"
                    step={50000}
                    value={editCouponMaxToman || ''}
                    onChange={(e) => setEditCouponMaxToman(parseInt(e.target.value) || undefined)}
                    placeholder="بدون سقف"
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">حداقل سفارش (تومان):</label>
                  <input
                    type="number"
                    step={100000}
                    value={editCouponMinOrder || ''}
                    onChange={(e) => setEditCouponMinOrder(parseInt(e.target.value) || undefined)}
                    placeholder="بدون حداقل"
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">تاریخ انقضا (شمسی):</label>
                  <input
                    type="text"
                    placeholder="۱۴۰۵/۱۲/۲۹"
                    value={editCouponExpires}
                    onChange={(e) => setEditCouponExpires(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">توضیحات و مناسبت:</label>
                <input
                  type="text"
                  placeholder="توضیحات کد تخفیف..."
                  value={editCouponDesc}
                  onChange={(e) => setEditCouponDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#EAE2D5] rounded-xl"
                  required
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-[#EAE2D5] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-800">وضعیت فعال بودن کد:</span>
                  <p className="text-[10px] text-stone-500 mt-0.5">در صورت غیرفعال بودن، کد در درگاه اعمال نخواهد شد.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditCouponIsActive(!editCouponIsActive)}
                  className="cursor-pointer"
                >
                  {editCouponIsActive ? (
                    <ToggleRight className="w-6 h-6 text-[#167C55]" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-stone-400" />
                  )}
                </button>
              </div>

              <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-1">
                <span>تعداد دفعات استفاده شده تاکنون:</span>
                <strong className="text-[#87553B] font-mono">{editingCoupon.usageCount} بار</strong>
                <span className="text-stone-400">(حفظ می‌شود)</span>
              </div>

              <div className="pt-3 border-t border-[#EAE2D5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-4 py-2 border border-[#EAE2D5] text-stone-600 rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#87553B] hover:bg-[#6E422C] text-white font-bold rounded-xl cursor-pointer"
                >
                  ذخیره تغییرات کد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!couponToDelete}
        danger
        title="حذف کد تخفیف"
        message={`کد «${couponToDelete?.code}» برای همیشه حذف می‌شود.`}
        confirmLabel="حذف"
        onCancel={() => setCouponToDelete(null)}
        onConfirm={() => { if (couponToDelete && onDeleteCoupon) onDeleteCoupon(couponToDelete.id); setCouponToDelete(null); }}
      />
    </div>
  );
};
