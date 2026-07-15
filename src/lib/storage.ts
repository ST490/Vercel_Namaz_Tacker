import { getMany, set as idbSet, del as idbDel, clear as idbClear, keys as idbKeys } from 'idb-keyval';

/**
 * StorageAdapter interface
 * Uses idb-keyval (IndexedDB) as backend with an in-memory cache
 * to provide a synchronous interface for the rest of the app.
 */

const cache = new Map();

// Load all data from IndexedDB into memory on startup
export const initStorage = async () => {
  try {
    const allKeys = await idbKeys();
    const values = await getMany(allKeys);
    allKeys.forEach((key, i) => {
      cache.set(key, values[i]);
    });
  } catch (e) {
    console.error('Failed to initialize storage from IndexedDB:', e);
  }
};

export const storage = {
  get(key) {
    return cache.get(key);
  },

  set(key, value) {
    cache.set(key, value);
    idbSet(key, value).catch(e => console.error(`Failed to set ${key} in IDB:`, e));
  },

  remove(key) {
    cache.delete(key);
    idbDel(key).catch(e => console.error(`Failed to remove ${key} from IDB:`, e));
  },

  clear() {
    cache.clear();
    idbClear().catch(e => console.error('Failed to clear IDB:', e));
  }
};
