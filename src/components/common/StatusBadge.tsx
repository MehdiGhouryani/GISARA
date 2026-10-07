/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * StatusBadge - Accessible and Canonical Invariant Badge Component
 * Compliant with Master Blueprint and UI Workbench v1.0
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  SessionStatus,
  RequestStatus,
  OrderStatus,
  RegistrationStatus,
} from '../../types/domain';

type AnyStatus = SessionStatus | RequestStatus | OrderStatus | RegistrationStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  let label = status;
  let bgClass = 'bg-[#EEE8DF] text-[#5E5A54] border-[#DED7CD]';
  let Icon = Clock;

  switch (status) {
    // Session statuses
    case 'OPEN':
      label = 'ظرفیت باز';
      bgClass = 'bg-[#2F6B51]/10 text-[#2F6B51] border-[#2F6B51]/20';
      Icon = CheckCircle2;
      break;
    case 'FULL':
      label = 'تکمیل ظرفیت';
      bgClass = 'bg-[#9A6B25]/10 text-[#9A6B25] border-[#9A6B25]/20';
      Icon = Lock;
      break;
    case 'COMPLETED':
      label = 'برگزار شده';
      bgClass = 'bg-stone-100 text-stone-600 border-stone-200';
      Icon = CheckCircle2;
      break;

    // Request statuses
    case 'SUBMITTED':
      label = 'ارسال شده';
      bgClass = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = Clock;
      break;
    case 'UNDER_REVIEW':
      label = 'در حال بررسی';
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;
    case 'SCHEDULE_PROPOSED':
      label = 'پیشنهاد جلسه ارائه شد';
      bgClass = 'bg-[#7A5E4D]/10 text-[#7A5E4D] border-[#7A5E4D]/25 font-bold';
      Icon = Calendar;
      break;
    case 'ACCEPTED':
      label = 'پذیرفته شد';
      bgClass = 'bg-[#2F6B51]/10 text-[#2F6B51] border-[#2F6B51]/20';
      Icon = CheckCircle2;
      break;
    case 'DECLINED':
      label = 'رد شد';
      bgClass = 'bg-[#A54843]/10 text-[#A54843] border-[#A54843]/20';
      Icon = XCircle;
      break;
    case 'CANCELLED':
      label = 'لغو شد';
      bgClass = 'bg-stone-100 text-stone-500 border-stone-200';
      Icon = XCircle;
      break;
    case 'EXPIRED':
      label = 'منقضی شد';
      bgClass = 'bg-stone-100 text-stone-500 border-stone-200';
      Icon = AlertCircle;
      break;

    // Order & Payment
    case 'PAID':
      label = 'پرداخت موفق';
      bgClass = 'bg-[#2F6B51]/10 text-[#2F6B51] border-[#2F6B51]/20';
      Icon = CheckCircle2;
      break;
    case 'PENDING_PAYMENT':
      label = 'در انتظار پرداخت';
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;
    case 'PAYMENT_FAILED':
      label = 'پرداخت ناموفق';
      bgClass = 'bg-[#A54843]/10 text-[#A54843] border-[#A54843]/20';
      Icon = XCircle;
      break;
    case 'REFUND_PENDING':
      label = 'در انتظار استرداد';
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;
    case 'REFUNDED':
      label = 'مسترد شد';
      bgClass = 'bg-stone-100 text-stone-600 border-stone-200';
      Icon = CheckCircle2;
      break;

    // Registration
    case 'CONFIRMED':
      label = 'ثبت‌نام قطعی';
      bgClass = 'bg-[#2F6B51]/10 text-[#2F6B51] border-[#2F6B51]/20';
      Icon = CheckCircle2;
      break;
    case 'PENDING':
      label = 'در انتظار تایید';
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;
    default:
      label = status;
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md shrink-0 select-none ${bgClass} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
