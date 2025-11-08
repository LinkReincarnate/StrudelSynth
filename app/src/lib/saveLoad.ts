/**
 * Save/Load System for StrudelSynth
 *
 * Handles saving and loading pattern libraries to:
 * - JSON files (download/upload)
 * - LocalStorage (auto-save)
 */

import type { PatternLibrary, PatternSlot } from './types';

const AUTOSAVE_KEY = 'strudelsynth_autosave';
const AUTOSAVE_TIMESTAMP_KEY = 'strudelsynth_autosave_timestamp';

/**
 * File format version for compatibility checking
 */
const FILE_FORMAT_VERSION = '1.0';

export interface SaveFileData {
  version: string;
  timestamp: string;
  library: PatternLibrary;
}

/**
 * Serialize pattern library to JSON string
 */
export function serializeLibrary(library: PatternLibrary): string {
  const saveData: SaveFileData = {
    version: FILE_FORMAT_VERSION,
    timestamp: new Date().toISOString(),
    library: library
  };

  return JSON.stringify(saveData, null, 2);
}

/**
 * Deserialize JSON string back to pattern library
 * Validates format and version
 */
export function deserializeLibrary(jsonString: string): PatternLibrary {
  try {
    const saveData: SaveFileData = JSON.parse(jsonString);

    // Validate format
    if (!saveData.version || !saveData.library) {
      throw new Error('Invalid save file format');
    }

    // Check version compatibility
    if (saveData.version !== FILE_FORMAT_VERSION) {
      console.warn(`Save file version ${saveData.version} differs from current version ${FILE_FORMAT_VERSION}`);
      // Could add migration logic here if needed
    }

    // Validate library structure
    if (!saveData.library.name || !Array.isArray(saveData.library.slots)) {
      throw new Error('Invalid library structure');
    }

    return saveData.library;
  } catch (error) {
    throw new Error(`Failed to load save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download pattern library as JSON file
 */
export function downloadLibrary(library: PatternLibrary): void {
  const jsonString = serializeLibrary(library);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement('a');
  link.href = url;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.download = `${library.name}_${timestamp}.json`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);

  console.log(`📥 Downloaded library: ${library.name}`);
}

/**
 * Load pattern library from uploaded file
 * Returns a Promise that resolves with the library
 */
export function uploadLibrary(): Promise<PatternLibrary> {
  return new Promise((resolve, reject) => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const library = deserializeLibrary(text);
        console.log(`📤 Loaded library: ${library.name}`);
        resolve(library);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    // Trigger file picker
    input.click();
  });
}

/**
 * Save pattern library to localStorage (auto-save)
 */
export function saveToLocalStorage(library: PatternLibrary): void {
  try {
    const jsonString = serializeLibrary(library);
    localStorage.setItem(AUTOSAVE_KEY, jsonString);
    localStorage.setItem(AUTOSAVE_TIMESTAMP_KEY, new Date().toISOString());
    console.log('💾 Auto-saved to localStorage');
  } catch (error) {
    console.error('Failed to auto-save:', error);
    // LocalStorage might be full or disabled
  }
}

/**
 * Load pattern library from localStorage (auto-save)
 * Returns null if no auto-save exists
 */
export function loadFromLocalStorage(): PatternLibrary | null {
  try {
    const jsonString = localStorage.getItem(AUTOSAVE_KEY);
    if (!jsonString) {
      return null;
    }

    const library = deserializeLibrary(jsonString);
    const timestamp = localStorage.getItem(AUTOSAVE_TIMESTAMP_KEY);
    console.log(`💾 Loaded auto-save from ${timestamp || 'unknown time'}`);
    return library;
  } catch (error) {
    console.error('Failed to load auto-save:', error);
    return null;
  }
}

/**
 * Check if auto-save exists
 */
export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}

/**
 * Get auto-save timestamp
 */
export function getAutoSaveTimestamp(): Date | null {
  const timestamp = localStorage.getItem(AUTOSAVE_TIMESTAMP_KEY);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Clear auto-save from localStorage
 */
export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
  localStorage.removeItem(AUTOSAVE_TIMESTAMP_KEY);
  console.log('🗑️ Cleared auto-save');
}

/**
 * Export a single pattern slot as JSON
 */
export function exportPattern(slot: PatternSlot): void {
  const data = {
    version: FILE_FORMAT_VERSION,
    timestamp: new Date().toISOString(),
    pattern: slot
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `pattern_${slot.id}_${slot.name.replace(/\s+/g, '_')}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  console.log(`📥 Exported pattern: ${slot.name}`);
}

/**
 * Import a single pattern slot from file
 */
export function importPattern(): Promise<PatternSlot> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.pattern) {
          reject(new Error('Invalid pattern file format'));
          return;
        }

        console.log(`📤 Imported pattern: ${data.pattern.name}`);
        resolve(data.pattern);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    input.click();
  });
}
