/**
 * PatternEngine - Manages pattern slots and Strudel pattern playback
 *
 * Responsibilities:
 * - Load pattern library (40 slots)
 * - Evaluate Strudel code strings into Pattern objects
 * - Start/stop patterns on button press
 * - Track pattern playback state
 * - Emit events for UI/LED updates
 */

import type { Pattern, PatternSlot, PatternLibrary } from '../lib/types';
import { DEFAULT_PATTERN_LIBRARY, LED_COLORS } from '../lib/constants';

export type PatternStateChangeHandler = (slot: PatternSlot) => void;
export type PatternErrorHandler = (slotId: number, error: Error) => void;

export class PatternEngine {
  private library: PatternLibrary;
  private slots: Map<number, PatternSlot>;
  private activeSlots: Map<number, PatternSlot>; // Changed: store slots instead of Pattern objects
  private combinedPattern: Pattern | null = null; // Single stacked pattern
  private initialized = false;

  // Event handlers
  private stateChangeHandlers: PatternStateChangeHandler[] = [];
  private errorHandlers: PatternErrorHandler[] = [];

  constructor() {
    this.library = DEFAULT_PATTERN_LIBRARY;
    this.slots = new Map();
    this.activeSlots = new Map();

    // Load default library
    this.loadLibrary(DEFAULT_PATTERN_LIBRARY);
  }

  /**
   * Initialize Strudel
   * MUST be called before using pattern playback
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if Strudel is loaded
      if (typeof window.initStrudel === 'undefined') {
        throw new Error('Strudel not loaded. Make sure @strudel/web CDN script is included.');
      }

      // Initialize with sample loading
      await window.initStrudel({
        prebake: () => window.samples('github:tidalcycles/dirt-samples'),
      });

      this.initialized = true;
      console.log('✅ PatternEngine initialized with Strudel');
    } catch (error) {
      throw new Error(`Failed to initialize PatternEngine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a pattern library
   * @param library Pattern library with 40 slots
   */
  loadLibrary(library: PatternLibrary): void {
    this.library = library;
    this.slots.clear();

    // Load all slots
    library.slots.forEach(slot => {
      this.slots.set(slot.id, { ...slot });
    });

    console.log(`✅ Loaded library: ${library.name} (${library.slots.length} patterns)`);
  }

  /**
   * Get pattern slot by ID
   * @param slotId Slot ID (0-39)
   */
  getSlot(slotId: number): PatternSlot | undefined {
    return this.slots.get(slotId);
  }

  /**
   * Get all pattern slots
   */
  getAllSlots(): PatternSlot[] {
    return Array.from(this.slots.values());
  }

  /**
   * Get currently playing slots
   */
  getPlayingSlots(): PatternSlot[] {
    return this.getAllSlots().filter(slot => slot.isPlaying);
  }

  /**
   * Check if a pattern is playing
   * @param slotId Slot ID (0-39)
   */
  isPlaying(slotId: number): boolean {
    return this.activeSlots.has(slotId);
  }

