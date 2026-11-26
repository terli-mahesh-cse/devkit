/**
 * Safe localStorage wrapper with try/catch
 */
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (err) {
      console.warn(`[storage] Failed reading ${key}:`, err);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storage] Failed writing ${key}:`, err);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.warn(`[storage] Failed removing ${key}:`, err);
      return false;
    }
  }
};
