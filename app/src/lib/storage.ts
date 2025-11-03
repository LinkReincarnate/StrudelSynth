/**
 * LocalStorage utilities for persisting custom patterns
 */

import type { PatternSlot, PatternLibrary } from './types';

const STORAGE_KEY = 'strudel-synth-patterns';
const LIBRARY_KEY = 'strudel-synth-library';

/**
 * Save a custom pattern to localStorage
 * @param pattern Pattern to save
 */
export function savePattern(pattern: PatternSlot): void {
  try {
    const patterns = loadCustomPatterns();
    const index = patterns.findIndex(p => p.id === pattern.id);

    if (index >= 0) {
      patterns[index] = pattern;
    } else {
      patterns.push(pattern);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
    console.log(`✅ Saved pattern ${pattern.id} to localStorage`);
  } catch (error) {
    console.error('Failed to save pattern:', error);
    throw new Error('Failed to save pattern to storage');
  }
}

/**
 * Load all custom patterns from localStorage
 * @returns Array of custom patterns
 */
export function loadCustomPatterns(): PatternSlot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const patterns = JSON.parse(data) as PatternSlot[];
    console.log(`✅ Loaded ${patterns.length} custom patterns from localStorage`);
    return patterns;
  } catch (error) {
    console.error('Failed to load custom patterns:', error);
    return [];
  }
}

/**
 * Delete a custom pattern from localStorage
 * @param slotId Slot ID to delete
 */
export function deletePattern(slotId: number): void {
  try {
    const patterns = loadCustomPatterns();
    const filtered = patterns.filter(p => p.id !== slotId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`✅ Deleted pattern ${slotId} from localStorage`);
  } catch (error) {
    console.error('Failed to delete pattern:', error);
    throw new Error('Failed to delete pattern from storage');
  }
}

/**
 * Clear all custom patterns from localStorage
 */
export function clearCustomPatterns(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Cleared all custom patterns');
  } catch (error) {
    console.error('Failed to clear patterns:', error);
  }
}

/**
 * Export pattern library to JSON file
 * @param library Pattern library to export
 */
export function exportLibrary(library: PatternLibrary): void {
  try {
    const json = JSON.stringify(library, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${library.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ Exported library: ${library.name}`);
  } catch (error) {
    console.error('Failed to export library:', error);
    throw new Error('Failed to export library');
  }
}

/**
 * Import pattern library from JSON file
 * @param file JSON file to import
 * @returns Promise<PatternLibrary>
 */
export function importLibrary(file: File): Promise<PatternLibrary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const library = JSON.parse(json) as PatternLibrary;

        // Validate library structure
        if (!library.name || !library.version || !Array.isArray(library.slots)) {
          throw new Error('Invalid library format');
        }

        console.log(`✅ Imported library: ${library.name}`);
        resolve(library);
      } catch (error) {
        console.error('Failed to parse library:', error);
        reject(new Error('Invalid library file format'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Save current library to localStorage
 * @param library Library to save
 */
export function saveLibrary(library: PatternLibrary): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    console.log(`✅ Saved library: ${library.name}`);
  } catch (error) {
    console.error('Failed to save library:', error);
  }
}

/**
 * Load library from localStorage
 * @returns PatternLibrary or null
 */
export function loadLibrary(): PatternLibrary | null {
  try {
    const data = localStorage.getItem(LIBRARY_KEY);
    if (!data) return null;

    const library = JSON.parse(data) as PatternLibrary;
    console.log(`✅ Loaded library: ${library.name}`);
    return library;
  } catch (error) {
    console.error('Failed to load library:', error);
    return null;
  }
}
