// Import all color images
import blackImg from '../assests/colors/black.png';
import blueImg from '../assests/colors/blue.png';
import grayImg from '../assests/colors/gray.png';
import greenImg from '../assests/colors/green.png';
import orangeImg from '../assests/colors/orange.png';
import pinkImg from '../assests/colors/pink.png';
import purpleImg from '../assests/colors/purple.png';
import redImg from '../assests/colors/red.png';
import whiteImg from '../assests/colors/white.png';
import yellowImg from '../assests/colors/yellow.png';

export interface ColorInfo {
  name: string;
  displayName: string;
  image: string;
  hexCode?: string;
}

// Color mapping with image assets
export const COLOR_MAP: Record<string, ColorInfo> = {
  'black': {
    name: 'black',
    displayName: 'Black',
    image: blackImg,
    hexCode: '#000000'
  },
  'blue': {
    name: 'blue',
    displayName: 'Blue',
    image: blueImg,
    hexCode: '#0000FF'
  },
  'gray': {
    name: 'gray',
    displayName: 'Gray',
    image: grayImg,
    hexCode: '#808080'
  },
  'grey': {
    name: 'gray', // Map grey to gray for consistency
    displayName: 'Gray',
    image: grayImg,
    hexCode: '#808080'
  },
  'green': {
    name: 'green',
    displayName: 'Green',
    image: greenImg,
    hexCode: '#008000'
  },
  'orange': {
    name: 'orange',
    displayName: 'Orange',
    image: orangeImg,
    hexCode: '#FFA500'
  },
  'pink': {
    name: 'pink',
    displayName: 'Pink',
    image: pinkImg,
    hexCode: '#FFC0CB'
  },
  'purple': {
    name: 'purple',
    displayName: 'Purple',
    image: purpleImg,
    hexCode: '#800080'
  },
  'red': {
    name: 'red',
    displayName: 'Red',
    image: redImg,
    hexCode: '#FF0000'
  },
  'white': {
    name: 'white',
    displayName: 'White',
    image: whiteImg,
    hexCode: '#FFFFFF'
  },
  'yellow': {
    name: 'yellow',
    displayName: 'Yellow',
    image: yellowImg,
    hexCode: '#FFFF00'
  },
  // Additional common color variations
  'navy': {
    name: 'blue', // Map navy to blue
    displayName: 'Navy',
    image: blueImg,
    hexCode: '#000080'
  },
  'beige': {
    name: 'yellow', // Map beige to yellow as closest match
    displayName: 'Beige',
    image: yellowImg,
    hexCode: '#F5F5DC'
  }
};

// Get all available colors
export const getAvailableColors = (): ColorInfo[] => {
  // Get unique colors by name to avoid duplicates
  const uniqueColors = new Map<string, ColorInfo>();

  Object.values(COLOR_MAP).forEach(color => {
    if (!uniqueColors.has(color.name)) {
      uniqueColors.set(color.name, color);
    }
  });

  return Array.from(uniqueColors.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
};

// Get color info by name (case-insensitive)
export const getColorInfo = (colorName: string): ColorInfo | null => {
  if (!colorName) return null;

  const normalizedName = colorName.toLowerCase().trim();
  return COLOR_MAP[normalizedName] || null;
};

// Get color image by name with fallback
export const getColorImage = (colorName: string): string => {
  const colorInfo = getColorInfo(colorName);
  return colorInfo?.image || '';
};

// Get color display name
export const getColorDisplayName = (colorName: string): string => {
  const colorInfo = getColorInfo(colorName);
  return colorInfo?.displayName || colorName;
};

// Check if color has an image available
export const hasColorImage = (colorName: string): boolean => {
  return getColorInfo(colorName) !== null;
};

// Normalize color name for database consistency
export const normalizeColorName = (colorName: string): string => {
  const colorInfo = getColorInfo(colorName);
  return colorInfo?.name || colorName.toLowerCase().trim();
};

// Get hex code for color
export const getColorHex = (colorName: string): string | null => {
  const colorInfo = getColorInfo(colorName);
  return colorInfo?.hexCode || null;
};

// Get all color names that map to images
export const getImageColorNames = (): string[] => {
  return Object.keys(COLOR_MAP);
};

// Validate if a color name exists in our mapping
export const isValidColor = (colorName: string): boolean => {
  return hasColorImage(colorName);
};

export default {
  COLOR_MAP,
  getAvailableColors,
  getColorInfo,
  getColorImage,
  getColorDisplayName,
  hasColorImage,
  normalizeColorName,
  getColorHex,
  getImageColorNames,
  isValidColor
};