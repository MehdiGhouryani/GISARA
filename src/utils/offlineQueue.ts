/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OfflineQueue - Resilience Offline Action Queue & Automatic Network Resync
 * Stores pending mutations (workshop requests, order submissions) when device is offline,
 * and automatically drains and syncs with the backend as soon as connectivity resumes.
 */

import { ApiClient } from '../services/apiClient';

export interface QueuedAction {
  id: string;
  type: 'WORKSHOP_REQUEST' | 'ORDER_SUBMIT' | 'CART_SYNC';
  endpoint: string;
  payload: any;
  createdAt: string;
}

const OFFLINE_QUEUE_STORAGE_KEY = 'gisara_offline_pending_actions_v1';

export class OfflineQueueService {
  private static isSyncing = false;

  static getQueue(): QueuedAction[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static enqueue(type: QueuedAction['type'], endpoint: string, payload: any): void {
    const action: QueuedAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      endpoint,
      payload,
      createdAt: new Date().toISOString()
    };

    const current = this.getQueue();
    current.push(action);
    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(current));
    console.info(`[OfflineQueue] Action ${type} queued for background sync.`);
  }

  static clearQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
  }

  static async flushQueue(): Promise<{ syncedCount: number; errorsCount: number }> {
    if (this.isSyncing || !navigator.onLine) {
      return { syncedCount: 0, errorsCount: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, errorsCount: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let errorsCount = 0;
    const remaining: QueuedAction[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'WORKSHOP_REQUEST') {
          await ApiClient.submitWorkshopRequest(item.payload);
        } else if (item.type === 'ORDER_SUBMIT') {
          await ApiClient.submitOrder(item.payload);
        } else if (item.type === 'CART_SYNC') {
          await ApiClient.syncCart(item.payload);
        }
        syncedCount++;
      } catch (err) {
        console.warn(`[OfflineQueue] Failed to sync action ${item.id}:`, err);
        errorsCount++;
        remaining.push(item);
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    this.isSyncing = false;

    if (syncedCount > 0) {
      console.info(`[OfflineQueue] Successfully synced ${syncedCount} queued action(s) to backend.`);
    }

    return { syncedCount, errorsCount };
  }

  static setupAutoSync(onSyncSuccess?: (count: number) => void): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
      console.info('[OfflineQueue] Network restored. Flushing pending actions...');
      const res = await this.flushQueue();
      if (res.syncedCount > 0 && onSyncSuccess) {
        onSyncSuccess(res.syncedCount);
      }
    });

    // Initial check if online
    if (navigator.onLine) {
      this.flushQueue().then((res) => {
        if (res.syncedCount > 0 && onSyncSuccess) {
          onSyncSuccess(res.syncedCount);
        }
      });
    }
  }
}
