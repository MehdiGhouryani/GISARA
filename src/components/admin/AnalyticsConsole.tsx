/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AnalyticsConsole - Comprehensive Visual Charts & Business Intelligence
 * Features:
 * - Smooth Area, Bar, and Dual-Axis Comparison Charts with Bezier splines
 * - Mini SVG Sparklines in every KPI metric card
 * - Interactive SVG Donut chart for traffic acquisition
 * - Circular radial meters for device breakdown
 * - Visual Multi-Stage Conversion Funnel with drop-off rates
 * - 7-Day Peak Traffic Heatmap Matrix
 * - Horizontal regional province bar comparison
 * - Real-time activity pulse and interactive event simulation
 * - CSV export capabilities
 */

import React, { useState, useMemo } from 'react';
import {
  UserOrder,
  Product,
  Course,
  StyleModel,
  WorkshopRequest,
  WorkshopSession,
} from '../../types/domain';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ShoppingCart,
  DollarSign,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Sparkles,
  Search,
  Activity,
  Flame,
  Clock,
  Layers,
  Award,
  BarChart2,
  PieChart,
  Filter,
  CheckCircle2,
  Zap,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface AnalyticsConsoleProps {
  orders: UserOrder[];
  products: Product[];
  courses: Course[];
  styles: StyleModel[];
  requests: WorkshopRequest[];
  sessions: WorkshopSession[];
}

type TimeRange = '24h' | '7d' | '30d' | '90d';
type MetricFilter = 'REVENUE' | 'TRAFFIC' | 'ORDERS';
type ChartStyleMode = 'AREA' | 'BAR' | 'DUAL';

interface LiveEvent {
  id: string;
  type: 'ORDER' | 'VIEW' | 'REQUEST' | 'CART';
  city: string;
  detail: string;
  amount?: number;
  timeAgo: string;
}

