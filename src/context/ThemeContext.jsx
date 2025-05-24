// ThemeContext.jsx
import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const LOCAL_KEY = 'dark_mode_enabled';

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored === 'true'; // đảm bảo là boolean
  });

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(LOCAL_KEY, darkMode);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
