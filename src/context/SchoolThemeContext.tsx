import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  description: string;
}

export const SCHOOL_COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Classic Royal & Gold',
    primary: '#1E40AF', // Royal Blue
    secondary: '#F59E0B', // Amber Gold
    description: 'Traditional academic elegance'
  },
  {
    name: 'Forest Emerald & Mint',
    primary: '#065F46', // Deep Emerald
    secondary: '#10B981', // Mint Green
    description: 'Fresh, vibrant and growth-focused'
  },
  {
    name: 'Imperial Purple & Coral',
    primary: '#6D28D9', // Deep Violet
    secondary: '#F43F5E', // Rose Coral
    description: 'Modern, creative and prestigious'
  },
  {
    name: 'Navy Blue & Sky Cyan',
    primary: '#0F172A', // Midnight Slate
    secondary: '#0284C7', // Sky Cyan
    description: 'Crisp, professional and authoritative'
  },
  {
    name: 'Crimson Red & Warm Orange',
    primary: '#991B1B', // Crimson
    secondary: '#EA580C', // Sunset Orange
    description: 'Energetic, bold and dynamic'
  },
  {
    name: 'Deep Teal & Sunset Amber',
    primary: '#115E59', // Deep Teal
    secondary: '#D97706', // Warm Amber
    description: 'Balanced, sophisticated and inspiring'
  }
];

export const PRIMARY_PALETTE = [
  '#1E40AF', // Blue 800
  '#1E3A8A', // Blue 900
  '#0F172A', // Slate 900
  '#065F46', // Emerald 800
  '#047857', // Emerald 700
  '#6D28D9', // Purple 700
  '#4C1D95', // Purple 900
  '#991B1B', // Red 800
  '#B91C1C', // Red 700
  '#115E59', // Teal 800
  '#134E4A', // Teal 900
  '#312E81', // Indigo 900
  '#4338CA', // Indigo 700
  '#831843', // Pink 900
];

export const SECONDARY_PALETTE = [
  '#F59E0B', // Amber 500
  '#D97706', // Amber 600
  '#10B981', // Emerald 500
  '#059669', // Emerald 600
  '#06B6D4', // Cyan 500
  '#0284C7', // Sky 600
  '#F43F5E', // Rose 500
  '#EA580C', // Orange 600
  '#8B5CF6', // Purple 500
  '#EC4899', // Pink 500
  '#14B8A6', // Teal 500
  '#84CC16', // Lime 500
  '#EAB308', // Yellow 500
  '#6366F1', // Indigo 500
];

export interface SchoolThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  applyPreset: (preset: ColorPreset) => void;
  saveColors: () => boolean;
  resetColors: () => void;
  isCustomized: boolean;
}

const DEFAULT_PRIMARY = '#1E40AF';
const DEFAULT_SECONDARY = '#F59E0B';

export const SchoolThemeContext = createContext<SchoolThemeContextType | undefined>(undefined);

// Helper to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16)
    };
  }
  if (cleanHex.length === 6) {
    return {
      r: parseInt(cleanHex.substring(0, 2), 16),
      g: parseInt(cleanHex.substring(2, 4), 16),
      b: parseInt(cleanHex.substring(4, 6), 16)
    };
  }
  return null;
};

// Helper to darken or lighten a hex color
const adjustBrightness = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (val: number) => Math.min(255, Math.max(0, Math.round(val * (1 + percent / 100))));
  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

export const SchoolThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth() ?? {};
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_SECONDARY);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const storageKey = user?._id || user?.schoolId || 'global';

  // Load saved colors on mount or user change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`school_theme_${storageKey}`) || localStorage.getItem('school_theme_default');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.primary) setPrimaryColor(parsed.primary);
        if (parsed.secondary) setSecondaryColor(parsed.secondary);
      } else {
        setPrimaryColor(DEFAULT_PRIMARY);
        setSecondaryColor(DEFAULT_SECONDARY);
      }
    } catch {
      // Ignore JSON parse errors
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Inject CSS custom properties on document root whenever colors change
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);

    root.style.setProperty('--school-primary', primaryColor);
    root.style.setProperty('--school-secondary', secondaryColor);
    root.style.setProperty('--school-primary-dark', adjustBrightness(primaryColor, -18));
    root.style.setProperty('--school-secondary-dark', adjustBrightness(secondaryColor, -18));
    root.style.setProperty('--school-primary-light', adjustBrightness(primaryColor, 35));
    root.style.setProperty('--school-secondary-light', adjustBrightness(secondaryColor, 35));

    if (primaryRgb) {
      root.style.setProperty('--school-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    }
    if (secondaryRgb) {
      root.style.setProperty('--school-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
    }
  }, [primaryColor, secondaryColor, isLoaded]);

  const saveColors = useCallback((): boolean => {
    try {
      const payload = JSON.stringify({ primary: primaryColor, secondary: secondaryColor });
      localStorage.setItem(`school_theme_${storageKey}`, payload);
      localStorage.setItem('school_theme_default', payload);
      return true;
    } catch (e) {
      console.error('Error saving school theme:', e);
      return false;
    }
  }, [primaryColor, secondaryColor, storageKey]);

  const resetColors = useCallback(() => {
    setPrimaryColor(DEFAULT_PRIMARY);
    setSecondaryColor(DEFAULT_SECONDARY);
    try {
      localStorage.removeItem(`school_theme_${storageKey}`);
      localStorage.removeItem('school_theme_default');
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const applyPreset = useCallback((preset: ColorPreset) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  }, []);

  const isCustomized = primaryColor !== DEFAULT_PRIMARY || secondaryColor !== DEFAULT_SECONDARY;

  return (
    <SchoolThemeContext.Provider
      value={{
        primaryColor,
        secondaryColor,
        setPrimaryColor,
        setSecondaryColor,
        applyPreset,
        saveColors,
        resetColors,
        isCustomized
      }}
    >
      {children}
    </SchoolThemeContext.Provider>
  );
};

export const useSchoolTheme = (): SchoolThemeContextType => {
  const context = useContext(SchoolThemeContext);
  if (!context) {
    return {
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
      setPrimaryColor: () => {},
      setSecondaryColor: () => {},
      applyPreset: () => {},
      saveColors: () => false,
      resetColors: () => {},
      isCustomized: false
    };
  }
  return context;
};
