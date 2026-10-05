/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ArticleCard - High-Fashion Magazine Editorial Article Card
 */

import React from 'react';
import { Article } from '../../types/domain';
import { EditorialImage } from '../common/EditorialImage';
import { Clock, BookOpen, ArrowLeft } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
  isFeatured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSelect, isFeatured = false }) => {
  if (isFeatured) {
    return (
      <article
        onClick={() => onSelect(article)}
        className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#C59B63]/30 bg-[#171614] text-white shadow-xl hover:shadow-2xl transition-all duration-400 cursor-pointer flex flex-col lg:flex-row items-stretch"
      >
        {/* Large Image Column */}
        <div className="lg:w-7/12 relative min-h-[220px] sm:min-h-[300px] overflow-hidden">
          <EditorialImage
            src={article.heroImage}
            alt={article.title}
            aspectRatio="16:10"
            sizes="(max-width: 1024px) 100vw, 700px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#171614] via-transparent to-transparent opacity-90" />
          <span className="absolute top-4 right-4 bg-[#87553B] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
            سرمقاله ویژه مجله
          </span>
        </div>

        {/* Content Column */}
        <div className="lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between space-y-4 relative z-10 bg-[#171614]/90 lg:bg-transparent">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#C59B63] font-semibold">
              <span>{article.category}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTimeMinutes} دقیقه مطالعه</span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#C59B63] transition-colors leading-snug">
              {article.title}
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 line-clamp-3 leading-relaxed">
              {article.summary}
            </p>
          </div>

          <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C59B63]/40 bg-stone-800">
                <EditorialImage src={article.author.avatar} alt={article.author.name} aspectRatio="1:1" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-stone-200">{article.author.name}</div>
                <div className="text-[10px] text-stone-400">{article.author.role}</div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C59B63] group-hover:translate-x-[-4px] transition-transform">
              <span>مطالعه کامل</span>
              <ArrowLeft className="w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(article)}
      className="group bg-[#FFFCF8] rounded-2xl overflow-hidden border border-[#EAE2D5] hover:border-[#C59B63]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#87553B]/10 flex flex-col justify-between cursor-pointer h-full"
    >
      <div>
        <div className="relative overflow-hidden">
          <EditorialImage
            src={article.heroImage}
            alt={article.title}
            aspectRatio="16:10"
            sizes="(max-width: 640px) 320px, (max-width: 1024px) 360px, 400px"
            categoryLabel={article.category}
            className="group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>

        <div className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-[#87553B] font-semibold">
            <span>{article.category}</span>
            <span>·</span>
            <div className="flex items-center gap-1 tabular-nums text-[#59524A]">
              <Clock className="w-3 h-3 text-[#87553B]" />
              <span>{article.readTimeMinutes} دقیقه مطالعه</span>
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[#171614] group-hover:text-[#87553B] transition-colors leading-snug line-clamp-2">
            {article.title}
          </h3>

          <p className="text-xs text-[#59524A] line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-3 border-t border-[#EAE2D5]/50 flex items-center justify-between text-xs text-[#59524A]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#EAE2D5]">
            <EditorialImage src={article.author.avatar} alt={article.author.name} aspectRatio="1:1" />
          </div>
          <span className="font-medium text-[#171614] text-[11px]">{article.author.name}</span>
        </div>

        <span className="text-[#87553B] font-bold text-[11px] group-hover:translate-x-[-2px] transition-transform inline-flex items-center gap-0.5">
          <span>مطالعه</span>
          <ArrowLeft className="w-3 h-3" />
        </span>
      </div>
    </article>
  );
};
