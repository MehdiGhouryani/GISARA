/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GisaraEmblem - Haute Coiffure Luxury Logo Emblem for GisAra (گیس‌آرا)
 * Replaces any standalone Persian characters with a pure luxury emblem
 * featuring stylized flowing hair ribbons, tiara crest, and gold warm highlights.
 */

import React from 'react';

interface GisaraEmblemProps {
  className?: string;
  size?: number;
}

export const GisaraEmblem: React.FC<GisaraEmblemProps> = ({
  className = 'w-5 h-5',
  size = 20,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gisaraGoldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE8C4" />
          <stop offset="0.45" stopColor="#D9A75E" />
          <stop offset="1" stopColor="#87553B" />
        </linearGradient>
        <linearGradient id="gisaraInnerShine" x1="12" y1="4" x2="12" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#D9A75E" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Outer Stylized Hair Ribbon Loop */}
      <path
        d="M4.5 14C4.5 18 7.8 20.8 12 20.8C16.2 20.8 19.5 18 19.5 14C19.5 10.2 16 8.2 12 8.2C8 8.2 4.5 10.2 4.5 14Z"
        stroke="url(#gisaraGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Inner Flowing Strand & Coiffure Crest */}
      <path
        d="M7.8 11.5C8 8 9.8 4.2 12 3.2C14.2 4.2 16 8 16.2 11.5C16.2 14.5 14.5 16.2 12 16.2C9.5 16.2 7.8 14.5 7.8 11.5Z"
        stroke="url(#gisaraGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Central Diamond Tiara Sparkle */}
      <path
        d="M12 6.8V10.2M10.3 8.5H13.7"
        stroke="url(#gisaraInnerShine)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Ambient Side Sparkle Accent */}
      <circle cx="17.8" cy="7.2" r="0.9" fill="#FDE8C4" />
      <circle cx="6.2" cy="7.2" r="0.9" fill="#FDE8C4" />
    </svg>
  );
};
