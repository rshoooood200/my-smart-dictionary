/**
 * مكتبة التخزين المحلي (IndexedDB) للعمل دون اتصال
 * توفر واجهة برمجية موحدة للتخزين والاسترجاع والمزامنة
 */

const DB_NAME = 'dictionary-offline';
const DB_VERSION = 2;

// أنواع المخازن
export const STORES = {
  WORDS: 'words',
  CATEGORIES: 'categories',
  NOTES: 'notes',
  PENDING_SYNC: 'pendingSync',
  SYNC_QUEUE: 'syncQueue',
  USER_PROGRESS: 'userProgress',
  SETTINGS: 'settings',
} as const;

// نوع عنصر المزامنة المعلقة
export interface PendingSyncItem {
  id: string;
  type: 'word' | 'category' | 'note' | 'progress';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

// نوع البيانات المحلية
export interface LocalDataItem<T = unknown> {
  id: string;
  data: T;
  synced: boolean;
  lastModified: number;
  serverId?: string;
}

// فئة إدارة قاعدة البيانات
class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  // فتح قاعدة البيانات
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineDB] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // إنشاء مخزن الكلمات
        if (!db.objectStoreNames.contains(STORES.WORDS)) {
          const wordsStore = db.createObjectStore(STORES.WORDS, { keyPath: 'id' });
          wordsStore.createIndex('categoryId', 'data.categoryId', { unique: false });
          wordsStore.createIndex('synced', 'synced', { unique: false });
        }

        // إنشاء مخزن التصنيفات
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const categoriesStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
          categoriesStore.createIndex('synced', 'synced', { unique: false });
        }

        // إنشاء مخزن الملاحظات
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          notesStore.createIndex('synced', 'synced', { unique: false });
        }

        // إنشاء مخزن المزامنة المعلقة
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // إنشاء طابور المزامنة
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // إنشاء مخزن تقدم المستخدم
        if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
          const progressStore = db.createObjectStore(STORES.USER_PROGRESS, { keyPath: 'id' });
          progressStore.createIndex('date', 'date', { unique: false });
        }

        // إنشاء مخزن الإعدادات
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        console.log('[OfflineDB] Database schema created/updated');
      };
    });

    return this.initPromise;
  }

  // إضافة أو تحديث عنصر
  async put<T>(storeName: string, data: T): Promise<string> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  // الحصول على عنصر
  async get<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // الحصول على جميع العناصر
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // الحصول على عناصر حسب الفهرس
  async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // حذف عنصر
  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // مسح مخزن كامل
  async clear(storeName: string): Promise<void> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // عدد العناصر في مخزن
  async count(storeName: string): Promise<number> {
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // إضافة عنصر لطابور المزامنة
  async addToSyncQueue(item: Omit<PendingSyncItem, 'id' | 'retries'>): Promise<void> {
    const syncItem: PendingSyncItem = {
      ...item,
      id: `${item.type}-${item.action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retries: 0,
    };

    await this.put(STORES.PENDING_SYNC, syncItem);
    console.log('[OfflineDB] Added to sync queue:', syncItem.id);
  }

  // الحصول على عناصر المزامنة المعلقة
  async getPendingSyncItems(): Promise<PendingSyncItem[]> {
    return this.getAll<PendingSyncItem>(STORES.PENDING_SYNC);
  }

  // حذف عنصر من طابور المزامنة
  async removeSyncItem(id: string): Promise<void> {
    await this.delete(STORES.PENDING_SYNC, id);
    console.log('[OfflineDB] Removed from sync queue:', id);
  }

  // تحديث عدد محاولات المزامنة
  async updateSyncRetries(id: string, retries: number): Promise<void> {
    const item = await this.get<PendingSyncItem>(STORES.PENDING_SYNC, id);
    if (item) {
      item.retries = retries;
      await this.put(STORES.PENDING_SYNC, item);
    }
  }

  // تخزين البيانات محلياً مع علامة المزامنة
  async storeLocalData<T extends { id: string }>(
    storeName: string, 
    data: T, 
    synced: boolean = false
  ): Promise<void> {
    const localItem: LocalDataItem<T> = {
      id: data.id,
      data,
      synced,
      lastModified: Date.now(),
    };

    await this.put(storeName, localItem);
  }

  // تخزين مجموعة بيانات (الاسم الجديد)
  async storeBulkLocalData<T extends { id: string }>(
    storeName: string,
    items: T[],
    synced: boolean = true
  ): Promise<void> {
    // Safety check: ensure items is an array
    if (!Array.isArray(items) || items.length === 0) {
      console.log('[OfflineDB] No items to store or items is not an array');
      return;
    }
    
    const db = await this.open();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach(item => {
        const localItem: LocalDataItem<T> = {
          id: item.id,
          data: item,
          synced,
          lastModified: Date.now(),
        };
        store.put(localItem);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // الحصول على البيانات غير المتزامنة
  async getUnsyncedData<T>(storeName: string): Promise<LocalDataItem<T>[]> {
    return this.getByIndex<LocalDataItem<T>>(storeName, 'synced', false as unknown as IDBValidKey);
  }

  // تحديث حالة المزامنة
  async markAsSynced(storeName: string, id: string, serverId?: string): Promise<void> {
    const item = await this.get<LocalDataItem>(storeName, id);
    if (item) {
      item.synced = true;
      if (serverId) item.serverId = serverId;
      item.lastModified = Date.now();
      await this.put(storeName, item);
    }
  }

  // حفظ إعداد
  async saveSetting(key: string, value: unknown): Promise<void> {
    await this.put(STORES.SETTINGS, { key, value, timestamp: Date.now() });
  }

  // الحصول على إعداد
  async getSetting<T>(key: string): Promise<T | null> {
    const setting = await this.get<{ key: string; value: T; timestamp: number }>(STORES.SETTINGS, key);
    return setting?.value ?? null;
  }

  // إحصائيات التخزين
  async getStorageStats(): Promise<{
    words: number;
    categories: number;
    notes: number;
    pendingSync: number;
    totalSize: string;
  }> {
    const [words, categories, notes, pendingSync] = await Promise.all([
      this.count(STORES.WORDS),
      this.count(STORES.CATEGORIES),
      this.count(STORES.NOTES),
      this.count(STORES.PENDING_SYNC),
    ]);

    // تقدير حجم التخزين
    const estimate = await navigator.storage?.estimate?.();
    const usedMB = estimate ? (estimate.usage || 0) / (1024 * 1024) : 0;

    return {
      words,
      categories,
      notes,
      pendingSync,
      totalSize: `${usedMB.toFixed(2)} MB`,
    };
  }

  // مسح جميع البيانات
  async clearAll(): Promise<void> {
    const storeNames = Object.values(STORES);
    await Promise.all(storeNames.map(name => this.clear(name)));
    console.log('[OfflineDB] All data cleared');
  }

  // إغلاق قاعدة البيانات
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('[OfflineDB] Database closed');
    }
  }
}

// تصدير نسخة واحدة من قاعدة البيانات
export const offlineDB = new OfflineDatabase();

// دوال مساعدة مباشرة
export const offlineStorage = {
  // الكلمات
  words: {
    save: async (word: Record<string, unknown> & { id: string }) => {
      await offlineDB.storeLocalData(STORES.WORDS, word, false);
      await offlineDB.addToSyncQueue({
        type: 'word',
        action: 'create',
        data: word,
        timestamp: Date.now(),
      });
    },
    getAll: () => offlineDB.getAll<LocalDataItem>(STORES.WORDS),
    get: (id: string) => offlineDB.get<LocalDataItem>(STORES.WORDS, id),
    delete: async (id: string) => {
      await offlineDB.delete(STORES.WORDS, id);
      await offlineDB.addToSyncQueue({
        type: 'word',
        action: 'delete',
        data: { id },
        timestamp: Date.now(),
      });
    },
  },

  // التصنيفات
  categories: {
    save: async (category: Record<string, unknown> & { id: string }) => {
      await offlineDB.storeLocalData(STORES.CATEGORIES, category, false);
      await offlineDB.addToSyncQueue({
        type: 'category',
        action: 'create',
        data: category,
        timestamp: Date.now(),
      });
    },
    getAll: () => offlineDB.getAll<LocalDataItem>(STORES.CATEGORIES),
    delete: async (id: string) => {
      await offlineDB.delete(STORES.CATEGORIES, id);
      await offlineDB.addToSyncQueue({
        type: 'category',
        action: 'delete',
        data: { id },
        timestamp: Date.now(),
      });
    },
  },

  // الملاحظات
  notes: {
    save: async (note: Record<string, unknown> & { id: string }) => {
      await offlineDB.storeLocalData(STORES.NOTES, note, false);
      await offlineDB.addToSyncQueue({
        type: 'note',
        action: 'create',
        data: note,
        timestamp: Date.now(),
      });
    },
    getAll: () => offlineDB.getAll<LocalDataItem>(STORES.NOTES),
    delete: async (id: string) => {
      await offlineDB.delete(STORES.NOTES, id);
      await offlineDB.addToSyncQueue({
        type: 'note',
        action: 'delete',
        data: { id },
        timestamp: Date.now(),
      });
    },
  },

  // الإعدادات
  settings: {
    save: (key: string, value: unknown) => offlineDB.saveSetting(key, value),
    get: <T>(key: string) => offlineDB.getSetting<T>(key),
  },

  // المزامنة
  sync: {
    getPending: () => offlineDB.getPendingSyncItems(),
    removeItem: (id: string) => offlineDB.removeSyncItem(id),
    getStats: () => offlineDB.getStorageStats(),
    clearAll: () => offlineDB.clearAll(),
  },
};

export default offlineDB;
