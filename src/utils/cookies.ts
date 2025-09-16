export const setCookie = (name: string, value: string, days: number = 7): void => {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    // Remove Secure flag for localhost/development
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  } catch (error) {
    console.warn('Cookie set failed, falling back to localStorage:', error);
    localStorage.setItem(name, value);
  }
};

export const getCookie = (name: string): string | null => {
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='));

    if (cookie) {
      return decodeURIComponent(cookie.split('=')[1]);
    }

    // Fallback to localStorage
    return localStorage.getItem(name);
  } catch (error) {
    console.warn('Cookie get failed, falling back to localStorage:', error);
    return localStorage.getItem(name);
  }
};

export const deleteCookie = (name: string): void => {
  try {
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secureFlag}`;
    // Also remove from localStorage fallback
    localStorage.removeItem(name);
  } catch (error) {
    console.warn('Cookie delete failed, falling back to localStorage:', error);
    localStorage.removeItem(name);
  }
};

export const cookieStorage = {
  getItem: (name: string): string | null => getCookie(name),
  setItem: (name: string, value: string): void => setCookie(name, value),
  removeItem: (name: string): void => deleteCookie(name),
};