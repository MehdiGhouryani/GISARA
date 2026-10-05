/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Intelligent Route and Component Prefetching Service
 * Loads secondary chunks during idle periods (requestIdleCallback) or on hover
 * to deliver instantaneous <50ms route transitions without blocking initial hydration.
 */

type RouteKey =
  | 'styles'
  | 'techniques'
  | 'shop'
  | 'courses'
  | 'mag'
  | 'cart'
  | 'search'
  | 'checkout'
  | 'account'
  | 'cities'
  | 'about'
  | 'faq';

const prefetchedRoutes = new Set<string>();

const routeLoaders: Record<RouteKey, () => Promise<unknown>> = {
  styles: () => import('../pages/StylesPage'),
  techniques: () => import('../pages/TechniquesPage'),
  shop: () => import('../pages/ShopPage'),
  courses: () => import('../pages/CoursesPage'),
  mag: () => import('../pages/MagazinePage'),
  cart: () => import('../components/commerce/CartDrawer'),
  search: () => import('../pages/SearchPage'),
  checkout: () => import('../pages/CheckoutPage'),
  account: () => import('../pages/AccountPage'),
  cities: () => import('../pages/CitiesPage'),
  about: () => import('../pages/AboutPage'),
  faq: () => import('../pages/FaqPage'),
};

/**
 * Prefetches a specific route bundle on demand (e.g. on mouse enter or focus)
 */
export function prefetchRoute(route: string): void {
  const normalized = route.toLowerCase() as RouteKey;
  if (prefetchedRoutes.has(normalized)) return;
  
  const loader = routeLoaders[normalized];
  if (loader) {
    prefetchedRoutes.add(normalized);
    // Execute dynamic import in microtask to not interrupt current UI animation
    Promise.resolve().then(() => {
      loader().catch(() => {
        // Retry allowed on failure
        prefetchedRoutes.delete(normalized);
      });
    });
  }
}

/**
 * Automatically prefetches core secondary routes when browser is in idle state
 */
export function scheduleIdleRoutePrefetch(priorityRoutes: RouteKey[] = ['styles', 'techniques', 'shop', 'courses']): void {
  if (typeof window === 'undefined') return;

  const runIdle = (deadline?: { timeRemaining: () => number }) => {
    let index = 0;
    const loadNext = () => {
      if (index >= priorityRoutes.length) return;
      const target = priorityRoutes[index++];
      if (!prefetchedRoutes.has(target) && routeLoaders[target]) {
        prefetchRoute(target);
      }
      if (index < priorityRoutes.length) {
        if (deadline && deadline.timeRemaining() > 10) {
          loadNext();
        } else {
          setTimeout(loadNext, 400);
        }
      }
    };
    loadNext();
  };

  if ('requestIdleCallback' in window) {
    // Wait 2 seconds after initial load before triggering idle prefetching
    setTimeout(() => {
      (window as unknown as { requestIdleCallback: (cb: (deadline: { timeRemaining: () => number }) => void, opts?: { timeout: number }) => void }).requestIdleCallback(
        runIdle,
        { timeout: 4000 }
      );
    }, 2000);
  } else {
    setTimeout(runIdle, 3000);
  }
}
