import { usePrivateStorage } from '../../../shared/PrivateWorkspaceGate';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface StorageOptions<T> {
  key: string;
  initialValue: T;
  enableAutoSave?: boolean;
}

export function useLocalStorage<T>({
  key,
  initialValue,
  enableAutoSave = true,
}: StorageOptions<T>): [T, (value: T | ((val: T) => T)) => void, { lastSaved: Date | null; isAutoSaveOn: boolean; setIsAutoSaveOn: (val: boolean) => void; resetToDefault: () => void }] {
  const localStorage = usePrivateStorage();
  const [isAutoSaveOn, setIsAutoSaveOn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`autosave_pref_${key}`);
      return saved !== null ? JSON.parse(saved) : enableAutoSave;
    } catch {
      return enableAutoSave;
    }
  });

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? new Date() : null;
    } catch {
      return null;
    }
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    try {
      localStorage.setItem(`autosave_pref_${key}`, JSON.stringify(isAutoSaveOn));
    } catch (e) {
      console.error(e);
    }
  }, [key, isAutoSaveOn]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isAutoSaveOn) return;

    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
      setLastSaved(new Date());
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, isAutoSaveOn]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        if (isAutoSaveOn) {
          try {
            localStorage.setItem(key, JSON.stringify(nextValue));
            setLastSaved(new Date());
          } catch (error) {
            console.error(`Error saving to localStorage key "${key}":`, error);
          }
        }
        return nextValue;
      });
    },
    [key, isAutoSaveOn]
  );

  const resetToDefault = useCallback(() => {
    setStoredValue(initialValue);
    if (isAutoSaveOn) {
      try {
        localStorage.setItem(key, JSON.stringify(initialValue));
        setLastSaved(new Date());
      } catch (e) {
        console.error(e);
      }
    }
  }, [key, initialValue, isAutoSaveOn]);

  return [storedValue, setValue, { lastSaved, isAutoSaveOn, setIsAutoSaveOn, resetToDefault }];
}
