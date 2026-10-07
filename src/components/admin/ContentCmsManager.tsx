/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ContentCmsManager - Premium Content Management System (CMS) for Admin Console
 * Manage Styles Journal, Magazine Articles, Step-by-Step Techniques, Discount Coupons, and dynamic FAQs.
 * Re-architected with luxury dark-travertine aesthetics, interactive real-time search,
 * granular category filters, contextual stats, and cohesive dark-theme modal overlays.
 * Follows strictly the GisAra zero-pill, RTL-alignment, and typographic hierarchy guidelines.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleModel,
  Article,
  Technique,
  Coupon,
  AboutContent,
} from '../../types/domain';
import { defaultAboutContent } from '../../data/mockAbout';
import {
  Sparkles,
  BookOpen,
  Layers,
  Tag,
  HelpCircle,
  Plus,
  Trash2,
  Pencil,
  Eye,
  X,
  ToggleLeft,
  ToggleRight,
  Clock,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronLeft,
  BookMarked,
  Info,
  Building2,
  Save,
} from 'lucide-react';
import { EditorialImage } from '../common/EditorialImage';
import { ImageUploader } from '../common/ImageUploader';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ContentCmsManagerProps {
  styles: StyleModel[];
  articles: Article[];
  techniques: Technique[];
  coupons: Coupon[];
  faqs?: any[];
  aboutContent?: AboutContent;
  onAddNewStyle: (style: Omit<StyleModel, 'id' | 'viewsCount' | 'createdAt'>) => void;
  onDeleteStyle: (styleId: string) => void;
  onAddNewArticle: (article: Omit<Article, 'id' | 'publishedAt'>) => void;
  onDeleteArticle: (articleId: string) => void;
  onAddNewTechnique: (technique: Omit<Technique, 'id'>) => void;
  onDeleteTechnique: (techniqueId: string) => void;
  onAddNewCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  onToggleCouponStatus: (couponId: string) => void;
  onDeleteCoupon: (couponId: string) => void;
  onAddNewFaq?: (faq: { category: string; question: string; answer: string }) => void;
  onDeleteFaq?: (faqId: string) => void;
  onUpdateStyle?: (style: StyleModel) => void;
  onUpdateArticle?: (article: Article) => void;
  onUpdateTechnique?: (technique: Technique) => void;
  onUpdateCoupon?: (coupon: Coupon) => void;
  onUpdateFaq?: (faqId: string, faq: { category: string; question: string; answer: string }) => void;
  onUpdateAboutContent?: (content: AboutContent) => void;
  initialSubTab?: 'STYLES' | 'ARTICLES' | 'TECHNIQUES' | 'COUPONS' | 'FAQS' | 'ABOUT';
}