// Utility for smooth cubic bezier SVG path generation
function generateBezierPath(
  points: { x: number; y: number }[],
  closeToBottom = false,
  bottomY = 220
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  if (closeToBottom) {
    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(1)} ${bottomY} L ${points[0].x.toFixed(1)} ${bottomY} Z`;
  }

  return d;
}

// Mini Sparkline Component for KPI Cards
const MiniSparkline: React.FC<{
  data: number[];
  color: string;
  fillId: string;
  height?: number;
}> = ({ data, color, fillId, height = 36 }) => {
  const width = 120;
  const padding = 3;
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = generateBezierPath(points, false);
  const areaPath = generateBezierPath(points, true, height);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={color}
          className="animate-pulse"
        />
      )}
    </svg>
  );
};

export const AnalyticsConsole: React.FC<AnalyticsConsoleProps> = ({
  orders,
  products,
  courses,
  styles,
  requests,
  sessions,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('REVENUE');
  const [chartStyleMode, setChartStyleMode] = useState<ChartStyleMode>('AREA');
  const [activeUsers, setActiveUsers] = useState<number>(28);
  const [selectedDonutIndex, setSelectedDonutIndex] = useState<number | null>(null);

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Live real-time events feed state
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([
    {
      id: 'evt-1',
      type: 'ORDER',
      city: 'تهران',
      detail: 'پرداخت موفق سفارش پکیج اسپری فیکساتور و گیره استیل',
      amount: 870000,
      timeAgo: '۱ دقیقه پیش',
    },
    {
      id: 'evt-2',
      type: 'VIEW',
      city: 'اصفهان',
      detail: 'مشاهده صفحه آموزش تکنیک شنیون خطی و کرلی',
      timeAgo: '۳ دقیقه پیش',
    },
    {
      id: 'evt-3',
      type: 'REQUEST',
      city: 'مشهد',
      detail: 'ثبت درخواست کارگاه تخصصی فرمالیته عروس',
      timeAgo: '۵ دقیقه پیش',
    },
    {
      id: 'evt-4',
      type: 'CART',
      city: 'شیراز',
      detail: 'افزودن دوره جامع استادی شنیون مو به سبد خرید',
      timeAgo: '۸ دقیقه پیش',
    },
    {
      id: 'evt-5',
      type: 'ORDER',
      city: 'تبریز',
      detail: 'ثبت‌نام آنلاین در دوره تخصصی بافت و حجم‌دهی',
      amount: 2400000,
      timeAgo: '۱۲ دقیقه پیش',
    },
  ]);

  // Aggregate stats calculations based on domain models
  const totalPaidOrders = useMemo(
    () => orders.filter((o) => o.status === 'PAID'),
    [orders]
  );

  const realOrdersRevenue = useMemo(
    () => totalPaidOrders.reduce((sum, o) => sum + o.payableToman, 0),
    [totalPaidOrders]
  );

  // Time-range multiplier for scaling statistics logically
  const rangeConfig = useMemo(() => {
    switch (timeRange) {
      case '24h':
        return {
          views: 3840,
          uniqueUsers: 1420,
          baseRevenue: 4200000,
          orderCount: 12,
          conversionRate: 3.1,
          growthRate: 8.5,
          daysCount: 1,
          chartData: [
            { label: '۰۰:۰۰', views: 85, revenue: 120000, orders: 0 },
            { label: '۰۳:۰۰', views: 32, revenue: 0, orders: 0 },
            { label: '۰۶:۰۰', views: 64, revenue: 350000, orders: 1 },
            { label: '۰۹:۰۰', views: 380, revenue: 980000, orders: 3 },
            { label: '۱۲:۰۰', views: 620, revenue: 1450000, orders: 4 },
            { label: '۱۵:۰۰', views: 540, revenue: 780000, orders: 2 },
            { label: '۱۸:۰۰', views: 980, revenue: 1950000, orders: 5 },
            { label: '۲۱:۰۰', views: 1139, revenue: 2150000, orders: 6 },
          ],
        };
      case '7d':
        return {
          views: 29480,
          uniqueUsers: 9840,
          baseRevenue: 38500000,
          orderCount: 48,
          conversionRate: 3.6,
          growthRate: 14.8,
          daysCount: 7,
          chartData: [
            { label: 'شنبه', views: 3820, revenue: 4800000, orders: 6 },
            { label: 'یک‌شنبه', views: 4120, revenue: 5600000, orders: 7 },
            { label: 'دوشنبه', views: 3950, revenue: 4900000, orders: 6 },
            { label: 'سه‌شنبه', views: 4680, revenue: 6450000, orders: 8 },
            { label: 'چهارشنبه', views: 4890, revenue: 7100000, orders: 9 },
            { label: 'پنج‌شنبه', views: 4210, revenue: 5300000, orders: 7 },
            { label: 'جمعه', views: 3810, revenue: 4350000, orders: 5 },
          ],
        };
      case '30d':
        return {
          views: 124600,
          uniqueUsers: 38900,
          baseRevenue: 154000000,
          orderCount: 194,
          conversionRate: 3.4,
          growthRate: 22.4,
          daysCount: 30,
          chartData: [
            { label: 'هفته ۱', views: 28400, revenue: 34500000, orders: 42 },
            { label: 'هفته ۲', views: 31200, revenue: 39800000, orders: 50 },
            { label: 'هفته ۳', views: 33100, revenue: 41200000, orders: 52 },
            { label: 'هفته ۴', views: 31900, revenue: 38500000, orders: 50 },
          ],
        };
      case '90d':
        return {
          views: 398000,
          uniqueUsers: 112000,
          baseRevenue: 482000000,
          orderCount: 580,
          conversionRate: 3.2,
          growthRate: 31.6,
          daysCount: 90,
          chartData: [
            { label: 'تیر', views: 121000, revenue: 145000000, orders: 180 },
            { label: 'مرداد', views: 139000, revenue: 172000000, orders: 215 },
            { label: 'شهریور', views: 138000, revenue: 165000000, orders: 185 },
          ],
        };
    }
  }, [timeRange]);

  // Combined computed revenue
  const computedRevenue = rangeConfig.baseRevenue + realOrdersRevenue;
  const computedOrders = rangeConfig.orderCount + totalPaidOrders.length;
  const averageOrderValue = Math.round(computedRevenue / Math.max(1, computedOrders));

  // Traffic Acquisition Channels
  const acquisitionChannels = [
    { name: 'جستجوی ارگانیک گوگل (SEO)', percentage: 54, visitors: Math.round(rangeConfig.uniqueUsers * 0.54), color: '#87553B', bgClass: 'bg-[#87553B]' },
    { name: 'شبکه‌های اجتماعی (اینستاگرام)', percentage: 26, visitors: Math.round(rangeConfig.uniqueUsers * 0.26), color: '#C59B63', bgClass: 'bg-[#C59B63]' },
    { name: 'ورودی مستقیم (Direct URL)', percentage: 14, visitors: Math.round(rangeConfig.uniqueUsers * 0.14), color: '#167C55', bgClass: 'bg-[#167C55]' },
    { name: 'کانال‌ها و ارجاع خارجی (Referral)', percentage: 6, visitors: Math.round(rangeConfig.uniqueUsers * 0.06), color: '#D97706', bgClass: 'bg-amber-600' },
  ];

  // Device Breakdown
  const deviceBreakdown = [
    { label: 'تلفن هوشمند (Mobile)', share: 71, icon: Smartphone, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', strokeColor: '#10B981' },
    { label: 'رایانه و لپ‌تاپ (Desktop)', share: 24, icon: Laptop, color: 'text-stone-700 bg-stone-100 border-stone-200', strokeColor: '#78716C' },
    { label: 'تبلت (Tablet)', share: 5, icon: Tablet, color: 'text-amber-700 bg-amber-50 border-amber-200', strokeColor: '#F59E0B' },
  ];

  // Geographic Distribution
  const geoBreakdown = [
    { province: 'تهران', share: 42, count: Math.round(rangeConfig.uniqueUsers * 0.42) },
    { province: 'اصفهان', share: 18, count: Math.round(rangeConfig.uniqueUsers * 0.18) },
    { province: 'خراسان رضوی (مشهد)', share: 13, count: Math.round(rangeConfig.uniqueUsers * 0.13) },
    { province: 'فارس (شیراز)', share: 11, count: Math.round(rangeConfig.uniqueUsers * 0.11) },
    { province: 'آذربایجان شرقی (تبریز)', share: 9, count: Math.round(rangeConfig.uniqueUsers * 0.09) },
    { province: 'سایر استان‌ها', share: 7, count: Math.round(rangeConfig.uniqueUsers * 0.07) },
  ];

  // Top Searches
  const topSearches = [
    { query: 'اسپری فیکساتور قوی', count: 1840, change: '+24%' },
    { query: 'شنیون اروپایی عروس', count: 1620, change: '+18%' },
    { query: 'کارگاه حضوری تهران', count: 1340, change: '+32%' },
    { query: 'تکنیک بافت مواج خطی', count: 980, change: '+12%' },
    { query: 'ست شانه دم‌باریک فلزی', count: 760, change: '+8%' },
  ];

  // Conversion Funnel Data
  const funnelSteps = [
    {
      step: '۱. بازدید کل صفحات',
      count: rangeConfig.views,
      percent: 100,
      description: 'ورود مخاطبان به سایت و صفحات اصلی',
      badge: 'مرحله آغازین',
    },
    {
      step: '۲. مشاهده کاتالوگ مدل‌ها و دوره‌ها',
      count: Math.round(rangeConfig.views * 0.68),
      percent: 68,
      description: 'بررسی جزئیات سبک‌ها، ابزارها و کارگاه‌ها',
      badge: 'علاقه‌مندی و کشف',
    },
    {
      step: '۳. افزودن به سبد / درخواست کارگاه',
      count: Math.round(rangeConfig.views * 0.22),
      percent: 22,
      description: 'ثبت سفارش کالا یا ارسال فرم شهر اختصاصی',
      badge: 'تصمیم به خرید',
    },
    {
      step: '۴. ورود به صفحه پرداخت',
      count: Math.round(rangeConfig.views * 0.085),
      percent: 8.5,
      description: 'انتقال به درگاه امن بانکی شاپرک',
      badge: 'اقدام مالی',
    },
    {
      step: '۵. پرداخت قطعی و موفق',
      count: computedOrders,
      percent: rangeConfig.conversionRate,
      description: 'تراکنش نهایی و صدور فاکتور یا بلیط کارگاه',
      badge: 'نرخ تبدیل نهایی',
    },
  ];

  // Peak Traffic Matrix (Days x 4 time blocks)
  const heatmapData = [
    { day: 'شنبه', times: [35, 60, 95, 80] },
    { day: 'یک‌شنبه', times: [40, 75, 85, 90] },
    { day: 'دوشنبه', times: [30, 65, 80, 75] },
    { day: 'سه‌شنبه', times: [45, 80, 100, 95] },
    { day: 'چهارشنبه', times: [50, 85, 90, 100] },
    { day: 'پنج‌شنبه', times: [60, 90, 85, 70] },
    { day: 'جمعه', times: [40, 50, 70, 85] },
  ];

  // Top Products
  const sortedProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.rating * b.reviewsCount - a.rating * a.reviewsCount)
      .slice(0, 5);
  }, [products]);

  // Top Styles
  const sortedStyles = useMemo(() => {
    return [...styles]
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 5);
  }, [styles]);

  // SVG Chart Geometry Calculations
  const chartHeight = 260;
  const chartWidth = 720;
  const chartPaddingX = 45;
  const chartPaddingY = 30;

  const currentChartData = rangeConfig.chartData;

  // Max calculations for single-axis and dual-axis
  const maxMetricVal = useMemo(() => {
    if (metricFilter === 'REVENUE') {
      return Math.max(...currentChartData.map((d) => d.revenue)) * 1.15 || 1000000;
    }
    if (metricFilter === 'TRAFFIC') {
      return Math.max(...currentChartData.map((d) => d.views)) * 1.15 || 1000;
    }
    return Math.max(...currentChartData.map((d) => d.orders)) * 1.25 || 10;
  }, [metricFilter, currentChartData]);

  const maxRevenueVal = useMemo(
    () => Math.max(...currentChartData.map((d) => d.revenue)) * 1.15 || 1000000,
    [currentChartData]
  );
  const maxTrafficVal = useMemo(
    () => Math.max(...currentChartData.map((d) => d.views)) * 1.15 || 1000,
    [currentChartData]
  );

  // Scaled Coordinates for Primary Curve
  const primaryPoints = useMemo(() => {
    return currentChartData.map((d, i) => {
      const x = chartPaddingX + (i / Math.max(1, currentChartData.length - 1)) * (chartWidth - chartPaddingX * 2);
      const val =
        metricFilter === 'REVENUE'
          ? d.revenue
          : metricFilter === 'TRAFFIC'
          ? d.views
          : d.orders;
      const y = chartHeight - chartPaddingY - (val / maxMetricVal) * (chartHeight - chartPaddingY * 2);
      return { x, y, data: d, value: val };
    });
  }, [currentChartData, metricFilter, maxMetricVal, chartWidth, chartHeight]);

  // Secondary Points for Dual-axis (Traffic)
  const dualTrafficPoints = useMemo(() => {
    return currentChartData.map((d, i) => {
      const x = chartPaddingX + (i / Math.max(1, currentChartData.length - 1)) * (chartWidth - chartPaddingX * 2);
      const y = chartHeight - chartPaddingY - (d.views / maxTrafficVal) * (chartHeight - chartPaddingY * 2);
      return { x, y, value: d.views };
    });
  }, [currentChartData, maxTrafficVal, chartWidth, chartHeight]);

  // Secondary Points for Dual-axis (Revenue)
  const dualRevenuePoints = useMemo(() => {
    return currentChartData.map((d, i) => {
      const x = chartPaddingX + (i / Math.max(1, currentChartData.length - 1)) * (chartWidth - chartPaddingX * 2);
      const y = chartHeight - chartPaddingY - (d.revenue / maxRevenueVal) * (chartHeight - chartPaddingY * 2);
      return { x, y, value: d.revenue };
    });
  }, [currentChartData, maxRevenueVal, chartWidth, chartHeight]);

  // SVG Paths
  const primaryAreaPath = useMemo(
    () => generateBezierPath(primaryPoints, true, chartHeight - chartPaddingY),
    [primaryPoints, chartHeight, chartPaddingY]
  );

  const primaryLinePath = useMemo(
    () => generateBezierPath(primaryPoints, false),
    [primaryPoints]
  );

  const dualRevenueArea = useMemo(
    () => generateBezierPath(dualRevenuePoints, true, chartHeight - chartPaddingY),
    [dualRevenuePoints, chartHeight, chartPaddingY]
  );
  const dualRevenueLine = useMemo(
    () => generateBezierPath(dualRevenuePoints, false),
    [dualRevenuePoints]
  );
  const dualTrafficLine = useMemo(
    () => generateBezierPath(dualTrafficPoints, false),
    [dualTrafficPoints]
  );

  // Active hovered data item
  const activeHoveredData = hoveredPointIndex !== null ? currentChartData[hoveredPointIndex] : null;

  // Export CSV handler
  const handleExportCSV = () => {
    const csvRows = [
      ['Date/Period', 'Views', 'Revenue (Toman)', 'Orders', 'Conversion Rate %'],
      ...rangeConfig.chartData.map((d) => [
        d.label,
        d.views,
        d.revenue,
        d.orders,
        ((d.orders / Math.max(1, d.views)) * 100).toFixed(2),
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shanyoon-analytics-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate new live ping
  const handleSimulatePing = () => {
    const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'رشت', 'تبریز', 'اهواز', 'کرمانشاه'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const types: ('ORDER' | 'VIEW' | 'REQUEST' | 'CART')[] = ['ORDER', 'VIEW', 'REQUEST', 'CART'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    let detail = '';
    let amount: number | undefined;

    if (randomType === 'ORDER') {
      amount = Math.floor(Math.random() * 20 + 3) * 100000;
      detail = `خرید موفق اقلام شنیون و ابزار حرفه‌ای به مبلغ ${amount.toLocaleString('fa-IR')} تومان`;
    } else if (randomType === 'VIEW') {
      detail = 'مشاهده راهنمای جامع پکیج فرمالیته و شنیون باز';
    } else if (randomType === 'REQUEST') {
      detail = 'ارسال درخواست جدید برای ثبت‌نام در کارگاه خصوصی';
    } else {
      detail = 'افزودن اسپری اوسیس پلاس به سبد خرید';
    }

    const newEvt: LiveEvent = {
      id: `evt-${Date.now()}`,
      type: randomType,
      city: randomCity,
      detail,
      amount,
      timeAgo: 'چند لحظه پیش',
    };

    setLiveEvents((prev) => [newEvt, ...prev.slice(0, 6)]);
    setActiveUsers((u) => Math.min(65, Math.max(12, u + (Math.random() > 0.4 ? 1 : -1))));
  };

  // Donut chart calculations
  const donutCircumference = 2 * Math.PI * 38; // radius 38 -> ~238.76
  let accumulatedDonutPercent = 0;

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#FFFCF8] p-5 sm:p-6 rounded-2xl border border-[#EAE2D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#87553B]/10 text-[#87553B] rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#171614]">
              کنسول هوش تجاری و نمودارهای آماری
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#59524A] mt-1">
            تصویرسازی بصری ترافیک زنده، فروش و درآمد، سهم کانال‌ها، قیف تبدیل و رفتار کاربران.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Real-time live traffic pulse indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{activeUsers} کاربر آنلاین هم‌اکنون</span>
          </div>

          {/* Time range selector */}
          <div className="flex items-center p-1 bg-[#F4EFE7]/70 rounded-xl text-xs border border-[#EAE2D5]">
            {(
              [
                { id: '24h', label: '۲۴ ساعت' },
                { id: '7d', label: '۷ روز' },
                { id: '30d', label: '۳۰ روز' },
                { id: '90d', label: '۳ ماه' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTimeRange(t.id);
                  setHoveredPointIndex(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-[#171614] text-white shadow-xs'
                    : 'text-[#59524A] hover:text-[#171614]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#FFFCF8] hover:bg-[#F4EFE7] text-[#171614] border border-[#EAE2D5] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="دانلود گزارش با فرمت CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#87553B]" />
            <span>خروجی CSV</span>
          </button>

          {/* Simulate Event Button */}
          <button
            type="button"
            onClick={handleSimulatePing}
            className="px-3 py-1.5 bg-[#87553B]/10 hover:bg-[#87553B]/20 text-[#87553B] border border-[#87553B]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="شبیه‌سازی رویداد و ورودی کاربر جدید"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تست رویداد زنده</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards with Mini Visual Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Total Views */}
        <div className="bg-[#FFFCF8] p-4 sm:p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#87553B]/40 transition-colors">
          <div className="flex items-center justify-between text-[#59524A] text-xs">
            <span>کل بازدید صفحات</span>
            <Eye className="w-4 h-4 text-[#87553B]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#171614] tabular-nums tracking-tight">
              {rangeConfig.views.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{rangeConfig.growthRate}%</span>
            </div>
            <MiniSparkline
              data={rangeConfig.chartData.map((d) => d.views)}
              color="#87553B"
              fillId="grad-spark-views"
            />
          </div>
        </div>

        {/* Metric 2: Unique Visitors */}
        <div className="bg-[#FFFCF8] p-4 sm:p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#87553B]/40 transition-colors">
          <div className="flex items-center justify-between text-[#59524A] text-xs">
            <span>کاربران یکتا</span>
            <Users className="w-4 h-4 text-[#87553B]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#171614] tabular-nums tracking-tight">
              {rangeConfig.uniqueUsers.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+۱۲.۳%</span>
            </div>
            <MiniSparkline
              data={rangeConfig.chartData.map((d) => d.views * 0.38)}
              color="#C59B63"
              fillId="grad-spark-users"
            />
          </div>
        </div>

        {/* Metric 3: Gross Revenue */}
        <div className="bg-[#FFFCF8] p-4 sm:p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#167C55]/40 transition-colors">
          <div className="flex items-center justify-between text-[#59524A] text-xs">
            <span>فروش و گردش مالی</span>
            <DollarSign className="w-4 h-4 text-[#167C55]" />
          </div>
          <div className="my-2">
            <span className="text-xl sm:text-2xl font-bold text-[#167C55] tabular-nums tracking-tight">
              {(computedRevenue / 1000000).toLocaleString('fa-IR', {
                maximumFractionDigits: 1,
              })}{' '}
              میلیون
            </span>
            <div className="text-[10px] text-[#59524A] tabular-nums">
              {computedRevenue.toLocaleString('fa-IR')} ت
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>رشد قوی</span>
            </div>
            <MiniSparkline
              data={rangeConfig.chartData.map((d) => d.revenue)}
              color="#167C55"
              fillId="grad-spark-rev"
            />
          </div>
        </div>

        {/* Metric 4: Paid Orders */}
        <div className="bg-[#FFFCF8] p-4 sm:p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-stone-800/40 transition-colors">
          <div className="flex items-center justify-between text-[#59524A] text-xs">
            <span>سفارشات موفق</span>
            <ShoppingCart className="w-4 h-4 text-[#171614]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#171614] tabular-nums tracking-tight">
              {computedOrders.toLocaleString('fa-IR')} سفارش
            </span>
            <div className="text-[10px] text-[#59524A] tabular-nums">
              میانگین {averageOrderValue.toLocaleString('fa-IR')} ت
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+۹.۵%</span>
            </div>
            <MiniSparkline
              data={rangeConfig.chartData.map((d) => d.orders)}
              color="#171614"
              fillId="grad-spark-orders"
            />
          </div>
        </div>

        {/* Metric 5: Conversion Rate */}
        <div className="bg-[#FFFCF8] p-4 sm:p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#87553B]/40 transition-colors">
          <div className="flex items-center justify-between text-[#59524A] text-xs">
            <span>نرخ تبدیل خرید</span>
            <Layers className="w-4 h-4 text-[#87553B]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#171614] tabular-nums tracking-tight">
              {rangeConfig.conversionRate}%
            </span>
            <div className="text-[10px] text-[#59524A]">
              از بازدید به تسویه‌حساب
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>بالاتر از میانگین صنف</span>
            </div>
            <MiniSparkline
              data={[2.8, 3.0, 3.1, 3.4, 3.2, 3.5, rangeConfig.conversionRate]}
              color="#D97706"
              fillId="grad-spark-conv"
            />
          </div>
        </div>

        {/* Metric 6: Avg Session Duration */}
        <div className="bg-[#FFFCF8] p-4 sm:p-5 rounded-2xl border border-[#EAE2D5] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#87553B]/40 transition-colors">
          <div className="flex items-center justify-between text-[#59524A] text-xs">
            <span>مدت حضور در سایت</span>
            <Clock className="w-4 h-4 text-[#87553B]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-[#171614] tabular-nums tracking-tight">
              ۰۴:۳۵
            </span>
            <div className="text-[10px] text-emerald-700 font-medium">
              نرخ پرش پایین (۲۴.۵٪)
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-[11px] text-[#59524A]">
              تعامل ماندگار
            </div>
            <MiniSparkline
              data={[3.8, 4.1, 4.0, 4.3, 4.2, 4.6, 4.58]}
              color="#2563EB"
              fillId="grad-spark-time"
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Visual Chart Section */}
      <div className="bg-[#FFFCF8] p-5 sm:p-7 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-6">
        {/* Chart Header with Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#EAE2D5] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#171614]">
                نمودار تحلیلی تعاملی
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F4EFE7] text-[#59524A] font-medium">
                {timeRange === '24h'
                  ? 'بازه ۲۴ ساعت گذشته'
                  : timeRange === '7d'
                  ? 'روند ۷ روزه اخیر'
                  : timeRange === '30d'
                  ? 'بازه یک‌ماهه گذشته'
                  : 'بازه فصلی سه ماهه'}
              </span>
            </div>
            <p className="text-xs text-[#59524A] mt-1">
              با حرکت ماوس روی نمودار، اطلاعات دقیق هر مقطع زمانی با جزئیات کامل نمایش داده می‌شود.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Visual Style Mode (Area / Bar / Dual Comparison) */}
            <div className="flex items-center p-1 bg-[#F4EFE7]/70 rounded-xl text-xs border border-[#EAE2D5]">
              <button
                type="button"
                onClick={() => setChartStyleMode('AREA')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  chartStyleMode === 'AREA'
                    ? 'bg-[#171614] text-white shadow-xs'
                    : 'text-[#59524A] hover:text-[#171614]'
                }`}
                title="نمودار سطحی گرادیانی موجی"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>سطحی پیوسته</span>
              </button>

              <button
                type="button"
                onClick={() => setChartStyleMode('BAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  chartStyleMode === 'BAR'
                    ? 'bg-[#171614] text-white shadow-xs'
                    : 'text-[#59524A] hover:text-[#171614]'
                }`}
                title="نمودار میله‌ای ستونی"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>میله‌ای ستونی</span>
              </button>

              <button
                type="button"
                onClick={() => setChartStyleMode('DUAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  chartStyleMode === 'DUAL'
                    ? 'bg-[#171614] text-white shadow-xs'
                    : 'text-[#59524A] hover:text-[#171614]'
                }`}
                title="مقایسه همزمان فروش و ترافیک"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>مقایسه دوگانه (فروش و ترافیک)</span>
              </button>
            </div>

            {/* Metric Filter (Only shown when not in DUAL mode) */}
            {chartStyleMode !== 'DUAL' && (
              <div className="flex items-center gap-1 p-1 bg-[#F4EFE7]/60 rounded-xl text-xs border border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => {
                    setMetricFilter('REVENUE');
                    setHoveredPointIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    metricFilter === 'REVENUE'
                      ? 'bg-[#167C55] text-white shadow-xs'
                      : 'text-[#59524A] hover:text-[#171614]'
                  }`}
                >
                  درآمد فروش (تومان)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetricFilter('TRAFFIC');
                    setHoveredPointIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    metricFilter === 'TRAFFIC'
                      ? 'bg-[#87553B] text-white shadow-xs'
                      : 'text-[#59524A] hover:text-[#171614]'
                  }`}
                >
                  تعداد بازدید
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetricFilter('ORDERS');
                    setHoveredPointIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    metricFilter === 'ORDERS'
                      ? 'bg-[#171614] text-white shadow-xs'
                      : 'text-[#59524A] hover:text-[#171614]'
                  }`}
                >
                  تعداد سفارشات
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Detailed Hover Card */}
        <div className="min-h-[50px] flex items-center justify-between bg-[#F8F5EE] border border-[#EAE2D5] rounded-xl px-4 py-2.5 text-xs">
          {activeHoveredData ? (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#171614]"></span>
                <span className="font-bold text-[#171614]">{activeHoveredData.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#167C55]">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-bold tabular-nums">
                  درآمد: {activeHoveredData.revenue.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#87553B]">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-bold tabular-nums">
                  بازدید: {activeHoveredData.views.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#171614]">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="font-bold tabular-nums">
                  سفارش: {activeHoveredData.orders.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#59524A]">
                <span>نرخ تبدیل:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {((activeHoveredData.orders / Math.max(1, activeHoveredData.views)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#59524A]">
              <Activity className="w-4 h-4 text-[#87553B]" />
              <span>
                نشانگر ماوس را روی هر نقطه از نمودار زیر حرکت دهید تا جزئیات درآمد، بازدید و سفارشات نمایش داده شود.
              </span>
            </div>
          )}

          {chartStyleMode === 'DUAL' && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-[#167C55]">
                <span className="w-3 h-1 bg-[#167C55] rounded-full inline-block"></span>
                <span>درآمد (محور چپ)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#87553B]">
                <span className="w-3 h-1 bg-[#87553B] rounded-full inline-block"></span>
                <span>ترافیک (محور راست)</span>
              </div>
            </div>
          )}
        </div>

        {/* Responsive SVG Chart Canvas */}
        <div className="relative w-full overflow-x-auto pb-2">
          <div className="min-w-[650px] w-full">
            {chartStyleMode === 'BAR' ? (
              /* MODERN COLUMN / BAR CHART */
              <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 px-4 pt-4 border-b border-[#EAE2D5] relative">
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25">
                  <div className="border-b border-dashed border-stone-400"></div>
                  <div className="border-b border-dashed border-stone-400"></div>
                  <div className="border-b border-dashed border-stone-400"></div>
                  <div className="border-b border-dashed border-stone-400"></div>
                </div>

                {currentChartData.map((item, idx) => {
                  const activeVal =
                    metricFilter === 'REVENUE'
                      ? item.revenue
                      : metricFilter === 'TRAFFIC'
                      ? item.views
                      : item.orders;
                  const heightPercent = Math.max(10, Math.round((activeVal / maxMetricVal) * 100));
                  const isHovered = hoveredPointIndex === idx;

                  const barGradient =
                    metricFilter === 'REVENUE'
                      ? 'bg-gradient-to-t from-[#1E4D3A] via-[#167C55] to-[#458C6D]'
                      : metricFilter === 'TRAFFIC'
                      ? 'bg-gradient-to-t from-[#6E422C] via-[#87553B] to-[#C59B63]'
                      : 'bg-gradient-to-t from-black via-[#171614] to-stone-500';

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-10"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      {/* Top floating pill */}
                      <span
                        className={`text-[10px] font-bold mb-2 transition-all tabular-nums ${
                          isHovered
                            ? 'opacity-100 text-[#171614] scale-110 -translate-y-1'
                            : 'opacity-0 text-[#59524A]'
                        }`}
                      >
                        {metricFilter === 'REVENUE'
                          ? `${(item.revenue / 1000000).toFixed(1)}م`
                          : activeVal.toLocaleString('fa-IR')}
                      </span>

                      {/* Bar Body */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[52px] rounded-t-xl transition-all duration-300 shadow-sm ${barGradient} ${
                          isHovered ? 'ring-2 ring-offset-2 ring-[#87553B] scale-[1.03]' : ''
                        }`}
                      />

                      {/* Bottom Label */}
                      <span
                        className={`mt-3 text-[11px] font-medium transition-colors ${
                          isHovered ? 'text-[#171614] font-bold' : 'text-[#59524A]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : chartStyleMode === 'DUAL' ? (
              /* DUAL AXIS COMPARATIVE SVG CHART */
              <div className="relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id="dualRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#167C55" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#167C55" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = chartHeight - chartPaddingY - pct * (chartHeight - chartPaddingY * 2);
                    return (
                      <line
                        key={i}
                        x1={chartPaddingX}
                        y1={y}
                        x2={chartWidth - chartPaddingX}
                        y2={y}
                        stroke="#EAE2D5"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Revenue Area & Line */}
                  <path d={dualRevenueArea} fill="url(#dualRevGrad)" />
                  <path
                    d={dualRevenueLine}
                    fill="none"
                    stroke="#167C55"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Traffic Line */}
                  <path
                    d={dualTrafficLine}
                    fill="none"
                    stroke="#87553B"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {dualRevenuePoints.map((pt, idx) => {
                    const trPt = dualTrafficPoints[idx];
                    const isHovered = hoveredPointIndex === idx;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        {/* Vertical Guide Line when hovered */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={chartPaddingY}
                            x2={pt.x}
                            y2={chartHeight - chartPaddingY}
                            stroke="#171614"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        )}

                        {/* Revenue Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4}
                          fill="#167C55"
                          stroke="#FFFCF8"
                          strokeWidth="2"
                          className="transition-all"
                        />

                        {/* Traffic Circle */}
                        <circle
                          cx={trPt.x}
                          cy={trPt.y}
                          r={isHovered ? 6 : 4}
                          fill="#87553B"
                          stroke="#FFFCF8"
                          strokeWidth="2"
                          className="transition-all"
                        />

                        {/* X-axis Label */}
                        <text
                          x={pt.x}
                          y={chartHeight - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fill={isHovered ? '#171614' : '#59524A'}
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {currentChartData[idx].label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* SMOOTH AREA GRADIENT CHART */
              <div className="relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id="mainAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={
                          metricFilter === 'REVENUE'
                            ? '#167C55'
                            : metricFilter === 'TRAFFIC'
                            ? '#87553B'
                            : '#171614'
                        }
                        stopOpacity="0.32"
                      />
                      <stop
                        offset="100%"
                        stopColor={
                          metricFilter === 'REVENUE'
                            ? '#167C55'
                            : metricFilter === 'TRAFFIC'
                            ? '#87553B'
                            : '#171614'
                        }
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = chartHeight - chartPaddingY - pct * (chartHeight - chartPaddingY * 2);
                    return (
                      <line
                        key={i}
                        x1={chartPaddingX}
                        y1={y}
                        x2={chartWidth - chartPaddingX}
                        y2={y}
                        stroke="#EAE2D5"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Area fill */}
                  <path d={primaryAreaPath} fill="url(#mainAreaGrad)" />

                  {/* Smooth curved stroke line */}
                  <path
                    d={primaryLinePath}
                    fill="none"
                    stroke={
                      metricFilter === 'REVENUE'
                        ? '#167C55'
                        : metricFilter === 'TRAFFIC'
                        ? '#87553B'
                        : '#171614'
                    }
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Nodes & Vertical Crosshair */}
                  {primaryPoints.map((pt, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    const strokeColor =
                      metricFilter === 'REVENUE'
                        ? '#167C55'
                        : metricFilter === 'TRAFFIC'
                        ? '#87553B'
                        : '#171614';

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        {/* Hover vertical reference line */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={chartPaddingY}
                            x2={pt.x}
                            y2={chartHeight - chartPaddingY}
                            stroke="#171614"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        )}

                        {/* Interactive invisible wider touch target */}
                        <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                        {/* Outer glowing ring when hovered */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="10"
                            fill={strokeColor}
                            opacity="0.25"
                            className="animate-ping"
                          />
                        )}

                        {/* Central Data Point Circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4}
                          fill={strokeColor}
                          stroke="#FFFCF8"
                          strokeWidth="2.5"
                          className="transition-all"
                        />

                        {/* X-axis Label */}
                        <text
                          x={pt.x}
                          y={chartHeight - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fill={isHovered ? '#171614' : '#59524A'}
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {currentChartData[idx].label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns for Visual Acquisition Donut & Visual Multi-Stage Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Visual Donut Chart for Traffic Sources */}
        <div className="bg-[#FFFCF8] p-5 sm:p-6 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#171614] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#87553B]" />
              <span>نمودار دایره‌ای (دونات) سهم ورودی‌های سایت</span>
            </h3>
            <span className="text-xs text-[#59524A]">
              {rangeConfig.uniqueUsers.toLocaleString('fa-IR')} کاربر
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F4EFE7"
                  strokeWidth="12"
                />

                {/* Slices */}
                {acquisitionChannels.map((channel, i) => {
                  const sliceLength = (channel.percentage / 100) * donutCircumference;
                  const offset = (accumulatedDonutPercent / 100) * donutCircumference;
                  accumulatedDonutPercent += channel.percentage;
                  const isSelected = selectedDonutIndex === i;

                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={channel.color}
                      strokeWidth={isSelected ? 16 : 12}
                      strokeDasharray={`${sliceLength} ${donutCircumference - sliceLength}`}
                      strokeDashoffset={-offset}
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setSelectedDonutIndex(i)}
                      onMouseLeave={() => setSelectedDonutIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                <span className="text-xs text-[#59524A] leading-tight">
                  {selectedDonutIndex !== null
                    ? acquisitionChannels[selectedDonutIndex].name.split(' ')[0]
                    : 'بزرگ‌ترین سهم'}
                </span>
                <span className="text-lg font-bold text-[#171614] tabular-nums">
                  {selectedDonutIndex !== null
                    ? `${acquisitionChannels[selectedDonutIndex].percentage}%`
                    : '۵۴٪'}
                </span>
                <span className="text-[10px] text-[#87553B] font-medium">
                  {selectedDonutIndex !== null
                    ? `${acquisitionChannels[selectedDonutIndex].visitors.toLocaleString('fa-IR')} کاربر`
                    : 'گوگل ارگانیک'}
                </span>
              </div>
            </div>

            {/* Interactive Legend with progress bars */}
            <div className="flex-1 w-full space-y-3">
              {acquisitionChannels.map((channel, i) => {
                const isSelected = selectedDonutIndex === i;
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected ? 'bg-[#F8F5EE] ring-1 ring-[#EAE2D5]' : 'hover:bg-[#F8F5EE]/60'
                    }`}
                    onMouseEnter={() => setSelectedDonutIndex(i)}
                    onMouseLeave={() => setSelectedDonutIndex(null)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="font-semibold text-[#171614]">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#59524A] tabular-nums">
                          {channel.visitors.toLocaleString('fa-IR')}
                        </span>
                        <span className="font-bold text-[#171614] tabular-nums">
                          {channel.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#F4EFE7] rounded-full overflow-hidden mt-1.5">
                      <div
                        style={{ width: `${channel.percentage}%`, backgroundColor: channel.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device Circular Meters */}
          <div className="pt-4 border-t border-[#EAE2D5]">
            <div className="text-xs font-bold text-[#171614] mb-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#87553B]" />
              <span>توزیع دستگاه‌ها (Device Share)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {deviceBreakdown.map((dev, i) => {
                const Icon = dev.icon;
                const meterCircumference = 2 * Math.PI * 22;
                const dashLen = (dev.share / 100) * meterCircumference;

                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-center space-y-1 ${dev.color}`}
                  >
                    <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                      <svg viewBox="0 0 54 54" className="w-full h-full -rotate-90 transform">
                        <circle
                          cx="27"
                          cy="27"
                          r="22"
                          fill="transparent"
                          stroke="currentColor"
                          opacity="0.2"
                          strokeWidth="5"
                        />
                        <circle
                          cx="27"
                          cy="27"
                          r="22"
                          fill="transparent"
                          stroke={dev.strokeColor}
                          strokeWidth="5"
                          strokeDasharray={`${dashLen} ${meterCircumference - dashLen}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-base font-bold text-[#171614] tabular-nums">
                      {dev.share}%
                    </div>
                    <div className="text-[10px] text-[#59524A] leading-tight">{dev.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Visual Multi-Stage Conversion Funnel Chart */}
        <div className="bg-[#FFFCF8] p-5 sm:p-6 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#171614] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#87553B]" />
              <span>نمودار بصری قیف تبدیل (Conversion Funnel)</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              نرخ کل: {rangeConfig.conversionRate}%
            </span>
          </div>

          <p className="text-xs text-[#59524A]">
            بررسی نرخ حفظ و ریزش کاربران در ۵ مرحله کلیدی از لحظه ورود تا پرداخت نهایی.
          </p>

          {/* Visual Funnel Diagram */}
          <div className="space-y-2.5 pt-1">
            {funnelSteps.map((step, idx) => {
              const prevStep = idx > 0 ? funnelSteps[idx - 1] : null;
              const stepRetention = prevStep
                ? Math.round((step.count / Math.max(1, prevStep.count)) * 100)
                : 100;
              const dropOff = prevStep ? 100 - stepRetention : 0;

              return (
                <div key={idx} className="space-y-1">
                  {/* Drop-off indicator between steps */}
                  {prevStep && (
                    <div className="flex items-center justify-between px-6 text-[10px] text-[#C54636]">
                      <span className="flex items-center gap-1 font-medium">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>ریزش: {dropOff}%</span>
                      </span>
                      <span className="text-[#59524A]">
                        نرخ انتقال مرحله: {stepRetention}%
                      </span>
                    </div>
                  )}

                  {/* Funnel Step Bar */}
                  <div className="bg-[#F8F5EE] border border-[#EAE2D5] rounded-xl p-3 hover:border-[#87553B]/40 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#171614] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#171614]">{step.step}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#EAE2D5] text-[#59524A] hidden sm:inline">
                          {step.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#171614] tabular-nums">
                          {step.count.toLocaleString('fa-IR')}
                        </span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tabular-nums">
                          {step.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Fill Bar with Gradient */}
                    <div className="w-full h-3 bg-[#F4EFE7] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(6, step.percent)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 4
                            ? 'bg-gradient-to-l from-emerald-600 to-teal-500'
                            : idx === 3
                            ? 'bg-gradient-to-l from-[#167C55] to-emerald-600'
                            : idx === 2
                            ? 'bg-gradient-to-l from-[#87553B] to-[#C59B63]'
                            : 'bg-gradient-to-l from-stone-700 to-stone-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns for Weekly Heatmap Matrix & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Peak Hours Weekly Heatmap Matrix */}
        <div className="bg-[#FFFCF8] p-5 sm:p-6 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#171614] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#C54636]" />
              <span>ماتریس حرارتی ساعات اوج خرید و بازدید (Heatmap)</span>
            </h3>
            <span className="text-xs text-[#59524A]">هفتگی</span>
          </div>

          <p className="text-xs text-[#59524A]">
            چگالی ترافیک در طول ایام هفته و ۴ شیفت زمانی روز (مناسب برای انتشار استوری و آفرهای کارگاه).
          </p>

          {/* Heatmap Grid */}
          <div className="pt-2">
            {/* Column Headers */}
            <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-semibold text-[#59524A] pb-2 border-b border-[#EAE2D5]/60">
              <span className="text-right">روز هفته</span>
              <span>صبح (۸-۱۲)</span>
              <span>ظهر (۱۲-۱۶)</span>
              <span>عصر (۱۶-۲۰)</span>
              <span>شب (۲۰-۲۴)</span>
            </div>

            {/* Rows */}
            <div className="space-y-1.5 pt-2">
              {heatmapData.map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center text-xs">
                  <span className="font-semibold text-[#171614] text-right">{row.day}</span>
                  {row.times.map((val, tIdx) => {
                    let tileColor = 'bg-[#F2ECE3] text-stone-700';
                    if (val >= 90) {
                      tileColor = 'bg-[#87553B] text-white font-bold shadow-xs';
                    } else if (val >= 75) {
                      tileColor = 'bg-[#C59B63] text-white font-medium';
                    } else if (val >= 50) {
                      tileColor = 'bg-[#CDB5A4] text-[#171614]';
                    }

                    return (
                      <div
                        key={tIdx}
                        className={`h-8 rounded-lg flex items-center justify-center text-[11px] tabular-nums transition-transform hover:scale-105 cursor-pointer ${tileColor}`}
                        title={`${row.day} - شیفت ${tIdx + 1}: شدت فعالیت ${val}%`}
                      >
                        {val}%
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-end gap-2 text-[10px] text-[#59524A] pt-3">
              <span>کم‌ترافیک</span>
              <span className="w-3.5 h-3.5 rounded bg-[#F2ECE3] border border-[#EAE2D5]"></span>
              <span className="w-3.5 h-3.5 rounded bg-[#CDB5A4]"></span>
              <span className="w-3.5 h-3.5 rounded bg-[#C59B63]"></span>
              <span className="w-3.5 h-3.5 rounded bg-[#87553B]"></span>
              <span>اوج فروش و ثبت‌نام</span>
            </div>
          </div>
        </div>

        {/* Right: Live Real-time Activity Stream */}
        <div className="bg-[#FFFCF8] p-5 sm:p-6 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#171614]">
                جریان زنده رویدادهای کاربر (Live Activity Stream)
              </h3>
            </div>
            <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-[#EAE2D5]/50 max-h-[350px] overflow-y-auto pr-1 space-y-0.5">
            {liveEvents.map((evt) => (
              <div
                key={evt.id}
                className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-[#F8F5EE] px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      evt.type === 'ORDER'
                        ? 'bg-emerald-100 text-emerald-800'
                        : evt.type === 'CART'
                        ? 'bg-amber-100 text-amber-800'
                        : evt.type === 'REQUEST'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {evt.type === 'ORDER' && <DollarSign className="w-3.5 h-3.5" />}
                    {evt.type === 'CART' && <ShoppingCart className="w-3.5 h-3.5" />}
                    {evt.type === 'REQUEST' && <Users className="w-3.5 h-3.5" />}
                    {evt.type === 'VIEW' && <Eye className="w-3.5 h-3.5" />}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#171614]">{evt.city}</span>
                      <span className="text-[10px] text-[#59524A]">• {evt.timeAgo}</span>
                    </div>
                    <p className="text-[#59524A] mt-0.5 leading-relaxed">{evt.detail}</p>
                    {evt.amount && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 tabular-nums">
                        مبلغ: {evt.amount.toLocaleString('fa-IR')} تومان
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-[#C59B63] font-semibold shrink-0">
                  {evt.type === 'ORDER'
                    ? 'سفارش'
                    : evt.type === 'CART'
                    ? 'سبد'
                    : evt.type === 'REQUEST'
                    ? 'کارگاه'
                    : 'بازدید'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: 3 Columns for Products, Content & Provinces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1: Top Performing Products */}
        <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <h3 className="text-sm font-bold text-[#171614] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#87553B]" />
              <span>پرفروش‌ترین کالاها و ابزار</span>
            </h3>
            <span className="text-xs text-[#59524A]">فروشگاه</span>
          </div>

          <div className="space-y-3">
            {sortedProducts.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl hover:bg-[#F8F5EE] transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-[#F4EFE7] text-[#171614] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-[#171614] truncate">{p.name}</p>
                    <p className="text-[11px] text-[#59524A] tabular-nums">
                      {p.priceToman.toLocaleString('fa-IR')} تومان • موجودی: {p.stock}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#167C55] shrink-0 tabular-nums">
                  ★ {p.rating}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Top Hair Styles & Content Engagement */}
        <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-3">
            <h3 className="text-sm font-bold text-[#171614] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#C54636]" />
              <span>محبوب‌ترین مدل‌های شنیون</span>
            </h3>
            <span className="text-xs text-[#59524A]">موتور کشف</span>
          </div>

          <div className="space-y-3">
            {sortedStyles.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl hover:bg-[#F8F5EE] transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-[#F4EFE7] text-[#171614] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-[#171614] truncate">{s.name}</p>
                    <p className="text-[11px] text-[#59524A]">
                      مناسبت: {s.occasion} • {s.difficulty}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#87553B] shrink-0 tabular-nums">
                  <Eye className="w-3 h-3" />
                  <span>{s.viewsCount.toLocaleString('fa-IR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Geographic Distribution & Top Searches */}
        <div className="bg-[#FFFCF8] p-5 rounded-2xl border border-[#EAE2D5] shadow-xs space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-[#EAE2D5] pb-2 mb-3">
              <h3 className="text-sm font-bold text-[#171614] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#87553B]" />
                <span>توزیع استانی بازدیدکنندگان</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {geoBreakdown.map((geo, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#171614] font-medium">{geo.province}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#59524A] tabular-nums">
                        {geo.count.toLocaleString('fa-IR')} کاربر
                      </span>
                      <span className="font-bold text-[#171614] tabular-nums w-8 text-left">
                        {geo.share}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#F4EFE7] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${geo.share}%` }}
                      className="h-full bg-[#87553B] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAE2D5]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#171614] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#87553B]" />
                <span>بیشترین عبارات جستجو شده</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topSearches.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#F8F5EE] border border-[#EAE2D5] text-[#171614] text-[11px] rounded-lg flex items-center gap-1.5"
                >
                  <span>{s.query}</span>
                  <span className="text-[10px] text-emerald-700 font-bold tabular-nums">
                    {s.change}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
