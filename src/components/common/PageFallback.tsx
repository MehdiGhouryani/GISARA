/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PageFallback - Compact & Refined Hair Weaving Spinner
 * Compact size (48px - 56px) for an elegant, non-intrusive loading state.
 */

import React from 'react';

export const PageFallback: React.FC = () => {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center p-6 text-center select-none"
      role="status"
      aria-label="در حال بارگذاری..."
    >
      <style>{`
        @keyframes hairSpinCw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes hairSpinCcw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .hair-strand-cw-1 {
          transform-origin: 50px 50px;
          animation: hairSpinCw 1.8s linear infinite;
          will-change: transform;
        }
        .hair-strand-ccw-1 {
          transform-origin: 50px 50px;
          animation: hairSpinCcw 2.4s linear infinite;
          will-change: transform;
        }
        .hair-strand-cw-2 {
          transform-origin: 50px 50px;
          animation: hairSpinCw 2.0s linear infinite;
          will-change: transform;
        }
        .hair-strand-ccw-2 {
          transform-origin: 50px 50px;
          animation: hairSpinCcw 2.8s linear infinite;
          will-change: transform;
        }
      `}</style>

      <div className="relative flex flex-col items-center justify-center">
        {/* Soft Ambient Warm Glow */}
        <div className="absolute w-16 h-16 bg-[#87553B]/10 rounded-full blur-md animate-pulse" />

        {/* Compact Counter-Rotating Hair Weaving Container */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full overflow-visible">
            <defs>
              {/* Rich Silky Hair Sheen Gradient */}
              <linearGradient id="hairMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A0B05" />
                <stop offset="25%" stopColor="#381F13" />
                <stop offset="50%" stopColor="#87553B" />
                <stop offset="75%" stopColor="#C59B63" />
                <stop offset="90%" stopColor="#F5E3C9" />
                <stop offset="100%" stopColor="#1A0B05" />
              </linearGradient>

              {/* Golden Highlight Gradient */}
              <linearGradient id="goldHighlight" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#87553B" />
                <stop offset="50%" stopColor="#C59B63" />
                <stop offset="100%" stopColor="#F5E3C9" />
              </linearGradient>
            </defs>

            {/* Strand 1: Thick Main Hair Strand (Clockwise) */}
            <path
              className="hair-strand-cw-1"
              d="M50 12 C68 12, 85 28, 85 50 C85 72, 68 88, 50 88 C32 88, 15 72, 15 50 C15 28, 32 12, 50 12"
              stroke="url(#hairMain)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="160 90"
              fill="none"
            />

            {/* Strand 2: Secondary Dark Strand (Counter-Clockwise) */}
            <path
              className="hair-strand-ccw-1"
              d="M50 18 C64 18, 78 32, 78 50 C78 68, 64 82, 50 82 C36 82, 22 68, 22 50 C22 32, 36 18, 50 18"
              stroke="#381F13"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray="125 95"
              fill="none"
            />

            {/* Strand 3: Golden Highlight Fine Strand (Clockwise) */}
            <path
              className="hair-strand-cw-2"
              d="M50 9 C71 9, 89 27, 89 50 C89 73, 71 91, 50 91 C29 91, 11 73, 11 50 C11 27, 29 9, 50 9"
              stroke="url(#goldHighlight)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="105 130"
              opacity="0.9"
              fill="none"
            />

            {/* Strand 4: Inner Deep Strand (Counter-Clockwise) */}
            <path
              className="hair-strand-ccw-2"
              d="M50 26 C60 26, 70 36, 70 50 C70 64, 60 74, 50 74 C40 74, 30 64, 30 50 C30 36, 40 26, 50 26"
              stroke="#1D0E08"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="95 70"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
