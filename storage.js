/* ========================================
   EXAMETRY 0.01 — Storage Module
   IndexedDB Wrapper, Key Obfuscation
   ======================================== */

const ExaDB = {
  DB_NAME: 'ExametryDB',
  DB_VERSION: 1,
  db: null,

  STORES: {
    users: 'users',
    studyEntries: 'studyEntries',
    chatConversations: 'chatConversations',
    chatMessages: 'chatMessages',
    quizRecords: 'quizRecords',
    flashcardRecords: 'flashcardRecords',
    questionRecords: 'questionRecords',
    settings: 'settings'
  },

  /** Initialize IndexedDB */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        // Create object stores with auto-increment
        if (!db.objectStoreNames.contains('users'))
          db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('studyEntries'))
          db.createObjectStore('studyEntries', { keyPath: 'id', autoIncrement: false });
        if (!db.objectStoreNames.contains('chatConversations'))
          db.createObjectStore('chatConversations', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('chatMessages'))
          db.createObjectStore('chatMessages', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('quizRecords'))
          db.createObjectStore('quizRecords', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('flashcardRecords'))
          db.createObjectStore('flashcardRecords', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('questionRecords'))
          db.createObjectStore('questionRecords', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings'))
          db.createObjectStore('settings', { keyPath: 'key' });
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e.target.error);
        reject(e.target.error);
      };
    });
  },

  /** Generic put operation */
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  /** Generic get by key */
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  /** Get all records from a store */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  /** Delete a record by key */
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /** Clear all records in a store */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /** Generate unique ID */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

/* ---------- Key Obfuscation (base64 + XOR) ---------- */
const KeyVault = {
  _xorKey: 0x5A,

  encode(plainText) {
    if (!plainText) return '';
    // XOR each char then base64 encode
    const xored = Array.from(plainText).map(c =>
      String.fromCharCode(c.charCodeAt(0) ^ this._xorKey)
    ).join('');
    return btoa(xored);
  },

  decode(encoded) {
    if (!encoded) return '';
    try {
      const xored = atob(encoded);
      return Array.from(xored).map(c =>
        String.fromCharCode(c.charCodeAt(0) ^ this._xorKey)
      ).join('');
    } catch {
      return '';
    }
  },

  /** Save API key to IndexedDB */
  async saveKey(provider, key) {
    const encoded = this.encode(key);
    await ExaDB.put('settings', { key: `apikey_${provider}`, value: encoded });
  },

  /** Get API key from IndexedDB */
  async getKey(provider) {
    const record = await ExaDB.get('settings', `apikey_${provider}`);
    return record ? this.decode(record.value) : '';
  }
};

/* ---------- Settings Helpers ---------- */
const Settings = {
  async get(key, defaultValue = null) {
    const record = await ExaDB.get('settings', key);
    return record ? record.value : defaultValue;
  },

  async set(key, value) {
    await ExaDB.put('settings', { key, value });
  },

  /** Get current user profile */
  async getProfile() {
    const userId = localStorage.getItem('exa_current_user');
    if (!userId) return null;
    return await ExaDB.get('users', userId);
  },

  /** Update user profile */
  async updateProfile(data) {
    const userId = localStorage.getItem('exa_current_user');
    if (!userId) return;
    const existing = await ExaDB.get('users', userId) || {};
    await ExaDB.put('users', { ...existing, ...data, id: userId });
  }
};

/* ---------- Data Export/Import ---------- */
const DataManager = {
  async exportAll() {
    const data = {};
    for (const [name, store] of Object.entries(ExaDB.STORES)) {
      data[name] = await ExaDB.getAll(store);
    }
    data._exportDate = new Date().toISOString();
    data._version = '0.01';
    return JSON.stringify(data, null, 2);
  },

  async importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      for (const [name, store] of Object.entries(ExaDB.STORES)) {
        if (data[name] && Array.isArray(data[name])) {
          await ExaDB.clear(store);
          for (const item of data[name]) {
            await ExaDB.put(store, item);
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  async deleteAll() {
    for (const store of Object.values(ExaDB.STORES)) {
      await ExaDB.clear(store);
    }
    localStorage.clear();
  },

  downloadJSON(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
