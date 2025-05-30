import { useState, useEffect } from "react";

function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(initialValue);

  // Initialize on client-side only
  useEffect(() => {
    try {
      // Get from local storage by key
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        const value = item ? JSON.parse(item) : initialValue;
        setStoredValue(value);
      }
    } catch (error) {
      console.error(error);
      // If error also return initialValue
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const clearValue = () => {
    try {
      // Save state
      setStoredValue(initialValue);

      // Remove from local storage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue, clearValue];
}

export { useLocalStorage };