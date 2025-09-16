/*
  Dynamic Color Palette Utility

  This utility loads color values from environment variables
  and applies them as CSS custom properties at runtime.
*/

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
}

// Default color palette (fallback values)
const defaultColors: ColorPalette = {
  primary: '#005147',
  secondary: '#ea553b',
  accent: '#ba2b2b',
  dark: '#000000',
  light: '#ffffff',
};

// Load colors from environment variables
export const getColorPalette = (): ColorPalette => {
  return {
    primary: import.meta.env.VITE_COLOR_PRIMARY || defaultColors.primary,
    secondary: import.meta.env.VITE_COLOR_SECONDARY || defaultColors.secondary,
    accent: import.meta.env.VITE_COLOR_ACCENT || defaultColors.accent,
    dark: import.meta.env.VITE_COLOR_DARK || defaultColors.dark,
    light: import.meta.env.VITE_COLOR_LIGHT || defaultColors.light,
  };
};

// Apply color palette to CSS custom properties
export const applyColorPalette = (colors?: ColorPalette): void => {
  const palette = colors || getColorPalette();

  const root = document.documentElement;
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-secondary', palette.secondary);
  root.style.setProperty('--color-accent', palette.accent);
  root.style.setProperty('--color-dark', palette.dark);
  root.style.setProperty('--color-light', palette.light);
};

// Initialize color palette on app load
export const initializeColorPalette = (): void => {
  applyColorPalette();
};

// Export the current color palette
export { defaultColors };
export type { ColorPalette };