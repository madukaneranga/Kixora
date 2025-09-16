import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorInfo, ColorInfo } from '../../services/colorService';

export interface ColorSelectorProps {
  colors: string[];
  selectedColors: string[];
  onColorSelect: (color: string) => void;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  disabledColors?: string[];
  showNames?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

const SIZE_CHECK_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6'
};

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColors,
  onColorSelect,
  multiple = false,
  size = 'md',
  disabled = false,
  disabledColors = [],
  showNames = false,
  className = ''
}) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const handleColorClick = (colorName: string) => {
    if (disabled || disabledColors.includes(colorName)) return;

    if (multiple) {
      onColorSelect(colorName);
    } else {
      // For single selection, toggle if same color, otherwise select new color
      const newColor = selectedColors.includes(colorName) ? '' : colorName;
      onColorSelect(newColor);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {colors.map((colorName) => {
        const colorInfo = getColorInfo(colorName);
        const isSelected = selectedColors.includes(colorName);
        const isDisabled = disabled || disabledColors.includes(colorName);

        if (!colorInfo) {
          // Fallback for colors without images
          return (
            <div
              key={colorName}
              className={`
                ${SIZE_CLASSES[size]}
                rounded-full border-2 bg-gray-200 flex items-center justify-center
                ${isSelected ? 'border-black' : 'border-gray-300'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-black'}
              `}
              onClick={() => handleColorClick(colorName)}
              title={colorName}
            >
              <span className="text-xs text-gray-600">?</span>
            </div>
          );
        }

        return (
          <motion.div
            key={colorName}
            className="relative"
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            onMouseEnter={() => setHoveredColor(colorName)}
            onMouseLeave={() => setHoveredColor(null)}
          >
            <button
              onClick={() => handleColorClick(colorName)}
              disabled={isDisabled}
              className={`
                ${SIZE_CLASSES[size]}
                relative rounded-full border-2 overflow-hidden transition-all duration-200
                ${isSelected
                  ? 'border-black shadow-md ring-2 ring-black ring-opacity-20'
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md'
                }
                focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50
              `}
            >
              <img
                src={colorInfo.image}
                alt={colorInfo.displayName}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"
                >
                  <Check
                    size={SIZE_CHECK_CLASSES[size].includes('w-3') ? 12 :
                          SIZE_CHECK_CLASSES[size].includes('w-4') ? 16 : 24}
                    className="text-white drop-shadow-sm"
                  />
                </motion.div>
              )}

              {/* Disabled overlay */}
              {isDisabled && (
                <div className="absolute inset-0 bg-gray-500 bg-opacity-40" />
              )}
            </button>

            {/* Tooltip - only render when hovering */}
            <AnimatePresence>
              {hoveredColor === colorName && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded pointer-events-none whitespace-nowrap z-50"
                >
                  {colorInfo.displayName}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Color name below (optional) */}
            {showNames && (
              <p className="text-xs text-gray-600 text-center mt-1 truncate">
                {colorInfo.displayName}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ColorSelector;