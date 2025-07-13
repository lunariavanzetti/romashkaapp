import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Eye, RotateCcw, Copy, Check, AlertTriangle } from 'lucide-react';
import { BrandConfig } from './BrandSettings';

interface ColorCustomizerProps {
  config: BrandConfig;
  onConfigUpdate: (updates: Partial<BrandConfig>) => void;
}

interface ColorItem {
  id: keyof BrandConfig['colors'];
  label: string;
  description: string;
  category: 'primary' | 'semantic' | 'neutral';
}

const colorItems: ColorItem[] = [
  {
    id: 'primary',
    label: 'Primary',
    description: 'Main brand color for buttons and highlights',
    category: 'primary'
  },
  {
    id: 'secondary',
    label: 'Secondary',
    description: 'Secondary accent color',
    category: 'primary'
  },
  {
    id: 'accent',
    label: 'Accent',
    description: 'Accent color for CTAs and emphasis',
    category: 'primary'
  },
  {
    id: 'success',
    label: 'Success',
    description: 'Color for success messages and indicators',
    category: 'semantic'
  },
  {
    id: 'warning',
    label: 'Warning',
    description: 'Color for warning messages and alerts',
    category: 'semantic'
  },
  {
    id: 'error',
    label: 'Error',
    description: 'Color for error messages and alerts',
    category: 'semantic'
  },
  {
    id: 'background',
    label: 'Background',
    description: 'Primary background color',
    category: 'neutral'
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Primary text color',
    category: 'neutral'
  }
];

const colorPresets = {
  'Default': {
    primary: '#1a365d',
    secondary: '#38b2ac',
    accent: '#ed8936',
    success: '#48bb78',
    warning: '#ecc94b',
    error: '#f56565',
    background: '#ffffff',
    text: '#2d3748'
  },
  'Ocean': {
    primary: '#0891b2',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#f8fafc',
    text: '#1e293b'
  },
  'Forest': {
    primary: '#166534',
    secondary: '#059669',
    accent: '#dc2626',
    success: '#22c55e',
    warning: '#eab308',
    error: '#dc2626',
    background: '#f9fafb',
    text: '#111827'
  },
  'Sunset': {
    primary: '#dc2626',
    secondary: '#ea580c',
    accent: '#d97706',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
    background: '#fef2f2',
    text: '#1f2937'
  },
  'Night': {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#111827',
    text: '#f9fafb'
  }
};

export default function ColorCustomizer({ config, onConfigUpdate }: ColorCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [contrastResults, setContrastResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkColorContrast();
  }, [config.colors]);

  const checkColorContrast = () => {
    const results: Record<string, boolean> = {};
    
    // Check primary colors against background
    const bgColor = config.colors.background;
    const textColor = config.colors.text;
    
    // Simple contrast check (in real app, use proper WCAG contrast calculation)
    Object.entries(config.colors).forEach(([key, color]) => {
      if (key !== 'background' && key !== 'text') {
        results[key] = checkContrast(color, bgColor);
      }
    });
    
    setContrastResults(results);
  };

  const checkContrast = (color1: string, color2: string): boolean => {
    // Simplified contrast check - in real app, use proper WCAG algorithm
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const brightness1 = (r1 * 299 + g1 * 587 + b1 * 114) / 1000;
    const brightness2 = (r2 * 299 + g2 * 587 + b2 * 114) / 1000;
    
    return Math.abs(brightness1 - brightness2) > 125;
  };

  const updateColor = (colorId: string, value: string) => {
    onConfigUpdate({
      colors: {
        ...config.colors,
        [colorId]: value
      }
    });
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const applyPreset = (presetName: string) => {
    const preset = colorPresets[presetName as keyof typeof colorPresets];
    if (preset) {
      onConfigUpdate({
        colors: {
          ...config.colors,
          ...preset
        }
      });
    }
  };

  const generatePalette = () => {
    // Simple palette generation based on primary color
    const primary = config.colors.primary;
    const hsl = hexToHsl(primary);
    
    const palette = {
      primary: primary,
      secondary: hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      accent: hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: hsl.l > 50 ? '#ffffff' : '#111827',
      text: hsl.l > 50 ? '#111827' : '#ffffff'
    };
    
    onConfigUpdate({
      colors: {
        ...config.colors,
        ...palette
      }
    });
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.substr(1, 2), 16) / 255;
    const g = parseInt(hex.substr(3, 2), 16) / 255;
    const b = parseInt(hex.substr(5, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const renderColorPicker = (colorItem: ColorItem) => {
    const colorValue = config.colors[colorItem.id];
    const hasContrastIssue = contrastResults[colorItem.id] === false;

    return (
      <div 
        key={colorItem.id}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm">{colorItem.label}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">{colorItem.description}</p>
          </div>
          {hasContrastIssue && (
            <div title="Contrast ratio may be too low">
              <AlertTriangle className="text-amber-500" size={16} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Color Preview */}
          <div
            className="w-full h-16 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: colorValue }}
            onClick={() => setSelectedColor(colorItem.id)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono bg-black/20 text-white px-2 py-1 rounded">
                {colorValue}
              </span>
            </div>
          </div>

          {/* Color Input */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorValue}
              onChange={(e) => updateColor(colorItem.id, e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={colorValue}
              onChange={(e) => updateColor(colorItem.id, e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-teal focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => copyColor(colorValue)}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary-teal transition-colors"
              title="Copy color"
            >
              {copiedColor === colorValue ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const groupedColors = {
    primary: colorItems.filter(item => item.category === 'primary'),
    semantic: colorItems.filter(item => item.category === 'semantic'),
    neutral: colorItems.filter(item => item.category === 'neutral')
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Color Customization</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize your brand colors and ensure accessibility
          </p>
        </div>
        <button
          onClick={generatePalette}
          className="flex items-center gap-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-primary-teal-dark transition-colors"
        >
          <Palette size={16} />
          Generate Palette
        </button>
      </div>

      {/* Color Presets */}
      <div className="space-y-3">
        <h4 className="font-medium">Color Presets</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(colorPresets).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-teal transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.secondary }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                </div>
              </div>
              <span className="text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Colors */}
      <div className="space-y-3">
        <h4 className="font-medium">Primary Colors</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groupedColors.primary.map(renderColorPicker)}
        </div>
      </div>

      {/* Semantic Colors */}
      <div className="space-y-3">
        <h4 className="font-medium">Semantic Colors</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groupedColors.semantic.map(renderColorPicker)}
        </div>
      </div>

      {/* Neutral Colors */}
      <div className="space-y-3">
        <h4 className="font-medium">Neutral Colors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedColors.neutral.map(renderColorPicker)}
        </div>
      </div>

      {/* Accessibility Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">🌐 Accessibility Guidelines</h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Ensure sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)</li>
          <li>• Test colors with color blindness simulators</li>
          <li>• Avoid using color alone to convey information</li>
          <li>• Consider how colors appear in different lighting conditions</li>
        </ul>
      </div>
    </div>
  );
}