/**
 * useLocalStorage Hook
 * 
 * Custom React hook for localStorage persistence with type safety.
 */

import { useState, useEffect, useCallback } from 'react';
import { storageLogger } from '@/lib/logger';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      storageLogger.warn(`Error loading localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  // State to track if storage is available
  const [isAvailable, setIsAvailable] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage if available
      if (isAvailable) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      storageLogger.warn(`Error saving localStorage key "${key}"`, error);
    }
  }, [key, storedValue, isAvailable]);

  // Function to clear the localStorage item
  const clearValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (isAvailable) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      storageLogger.warn(`Error clearing localStorage key "${key}"`, error);
    }
  }, [key, initialValue, isAvailable]);

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    if (!isAvailable) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          storageLogger.warn(`Error parsing localStorage change for key "${key}"`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Item was removed
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue, isAvailable]);

  return [storedValue, setValue, clearValue, isAvailable];
}