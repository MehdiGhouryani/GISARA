/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Domain Types for گیس‌آرا (GisAra)
 * Conforming strictly to Master Blueprint v5.0 and Backend Contract v1.0
 */

// -----------------------------------------------------------------------------
// Canonical Status Enums
// -----------------------------------------------------------------------------

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type EntityPublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'DISCONTINUED';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentAttemptStatus = 'INITIATED' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';

export type ShipmentStatus = 'UNFULFILLED' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'RETURN_REQUESTED' | 'RETURNED';

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export type CourseKind = 'ONLINE' | 'IN_PERSON';

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type AccessGrantStatus = 'ACTIVE' | 'REVOKED';

export type InstructorStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type SessionStatus = 'DRAFT' | 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export type RequestStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'SCHEDULE_PROPOSED' 
  | 'DECLINED' 
  | 'ACCEPTED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';

// -----------------------------------------------------------------------------
// Coupon & Certificate Entities
// -----------------------------------------------------------------------------

export interface FAQItem {
  id: string;
  category: 'COURSES' | 'SHOP' | 'CERTIFICATES' | 'WORKSHOPS' | string;
  question: string;
  answer: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number; // e.g. 20 for 20%
  maxDiscountToman?: number;
  minOrderToman?: number;
  usageLimit?: number;
  description: string;
  isActive: boolean;
  expiresAtJalali?: string;
  usageCount: number;
}

export interface Certificate {
  id: string;
  certificateCode: string; // e.g. "SHN-CERT-94821"
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentMobile: string;
  issueDateJalali: string;
  instructorName: string;
  hoursCount: number;
  grade: string;
  status: 'ISSUED' | 'REVOKED';
}

// -----------------------------------------------------------------------------
// Core Domain Entities
// -----------------------------------------------------------------------------

export interface StyleModel {
  id: string;
  name: string;
  slug: string;
  primaryImage: string;
  summary: string;
  description: string;
  occasion: 'عروس' | 'مجلسی' | 'روزمره' | 'نامزدی' | 'فرمالیته';
  difficulty: 'مبتدی' | 'متوسط' | 'پیشرفته';
  approxMinutes: number;
  status: EntityPublishStatus;
  techniqueIds: string[];
  productIds: string[];
  courseId?: string;
  articleIds?: string[];
  viewsCount: number;
  createdAt: string;
}

export interface Technique {
  id: string;
  name: string;
  slug: string;
  summary: string;
  steps: {
    number: number;
    title: string;
    description: string;
    tip?: string;
  }[];
  commonMistakes: string[];
  videoThumbnail?: string;
  videoDurationMinutes?: number;
  difficulty: 'مبتدی' | 'متوسط' | 'پیشرفته';
  status: EntityPublishStatus;
  toolIds: string[];
  courseId?: string;
  styleIds: string[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: 'مراقبت از مو' | 'آموزش تخصصی' | 'ترندهای فصل' | 'راهنمای خرید';
  summary: string;
  content: string;
  readTimeMinutes: number;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  heroImage: string;
  relatedStyleIds?: string[];
  relatedProductIds?: string[];
  relatedCourseId?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'تثبیت‌کننده‌ها' | 'گیره و تقسیم‌بندی' | 'کش و سنجاق' | 'ابزار دستی' | 'کیت و ست';
  brand: string;
  priceToman: number;
  compareAtPriceToman?: number;
  sku: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  summary: string;
  description: string;
  specifications: Record<string, string>;
  kitContents?: string[];
  status: ProductStatus;
  relatedStyleIds?: string[];
}

export interface Course {
  id: string;
  name: string;
  slug: string;
  kind: CourseKind;
  summary: string;
  description: string;
  instructorId: string;
  priceToman: number;
  compareAtPriceToman?: number;
  level: 'مبتدی' | 'متوسط' | 'پیشرفته' | 'جامع و حرفه‌ای';
  durationMinutes: number;
  status: CourseStatus;
  heroImage: string;
  previewVideoUrl?: string;
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      durationMinutes: number;
      isPreview: boolean;
      videoUrl?: string;
    }[];
  }[];
  prerequisites: string[];
  targetAudience: string[];
}

export interface Instructor {
  id: string;
  name: string;
  slug: string;
  portrait: string;
  specialty: string;
  experienceYears: number;
  bio: string;
  coveredCityIds: string[];
  status: InstructorStatus;
  coursesCount: number;
  workshopsCount: number;
  rating: number;
  portfolioImages: string[];
}

export interface City {
  id: string;
  name: string;
  slug: string;
  province: string;
  description: string;
  image: string;
  activeInstructorsCount: number;
  activeSessionsCount: number;
}

export interface WorkshopSession {
  id: string;
  courseId: string;
  courseName: string;
  cityId: string;
  cityName: string;
  instructorId: string;
  instructorName: string;
  instructorPortrait: string;
  slug: string;
  venueName: string;
  venueAddress: string;
  dateJalali: string;
  timeSlot: string;
  capacity: number;
  registeredCount: number;
  priceToman: number;
  status: SessionStatus;
}

export interface WorkshopRequest {
  id: string;
  userId: string;
  kind: 'JOIN_SESSION' | 'REQUEST_NEW_SESSION';
  sessionId?: string;
  courseId: string;
  cityId: string;
  fullName: string;
  mobile: string;
  experienceLevel: 'مبتدی' | 'آرایشگر نوپا' | 'مدرس و حرفه‌ای';
  participantCount: number;
  preferredDays: string;
  notes?: string;
  status: RequestStatus;
  submittedAt: string;
  proposal?: {
    id: string;
    cityName: string;
    instructorName: string;
    dateJalali: string;
    venueName: string;
    priceToman: number;
    expiresAt: string;
  };
}

export interface CartItem {
  id: string;
  type: 'PHYSICAL_PRODUCT' | 'ONLINE_COURSE';
  productId?: string;
  courseId?: string;
  title: string;
  sku?: string;
  priceToman: number;
  quantity: number;
  image: string;
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotalToman: number;
  discountToman?: number;
  couponApplied?: string;
  shippingToman: number;
  payableToman: number;
  status: OrderStatus;
  shipmentStatus?: ShipmentStatus;
  createdAt: string;
  paidAt?: string;
  paymentExpiresAt?: string;
  stockReleased?: boolean;
  trackingCode?: string;
  paymentRefId?: string;
  userMobile?: string;
  mobile?: string;
  customerName?: string;
  notes?: string;
  shippingAddress?: {
    recipientName: string;
    mobile: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
}

export interface AboutContent {
  title: string;
  subtitle: string;
  story: string;
  mission: string;
  founderName: string;
  founderRole: string;
  founderBio: string;
  founderImage: string;
  heroImage: string;
  headquartersAddress: string;
  phone: string;
  email: string;
  workingHours: string;
  stats: {
    studentsCount: number;
    yearsExperience: number;
    citiesCovered: number;
    satisfactionRate: number;
  };
  features: {
    title: string;
    description: string;
  }[];
}

