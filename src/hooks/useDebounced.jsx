// hooks/useDebouncedValue.js
import { useState, useEffect } from 'react';

/**
 * Trả về giá trị sau khi delay một khoảng thời gian nhất định (debounce)
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian debounce (ms)
 * @returns {any} Giá trị debounce
 */
const useDebounced = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // clear timer nếu value thay đổi trước khi hết delay
  }, [value, delay]);

  return debounced;
};

export default useDebounced;