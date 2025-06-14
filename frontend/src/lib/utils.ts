import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

declare global {
  interface Window {
    electron?: any;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isElectron = () => {
  // Check for Electron-specific APIs
  return typeof window !== 'undefined' && window.electron !== undefined;
};

export const isMobile = () => {
  // Simple user agent check for mobile
  return /Mobi|Android/i.test(navigator.userAgent);
};

// Debounce utility function that handles promises
export const debounce = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<any> => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create a new promise for this call
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};