  /**
   * Evaluate Strudel code string into Pattern object
   * @param code Strudel pattern code (e.g., 's("bd").fast(2)')
   * @returns Pattern object ready to play
   */
  private evaluatePattern(code: string): Pattern {
    try {
      // Use Function constructor to evaluate in global scope
      // This allows access to Strudel globals (note, s, sound, etc.)
      const fn = new Function(`
        with (window) {
          return ${code};
        }
      `);

      const pattern = fn();

      if (!pattern || typeof pattern.play !== 'function') {
        throw new Error('Code did not return a valid Pattern object');
      }

      return pattern;
    } catch (error) {
      throw new Error(`Pattern evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rebuild combined pattern from all active slots
   * This is the key to proper pattern layering - all patterns must be
   * combined with stack() and played as a single Pattern object
   */
  private rebuildCombinedPattern(): void {
    // Stop existing combined pattern
    if (this.combinedPattern) {
      this.combinedPattern.hush();
      this.combinedPattern = null;
    }

    // If no active patterns, we're done
    if (this.activeSlots.size === 0) {
      console.log('🔇 No active patterns');
      return;
    }

    try {
      // Collect all active pattern codes
      const activeCodes = Array.from(this.activeSlots.values())
        .map(slot => slot.code);

      // Build combined pattern using stack()
      let combinedCode: string;
      if (activeCodes.length === 1) {
        // Single pattern - no stack needed
        combinedCode = activeCodes[0];
      } else {
        // Multiple patterns - use stack()
        combinedCode = `stack(${activeCodes.join(', ')})`;
      }

      console.log(`🎵 Building combined pattern: ${combinedCode}`);

      // Evaluate and play combined pattern
      this.combinedPattern = this.evaluatePattern(combinedCode);
      this.combinedPattern.play();

      console.log(`✅ Combined pattern playing (${activeCodes.length} layers)`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('❌ Failed to rebuild combined pattern:', err);
      throw err;
    }
  }

  /**
   * Start playing a pattern
   * @param slotId Slot ID (0-39)
   */
  startPattern(slotId: number): void {
    if (!this.initialized) {
      throw new Error('PatternEngine not initialized. Call initialize() first.');
    }

    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    // If already playing, do nothing
    if (this.activeSlots.has(slotId)) {
      console.log(`Pattern ${slotId} already playing`);
      return;
    }

    try {
      // Add to active slots
      this.activeSlots.set(slotId, slot);

      // Update slot state
      slot.isPlaying = true;
      slot.lastModified = Date.now();

      // Rebuild combined pattern with this slot included
      this.rebuildCombinedPattern();

      // Notify handlers
      this.notifyStateChange(slot);

      console.log(`✅ Started pattern ${slotId}: ${slot.name}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Failed to start pattern ${slotId}:`, err);

      // Rollback state on error
      this.activeSlots.delete(slotId);
      slot.isPlaying = false;

      this.notifyError(slotId, err);
      throw err;
    }
  }

  /**
   * Stop playing a pattern
   * @param slotId Slot ID (0-39)
   */
  stopPattern(slotId: number): void {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    if (!this.activeSlots.has(slotId)) {
      console.log(`Pattern ${slotId} not playing`);
      return;
    }

    try {
      // Remove from active slots
      this.activeSlots.delete(slotId);

      // Update slot state
      slot.isPlaying = false;
      slot.lastModified = Date.now();

      // Rebuild combined pattern without this slot
      this.rebuildCombinedPattern();

      // Notify handlers
      this.notifyStateChange(slot);

      console.log(`✅ Stopped pattern ${slotId}: ${slot.name}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Failed to stop pattern ${slotId}:`, err);
      this.notifyError(slotId, err);
      throw err;
    }
  }

  /**
   * Toggle pattern playback (start if stopped, stop if playing)
   * @param slotId Slot ID (0-39)
   */
  togglePattern(slotId: number): void {
    if (this.isPlaying(slotId)) {
      this.stopPattern(slotId);
    } else {
      this.startPattern(slotId);
    }
  }

  /**
   * Stop all playing patterns
   */
  stopAll(): void {
    console.log('🛑 Stopping all patterns...');

    // Use global hush() to stop all Strudel audio (most reliable)
    if (typeof window.hush === 'function') {
      window.hush();
    }

    // Clear pattern state
    this.combinedPattern = null;

    // Update all slot states
    this.activeSlots.forEach((slot) => {
      slot.isPlaying = false;
      slot.lastModified = Date.now();
      this.notifyStateChange(slot);
    });

    // Clear active slots
    this.activeSlots.clear();

    console.log('✅ All patterns stopped');
  }

  /**
   * Update pattern code in a slot
   * Note: If pattern is currently playing, it will need to be restarted
   * @param slotId Slot ID (0-39)
   * @param code New Strudel code
   */
  updatePatternCode(slotId: number, code: string): void {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    const wasPlaying = this.isPlaying(slotId);

    // Stop if playing
    if (wasPlaying) {
      this.stopPattern(slotId);
    }

    // Update code
    slot.code = code;
    slot.lastModified = Date.now();

    // Restart if it was playing
    if (wasPlaying) {
      this.startPattern(slotId);
    }

    this.notifyStateChange(slot);
  }

  /**
   * Get LED color for a slot based on its state
   * @param slotId Slot ID (0-39)
   */
  getLEDColor(slotId: number): number {
    const slot = this.slots.get(slotId);
    if (!slot) return LED_COLORS.OFF;

    if (slot.isPlaying) {
      return slot.ledColor;
    } else {
      return LED_COLORS.OFF;
    }
  }

  /**
   * Register pattern state change handler
   * Called when pattern starts, stops, or is modified
   */
  onStateChange(handler: PatternStateChangeHandler): () => void {
    this.stateChangeHandlers.push(handler);
    return () => {
      const index = this.stateChangeHandlers.indexOf(handler);
      if (index > -1) this.stateChangeHandlers.splice(index, 1);
    };
  }

  /**
   * Register error handler
   * Called when pattern evaluation or playback fails
   */
  onError(handler: PatternErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) this.errorHandlers.splice(index, 1);
    };
  }

  /**
   * Notify state change handlers
   */
  private notifyStateChange(slot: PatternSlot): void {
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(slot);
      } catch (error) {
        console.error('State change handler error:', error);
      }
    });
  }

  /**
   * Notify error handlers
   */
  private notifyError(slotId: number, error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(slotId, error);
      } catch (err) {
        console.error('Error handler error:', err);
      }
    });
  }

  /**
   * Get library info
   */
  getLibraryInfo(): { name: string; version: string; patternCount: number; playingCount: number } {
    return {
      name: this.library.name,
      version: this.library.version,
      patternCount: this.slots.size,
      playingCount: this.activeSlots.size,
    };
  }

  /**
   * Check if engine is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
