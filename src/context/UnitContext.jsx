import React, { createContext, useState, useEffect } from 'react';

// Tạo context
export const UnitContext = createContext();

export const UnitProvider = ({ children }) => {
  const LOCAL_KEY = 'until_toggle';

  const [unit, setUnit] = useState('metric'); // Mặc định là 'metric'

  // Lấy unit từ localStorage khi load app
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.value) {
          setUnit(parsed.value);
        }
      } catch (e) {
        console.error('Lỗi parse unit từ localStorage:', e);
      }
    }
  }, []);

  // Hàm để đổi unit và lưu vào localStorage
  const toggleUnit = () => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    const newState = unit === 'metric' ? true : false;
    setUnit(newUnit);
    localStorage.setItem(LOCAL_KEY, JSON.stringify({state:newState, value: newUnit }));
  };

  return (
    <UnitContext.Provider value={{ unit, toggleUnit }}>
      {children}
    </UnitContext.Provider>
  );
};
