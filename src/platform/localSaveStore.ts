// Offline-first local save slots (IndexedDB) — bead 84a.2.
// Browser path uses IndexedDB; non-browser hosts (SSR, node checks) fall back
// to an in-memory map with the same async contract. All methods are
// best-effort and never throw — persistence must not break gameplay.

export interface LocalSlotRecord {
  slot: string;
  payload: string;
  updatedAt: number;
}

const DB_NAME = 'rst-saves';
const STORE_NAME = 'slots';

const memFallback = new Map<string, LocalSlotRecord>();

const hasIndexedDB = (): boolean => {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME, { keyPath: 'slot' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('indexeddb-open'));
      req.onblocked = () => reject(new Error('indexeddb-blocked'));
    } catch (e) {
      reject(e);
    }
  });

const withStore = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      let settled = false;
      const tx = db.transaction(STORE_NAME, mode);
      tx.oncomplete = () => {
        if (!settled) {
          settled = true;
          reject(new Error('indexeddb-no-result'));
        }
      };
      tx.onerror = () => {
        if (!settled) {
          settled = true;
          reject(tx.error ?? new Error('indexeddb-tx'));
        }
      };
      let req: IDBRequest<T>;
      try {
        req = fn(tx.objectStore(STORE_NAME));
      } catch (e) {
        if (!settled) {
          settled = true;
          reject(e);
        }
        return;
      }
      req.onsuccess = () => {
        if (!settled) {
          settled = true;
          resolve(req.result);
        }
      };
      req.onerror = () => {
        if (!settled) {
          settled = true;
          reject(req.error ?? new Error('indexeddb-request'));
        }
      };
    });
  } finally {
    db.close();
  }
};

/** Persist one slot locally (mirror of the localStorage career save). */
export const writeLocalSaveSlot = async (slot: string, payload: string): Promise<boolean> => {
  const record: LocalSlotRecord = { slot, payload, updatedAt: Date.now() };
  if (!hasIndexedDB()) {
    memFallback.set(slot, record);
    return true;
  }
  try {
    await withStore('readwrite', (store) => store.put(record));
    return true;
  } catch {
    memFallback.set(slot, record);
    return false;
  }
};

/** Read one slot. Null when missing or unreadable. */
export const readLocalSaveSlot = async (slot: string): Promise<LocalSlotRecord | null> => {
  if (!hasIndexedDB()) return memFallback.get(slot) ?? null;
  try {
    const got = await withStore('readonly', (store) => store.get(slot));
    return (got as LocalSlotRecord | undefined) ?? memFallback.get(slot) ?? null;
  } catch {
    return memFallback.get(slot) ?? null;
  }
};

/** Slot summaries ordered by recency (newest first). */
export const listLocalSaveSlots = async (): Promise<LocalSlotRecord[]> => {
  if (!hasIndexedDB()) {
    return [...memFallback.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  try {
    const all = await withStore('readonly', (store) => store.getAll());
    const rows = ((all as unknown as LocalSlotRecord[] | undefined) ?? []).slice();
    for (const m of memFallback.values()) {
      if (!rows.some((r) => r.slot === m.slot)) rows.push(m);
    }
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [...memFallback.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }
};

/** Delete one slot everywhere we may hold it. */
export const deleteLocalSaveSlot = async (slot: string): Promise<boolean> => {
  memFallback.delete(slot);
  if (!hasIndexedDB()) return true;
  try {
    await withStore('readwrite', (store) => store.delete(slot));
    return true;
  } catch {
    return false;
  }
};

/** Test seam: clear the in-memory fallback. */
export const resetLocalSaveStoreForTests = (): void => {
  memFallback.clear();
};
