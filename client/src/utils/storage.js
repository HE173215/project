// LocalStorage helpers

// Save to localStorage
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Get from localStorage
export const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting from localStorage:', error);
    return null;
  }
};

// Remove from localStorage
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Clear all localStorage
export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Token helpers
export const saveToken = (token) => saveToStorage('token', token);
export const getToken = () => getFromStorage('token');
export const removeToken = () => removeFromStorage('token');

// User helpers
export const saveUser = (user) => saveToStorage('user', user);
export const getUser = () => getFromStorage('user');
export const removeUser = () => removeFromStorage('user');
