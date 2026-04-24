/**
 * Local data client — replaces the Base44 SDK.
 * All data is persisted in localStorage under the key `namaz_db`.
 */

const DB_KEY = 'namaz_db';

function loadDB() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCollection(name) {
  const db = loadDB();
  return db[name] || [];
}

function saveCollection(name, records) {
  const db = loadDB();
  db[name] = records;
  saveDB(db);
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createEntityClient(entityName) {
  return {
    list(sortField = '-created_date', limit = 1000) {
      let records = getCollection(entityName);
      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        records = [...records].sort((a, b) => {
          if (a[field] < b[field]) return desc ? 1 : -1;
          if (a[field] > b[field]) return desc ? -1 : 1;
          return 0;
        });
      }
      return Promise.resolve(records.slice(0, limit));
    },

    filter(query = {}, sortField = '-created_date', limit = 1000) {
      let records = getCollection(entityName);
      records = records.filter(r =>
        Object.entries(query).every(([k, v]) => r[k] === v)
      );
      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        records = [...records].sort((a, b) => {
          if (a[field] < b[field]) return desc ? 1 : -1;
          if (a[field] > b[field]) return desc ? -1 : 1;
          return 0;
        });
      }
      return Promise.resolve(records.slice(0, limit));
    },

    get(id) {
      const records = getCollection(entityName);
      const record = records.find(r => r.id === id);
      return record ? Promise.resolve(record) : Promise.reject(new Error('Not found'));
    },

    create(data) {
      const records = getCollection(entityName);
      const now = new Date().toISOString();
      const record = {
        ...data,
        id: generateId(),
        created_date: now,
        updated_date: now,
      };
      records.push(record);
      saveCollection(entityName, records);
      return Promise.resolve(record);
    },

    bulkCreate(dataArray) {
      return Promise.all(dataArray.map(d => this.create(d)));
    },

    update(id, data) {
      const records = getCollection(entityName);
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) return Promise.reject(new Error('Not found'));
      records[idx] = { ...records[idx], ...data, updated_date: new Date().toISOString() };
      saveCollection(entityName, records);
      return Promise.resolve(records[idx]);
    },

    delete(id) {
      const records = getCollection(entityName);
      const filtered = records.filter(r => r.id !== id);
      saveCollection(entityName, filtered);
      return Promise.resolve({ id });
    },

    subscribe(callback) {
      // No-op for local store; return unsubscribe fn
      return () => {};
    },
  };
}

export const base44 = {
  entities: new Proxy({}, {
    get(_, entityName) {
      return createEntityClient(entityName);
    }
  }),
};