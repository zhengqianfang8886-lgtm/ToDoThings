
import { Priority, Tag } from './types';

export const COLORS = {
  // Pure UI semantic colors
  ACCENT: '#4C8DFF',
  SUCCESS: '#2ECC71',
  CRITICAL: '#FF5C5C',
  WARNING: '#F5A623',
  INFO: '#9B6BFF',
  
  // High Priority / Critical
  PINK: '#FF5C5C',
  // Completed / Success
  GREEN: '#2ECC71',
  // Accent / Selection
  CYAN: '#4C8DFF',
  // Medium / Warning
  ORANGE: '#F5A623',
  // Decorative
  PURPLE: '#9B6BFF',

  // Dark Theme
  BG_DARK: '#121212',
  SIDEBAR_DARK: '#181818',
  CARD_DARK: '#1F1F1F',
  BORDER_DARK: '#2E2E2E',
  TEXT_DARK: '#EDEDED',
  SECONDARY_DARK: '#B5B5B5',
  
  // Light Theme
  BG_LIGHT: '#FFFFFF',
  SIDEBAR_LIGHT: '#F9F9F9',
  BORDER_LIGHT: '#EFEFEF',
  TEXT_LIGHT: '#111111'
};

/**
 * Automatic Tag Color System
 * Generates a consistent, distinct HSL color based on a string ID.
 * Adapts saturation and lightness for dark/light themes.
 */
export const generateTagColor = (id: string, isDark: boolean): string => {
  // Simple hash function to convert string to numeric seed
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);

  // Hue: Using Golden Ratio (0.618...) to distribute hues as evenly as possible
  // 360 * (seed * 0.618033988749895 % 1)
  const hue = Math.floor(360 * ((seed * 0.618033988749895) % 1));

  if (isDark) {
    // Dark mode: Higher brightness, crisp saturation
    // Modern "Linear" look: S 65-75, L 60-70
    return `hsl(${hue}, 70%, 65%)`;
  } else {
    // Light mode: Lowered lightness for readability, moderate saturation
    // Professional "Notion" look: S 55-65, L 40-50
    return `hsl(${hue}, 60%, 45%)`;
  }
};

// Initial tags now use the dynamic generator
export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Work', color: generateTagColor('tag-1', false) },
  { id: 'tag-2', name: 'Personal', color: generateTagColor('tag-2', false) },
  { id: 'tag-3', name: 'Urgent', color: generateTagColor('tag-3', false) },
  { id: 'tag-4', name: 'Idea', color: generateTagColor('tag-4', false) },
];

export const PRIORITY_COLORS = {
  [Priority.LOW]: COLORS.SUCCESS,
  [Priority.MEDIUM]: COLORS.WARNING,
  [Priority.HIGH]: COLORS.CRITICAL
};