export const ContentCmsManager: React.FC<ContentCmsManagerProps> = ({
  styles,
  articles,
  techniques,
  coupons,
  faqs = [],
  onAddNewStyle,
  onDeleteStyle,
  onAddNewArticle,
  onDeleteArticle,
  onAddNewTechnique,
  onDeleteTechnique,
  onAddNewCoupon,
  onToggleCouponStatus,
  onDeleteCoupon,
  onAddNewFaq,
  onDeleteFaq,
  onUpdateStyle,
  onUpdateArticle,
  onUpdateTechnique,
  onUpdateCoupon,
  onUpdateFaq,
  aboutContent,
  onUpdateAboutContent,
  initialSubTab = 'STYLES',
}) => {
  // One accessible confirmation for every destructive action in this screen (replaces window.confirm).
  const [pendingDelete, setPendingDelete] = useState<{ message: string; run: () => void } | null>(null);
  const [activeTab, setActiveTab] = useState<'STYLES' | 'ARTICLES' | 'TECHNIQUES' | 'COUPONS' | 'FAQS' | 'ABOUT'>(initialSubTab);
  
  // Real-time Search Query state
  const [searchQuery, setSearchQuery] = useState('');

  // About Page CMS state
  const [aboutForm, setAboutForm] = useState<AboutContent>(() => {
    return aboutContent || defaultAboutContent;
  });
  const [aboutSavedAlert, setAboutSavedAlert] = useState(false);

  useEffect(() => {
    if (aboutContent) {
      setAboutForm(aboutContent);
    }
  }, [aboutContent]);

  // Tab-specific filters
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<'ALL' | 'COURSES' | 'SHOP' | 'CERTIFICATES' | 'WORKSHOPS'>('ALL');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<'ALL' | 'آموزش تخصصی' | 'مراقبت از مو' | 'ترندهای فصل' | 'راهنمای خرید'>('ALL');
  const [styleDifficultyFilter, setStyleDifficultyFilter] = useState<'ALL' | 'مبتدی' | 'متوسط' | 'پیشرفته'>('ALL');

  // New Style Modal
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [styleName, setStyleName] = useState('');
  const [styleOccasion, setStyleOccasion] = useState<'عروس' | 'مجلسی' | 'روزمره' | 'نامزدی' | 'فرمالیته'>('عروس');
  const [styleDifficulty, setStyleDifficulty] = useState<'مبتدی' | 'متوسط' | 'پیشرفته'>('متوسط');
  const [styleMinutes, setStyleMinutes] = useState(45);
  const [styleImage, setStyleImage] = useState('/assets/styles/classic-european.jpg');
  const [styleSummary, setStyleSummary] = useState('');
  const [styleDescription, setStyleDescription] = useState('');

  // New Article Modal
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleCategory, setArticleCategory] = useState<'مراقبت از مو' | 'آموزش تخصصی' | 'ترندهای فصل' | 'راهنمای خرید'>('آموزش تخصصی');
  const [articleAuthor, setArticleAuthor] = useState('سارا محمدی');
  const [articleReadTime, setArticleReadTime] = useState(6);
  const [articleHero, setArticleHero] = useState('/assets/styles/romantic-textured.jpg');
  const [articleSummary, setArticleSummary] = useState('');
  const [articleContent, setArticleContent] = useState('');

  // New Technique Modal
  const [isTechniqueModalOpen, setIsTechniqueModalOpen] = useState(false);
  const [techName, setTechName] = useState('');
  const [techDifficulty, setTechDifficulty] = useState<'مبتدی' | 'متوسط' | 'پیشرفته'>('متوسط');
  const [techSummary, setTechSummary] = useState('');
  const [techStep1, setTechStep1] = useState('');
  const [techStep2, setTechStep2] = useState('');
  const [techMistake, setTechMistake] = useState('');

  // New Coupon Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState(15);
  const [couponMaxDiscount, setCouponMaxDiscount] = useState(400000);
  const [couponMinOrder, setCouponMinOrder] = useState(500000);
  const [couponDesc, setCouponDesc] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('۲۹ اسفند ۱۴۰۵');

  // New FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqCategory, setFaqCategory] = useState<'COURSES' | 'SHOP' | 'CERTIFICATES' | 'WORKSHOPS'>('COURSES');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Edit Coupon Modal State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCouponCode, setEditCouponCode] = useState('');
  const [editCouponPercent, setEditCouponPercent] = useState(15);
  const [editCouponMaxDiscount, setEditCouponMaxDiscount] = useState<string>('');
  const [editCouponMinOrder, setEditCouponMinOrder] = useState<string>('');
  const [editCouponDesc, setEditCouponDesc] = useState('');
  const [editCouponExpiry, setEditCouponExpiry] = useState('');
  const [editCouponIsActive, setEditCouponIsActive] = useState(true);

  // Edit FAQ Modal State
  const [editingFaq, setEditingFaq] = useState<{ id: string; category: string; question: string; answer: string } | null>(null);
  const [editFaqCategory, setEditFaqCategory] = useState<'COURSES' | 'SHOP' | 'CERTIFICATES' | 'WORKSHOPS'>('COURSES');
  const [editFaqQuestion, setEditFaqQuestion] = useState('');
  const [editFaqAnswer, setEditFaqAnswer] = useState('');

  // Edit Style Modal State
  const [editingStyle, setEditingStyle] = useState<StyleModel | null>(null);
  const [editStyleName, setEditStyleName] = useState('');
  const [editStyleOccasion, setEditStyleOccasion] = useState<'عروس' | 'مجلسی' | 'روزمره' | 'نامزدی' | 'فرمالیته'>('عروس');
  const [editStyleDifficulty, setEditStyleDifficulty] = useState<'مبتدی' | 'متوسط' | 'پیشرفته'>('متوسط');
  const [editStyleMinutes, setEditStyleMinutes] = useState(45);
  const [editStyleImage, setEditStyleImage] = useState('');
  const [editStyleSummary, setEditStyleSummary] = useState('');
  const [editStyleDescription, setEditStyleDescription] = useState('');

  // Edit Article Modal State
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editArticleTitle, setEditArticleTitle] = useState('');
  const [editArticleCategory, setEditArticleCategory] = useState<'مراقبت از مو' | 'آموزش تخصصی' | 'ترندهای فصل' | 'راهنمای خرید'>('آموزش تخصصی');
  const [editArticleAuthorName, setEditArticleAuthorName] = useState('سارا محمدی');
  const [editArticleAuthorRole, setEditArticleAuthorRole] = useState('مدرس ارشد');
  const [editArticleAuthorAvatar, setEditArticleAuthorAvatar] = useState('/assets/instructors/sara.jpg');
  const [editArticleReadTime, setEditArticleReadTime] = useState(6);
  const [editArticleHero, setEditArticleHero] = useState('');
  const [editArticleSummary, setEditArticleSummary] = useState('');
  const [editArticleContent, setEditArticleContent] = useState('');

  // Edit Technique Modal State (Dynamic Steps)
  const [editingTechnique, setEditingTechnique] = useState<Technique | null>(null);
  const [editTechName, setEditTechName] = useState('');
  const [editTechDifficulty, setEditTechDifficulty] = useState<'مبتدی' | 'متوسط' | 'پیشرفته'>('متوسط');
  const [editTechSummary, setEditTechSummary] = useState('');
  const [editTechSteps, setEditTechSteps] = useState<{ number: number; title: string; description: string; tip?: string }[]>([]);
  const [editTechMistakes, setEditTechMistakes] = useState<string[]>([]);

  // Handle ESC key to dismiss any open modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTechnique) setEditingTechnique(null);
        else if (editingArticle) setEditingArticle(null);
        else if (editingStyle) setEditingStyle(null);
        else if (editingCoupon) setEditingCoupon(null);
        else if (editingFaq) setEditingFaq(null);
        else if (isStyleModalOpen) setIsStyleModalOpen(false);
        else if (isArticleModalOpen) setIsArticleModalOpen(false);
        else if (isTechniqueModalOpen) setIsTechniqueModalOpen(false);
        else if (isCouponModalOpen) setIsCouponModalOpen(false);
        else if (isFaqModalOpen) setIsFaqModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    editingTechnique,
    editingArticle,
    editingStyle,
    editingCoupon,
    editingFaq,
    isStyleModalOpen,
    isArticleModalOpen,
    isTechniqueModalOpen,
    isCouponModalOpen,
    isFaqModalOpen,
  ]);

  // Handlers
  const handleSaveAbout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateAboutContent) {
      onUpdateAboutContent(aboutForm);
    }
    setAboutSavedAlert(true);
    setTimeout(() => {
      setAboutSavedAlert(false);
    }, 4000);
  };

  const handleCreateStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim() || !styleSummary.trim()) return;

    onAddNewStyle({
      name: styleName.trim(),
      slug: styleName.trim().toLowerCase().replace(/\s+/g, '-'),
      primaryImage: styleImage.trim() || '/assets/styles/classic-european.jpg',
      summary: styleSummary.trim(),
      description: styleDescription.trim() || styleSummary.trim(),
      occasion: styleOccasion,
      difficulty: styleDifficulty,
      approxMinutes: Number(styleMinutes) || 45,
      status: 'PUBLISHED',
      techniqueIds: ['tech-1'],
      productIds: ['prod-1', 'prod-2'],
    });

    setIsStyleModalOpen(false);
    setStyleName('');
    setStyleSummary('');
    setStyleDescription('');
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleSummary.trim()) return;

    onAddNewArticle({
      title: articleTitle.trim(),
      slug: articleTitle.trim().toLowerCase().replace(/\s+/g, '-'),
      category: articleCategory,
      summary: articleSummary.trim(),
      content: articleContent.trim() || articleSummary.trim(),
      readTimeMinutes: Number(articleReadTime) || 5,
      author: {
        name: articleAuthor.trim(),
        role: 'مستر و مدرس ارشد شنیون',
        avatar: '/assets/instructors/sara-mohammadi.jpg',
      },
      heroImage: articleHero.trim() || '/assets/styles/romantic-textured.jpg',
    });

    setIsArticleModalOpen(false);
    setArticleTitle('');
    setArticleSummary('');
    setArticleContent('');
  };

  const handleCreateTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim() || !techSummary.trim()) return;

    onAddNewTechnique({
      name: techName.trim(),
      slug: techName.trim().toLowerCase().replace(/\s+/g, '-'),
      summary: techSummary.trim(),
      difficulty: techDifficulty,
      status: 'PUBLISHED',
      steps: [
        {
          number: 1,
          title: 'زیرسازی و تقسیم‌بندی اصولی',
          description: techStep1.trim() || 'تقسیم‌بندی چهارگانه و براشینگ اولیه تارهای مو با کشسانی بالا.',
        },
        {
          number: 2,
          title: 'اجرای فونداسیون و خط‌اندازی',
          description: techStep2.trim() || 'استفاده از شانه دم‌باریک فلزی و تثبیت فرم با اسپری شاین بدون وز.',
        },
      ],
      commonMistakes: [
        techMistake.trim() || 'استفاده بیش‌ازحد از اسپری پیش از بستن خطوط مو.',
      ],
      toolIds: ['prod-1', 'prod-2'],
      styleIds: ['style-1'],
    });

    setIsTechniqueModalOpen(false);
    setTechName('');
    setTechSummary('');
    setTechStep1('');
    setTechStep2('');
    setTechMistake('');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponDesc.trim()) return;

    onAddNewCoupon({
      code: couponCode.trim().toUpperCase(),
      discountPercent: Number(couponPercent) || 10,
      maxDiscountToman: Number(couponMaxDiscount) || undefined,
      minOrderToman: Number(couponMinOrder) || undefined,
      description: couponDesc.trim(),
      isActive: true,
      expiresAtJalali: couponExpiry.trim() || '۲۹ اسفند ۱۴۰۵',
    });

    setIsCouponModalOpen(false);
    setCouponCode('');
    setCouponDesc('');
  };

  const handleCreateFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    if (onAddNewFaq) {
      onAddNewFaq({
        category: faqCategory,
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
      });
    }

    setIsFaqModalOpen(false);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditCouponCode(coupon.code || '');
    setEditCouponPercent(coupon.discountPercent || 15);
    setEditCouponMaxDiscount(coupon.maxDiscountToman !== undefined ? String(coupon.maxDiscountToman) : '');
    setEditCouponMinOrder(coupon.minOrderToman !== undefined ? String(coupon.minOrderToman) : '');
    setEditCouponDesc(coupon.description || '');
    setEditCouponExpiry(coupon.expiresAtJalali || '');
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
        maxDiscountToman: editCouponMaxDiscount ? Number(editCouponMaxDiscount) : undefined,
        minOrderToman: editCouponMinOrder ? Number(editCouponMinOrder) : undefined,
        expiresAtJalali: editCouponExpiry.trim() || undefined,
        description: editCouponDesc.trim(),
        isActive: editCouponIsActive,
      });
    }
    setEditingCoupon(null);
  };

  const handleOpenEditFaq = (faq: { id: string; category: string; question: string; answer: string }) => {
    setEditingFaq(faq);
    setEditFaqCategory((faq.category as any) || 'COURSES');
    setEditFaqQuestion(faq.question || '');
    setEditFaqAnswer(faq.answer || '');
  };

  const handleSaveEditFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq || !editFaqQuestion.trim() || !editFaqAnswer.trim()) return;

    if (onUpdateFaq) {
      onUpdateFaq(editingFaq.id, {
        category: editFaqCategory,
        question: editFaqQuestion.trim(),
        answer: editFaqAnswer.trim(),
      });
    }
    setEditingFaq(null);
  };

  const handleOpenEditStyle = (style: StyleModel) => {
    setEditingStyle(style);
    setEditStyleName(style.name || '');
    setEditStyleOccasion(style.occasion || 'عروس');
    setEditStyleDifficulty(style.difficulty || 'متوسط');
    setEditStyleMinutes(style.approxMinutes || 45);
    setEditStyleImage(style.primaryImage || '');
    setEditStyleSummary(style.summary || '');
    setEditStyleDescription(style.description || style.summary || '');
  };

  const handleSaveEditStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle || !editStyleName.trim() || !editStyleSummary.trim()) return;

    if (onUpdateStyle) {
      onUpdateStyle({
        ...editingStyle,
        name: editStyleName.trim(),
        occasion: editStyleOccasion,
        difficulty: editStyleDifficulty,
        approxMinutes: Number(editStyleMinutes) || 45,
        primaryImage: editStyleImage.trim() || editingStyle.primaryImage || '/assets/styles/classic-european.jpg',
        summary: editStyleSummary.trim(),
        description: editStyleDescription.trim() || editStyleSummary.trim(),
      });
    }
    setEditingStyle(null);
  };

  const handleOpenEditArticle = (art: Article) => {
    setEditingArticle(art);
    setEditArticleTitle(art.title || '');
    setEditArticleCategory(art.category || 'آموزش تخصصی');
    setEditArticleAuthorName(art.author?.name || 'سارا محمدی');
    setEditArticleAuthorRole(art.author?.role || 'مدرس ارشد');
    setEditArticleAuthorAvatar(art.author?.avatar || '/assets/instructors/sara.jpg');
    setEditArticleReadTime(art.readTimeMinutes || 6);
    setEditArticleHero(art.heroImage || '');
    setEditArticleSummary(art.summary || '');
    setEditArticleContent(art.content || art.summary || '');
  };

  const handleSaveEditArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editArticleTitle.trim() || !editArticleSummary.trim()) return;

    if (onUpdateArticle) {
      onUpdateArticle({
        ...editingArticle,
        title: editArticleTitle.trim(),
        category: editArticleCategory,
        author: {
          name: editArticleAuthorName.trim() || editingArticle.author?.name || 'مدرس آکادمی',
          role: editArticleAuthorRole.trim() || editingArticle.author?.role || 'مدرس ارشد شنیون',
          avatar: editArticleAuthorAvatar.trim() || editingArticle.author?.avatar || '/assets/instructors/sara.jpg',
        },
        readTimeMinutes: Number(editArticleReadTime) || 5,
        heroImage: editArticleHero.trim() || editingArticle.heroImage || '/assets/styles/romantic-textured.jpg',
        summary: editArticleSummary.trim(),
        content: editArticleContent.trim() || editArticleSummary.trim(),
      });
    }
    setEditingArticle(null);
  };

  const handleOpenEditTechnique = (tech: Technique) => {
    setEditingTechnique(tech);
    setEditTechName(tech.name || '');
    setEditTechDifficulty(tech.difficulty || 'متوسط');
    setEditTechSummary(tech.summary || '');
    setEditTechSteps(
      tech.steps && tech.steps.length > 0
        ? tech.steps.map((st, i) => ({ ...st, number: i + 1 }))
        : [
            { number: 1, title: 'گام اول', description: '' },
            { number: 2, title: 'گام دوم', description: '' },
          ]
    );
    setEditTechMistakes(tech.commonMistakes && tech.commonMistakes.length > 0 ? [...tech.commonMistakes] : ['']);
  };

  const handleAddStepToEdit = () => {
    setEditTechSteps((prev) => [
      ...prev,
      {
        number: prev.length + 1,
        title: `گام ${prev.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleRemoveStepFromEdit = (index: number) => {
    if (editTechSteps.length <= 1) return;
    setEditTechSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((st, i) => ({ ...st, number: i + 1 }))
    );
  };

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    setEditTechSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddMistakeToEdit = () => {
    setEditTechMistakes((prev) => [...prev, '']);
  };

  const handleRemoveMistakeFromEdit = (index: number) => {
    setEditTechMistakes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMistakeChange = (index: number, value: string) => {
    setEditTechMistakes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSaveEditTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTechnique || !editTechName.trim() || !editTechSummary.trim()) return;

    const cleanedSteps = editTechSteps
      .filter((s) => s.title.trim() || s.description.trim())
      .map((s, i) => ({
        number: i + 1,
        title: s.title.trim() || `مرحله ${i + 1}`,
        description: s.description.trim() || 'اجرای مرحله طبق دستورالعمل آموزشی.',
      }));

    const cleanedMistakes = editTechMistakes.filter((m) => m.trim());

    if (onUpdateTechnique) {
      onUpdateTechnique({
        ...editingTechnique,
        name: editTechName.trim(),
        difficulty: editTechDifficulty,
        summary: editTechSummary.trim(),
        steps: cleanedSteps.length > 0 ? cleanedSteps : editingTechnique.steps,
        commonMistakes: cleanedMistakes,
      });
    }
    setEditingTechnique(null);
  };

  // Reset search when active tab changes
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Filtered lists computed via useMemo to maximize search speed
  const filteredStyles = useMemo(() => {
    return styles.filter((s) => {
      const matchesSearch = searchQuery
        ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.occasion.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesDifficulty = styleDifficultyFilter === 'ALL' ? true : s.difficulty === styleDifficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [styles, searchQuery, styleDifficultyFilter]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch = searchQuery
        ? a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = articleCategoryFilter === 'ALL' ? true : a.category === articleCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, articleCategoryFilter]);

  const filteredTechniques = useMemo(() => {
    return techniques.filter((t) => {
      return searchQuery
        ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          t.summary.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
    });
  }, [techniques, searchQuery]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      return searchQuery
        ? c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
    });
  }, [coupons, searchQuery]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchesSearch = searchQuery
        ? f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          f.answer.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = faqCategoryFilter === 'ALL' ? true : f.category === faqCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, faqCategoryFilter]);

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* CMS Top Bar: Unified Operations Layout */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4 p-3.5 sm:p-5 bg-[#141211] rounded-2xl border border-[#2e2824] shadow-lg">
        
        {/* Navigation Tabs List - Premium Segmented Style with Native Touch Scrolling */}
        <div className="flex items-center gap-1.5 bg-[#0a0908] p-1.5 rounded-xl border border-[#201c1a] overflow-x-auto scrollbar-none shrink-0 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => handleTabChange('STYLES')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === 'STYLES'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>مدل‌های شنیون</span>
            <span className="text-xs opacity-70 tabular-nums">({styles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('ARTICLES')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === 'ARTICLES'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>مجله و بلاگ</span>
            <span className="text-xs opacity-70 tabular-nums">({articles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('TECHNIQUES')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === 'TECHNIQUES'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>تکنیک‌ها</span>
            <span className="text-xs opacity-70 tabular-nums">({techniques.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('COUPONS')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === 'COUPONS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>کدهای تخفیف</span>
            <span className="text-xs opacity-70 tabular-nums">({coupons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('FAQS')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === 'FAQS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>سوالات متداول</span>
            <span className="text-xs opacity-70 tabular-nums">({faqs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('ABOUT')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              activeTab === 'ABOUT'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>صفحه درباره ما</span>
          </button>
        </div>

        {/* Action Button & Instant Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          
          {/* Universal Search Bar */}
          <div className="relative min-w-0 sm:min-w-[220px] flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در این بخش..."
              className="w-full pl-3 pr-9 py-2.5 bg-[#0a0908] border border-[#26211e] rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all text-right font-sans"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-stone-500" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-3.5 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dynamic Action Buttons */}
          <div className="shrink-0 flex w-full sm:w-auto">
            {activeTab === 'STYLES' && (
              <button
                type="button"
                onClick={() => setIsStyleModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow-lg hover:shadow-amber-900/10 active:scale-[0.98] min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>مدل جدید شینیون</span>
              </button>
            )}

            {activeTab === 'ARTICLES' && (
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow-lg hover:shadow-amber-900/10 active:scale-[0.98] min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>انتشار مقاله جدید</span>
              </button>
            )}

            {activeTab === 'TECHNIQUES' && (
              <button
                type="button"
                onClick={() => setIsTechniqueModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow-lg hover:shadow-amber-900/10 active:scale-[0.98] min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>تکنیک آموزشی جدید</span>
              </button>
            )}

            {activeTab === 'COUPONS' && (
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-900/10 active:scale-[0.98] min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>کد تخفیف جدید</span>
              </button>
            )}

            {activeTab === 'FAQS' && (
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-900/10 active:scale-[0.98] min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>سوال متداول جدید</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. STYLES TAB CONTENT */}
      {activeTab === 'STYLES' && (
        <div className="space-y-5">
          {/* Quick filter by difficulty */}
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="font-semibold text-stone-300">سطح دشواری:</span>
            <div className="flex items-center gap-1 bg-[#141211] p-1 rounded-lg border border-[#26211e]">
              {(['ALL', 'مبتدی', 'متوسط', 'پیشرفته'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setStyleDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded-md transition-all text-xs ${
                    styleDifficultyFilter === diff
                      ? 'bg-amber-600/20 text-[#e2b87f] font-bold border border-amber-600/30'
                      : 'hover:text-stone-200'
                  }`}
                >
                  {diff === 'ALL' ? 'همه سطوح' : diff}
                </button>
              ))}
            </div>
          </div>

          {filteredStyles.length === 0 ? (
            <div className="p-12 text-center text-stone-500 bg-[#141211] rounded-2xl border border-[#2e2824] space-y-2">
              <Sparkles className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs">هیچ مدلی با مشخصات جستجویافته پیدا نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStyles.map((style) => (
                <div
                  key={style.id}
                  className="bg-[#141211] rounded-2xl border border-[#26211e] overflow-hidden flex flex-col justify-between shadow-md hover:border-amber-600/30 transition-all group duration-200"
                >
                  <div>
                    <div className="h-44 relative bg-stone-900 overflow-hidden">
                      <EditorialImage src={style.primaryImage} alt={style.name} aspectRatio="16:9" />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-black/80 text-[#e2b87f] text-xs font-bold rounded border border-stone-800">
                        {style.occasion}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/85 text-stone-200 text-xs font-bold rounded flex items-center gap-1 border border-stone-850">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="tabular-nums">{style.approxMinutes} دقیقه</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition-colors">
                          {style.name}
                        </h4>
                        {/* unboxed metadata for level */}
                        <span className="text-xs text-amber-400 font-semibold">
                          {style.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                        {style.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-3 border-t border-[#26211e] flex items-center justify-between text-xs text-stone-500 mt-2">
                    <div className="flex items-center gap-1.5 text-xs tabular-nums text-stone-400">
                      <Eye className="w-3.5 h-3.5 text-amber-500/80" />
                      <span>{style.viewsCount.toLocaleString('fa-IR')} بازدید</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStyle(style)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#2e2824] bg-[#1a1816] hover:bg-amber-600/10 hover:border-amber-600/30 hover:text-[#e2b87f] text-stone-300 transition-colors cursor-pointer flex items-center gap-1"
                        title="ویرایش مدل شنیون"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#e2b87f]" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPendingDelete({ message: `آیا از حذف مدل «${style.name}» اطمینان دارید؟`, run: () => { onDeleteStyle(style.id); } });
                        }}
                        className="p-1.5 text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف این مدل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ARTICLES TAB CONTENT */}
      {activeTab === 'ARTICLES' && (
        <div className="space-y-5">
          {/* Granular category filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="font-semibold text-stone-300">دسته‌بندی موضوعی:</span>
            <div className="flex flex-wrap items-center gap-1 bg-[#141211] p-1 rounded-lg border border-[#26211e]">
              {(['ALL', 'آموزش تخصصی', 'مراقبت از مو', 'ترندهای فصل', 'راهنمای خرید'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setArticleCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-md transition-all text-xs ${
                    articleCategoryFilter === cat
                      ? 'bg-amber-600/20 text-[#e2b87f] font-bold border border-amber-600/30'
                      : 'hover:text-stone-200'
                  }`}
                >
                  {cat === 'ALL' ? 'همه دسته‌ها' : cat}
                </button>
              ))}
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center text-stone-500 bg-[#141211] rounded-2xl border border-[#2e2824] space-y-2">
              <BookOpen className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs">هیچ مقاله‌ای با مشخصات جستجویافته پیدا نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="bg-[#141211] rounded-2xl border border-[#26211e] p-4 flex flex-col justify-between shadow-md hover:border-amber-600/30 transition-all group duration-200"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-[#26211e] bg-stone-900">
                      <EditorialImage src={art.heroImage} alt={art.title} aspectRatio="1:1" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        {/* zero-pill metadata */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-semibold">{art.category}</span>
                          <span className="text-stone-600">·</span>
                          <span>{art.readTimeMinutes} دقیقه مطالعه</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition-colors line-clamp-1">{art.title}</h4>
                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{art.summary}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#26211e]/70 flex items-center justify-between text-xs text-stone-400 mt-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={art.author.avatar}
                        alt={art.author.name}
                        className="w-5 h-5 rounded-full object-cover border border-[#2e2824]"
                      />
                      <span className="text-xs text-stone-300 font-bold">{art.author.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditArticle(art)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#2e2824] bg-[#1a1816] hover:bg-amber-600/10 hover:border-amber-600/30 hover:text-[#e2b87f] text-stone-300 transition-colors cursor-pointer flex items-center gap-1"
                        title="ویرایش مقاله"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#e2b87f]" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPendingDelete({ message: `آیا از حذف مقاله «${art.title}» اطمینان دارید؟`, run: () => { onDeleteArticle(art.id); } });
                        }}
                        className="p-1.5 text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف این مقاله"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TECHNIQUES TAB CONTENT */}
      {activeTab === 'TECHNIQUES' && (
        <div className="space-y-4">
          {filteredTechniques.length === 0 ? (
            <div className="p-12 text-center text-stone-500 bg-[#141211] rounded-2xl border border-[#2e2824] space-y-2">
              <Layers className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs">هیچ تکنیکی با مشخصات جستجویافته پیدا نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredTechniques.map((tech) => (
                <div
                  key={tech.id}
                  className="bg-[#141211] rounded-2xl border border-[#26211e] p-5 space-y-4 shadow-md hover:border-amber-600/30 transition-all group duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Zero pill metadata */}
                      <span className="text-xs text-amber-500 font-bold tracking-wide">
                        تکنیک استاندارد آکادمی
                      </span>
                      <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition-colors mt-1">{tech.name}</h4>
                    </div>
                    <span className="text-xs text-[#e2b87f]">
                      سطح: {tech.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed pr-1">{tech.summary}</p>

                  <div className="space-y-2 pt-3 border-t border-[#26211e]/70 text-xs">
                    <div className="font-bold text-stone-300 flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5 text-amber-500/80" />
                      <span>مراحل اصلی تکنیک ({tech.steps.length} مرحله):</span>
                    </div>
                    <div className="space-y-1.5 pr-5">
                      {tech.steps.map((st) => (
                        <div key={st.number} className="text-stone-400 flex items-start gap-2">
                          <span className="font-mono text-amber-500 font-bold">{st.number}.</span>
                          <span className="text-stone-300">{st.title}: <span className="text-stone-400 font-normal">{st.description}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tech.commonMistakes && tech.commonMistakes.length > 0 && (
                    <div className="p-3 bg-amber-950/10 border border-amber-900/10 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-[#e2b87f] flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-500/80" />
                        <span>اشتباه رایج هنرجویان:</span>
                      </div>
                      <p className="text-stone-400 leading-relaxed pr-5">{tech.commonMistakes[0]}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#26211e]/60 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-mono">
                      کد تکنیک: {tech.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTechnique(tech)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#2e2824] bg-[#1a1816] hover:bg-amber-600/10 hover:border-amber-600/30 hover:text-[#e2b87f] text-stone-300 transition-colors cursor-pointer flex items-center gap-1"
                        title="ویرایش تکنیک"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#e2b87f]" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPendingDelete({ message: `آیا از حذف تکنیک «${tech.name}» اطمینان دارید؟`, run: () => { onDeleteTechnique(tech.id); } });
                        }}
                        className="p-1.5 text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف این تکنیک"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. COUPONS TAB CONTENT */}
      {activeTab === 'COUPONS' && (
        <div className="bg-[#141211] rounded-2xl border border-[#26211e] overflow-hidden shadow-lg">
          <div className="p-5 bg-[#0a0908] border-b border-[#26211e] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-200">کدهای تخفیف تعریف‌شده در سیستم</h4>
              <p className="text-xs text-stone-500 mt-1">
                کدهای تخفیف به صورت خودکار در سیستم فعال شده و در درگاه سفارشات کلاینت قابل استفاده هستند.
              </p>
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="p-12 text-center text-stone-500 bg-stone-900/10">
              <p className="text-xs">هیچ کد تخفیفی با این نام پیدا نشد.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#26211e] text-xs text-stone-300">
              {filteredCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-900/20 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-[#e2b87f] bg-stone-900 border border-[#2e2824] px-2.5 py-1 rounded-lg tracking-wider">
                        {coupon.code}
                      </span>
                      {/* unboxed metadata separators */}
                      <span className="text-stone-500">·</span>
                      <span className="text-xs text-emerald-400 font-bold">
                        {coupon.discountPercent}٪ تخفیف
                      </span>
                      <span className="text-stone-500">·</span>
                      <span className={`text-xs font-bold ${coupon.isActive ? 'text-emerald-400' : 'text-stone-500'}`}>
                        {coupon.isActive ? 'وضعیت: فعال' : 'وضعیت: غیرفعال'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400">{coupon.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-0.5">
                      {coupon.maxDiscountToman && (
                        <span>سقف تخفیف: {coupon.maxDiscountToman.toLocaleString('fa-IR')} تومان</span>
                      )}
                      {coupon.maxDiscountToman && <span className="text-stone-700">|</span>}
                      {coupon.minOrderToman && (
                        <span>حداقل سفارش: {coupon.minOrderToman.toLocaleString('fa-IR')} تومان</span>
                      )}
                      {coupon.minOrderToman && <span className="text-stone-700">|</span>}
                      {coupon.expiresAtJalali && (
                        <span>تاریخ انقضا: {coupon.expiresAtJalali}</span>
                      )}
                      <span className="text-stone-700">|</span>
                      <span className="tabular-nums">تعداد استفاده: {coupon.usageCount} بار</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCoupon(coupon)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-[#2e2824] bg-[#1a1816] hover:bg-amber-600/10 hover:border-amber-600/30 hover:text-[#e2b87f] text-stone-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="ویرایش کد تخفیف"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#e2b87f]" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleCouponStatus(coupon.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#2e2824] bg-[#1a1816] hover:bg-stone-800 text-stone-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {coupon.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-500" />
                          <span>غیرفعال‌سازی</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-stone-500" />
                          <span>فعال‌سازی</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPendingDelete({ message: `آیا از حذف کد تخفیف «${coupon.code}» مطمئن هستید؟`, run: () => { onDeleteCoupon(coupon.id); } });
                      }}
                      className="p-1.5 text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="حذف کد تخفیف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. FAQS TAB CONTENT - Dynamic Help Center Management */}
      {activeTab === 'FAQS' && (
        <div className="space-y-4">
          
          {/* Grand category switcher for FAQ */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="font-semibold text-stone-300">دسته‌بندی پرسش‌ها:</span>
            <div className="flex flex-wrap items-center gap-1 bg-[#141211] p-1 rounded-lg border border-[#26211e]">
              {(['ALL', 'COURSES', 'SHOP', 'CERTIFICATES', 'WORKSHOPS'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFaqCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-md transition-all text-xs ${
                    faqCategoryFilter === cat
                      ? 'bg-amber-600/20 text-[#e2b87f] font-bold border border-amber-600/30'
                      : 'hover:text-stone-200'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'همه دسته‌ها'
                    : cat === 'COURSES'
                    ? 'دوره‌های آنلاین'
                    : cat === 'SHOP'
                    ? 'ابزار و ارسال'
                    : cat === 'CERTIFICATES'
                    ? 'گواهینامه‌ها'
                    : 'ورکشاپ‌های حضوری'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#141211] rounded-2xl border border-[#26211e] overflow-hidden shadow-lg">
            <div className="p-5 bg-[#0a0908] border-b border-[#26211e] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-200">لیست پرسش‌ها و پاسخ‌های وب‌سایت</h4>
                <p className="text-xs text-stone-500 mt-1">
                  تغییرات شما در این لیست بلافاصله در بخش سوالات متداول صفحه کلاینت وب‌سایت اعمال می‌شود.
                </p>
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="p-12 text-center text-stone-500 bg-stone-900/10">
                <HelpCircle className="w-8 h-8 text-stone-600 mx-auto mb-1" />
                <p className="text-xs">هیچ پرسشی در این دسته‌بندی یافت نشد.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#26211e] text-xs text-stone-300">
                {filteredFaqs.map((faq, idx) => (
                  <div
                    key={faq.id || idx}
                    className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-stone-900/20 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#e2b87f] font-semibold">
                          {faq.category === 'COURSES'
                            ? 'دوره‌های آنلاین'
                            : faq.category === 'SHOP'
                            ? 'ابزار و ارسال'
                            : faq.category === 'CERTIFICATES'
                            ? 'گواهینامه'
                            : 'ورکشاپ‌های حضوری'}
                        </span>
                        <span className="text-stone-600">·</span>
                        <h5 className="font-bold text-stone-200 text-xs">{faq.question}</h5>
                      </div>

                      <p className="text-xs text-stone-400 leading-relaxed max-w-3xl pr-1">{faq.answer}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditFaq(faq)}
                        className="p-1.5 px-2.5 text-stone-300 hover:text-[#e2b87f] hover:bg-amber-600/10 border border-[#2e2824] bg-[#1a1816] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                        title="ویرایش پرسش و پاسخ"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#e2b87f]" />
                        <span className="text-xs font-semibold">ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPendingDelete({ message: `آیا از حذف این پرسش اطمینان دارید؟`, run: () => { if (onDeleteFaq) onDeleteFaq(faq.id); } });
                        }}
                        className="p-2 text-stone-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف این پرسش"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 6: ABOUT US PAGE CMS EDITOR                                     */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'ABOUT' && (
        <div className="bg-[#12100f] rounded-2xl border border-[#26211e] p-6 lg:p-8 space-y-8 text-right font-sans">
          {/* Header & Save Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211e] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#e2b87f]">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>سامانه مدیریت محتوای هویت و آکادمی</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                ویرایش و شخصی‌سازی صفحه «درباره ما»
              </h2>
              <p className="text-xs text-stone-400">
                تغییرات شما به صورت آنی در صفحه اختصاصی درباره ما (/about) و متاداده‌های هویتی موتورهای جستجو اعمال می‌شود.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAbout}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-950/20 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات درباره ما</span>
            </button>
          </div>

          {aboutSavedAlert && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">تغییرات صفحه درباره ما با موفقیت ذخیره شد و در فرانت‌اند منتشر گردید.</span>
            </div>
          )}

          <form onSubmit={handleSaveAbout} className="space-y-8 text-xs text-stone-300">
            {/* Section 1: Main Headings */}
            <div className="space-y-4 p-5 bg-[#171413] rounded-xl border border-[#2e2824]">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>۱. عناوین و تصویر کاور هیرو</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">عنوان اصلی صفحه درباره ما:</label>
                  <input
                    type="text"
                    value={aboutForm.title}
                    onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">زیرعنوان و معرفی اجمالی:</label>
                  <textarea
                    rows={2}
                    value={aboutForm.subtitle}
                    onChange={(e) => setAboutForm({ ...aboutForm, subtitle: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">تصویر کاور هیرو (URL یا بارگذاری):</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={aboutForm.heroImage}
                      onChange={(e) => setAboutForm({ ...aboutForm, heroImage: e.target.value })}
                      required
                      className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono text-left text-xs"
                    />
                    <ImageUploader
                      value={aboutForm.heroImage}
                      onChange={(url: string) => setAboutForm({ ...aboutForm, heroImage: url })}
                      label="بارگذاری تصویر جدید بنر هیرو"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Story & Mission */}
            <div className="space-y-4 p-5 bg-[#171413] rounded-xl border border-[#2e2824]">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>۲. داستان آکادمی و مأموریت</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">داستان شکل‌گیری و تاریخچه آکادمی (پاراگراف‌ها با اینتر جدا شوند):</label>
                  <textarea
                    rows={6}
                    value={aboutForm.story}
                    onChange={(e) => setAboutForm({ ...aboutForm, story: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مأموریت و چشم‌انداز کلیدی:</label>
                  <textarea
                    rows={3}
                    value={aboutForm.mission}
                    onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Founder & Leadership */}
            <div className="space-y-4 p-5 bg-[#171413] rounded-xl border border-[#2e2824]">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                <span>۳. مشخصات مؤسس و رهبری آکادمی</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">نام مؤسس:</label>
                  <input
                    type="text"
                    value={aboutForm.founderName}
                    onChange={(e) => setAboutForm({ ...aboutForm, founderName: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سمت و عنوان تخصصی:</label>
                  <input
                    type="text"
                    value={aboutForm.founderRole}
                    onChange={(e) => setAboutForm({ ...aboutForm, founderRole: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-300 mb-1.5">بیوگرافی و افتخارات بین‌المللی مؤسس:</label>
                  <textarea
                    rows={3}
                    value={aboutForm.founderBio}
                    onChange={(e) => setAboutForm({ ...aboutForm, founderBio: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-300 mb-1.5">تصویر پرتره مؤسس (URL یا آپلود):</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={aboutForm.founderImage}
                      onChange={(e) => setAboutForm({ ...aboutForm, founderImage: e.target.value })}
                      required
                      className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono text-left text-xs"
                    />
                    <ImageUploader
                      value={aboutForm.founderImage}
                      onChange={(url: string) => setAboutForm({ ...aboutForm, founderImage: url })}
                      label="بارگذاری پرتره مؤسس"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Headquarters & Contact */}
            <div className="space-y-4 p-5 bg-[#171413] rounded-xl border border-[#2e2824]">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>۴. نشانی شعبه مرکزی و اطلاعات تماس رسمی</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-300 mb-1.5">آدرس کامل شعبه مرکزی:</label>
                  <input
                    type="text"
                    value={aboutForm.headquartersAddress}
                    onChange={(e) => setAboutForm({ ...aboutForm, headquartersAddress: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">تلفن پشتیبانی و مشاوره:</label>
                  <input
                    type="text"
                    value={aboutForm.phone}
                    onChange={(e) => setAboutForm({ ...aboutForm, phone: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">ایمیل رسمی پشتیبانی:</label>
                  <input
                    type="email"
                    value={aboutForm.email}
                    onChange={(e) => setAboutForm({ ...aboutForm, email: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-300 mb-1.5">ساعات کاری و پذیرش هنرجویان:</label>
                  <input
                    type="text"
                    value={aboutForm.workingHours}
                    onChange={(e) => setAboutForm({ ...aboutForm, workingHours: e.target.value })}
                    required
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Key Metrics */}
            <div className="space-y-4 p-5 bg-[#171413] rounded-xl border border-[#2e2824]">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                <span>۵. آمار و سنجه‌های عملکردی آکادمی</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">تعداد هنرجویان:</label>
                  <input
                    type="number"
                    value={aboutForm.stats.studentsCount}
                    onChange={(e) =>
                      setAboutForm({
                        ...aboutForm,
                        stats: { ...aboutForm.stats, studentsCount: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سابقه به سال:</label>
                  <input
                    type="number"
                    value={aboutForm.stats.yearsExperience}
                    onChange={(e) =>
                      setAboutForm({
                        ...aboutForm,
                        stats: { ...aboutForm.stats, yearsExperience: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">استان‌های تحت پوشش:</label>
                  <input
                    type="number"
                    value={aboutForm.stats.citiesCovered}
                    onChange={(e) =>
                      setAboutForm({
                        ...aboutForm,
                        stats: { ...aboutForm.stats, citiesCovered: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">درصد رضایت:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={aboutForm.stats.satisfactionRate}
                    onChange={(e) =>
                      setAboutForm({
                        ...aboutForm,
                        stats: { ...aboutForm.stats, satisfactionRate: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 bg-[#100e0d] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Floating Save Button */}
            <div className="pt-4 border-t border-[#26211e] flex items-center justify-between">
              <span className="text-xs text-stone-400">
                ذخیره تغییرات فوراً در حافظه پایدار مرورگر و پایگاه داده محتوا همگام‌سازی می‌شود.
              </span>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره نهایی تغییرات درباره ما</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: ADD NEW STYLE (Sleek Dark Theme) */}
      {/* -------------------------------------------------------------------- */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e2b87f]" />
                <span>افزودن مدل جدید به ژورنال شنیون</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsStyleModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStyle} className="space-y-4 text-xs text-stone-300">
              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">نام مدل شینیون:</label>
                <input
                  type="text"
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  placeholder="مثال: شینیون روسی بافت‌دار VIP"
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مناسبت / استایل:</label>
                  <select
                    value={styleOccasion}
                    onChange={(e) => setStyleOccasion(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="عروس">عروس</option>
                    <option value="مجلسی">مجلسی</option>
                    <option value="نامزدی">نامزدی</option>
                    <option value="فرمالیته">فرمالیته</option>
                    <option value="روزمره">روزمره</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سطح دشواری:</label>
                  <select
                    value={styleDifficulty}
                    onChange={(e) => setStyleDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مدت زمان اجرا (دقیقه):</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={styleMinutes}
                    onChange={(e) => setStyleMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">آدرس تصویر مدل:</label>
                  <input
                    type="text"
                    value={styleImage}
                    onChange={(e) => setStyleImage(e.target.value)}
                    placeholder="/assets/styles/..."
                    dir="ltr"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">خلاصه کوتاه معرفی مدل:</label>
                <textarea
                  rows={2}
                  value={styleSummary}
                  onChange={(e) => setStyleSummary(e.target.value)}
                  placeholder="توضیح کوتاه در مورد بافت و فرم مدل در یک یا دو جمله..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                />
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStyleModalOpen(false)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  انتشار در ژورنال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW ARTICLE (Sleek Dark Theme) */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#e2b87f]" />
                <span>انتشار مقاله جدید در مجله گیس‌آرا</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 text-xs text-stone-300">
              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">تیتر اصلی مقاله:</label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="مثال: ۱۰ راز ماندگاری شینیون عروس در هوای مرطوب"
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">دسته‌بندی موضوعی:</label>
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="آموزش تخصصی">آموزش تخصصی</option>
                    <option value="مراقبت از مو">مراقبت از مو</option>
                    <option value="ترندهای فصل">ترندهای فصل</option>
                    <option value="راهنمای خرید">راهنمای خرید</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">نویسنده / مدرس:</label>
                  <input
                    type="text"
                    value={articleAuthor}
                    onChange={(e) => setArticleAuthor(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مدت زمان مطالعه (دقیقه):</label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={articleReadTime}
                    onChange={(e) => setArticleReadTime(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">تصویر کاور مقاله (آدرس):</label>
                  <input
                    type="text"
                    value={articleHero}
                    onChange={(e) => setArticleHero(e.target.value)}
                    placeholder="/assets/styles/..."
                    dir="ltr"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">خلاصه مقاله (کپشن):</label>
                <textarea
                  rows={2}
                  value={articleSummary}
                  onChange={(e) => setArticleSummary(e.target.value)}
                  placeholder="موضوع مقاله را در دو جمله خلاصه کنید..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  انتشار مقاله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW TECHNIQUE (Sleek Dark Theme) */}
      {isTechniqueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#e2b87f]" />
                <span>ثبت تکنیک آموزشی گام‌به‌گام جدید</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTechniqueModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTechnique} className="space-y-4 text-xs text-stone-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">نام تکنیک:</label>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    placeholder="مثال: تکنیک فوق‌تخصصی صیقل تارهای وزدار"
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">سطح سختی اجرای تکنیک:</label>
                  <select
                    value={techDifficulty}
                    onChange={(e) => setTechDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="مبتدی">مبتدی (آموزش پایه)</option>
                    <option value="متوسط">متوسط (سالن‌کار)</option>
                    <option value="پیشرفته">پیشرفته (VIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">شرح کوتاه خلاصه تکنیک:</label>
                <textarea
                  rows={2}
                  value={techSummary}
                  onChange={(e) => setTechSummary(e.target.value)}
                  placeholder="این تکنیک چه مشکلی را در شینیون حل می‌کند..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">گام اول اجرا (زیرسازی):</label>
                <input
                  type="text"
                  value={techStep1}
                  onChange={(e) => setTechStep1(e.target.value)}
                  placeholder="مراحل براشینگ، پوش‌دهی یا حجم‌دهی پایه..."
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">گام دوم اجرا (فرم‌دهی نهایی):</label>
                <input
                  type="text"
                  value={techStep2}
                  onChange={(e) => setTechStep2(e.target.value)}
                  placeholder="نحوه وزگیری، خط‌اندازی یا شانه کردن خطوط..."
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">اشتباه رایج شینیون‌کاران:</label>
                <input
                  type="text"
                  value={techMistake}
                  onChange={(e) => setTechMistake(e.target.value)}
                  placeholder="مثال: استفاده مکرر از واکس یا تافت سنگین پیش از خط‌اندازی..."
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTechniqueModalOpen(false)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  ثبت تکنیک
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW COUPON (Sleek Dark Theme) */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>تعریف کد تخفیف جدید برای وب‌سایت</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs text-stone-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">کد تخفیف (انگلیسی):</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="مثال: NEWYEAR2026"
                    required
                    dir="ltr"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono tracking-wider text-left"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">درصد تخفیف (٪):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={couponPercent}
                    onChange={(e) => setCouponPercent(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سقف تخفیف (تومان):</label>
                  <input
                    type="number"
                    value={couponMaxDiscount}
                    onChange={(e) => setCouponMaxDiscount(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">حداقل رقم فاکتور خرید (تومان):</label>
                  <input
                    type="number"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">تاریخ انقضای جلالی:</label>
                  <input
                    type="text"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    placeholder="مثال: ۲۹ اسفند ۱۴۰۵"
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">توضیحات جشنواره تخفیف:</label>
                  <input
                    type="text"
                    value={couponDesc}
                    onChange={(e) => setCouponDesc(e.target.value)}
                    placeholder="مثال: تخفیف ویژه نوروز"
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  ثبت تخفیف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD NEW FAQ (Sleek Dark Theme) */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                <span>ثبت سوال متداول (FAQ) جدید برای وب‌سایت</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFaq} className="space-y-4 text-xs text-stone-300">
              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">دسته‌بندی موضوعی سوال:</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                >
                  <option value="COURSES">آموزش و دوره‌های آنلاین</option>
                  <option value="SHOP">فروشگاه و ارسال ابزار فیزیکی</option>
                  <option value="CERTIFICATES">گواهینامه‌ها</option>
                  <option value="WORKSHOPS">کارگاه‌های حضوری و استانی</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">متن سوال (Question):</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="مثال: روش پشتیبانی دوره‌ها به چه صورت است؟"
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">پاسخ تشریحی سوال (Answer):</label>
                <textarea
                  rows={4}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="پاسخ کامل، شفاف و دقیق را در این کادر بنویسید..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  ثبت و نمایش در سایت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT COUPON (Luxury Dark Theme) */}
      {editingCoupon && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCoupon(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#e2b87f]" />
                <span>ویرایش کد تخفیف «{editingCoupon.code}»</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCoupon} className="space-y-4 text-xs text-stone-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">کد تخفیف (انگلیسی):</label>
                  <input
                    type="text"
                    value={editCouponCode}
                    onChange={(e) => setEditCouponCode(e.target.value)}
                    required
                    dir="ltr"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono tracking-wider text-left"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">درصد تخفیف (٪):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editCouponPercent}
                    onChange={(e) => setEditCouponPercent(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سقف تخفیف (تومان - اختیاری):</label>
                  <input
                    type="number"
                    value={editCouponMaxDiscount}
                    onChange={(e) => setEditCouponMaxDiscount(e.target.value)}
                    placeholder="بدون سقف"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">حداقل خرید (تومان - اختیاری):</label>
                  <input
                    type="number"
                    value={editCouponMinOrder}
                    onChange={(e) => setEditCouponMinOrder(e.target.value)}
                    placeholder="بدون حداقل"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">تاریخ انقضای جلالی:</label>
                  <input
                    type="text"
                    value={editCouponExpiry}
                    onChange={(e) => setEditCouponExpiry(e.target.value)}
                    placeholder="مثال: ۲۹ اسفند ۱۴۰۵"
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">توضیحات و عنوان جشنواره:</label>
                  <input
                    type="text"
                    value={editCouponDesc}
                    onChange={(e) => setEditCouponDesc(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#171412] rounded-xl border border-[#26211e] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-200">وضعیت فعال بودن کد:</span>
                  <p className="text-xs text-stone-500 mt-0.5">در صورت غیرفعال بودن، کد در سبد خرید کاربران اعمال نمی‌شود.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditCouponIsActive(!editCouponIsActive)}
                  className="cursor-pointer p-1"
                >
                  {editCouponIsActive ? (
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-stone-500" />
                  )}
                </button>
              </div>

              <div className="text-xs text-stone-500 flex items-center gap-2 pt-1">
                <span>تعداد دفعات استفاده شده تاکنون:</span>
                <span className="text-[#e2b87f] font-mono font-bold">{editingCoupon.usageCount} بار</span>
                <span className="text-stone-600">(این آمار با ویرایش حفظ می‌شود)</span>
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات کد تخفیف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT FAQ (Luxury Dark Theme) */}
      {editingFaq && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingFaq(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#12100f] rounded-2xl max-w-lg w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#e2b87f]" />
                <span>ویرایش پرسش و پاسخ متداول</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFaq} className="space-y-4 text-xs text-stone-300">
              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">دسته‌بندی موضوعی سوال:</label>
                <select
                  value={editFaqCategory}
                  onChange={(e) => setEditFaqCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                >
                  <option value="COURSES">آموزش و دوره‌های آنلاین</option>
                  <option value="SHOP">فروشگاه و ارسال ابزار فیزیکی</option>
                  <option value="CERTIFICATES">گواهینامه‌ها</option>
                  <option value="WORKSHOPS">کارگاه‌های حضوری و استانی</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">متن سوال (Question):</label>
                <input
                  type="text"
                  value={editFaqQuestion}
                  onChange={(e) => setEditFaqQuestion(e.target.value)}
                  placeholder="عنوان سوال متداول..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">پاسخ تشریحی سوال (Answer):</label>
                <textarea
                  rows={4}
                  value={editFaqAnswer}
                  onChange={(e) => setEditFaqAnswer(e.target.value)}
                  placeholder="پاسخ کامل، شفاف و دقیق را در این کادر بنویسید..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات سوال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: EDIT STYLE (Luxury Dark Theme with Image Uploader) */}
      {editingStyle && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingStyle(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#12100f] rounded-2xl max-w-xl w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#e2b87f]" />
                <span>ویرایش مدل شنیون «{editingStyle.name}»</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStyle(null)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStyle} className="space-y-4 text-xs text-stone-300">
              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">نام مدل شنیون:</label>
                <input
                  type="text"
                  value={editStyleName}
                  onChange={(e) => setEditStyleName(e.target.value)}
                  placeholder="عنوان مدل شنیون..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مناسبت / استایل:</label>
                  <select
                    value={editStyleOccasion}
                    onChange={(e) => setEditStyleOccasion(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="عروس">عروس</option>
                    <option value="مجلسی">مجلسی</option>
                    <option value="نامزدی">نامزدی</option>
                    <option value="فرمالیته">فرمالیته</option>
                    <option value="روزمره">روزمره</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سطح دشواری:</label>
                  <select
                    value={editStyleDifficulty}
                    onChange={(e) => setEditStyleDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مدت زمان اجرا (دقیقه):</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={editStyleMinutes}
                    onChange={(e) => setEditStyleMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="p-2.5 bg-[#171412] rounded-xl border border-[#26211e] flex items-center justify-between text-xs text-stone-400">
                    <span>آمار بازدید:</span>
                    <span className="text-[#e2b87f] font-mono font-bold">{editingStyle.viewsCount.toLocaleString('fa-IR')} بازدید</span>
                  </div>
                </div>
              </div>

              {/* Image Uploader & Live Preview */}
              <div className="pt-1">
                <ImageUploader
                  label="تصویر شاخص مدل شنیون:"
                  value={editStyleImage}
                  onChange={(url) => setEditStyleImage(url)}
                  placeholder="آدرس تصویر یا انتخاب از کتابخانه رسانه..."
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">خلاصه کوتاه ژورنالی:</label>
                <textarea
                  rows={2}
                  value={editStyleSummary}
                  onChange={(e) => setEditStyleSummary(e.target.value)}
                  placeholder="توضیح کوتاه ویژگی‌های مدل مو..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">توضیحات تکمیلی و مشاوره تخصصی:</label>
                <textarea
                  rows={3}
                  value={editStyleDescription}
                  onChange={(e) => setEditStyleDescription(e.target.value)}
                  placeholder="مشخصات کامل ساختار مو، اکسسوری‌های پیشنهادی و نکات سالنی..."
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="text-xs text-stone-500 flex items-center justify-between pt-1 border-t border-[#26211e]">
                <span>شناسه پیوند (Slug): <code className="text-stone-400 font-mono">{editingStyle.slug}</code></span>
                <span className="text-emerald-500/80">برای حفظ سئو و بوکمارک‌ها ثابت می‌ماند</span>
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStyle(null)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات مدل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: EDIT ARTICLE (Luxury Dark Theme with Image Uploader) */}
      {editingArticle && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingArticle(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#12100f] rounded-2xl max-w-2xl w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#e2b87f]" />
                <span>ویرایش مقاله «{editingArticle.title}»</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingArticle(null)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditArticle} className="space-y-4 text-xs text-stone-300">
              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">عنوان مقاله:</label>
                <input
                  type="text"
                  value={editArticleTitle}
                  onChange={(e) => setEditArticleTitle(e.target.value)}
                  placeholder="عنوان جذاب مقاله..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">دسته‌بندی موضوعی:</label>
                  <select
                    value={editArticleCategory}
                    onChange={(e) => setEditArticleCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="آموزش تخصصی">آموزش تخصصی</option>
                    <option value="مراقبت از مو">مراقبت از مو</option>
                    <option value="ترندهای فصل">ترندهای فصل</option>
                    <option value="راهنمای خرید">راهنمای خرید</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">مدت زمان مطالعه (دقیقه):</label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={editArticleReadTime}
                    onChange={(e) => setEditArticleReadTime(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">نویسنده / مدرس:</label>
                  <input
                    type="text"
                    value={editArticleAuthorName}
                    onChange={(e) => setEditArticleAuthorName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1.5">سمت نویسنده:</label>
                  <input
                    type="text"
                    value={editArticleAuthorRole}
                    onChange={(e) => setEditArticleAuthorRole(e.target.value)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
              </div>

              {/* Cover Image Uploader */}
              <div className="pt-1">
                <ImageUploader
                  label="تصویر کاور مقاله:"
                  value={editArticleHero}
                  onChange={(url) => setEditArticleHero(url)}
                  placeholder="آدرس تصویر یا انتخاب از کتابخانه رسانه..."
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">خلاصه کوتاه مقاله (کپشن):</label>
                <textarea
                  rows={2}
                  value={editArticleSummary}
                  onChange={(e) => setEditArticleSummary(e.target.value)}
                  placeholder="خلاصه‌ای از مباحث مقاله..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">متن کامل مقاله:</label>
                <textarea
                  rows={5}
                  value={editArticleContent}
                  onChange={(e) => setEditArticleContent(e.target.value)}
                  placeholder="محتوای تشریحی مقاله، نکات و راهنماها..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors leading-relaxed"
                />
              </div>

              <div className="text-xs text-stone-500 flex items-center justify-between pt-1 border-t border-[#26211e]">
                <span>شناسه پیوند (Slug): <code className="text-stone-400 font-mono">{editingArticle.slug}</code></span>
                <span className="text-emerald-500/80">آدرس اینترنتی صفحه برای جلوگیری از ارور ۴۰۴ ثابت می‌ماند</span>
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات مقاله</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10: EDIT TECHNIQUE (Luxury Dark Theme with Dynamic Steps) */}
      {editingTechnique && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setEditingTechnique(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#12100f] rounded-2xl max-w-2xl w-full p-6 border border-[#2e2824] shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#2e2824] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#e2b87f]" />
                <span>ویرایش تکنیک آموزشی «{editingTechnique.name}»</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTechnique(null)}
                className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTechnique} className="space-y-4 text-xs text-stone-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">نام تکنیک:</label>
                  <input
                    type="text"
                    value={editTechName}
                    onChange={(e) => setEditTechName(e.target.value)}
                    placeholder="عنوان تکنیک تخصصی..."
                    required
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-stone-300 mb-1.5">سطح سختی اجرای تکنیک:</label>
                  <select
                    value={editTechDifficulty}
                    onChange={(e) => setEditTechDifficulty(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors font-sans"
                  >
                    <option value="مبتدی">مبتدی (آموزش پایه)</option>
                    <option value="متوسط">متوسط (سالن‌کار)</option>
                    <option value="پیشرفته">پیشرفته (VIP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1.5">شرح کوتاه خلاصه تکنیک:</label>
                <textarea
                  rows={2}
                  value={editTechSummary}
                  onChange={(e) => setEditTechSummary(e.target.value)}
                  placeholder="این تکنیک چه کاربردی دارد و چه مشکلی را حل می‌کند..."
                  required
                  className="w-full p-2.5 bg-[#1a1816] border border-[#2e2824] text-stone-200 rounded-xl focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              {/* Dynamic Steps Section */}
              <div className="p-4 bg-[#171412] rounded-2xl border border-[#26211e] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2e2824] pb-2">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-stone-200">مراحل و گام‌های اجرای تکنیک ({editTechSteps.length} گام):</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStepToEdit}
                    className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-[#e2b87f] border border-amber-600/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن مرحله جدید</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editTechSteps.map((st, idx) => (
                    <div key={idx} className="p-3 bg-[#131110] rounded-xl border border-[#2a2420] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#e2b87f] flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-600/20 border border-amber-600/30 flex items-center justify-center text-xs font-mono text-amber-400">
                            {idx + 1}
                          </span>
                          <span>مرحله {idx + 1}</span>
                        </span>
                        {editTechSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStepFromEdit(idx)}
                            className="p-1 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                            title="حذف این مرحله"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                          placeholder="عنوان مرحله (مثال: آماده‌سازی و وزگیری اولیه)..."
                          required
                          className="w-full p-2 bg-[#1c1917] border border-[#2e2824] text-stone-200 rounded-lg focus:outline-none focus:border-amber-600 transition-colors text-xs font-semibold"
                        />
                        <textarea
                          rows={2}
                          value={st.description}
                          onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                          placeholder="دستورالعمل دقیق و ابزارهای مورد استفاده در این گام..."
                          required
                          className="w-full p-2 bg-[#1c1917] border border-[#2e2824] text-stone-300 rounded-lg focus:outline-none focus:border-amber-600 transition-colors text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Common Mistakes Section */}
              <div className="p-4 bg-[#171412] rounded-2xl border border-[#26211e] space-y-3">
                <div className="flex items-center justify-between border-b border-[#2e2824] pb-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-stone-200">اشتباهات رایج و نکات هشدار:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMistakeToEdit}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن هشدار</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editTechMistakes.map((mstk, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mstk}
                        onChange={(e) => handleMistakeChange(idx, e.target.value)}
                        placeholder="نکته هشداری یا اشتباه رایج شینیون‌کاران در اجرای این تکنیک..."
                        className="flex-1 p-2 bg-[#1c1917] border border-[#2e2824] text-stone-200 rounded-lg focus:outline-none focus:border-amber-600 transition-colors text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMistakeFromEdit(idx)}
                        className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="حذف این نکته"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-stone-500 flex items-center justify-between pt-1 border-t border-[#26211e]">
                <span>شناسه پیوند (Slug): <code className="text-stone-400 font-mono">{editingTechnique.slug}</code></span>
                <span className="text-emerald-500/80">ساختار پیوند جهت پایداری سیستم حفظ می‌شود</span>
              </div>

              <div className="pt-3 border-t border-[#2e2824] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTechnique(null)}
                  className="px-4 py-2 border border-[#2e2824] hover:bg-stone-900 text-stone-300 rounded-xl cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات تکنیک</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        danger
        title="تأیید حذف"
        message={pendingDelete?.message}
        confirmLabel="حذف"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => { pendingDelete?.run(); setPendingDelete(null); }}
      />
    </div>
  );
};
