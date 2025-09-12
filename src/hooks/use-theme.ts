/**
 * useTheme Hook
 * 
 * Custom React hook for theme management integration with next-themes.
 */

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export interface ThemeHook {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  systemTheme: 'light' | 'dark';
  mounted: boolean;
}

export function useTheme(): ThemeHook {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure we have safe defaults before mounting
  const safeTheme = mounted ? (theme as 'light' | 'dark' | 'system') || 'system' : 'system';
  const safeResolvedTheme = mounted ? (resolvedTheme as 'light' | 'dark') || 'light' : 'light';
  const safeSystemTheme = mounted ? (systemTheme as 'light' | 'dark') || 'light' : 'light';

  return {
    theme: safeTheme,
    resolvedTheme: safeResolvedTheme,
    setTheme: (newTheme: 'light' | 'dark' | 'system') => {
      if (mounted) {
        setTheme(newTheme);
      }
    },
    systemTheme: safeSystemTheme,
    mounted
  };
}