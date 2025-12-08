import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  light: {
    primary: '#00A7E1',
    secondary: '#007EA7',
    accent: '#003459',
    background: '#FFFFFF',
    text: '#00171F',
    surface: '#F5F5F5',
    border: '#E0E0E0',
    success: '#28a745',
    error: '#dc3545',
  },
  dark: {
    primary: '#00A7E1',
    secondary: '#007EA7',
    accent: '#003459',
    background: '#00171F',
    text: '#FFFFFF',
    surface: '#003459',
    border: '#007EA7',
    success: '#28a745',
    error: '#dc3545',
  }
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}