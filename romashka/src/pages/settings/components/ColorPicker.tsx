import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, RefreshCw, Eye } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  presets?: string[];
}

const defaultPresets = [
  '#1E40AF', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function ColorPicker({ 
  label, 
  color, 
  onChange, 
  presets = defaultPresets 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const [isValidColor, setIsValidColor] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateHexColor = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    const isValid = validateHexColor(newColor);
    setIsValidColor(isValid);
    
    if (isValid) {
      onChange(newColor);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleColorChange(value.startsWith('#') ? value : `#${value}`);
  };

  const handlePresetClick = (presetColor: string) => {
    handleColorChange(presetColor);
  };

  const generateShades = (baseColor: string): string[] => {
    const shades = [];
    for (let i = 1; i <= 9; i++) {
      const opacity = i / 10;
      shades.push(baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0'));
    }
    return shades;
  };

  const getContrastColor = (hexColor: string): string => {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const generateHarmonies = (baseColor: string): { name: string; colors: string[] }[] => {
    // Simple color harmony generation (complementary, triadic, etc.)
    const hue = parseInt(baseColor.substr(1, 2), 16);
    return [
      {
        name: 'Complementary',
        colors: [baseColor, `#${((hue + 128) % 256).toString(16).padStart(2, '0')}${baseColor.substr(3)}`]
      },
      {
        name: 'Analogous',
        colors: [
          `#${((hue + 30) % 256).toString(16).padStart(2, '0')}${baseColor.substr(3)}`,
          baseColor,
          `#${((hue - 30) % 256).toString(16).padStart(2, '0')}${baseColor.substr(3)}`
        ]
      }
    ];
  };

  return (
    <div ref={pickerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Color Input */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-lg border-2 transition-all ${
            isValidColor 
              ? 'border-gray-300 dark:border-gray-600 hover:border-primary-teal' 
              : 'border-red-300 dark:border-red-600'
          }`}
          style={{ backgroundColor: isValidColor ? color : '#ef4444' }}
        >
          <span className="sr-only">Open color picker</span>
        </button>
        
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={tempColor}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent ${
              isValidColor
                ? 'border-gray-300 dark:border-gray-600'
                : 'border-red-300 dark:border-red-600'
            }`}
            placeholder="#000000"
          />
          {!isValidColor && (
            <p className="text-xs text-red-500 mt-1">Invalid hex color format</p>
          )}
        </div>

        <button
          onClick={() => handleColorChange(presets[Math.floor(Math.random() * presets.length)])}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Random color"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Color Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Preset Colors */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preset Colors
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-primary-teal transition-all relative"
                    style={{ backgroundColor: preset }}
                  >
                    {preset === color && (
                      <Check 
                        className="w-4 h-4 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                        style={{ color: getContrastColor(preset) }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Shades */}
            {isValidColor && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shades & Tints
                </h4>
                <div className="grid grid-cols-9 gap-1">
                  {generateShades(color).map((shade, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorChange(shade)}
                      className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 hover:border-primary-teal transition-all"
                      style={{ backgroundColor: shade }}
                      title={shade}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Native Color Picker */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Color
              </h4>
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>

            {/* Color Information */}
            {isValidColor && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">HEX:</span>
                    <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">{color}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">RGB:</span>
                    <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">
                      {parseInt(color.substr(1, 2), 16)}, {parseInt(color.substr(3, 2), 16)}, {parseInt(color.substr(5, 2), 16)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}