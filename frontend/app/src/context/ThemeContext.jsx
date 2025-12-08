import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  light: {
    primary: '#FFFFFF',       /* Fresh sky - Liffey River */
    secondary: '#FFFFFF',     /* Cerulean - Dublin Bay */
    accent: '#11add4ff',        /* Deep space blue - Georgian doors */
    background: '#FFFFFF',    /* White */
    text: '#00171F',          /* Ink black */
    surface: '#F8F9FA',       /* Very light gray */
    border: '#E0E0E0',        /* Light border */
    sidebar: '#3fb8f0ff',       /* Dark sidebar */
    success: '#28a745',
    error: '#dc3545'
  },
  dark: {
    primary: '#132a35',       /* Bright Liffey blue */
    secondary: '#132a35',     /* Sky blue */
    accent: '#FF6B6B',        /* Georgian door red accent */
    background: '#0d212a',    /* Deep Dublin night sky */
    text: '#FFFFFF',          /* White text */
    surface: '#132a35',       /* Deep blue cards */
    border: '#007EA7',        /* Blue border */
    sidebar: '#00171F',       /* Darkest sidebar */
    success: '#28a745',
    error: '#FF6B6B'
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