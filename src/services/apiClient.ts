/**
 * Resilient full-stack API Client for GisAra
 * Implements JWT forwarding, global error handling, and robust mock fallbacks
 */

const API_BASE_URL = '/api';
// Legacy key: older builds stored the JWT in browser storage. Purged on load (see below).
const LEGACY_AUTH_TOKEN_KEY = 'gisara_jwt_token_v1';

export interface CacheOptions {
  ttlMs?: number;
  skipCache?: boolean;
  /** The server de-duplicates this call (idempotency key / session reuse), so a POST may be retried safely. */
  idempotent?: boolean;
  /** Extra request headers (e.g. Idempotency-Key). */
  headers?: Record<string, string>;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class ApiClient {
  private static sessionActive = false;
  /** True while the admin console is open: tells the server to act as the administrator for shared routes. */
  private static adminContext = false;
  private static cacheMap = new Map<string, CacheEntry>();
  private static activeControllers = new Map<string, AbortController>();
  private static DEFAULT_TTL_MS = 15000; // 15 seconds SWR cache

  // Circuit Breaker State & Config
  private static circuitState: CircuitState = 'CLOSED';
  private static consecutiveFailures = 0;
  private static FAILURE_THRESHOLD = 3; // Trip circuit after 3 consecutive failures
  private static COOLING_WINDOW_MS = 15000; // 15s cooling window
  private static lastStateChangeTime = Date.now();

  static getCircuitStatus(): { state: CircuitState; failures: number; isTripped: boolean } {
    this.checkCircuitState();
    return {
      state: this.circuitState,
      failures: this.consecutiveFailures,
      isTripped: this.circuitState === 'OPEN'
    };
  }

  private static checkCircuitState(): void {
    if (this.circuitState === 'OPEN') {
      const now = Date.now();
      if (now - this.lastStateChangeTime > this.COOLING_WINDOW_MS) {
        this.circuitState = 'HALF_OPEN';
        console.warn('[CircuitBreaker] Transitioning circuit to HALF_OPEN probe state.');
      }
    }
  }

  private static recordSuccess(): void {
    if (this.circuitState !== 'CLOSED') {
      console.info('[CircuitBreaker] Server response succeeded. Circuit reset to CLOSED.');
    }
    this.consecutiveFailures = 0;
    this.circuitState = 'CLOSED';
  }

  private static recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD && this.circuitState !== 'OPEN') {
      this.circuitState = 'OPEN';
      this.lastStateChangeTime = Date.now();
      console.warn(`[CircuitBreaker] Circuit TRIPPED OPEN due to ${this.consecutiveFailures} consecutive server errors. Cooling window active.`);
    }
  }

  static clearCache(endpointPrefix?: string): void {
    if (endpointPrefix) {
      for (const key of this.cacheMap.keys()) {
        if (key.includes(endpointPrefix)) {
          this.cacheMap.delete(key);
        }
      }
    } else {
      this.cacheMap.clear();
    }
  }

  // ---------------------------------------------------------------------------
  // Session state. The credential is an HttpOnly cookie managed by the server;
  // page scripts never see or store it. We only track a boolean "believed signed in".
  // ---------------------------------------------------------------------------
  static hasSession(): boolean {
    return this.sessionActive;
  }

  static markSession(active: boolean): void {
    this.sessionActive = active;
    if (!active) this.clearCache();
  }

  static setAdminContext(active: boolean): void {
    if (this.adminContext === active) return;
    this.adminContext = active;
    this.clearCache(); // cached answers belong to ONE identity
  }

  /** Ends the session: asks the server to expire the cookie, then resets local state. */
  static async clearSession(): Promise<void> {
    this.markSession(false);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // Network failure: the cookie simply expires on its own.
    }
  }

  /**
   * Universal fetch wrapper with automatic headers, cookie credentials, SWR caching,
   * AbortController de-duplication, and exponential backoff retry.
   */
  private static async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    fallbackData?: T,
    options?: CacheOptions
  ): Promise<T> {
    // 0. Circuit Breaker Guard - Fast-fail when circuit is OPEN
    this.checkCircuitState();
    if (this.circuitState === 'OPEN') {
      console.warn(`[CircuitBreaker] Fast-failing request for ${endpoint} because circuit is OPEN.`);
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      throw new Error('سرور در حال حاضر موقتاً در حالت بازیابی است. لطفاً چند لحظه دیگر دوباره تلاش فرمایید.');
    }

    const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : endpoint;
    const cacheKey = `${method}:${url}:${JSON.stringify(body || {})}`;

    // 1. Check in-memory SWR cache for GET requests
    if (method === 'GET' && !options?.skipCache) {
      const cached = this.cacheMap.get(cacheKey);
      const ttl = options?.ttlMs ?? this.DEFAULT_TTL_MS;
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data as T;
      }
    }

    // Clear cache on mutation requests (POST/PUT/DELETE)
    if (method !== 'GET') {
      this.clearCache(endpoint.split('/')[1]);
    }

    // 2. Abort previous pending request for the same GET endpoint
    if (method === 'GET') {
      const existingController = this.activeControllers.get(cacheKey);
      if (existingController) {
        existingController.abort();
      }
      const controller = new AbortController();
      this.activeControllers.set(cacheKey, controller);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.adminContext ? { 'X-Admin-Context': '1' } : {}),
      ...(options?.headers || {}),
    };

    // 3. Retry loop with Exponential Backoff (1s, 2s, 4s - skips 404 errors).
    // Only reads are retried freely. A write is retried (once) only when the server is known to be
    // idempotent for it - otherwise a lost response would create a duplicate order / payment.
    const maxRetries = method === 'GET' ? 3 : options?.idempotent ? 1 : 0;
    let attempt = 0;

    while (attempt <= maxRetries) {
      let isRetryable = false;
      let statusCode = 0;

      try {
        const signal = method === 'GET' ? this.activeControllers.get(cacheKey)?.signal : undefined;

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal
        });

        if (method === 'GET') {
          this.activeControllers.delete(cacheKey);
        }

        statusCode = response.status;

        // Skip retries for client errors (404 Not Found, 401 Unauthorized, 403 Forbidden, 400 Bad Request)
        if (statusCode === 404 || statusCode === 401 || statusCode === 403 || statusCode === 400) {
          if (statusCode === 401 && this.sessionActive) {
            // Server no longer recognises our cookie (expired/revoked).
            this.markSession(false);
          }
          const contentType = response.headers.get('content-type') || '';
          const responseText = await response.text();
          let resData: any = {};
          try { resData = JSON.parse(responseText); } catch {}

          if (fallbackData !== undefined) {
            return fallbackData;
          }
          throw Object.assign(new Error(resData?.message || (statusCode === 404 ? `آدرس مورد نظر یافت نشد (404)` : `خطای کلاینت (${statusCode})`)), { status: statusCode, data: resData });
        }

        const contentType = response.headers.get('content-type') || '';
        const responseText = await response.text();

        // Verify whether the response is valid JSON
        const isJson = contentType.includes('application/json') || 
          (responseText.trim().startsWith('{') || responseText.trim().startsWith('['));

        if (!isJson) {
          isRetryable = true;
          throw new Error(`پاسخ سرور در فرمت متنی/HTML دریافت شد (کد وضعیت: ${response.status})`);
        }

        let resData: any;
        try {
          resData = JSON.parse(responseText);
        } catch {
          isRetryable = true;
          throw new Error('خطا در تبدیل داده‌های JSON سرور');
        }

        if (!response.ok || resData?.success === false) {
          if (statusCode >= 500) {
            isRetryable = true;
          }
          if (fallbackData !== undefined) {
            this.recordFailure();
            return fallbackData;
          }
          throw Object.assign(new Error(resData?.message || `خطای سرور (${response.status})`), { status: response.status, data: resData });
        }

        this.recordSuccess();
        const finalResult = (resData.data !== undefined ? resData.data : resData) as T;

        // Store successful GET responses in SWR cache
        if (method === 'GET' && !options?.skipCache) {
          this.cacheMap.set(cacheKey, {
            data: finalResult,
            timestamp: Date.now()
          });
        }

        return finalResult;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Request was aborted by a newer request; return fallback if present or fail silently
          if (fallbackData !== undefined) return fallbackData;
          throw err;
        }

        attempt++;
        const isNetworkError = err.message.includes('fetch') || err.message.includes('Network') || err.message.includes('Failed');

        if (attempt <= maxRetries && (isRetryable || isNetworkError) && statusCode !== 404) {
          // Exponential backoff delays: 1000ms (1s), 2000ms (2s), 4000ms (4s)
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          console.warn(`[Exponential Backoff] Retry attempt ${attempt}/${maxRetries} for ${endpoint} after ${delayMs}ms. Reason: ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        this.recordFailure();
        if (fallbackData !== undefined) {
          return fallbackData;
        }
        console.warn(`[Network API Error] Endpoint ${endpoint}:`, err.message || err);
        throw err;
      }
    }

    return fallbackData as T;
  }

  // ---------------------------------------------------------------------------
  // Authentication services
  // ---------------------------------------------------------------------------
  /** On 429 the thrown error's `data.retryAfterSec` says how long until a new code may be requested. */
  static async requestOTP(mobile: string): Promise<{ success: boolean; cooldownSec?: number; expiresInSec?: number; message?: string }> {
    return this.request('/auth/otp/request', 'POST', { mobile });
  }

  static async verifyOTP(mobile: string, code: string): Promise<{ success: boolean; user: any }> {
    const res = await this.request<{ success: boolean; user: any }>('/auth/otp/verify', 'POST', { mobile, code });
    if (res.success) this.markSession(true);
    return res;
  }

  static async adminLogin(passcode: string): Promise<{ success: boolean; user: any }> {
    const res = await this.request<{ success: boolean; user: any }>('/auth/admin/login', 'POST', { passcode });
    if (res.success) this.markSession(true);
    return res;
  }

  static async getCurrentUser(): Promise<{ success: boolean; user: any; isAdmin?: boolean }> {
    return this.request('/auth/me', 'GET', undefined, { success: false, user: null }, { skipCache: true });
  }

  /** Saves the customer's display name (and avatar when supplied). */
  static async updateProfile(patch: { name?: string; avatar?: string | null }): Promise<{ success: boolean; user: any }> {
    return this.request('/me/profile', 'PUT', patch);
  }

  static async adminLogout(): Promise<void> {
    this.setAdminContext(false);
    try {
      await fetch(`${API_BASE_URL}/auth/admin/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // The admin cookie expires by itself.
    }
  }

  /** Admin: search customers by user code, mobile or name. */
  static async searchUsers(query: string): Promise<{ success: boolean; total: number; data: any[] }> {
    return this.request<{ success: boolean; total: number; data: any[] }>(`/admin/users?q=${encodeURIComponent(query)}`, 'GET', undefined, undefined, { skipCache: true });
  }

  /** Admin: one customer's full status (orders, courses, requests, certificates). */
  static async getUserDetail(userCode: string): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(`/admin/users/${encodeURIComponent(userCode)}`, 'GET', undefined, undefined, { skipCache: true });
  }

  /** Course ids the signed-in user is entitled to. Server-derived from PAID orders. */
  static async getEnrollments(): Promise<string[]> {
    // No fallback on purpose: a failure must be distinguishable from "owns nothing", otherwise a paying
    // customer is shown the "buy" button / a locked course during a hiccup.
    const res = await this.request<{ courseIds?: string[] }>('/me/enrollments', 'GET', undefined, undefined, { skipCache: true });
    return Array.isArray(res?.courseIds) ? res.courseIds : [];
  }

  /** Lesson (incl. media URL) - the server answers 401/403 unless preview or purchased. */
  static async getLesson(courseId: string, lessonId: string): Promise<any> {
    return this.request(`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`, 'GET');
  }

  static async logout(): Promise<{ success: boolean }> {
    await this.clearSession();
    return { success: true };
  }

  static async getCart(): Promise<{ success: boolean; cart: any[] }> {
    return this.request('/cart', 'GET', undefined, { success: true, cart: [] });
  }

  static async syncCart(cartItems: any[]): Promise<{ success: boolean; cart: any[] }> {
    return this.request('/cart/sync', 'POST', { cartItems }, { success: true, cart: cartItems });
  }

  // ---------------------------------------------------------------------------
  // Content & Styles
  // ---------------------------------------------------------------------------
  static async getStyles(fallback: any[]): Promise<any[]> {
    return this.request('/styles', 'GET', undefined, fallback);
  }

  static async createStyle(styleData: any): Promise<any> {
    return this.request('/styles', 'POST', styleData);
  }

  static async updateStyle(id: string, styleData: any): Promise<any> {
    return this.request(`/styles/${id}`, 'PUT', styleData);
  }

  static async deleteStyle(id: string): Promise<any> {
    return this.request(`/styles/${id}`, 'DELETE');
  }

  // ---------------------------------------------------------------------------
  // Articles CMS API Client
  // ---------------------------------------------------------------------------
  static async createArticle(articleData: any): Promise<any> {
    return this.request('/articles', 'POST', articleData);
  }

  static async updateArticle(id: string, articleData: any): Promise<any> {
    return this.request(`/articles/${id}`, 'PUT', articleData);
  }

  static async deleteArticle(id: string): Promise<any> {
    return this.request(`/articles/${id}`, 'DELETE');
  }

  // ---------------------------------------------------------------------------
  // Techniques CMS API Client
  // ---------------------------------------------------------------------------
  static async createTechnique(techniqueData: any): Promise<any> {
    return this.request('/techniques', 'POST', techniqueData);
  }

  static async updateTechnique(id: string, techniqueData: any): Promise<any> {
    return this.request(`/techniques/${id}`, 'PUT', techniqueData);
  }

  static async deleteTechnique(id: string): Promise<any> {
    return this.request(`/techniques/${id}`, 'DELETE');
  }

  // ---------------------------------------------------------------------------
  // Sessions CMS API Client
  // ---------------------------------------------------------------------------
  static async createSession(sessionData: any): Promise<any> {
    return this.request('/sessions', 'POST', sessionData);
  }

  static async updateSession(id: string, sessionData: any): Promise<any> {
    return this.request(`/sessions/${id}`, 'PUT', sessionData);
  }

  static async deleteSession(id: string): Promise<any> {
    return this.request(`/sessions/${id}`, 'DELETE');
  }

  // ---------------------------------------------------------------------------
  // Products & Commerce
  // ---------------------------------------------------------------------------
  static async getProducts(fallback: any[]): Promise<any[]> {
    return this.request('/products', 'GET', undefined, fallback);
  }

  static async createProduct(productData: any): Promise<any> {
    return this.request('/products', 'POST', productData);
  }

  static async updateProduct(id: string, productData: any): Promise<any> {
    return this.request(`/products/${id}`, 'PUT', productData);
  }

  static async deleteProduct(id: string): Promise<any> {
    return this.request(`/products/${id}`, 'DELETE');
  }

  static async validateCoupon(code: string): Promise<any> {
    return this.request(`/coupons/validate/${encodeURIComponent(code)}`, 'GET', undefined, undefined, { skipCache: true });
  }

  /** `idempotencyKey` makes a retried/double-submitted request return the SAME order instead of a second one. */
  static async submitOrder(orderData: any, idempotencyKey?: string): Promise<any> {
    return this.request('/orders', 'POST', orderData, undefined, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey }, idempotent: true } : undefined);
  }

  static async getOrders(fallback: any[]): Promise<any[]> {
    return this.request('/orders', 'GET', undefined, fallback);
  }

  static async updateOrderStatus(id: string, status: string, shipmentStatus?: string): Promise<any> {
    return this.request(`/orders/${id}/status`, 'PUT', { status, shipmentStatus });
  }

  // ---------------------------------------------------------------------------
  // Workshops & LMS
  // ---------------------------------------------------------------------------
  static async getCourses(fallback: any[]): Promise<any[]> {
    return this.request('/courses', 'GET', undefined, fallback);
  }

  /** Admin: every course (all statuses, with lesson media URLs). */
  static async getAdminCourses(): Promise<any[]> {
    return this.request<any[]>('/admin/courses', 'GET', undefined, undefined, { skipCache: true });
  }

  static async createCourse(course: any): Promise<any> {
    return this.request('/courses', 'POST', course);
  }

  static async updateCourse(id: string, patch: any): Promise<any> {
    return this.request(`/courses/${encodeURIComponent(id)}`, 'PUT', patch);
  }

  static async deleteCourse(id: string): Promise<any> {
    return this.request(`/courses/${encodeURIComponent(id)}`, 'DELETE');
  }

  static async getSessions(fallback: any[]): Promise<any[]> {
    return this.request('/sessions', 'GET', undefined, fallback);
  }

  static async getTechniques(fallback: any[]): Promise<any[]> {
    return this.request('/techniques', 'GET', undefined, fallback);
  }

  static async getArticles(fallback: any[]): Promise<any[]> {
    return this.request('/articles', 'GET', undefined, fallback);
  }

  static async submitWorkshopRequest(requestData: any): Promise<any> {
    return this.request('/workshops/request', 'POST', requestData);
  }

  static async getWorkshopRequests(fallback: any[]): Promise<any[]> {
    return this.request('/workshops/requests', 'GET', undefined, fallback);
  }

  static async getAIConsultation(prefs: any): Promise<{
    aiAdvice: string;
    matchScore: number;
    source: string;
    recommendedStyleIds?: string[];
    recommendedTechniqueIds?: string[];
    recommendedProductIds?: string[];
    keyAdvicePoints?: string[];
  }> {
    return this.request('/ai/consultation', 'POST', prefs, {
      aiAdvice: 'بر اساس فرم هندسی صورت و ویژگی‌های موی شما، شینیون‌های خطی و تکسچر با فیکساتور متوسط بهترین تعادل بصری را ایجاد می‌کنند.',
      matchScore: 98,
      source: 'expert_rule_engine',
      keyAdvicePoints: [
        'ایجاد تعادل بصری در چهره متناسب با قد پیشانی',
        'تلطیف خطوط سرشانه با هماهنگی مدل یقه لباس',
        'زیرسازی اصولی و فیکس یکنواخت با ماندگاری بالا'
      ]
    });
  }

  // ---------------------------------------------------------------------------
  // Manual Enrollments API Client
  // ---------------------------------------------------------------------------
  static async getManualEnrollments(): Promise<any[]> {
    return this.request('/admin/enrollments', 'GET', undefined, []);
  }

  static async submitManualEnrollment(userMobile: string, courseId: string, courseName: string, status: 'ACTIVE' | 'REVOKED'): Promise<any> {
    return this.request('/admin/enrollments', 'POST', { userMobile, courseId, courseName, status });
  }

  // ---------------------------------------------------------------------------
  // Analytics & Audits
  // ---------------------------------------------------------------------------
  static async getAdminAnalytics(): Promise<any> {
    return this.request('/admin/analytics', 'GET');
  }

  static async getAdminAuditLogs(): Promise<any[]> {
    return this.request('/admin/logs', 'GET', undefined, []);
  }

  static async exportDbBackup(): Promise<any> {
    return this.request('/admin/db/export', 'GET');
  }

  static async importDbBackup(data: any): Promise<any> {
    return this.request('/admin/db/import', 'POST', data);
  }

  static async getAdminSettings(): Promise<any> {
    return this.request('/admin/settings', 'GET');
  }

  static async updateAdminSettings(settings: any): Promise<any> {
    return this.request('/admin/settings', 'POST', settings);
  }

  static async requestOnlinePayment(orderId: string): Promise<any> {
    // The server re-uses a still-valid gateway session for the same order, so this is safe to retry.
    return this.request('/payments/request', 'POST', { orderId }, undefined, { idempotent: true });
  }

  static async uploadImage(imageBase64: string, filename?: string): Promise<{ success: boolean; url: string; filename: string; sizeKb: number; message?: string }> {
    return this.request('/upload', 'POST', { imageBase64, filename });
  }

  static async getMediaList(): Promise<{ success: boolean; data: Array<{ filename: string; url: string; sizeKb: number; createdAt: string }> }> {
    return this.request('/admin/media', 'GET');
  }

  static async deleteMedia(filename: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/admin/media/${encodeURIComponent(filename)}`, 'DELETE');
  }
}

// One-time cleanup: remove any JWT persisted by earlier versions so a credential
// that used to sit in script-readable storage is not left behind on users' devices.
try {
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
} catch {
  // Storage unavailable (private mode / SSR) - nothing to clean.
}
