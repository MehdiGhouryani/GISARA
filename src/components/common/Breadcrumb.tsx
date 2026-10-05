/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Breadcrumb Component - Strict RTL and Accessible
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="موقعیت فعلی در سایت" className={`flex items-center text-xs text-[#5E5A54] ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.isCurrent || isLast || !item.onClick ? (
                <span className="font-semibold text-[#171614] max-w-[200px] truncate" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-[#7A5E4D] transition-colors focus-visible:outline-none focus-visible:underline cursor-pointer"
                >
                  {item.label}
                </button>
              )}

              {!isLast && (
                <ChevronLeft className="w-3.5 h-3.5 text-[#DED7CD] shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
