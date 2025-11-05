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

import type { Pattern, PatternSlot, PatternLibrary, DynamicParameter } from '../lib/types';
import { DEFAULT_PATTERN_LIBRARY, LED_COLORS } from '../lib/constants';
import type { KnobParameter } from '../lib/parameters';
import { DEFAULT_KNOB_PARAMETERS, applyParameters, scaleValue } from '../lib/parameters';
import { extractParameters, createDynamicParameters, injectParameterValues, updateParameterFromKnob } from '../lib/parameterDetector';
import { STRUDEL_PARAMETERS, getParameterDefinition } from '../lib/strudelParameters';

export type PatternStateChangeHandler = (slot: PatternSlot) => void;
export type PatternErrorHandler = (slotId: number, error: Error) => void;

export class PatternEngine {
  private library: PatternLibrary;
  private slots: Map<number, PatternSlot>;
  private activeSlots: Map<number, PatternSlot>; // Changed: store slots instead of Pattern objects
  private combinedPattern: Pattern | null = null; // Single stacked pattern
  private initialized = false;

  // Currently selected slot for parameter control
  private selectedSlotId: number | null = null;

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
      const slotCopy = { ...slot };
      // Initialize parameters for this slot if not already set
      if (!slotCopy.parameters) {
        slotCopy.parameters = DEFAULT_KNOB_PARAMETERS.map(p => ({ ...p }));
      }
      this.slots.set(slot.id, slotCopy);
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
      console.log('🔇 Calling hush() on existing combined pattern');
      this.combinedPattern.hush();
      this.combinedPattern = null;
      console.log('✅ Existing pattern hushed and cleared');
    }

    // If no active patterns, call global hush to ensure everything stops
    if (this.activeSlots.size === 0) {
      console.log('🔇 No active patterns - calling global hush()');
      if (typeof window.hush === 'function') {
        window.hush();
      }
      return;
    }

    try {
      // Collect all active pattern codes and inject dynamic parameter values
      const activeCodes = Array.from(this.activeSlots.values())
        .map(slot => {
          // Extract and initialize dynamic parameters if needed
          const paramNames = extractParameters(slot.code);

          if (paramNames.length > 0) {
            // Initialize dynamic parameters if not already set
            if (!slot.dynamicParameters) {
              slot.dynamicParameters = createDynamicParameters(paramNames);
              console.log(`🔍 Detected ${paramNames.length} parameters in slot ${slot.id}: ${paramNames.join(', ')}`);
            } else {
              // Update existing parameters with any new ones detected
              const existingNames = new Set(slot.dynamicParameters.map(p => p.name));
              const newParams = paramNames.filter(name => !existingNames.has(name));

              if (newParams.length > 0) {
                const additionalParams = createDynamicParameters(newParams);
                slot.dynamicParameters = [...slot.dynamicParameters, ...additionalParams];
                console.log(`➕ Added ${newParams.length} new parameters to slot ${slot.id}: ${newParams.join(', ')}`);
              }
            }

            // Inject parameter values into code
            return injectParameterValues(slot.code, slot.dynamicParameters);
          } else {
            // No parameters detected - use code as-is
            // Fallback to old parameter system if it exists
            if (slot.parameters) {
              return applyParameters(slot.code, slot.parameters);
            }
            return slot.code;
          }
        });

      // Build combined pattern using stack()
      let combinedCode: string;
      if (activeCodes.length === 1) {
        // Single pattern - no stack needed
        combinedCode = activeCodes[0];
      } else {
        // Multiple patterns - use stack()
        combinedCode = `stack(${activeCodes.join(', ')})`;
      }

      console.log(`🎵 Building combined pattern with dynamic parameters`);

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
      console.log(`⚠️ Pattern ${slotId} not playing - cannot stop`);
      return;
    }

    console.log(`🛑 Stopping pattern ${slotId}: ${slot.name}`);

    try {
      // Remove from active slots
      this.activeSlots.delete(slotId);
      console.log(`Removed from active slots. Remaining active: ${this.activeSlots.size}`);

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
   * Update code for a playing pattern (live code editing)
   * This rebuilds the combined pattern immediately without stopping/starting
   * @param slotId Slot ID (0-39)
   * @param code New Strudel code
   */
  updateLiveCode(slotId: number, code: string): void {
    if (!this.initialized) {
      throw new Error('PatternEngine not initialized. Call initialize() first.');
    }

    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    const isPlaying = this.isPlaying(slotId);
    if (!isPlaying) {
      throw new Error(`Pattern ${slotId} is not playing. Use updatePatternCode() for non-playing patterns.`);
    }

    try {
      // Extract parameters from new code
      const paramNames = extractParameters(code);

      // Initialize or update dynamic parameters
      if (paramNames.length > 0) {
        if (!slot.dynamicParameters) {
          // Create new parameters with defaults
          slot.dynamicParameters = createDynamicParameters(paramNames);
          console.log(`🔍 Detected ${paramNames.length} new parameters: ${paramNames.join(', ')}`);
        } else {
          // Merge with existing parameters
          const existingNames = new Set(slot.dynamicParameters.map(p => p.name));
          const newParams = paramNames.filter(name => !existingNames.has(name));

          if (newParams.length > 0) {
            const additionalParams = createDynamicParameters(newParams, slot.dynamicParameters);
            slot.dynamicParameters = [...slot.dynamicParameters, ...additionalParams];
            console.log(`➕ Added ${newParams.length} new parameters: ${newParams.join(', ')}`);
          }
        }

        // Inject parameter values for validation
        const codeWithParams = injectParameterValues(code, slot.dynamicParameters);

        // Validate code with parameters injected
        this.evaluatePattern(codeWithParams);
      } else {
        // No parameters, validate as-is
        this.evaluatePattern(code);
      }

      // Update code in slot (store original code with $params)
      slot.code = code;
      slot.lastModified = Date.now();

      // Update the activeSlots reference (important for rebuildCombinedPattern)
      this.activeSlots.set(slotId, slot);

      // Rebuild combined pattern with new code
      this.rebuildCombinedPattern();

      // Notify handlers
      this.notifyStateChange(slot);

      console.log(`✅ Updated live code for pattern ${slotId}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Failed to update live code for pattern ${slotId}:`, err);
      this.notifyError(slotId, err);
      throw err;
    }
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

  /**
   * Set the currently selected slot for parameter control
   * @param slotId Slot ID (0-39) or null for no selection
   */
  selectSlot(slotId: number | null): void {
    this.selectedSlotId = slotId;
    if (slotId !== null) {
      console.log(`🎯 Selected slot ${slotId} for parameter control`);
    }
  }

  /**
   * Get the currently selected slot ID
   * @returns Selected slot ID or null
   */
  getSelectedSlotId(): number | null {
    return this.selectedSlotId;
  }

  /**
   * Update a parameter value for the selected slot (relative encoder)
   * @param knobIndex Knob index (0-7)
   * @param delta Relative change value (+/-)
   */
  updateParameter(knobIndex: number, delta: number): void {
    // Need a selected slot to update
    if (this.selectedSlotId === null) {
      console.log('⚠️ No slot selected for parameter control');
      return;
    }

    const slot = this.slots.get(this.selectedSlotId);
    if (!slot) return;

    // NEW: Try dynamic parameters first
    if (slot.dynamicParameters && slot.dynamicParameters.length > 0) {
      // Find parameter assigned to this knob
      const paramIndex = slot.dynamicParameters.findIndex(p => p.assignedKnob === knobIndex);

      if (paramIndex !== -1) {
        const param = slot.dynamicParameters[paramIndex];
        const updatedParam = updateParameterFromKnob(param, delta);
        slot.dynamicParameters[paramIndex] = updatedParam;

        console.log(`🎛️ Slot ${this.selectedSlotId} - ${param.displayName || param.name}: ${updatedParam.value.toFixed(3)}`);

        // If this slot is currently playing, rebuild the combined pattern
        if (this.activeSlots.has(this.selectedSlotId)) {
          this.rebuildCombinedPattern();
        }
        return;
      } else {
        console.log(`⚠️ No parameter assigned to knob ${knobIndex} in slot ${this.selectedSlotId}`);
        return;
      }
    }

    // FALLBACK: Old parameter system (DEPRECATED)
    if (slot.parameters) {
      const param = slot.parameters[knobIndex];
      if (!param) return;

      // Calculate step size based on range
      const range = param.maxValue - param.minValue;
      const stepSize = range / 127; // 127 steps across full range

      // Apply delta
      let newValue = param.currentValue + (delta * stepSize);

      // Clamp to range
      newValue = Math.max(param.minValue, Math.min(param.maxValue, newValue));

      param.currentValue = newValue;

      console.log(`🎛️ Slot ${this.selectedSlotId} - ${param.name}: ${param.currentValue.toFixed(2)}`);

      // If this slot is currently playing, rebuild the combined pattern
      if (this.activeSlots.has(this.selectedSlotId)) {
        this.rebuildCombinedPattern();
      }
    }
  }

  /**
   * Get parameter values for the selected slot
   * @returns Array of parameters for selected slot, or default params if no selection
   */
  getParameters(): KnobParameter[] {
    if (this.selectedSlotId === null) {
      return [...DEFAULT_KNOB_PARAMETERS];
    }

    const slot = this.slots.get(this.selectedSlotId);
    if (!slot || !slot.parameters) {
      return [...DEFAULT_KNOB_PARAMETERS];
    }

    return slot.parameters;
  }

  /**
   * Reset parameters to defaults for the selected slot
   */
  resetParameters(): void {
    if (this.selectedSlotId === null) return;

    const slot = this.slots.get(this.selectedSlotId);
    if (!slot) return;

    // Reset to defaults
    slot.parameters = DEFAULT_KNOB_PARAMETERS.map(p => ({ ...p }));

    // Rebuild if playing
    if (this.activeSlots.has(this.selectedSlotId)) {
      this.rebuildCombinedPattern();
    }

    console.log(`🔄 Parameters reset for slot ${this.selectedSlotId}`);
  }

  /**
   * Get dynamic parameters for a slot
   * @param slotId Slot ID (0-39) or null to use selected slot
   * @returns Dynamic parameters array or null if none
   */
  getDynamicParameters(slotId: number | null = null): DynamicParameter[] | null {
    const id = slotId ?? this.selectedSlotId;
    if (id === null) return null;

    const slot = this.slots.get(id);
    if (!slot) return null;

    return slot.dynamicParameters || null;
  }

  /**
   * Assign a dynamic parameter to a knob
   * @param slotId Slot ID (0-39)
   * @param paramName Parameter name (without $ prefix)
   * @param knobIndex Knob index (0-7), or null to unassign
   */
  assignParameterToKnob(slotId: number, paramName: string, knobIndex: number | null): void {
    const slot = this.slots.get(slotId);
    if (!slot || !slot.dynamicParameters) {
      throw new Error(`Slot ${slotId} has no dynamic parameters`);
    }

    const param = slot.dynamicParameters.find(p => p.name === paramName);
    if (!param) {
      throw new Error(`Parameter '${paramName}' not found in slot ${slotId}`);
    }

    // Unassign any other parameter using this knob
    if (knobIndex !== null) {
      slot.dynamicParameters.forEach(p => {
        if (p.assignedKnob === knobIndex && p.name !== paramName) {
          p.assignedKnob = null;
        }
      });
    }

    // Assign this parameter to the knob
    param.assignedKnob = knobIndex;

    console.log(`🔗 Assigned parameter '${paramName}' to knob ${knobIndex} in slot ${slotId}`);
  }

  /**
   * Update a dynamic parameter's range
   * @param slotId Slot ID (0-39)
   * @param paramName Parameter name (without $ prefix)
   * @param minValue New minimum value
   * @param maxValue New maximum value
   */
  updateParameterRange(slotId: number, paramName: string, minValue: number, maxValue: number): void {
    const slot = this.slots.get(slotId);
    if (!slot || !slot.dynamicParameters) {
      throw new Error(`Slot ${slotId} has no dynamic parameters`);
    }

    const param = slot.dynamicParameters.find(p => p.name === paramName);
    if (!param) {
      throw new Error(`Parameter '${paramName}' not found in slot ${slotId}`);
    }

    param.minValue = minValue;
    param.maxValue = maxValue;

    // Clamp current value to new range
    param.value = Math.max(minValue, Math.min(maxValue, param.value));

    console.log(`📊 Updated range for '${paramName}' in slot ${slotId}: ${minValue} - ${maxValue}`);

    // Rebuild if playing
    if (this.activeSlots.has(slotId)) {
      this.rebuildCombinedPattern();
    }
  }

  /**
   * Manually set a dynamic parameter's value
   * @param slotId Slot ID (0-39)
   * @param paramName Parameter name (without $ prefix)
   * @param value New value
   */
  setParameterValue(slotId: number, paramName: string, value: number): void {
    const slot = this.slots.get(slotId);
    if (!slot || !slot.dynamicParameters) {
      throw new Error(`Slot ${slotId} has no dynamic parameters`);
    }

    const param = slot.dynamicParameters.find(p => p.name === paramName);
    if (!param) {
      throw new Error(`Parameter '${paramName}' not found in slot ${slotId}`);
    }

    // Clamp to range
    param.value = Math.max(param.minValue, Math.min(param.maxValue, value));

    console.log(`🎚️ Set '${paramName}' to ${param.value.toFixed(3)} in slot ${slotId}`);

    // Rebuild if playing
    if (this.activeSlots.has(slotId)) {
      this.rebuildCombinedPattern();
    }
  }

  /**
   * Detect and initialize parameters for a slot without playing it
   * This allows UI to show parameters before the pattern is played
   * @param slotId Slot ID (0-39)
   */
  detectAndInitializeParameters(slotId: number): void {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    // Extract parameters from code
    const paramNames = extractParameters(slot.code);

    if (paramNames.length > 0) {
      // Initialize parameters with existing values preserved
      slot.dynamicParameters = createDynamicParameters(paramNames, slot.dynamicParameters);
      console.log(`🔍 Detected ${paramNames.length} parameters in slot ${slotId}: ${paramNames.join(', ')}`);
    } else {
      // No parameters found
      slot.dynamicParameters = [];
    }
  }

  /**
   * Add a parameter from the Strudel parameter library to a slot's code
   * Automatically inserts the parameter syntax into the code and initializes it
   * @param slotId Slot ID (0-39)
   * @param paramName Parameter name from STRUDEL_PARAMETERS (e.g., 'volume', 'cutoff')
   * @param knobIndex Optional knob to assign the parameter to (0-7)
   */
  addParameterToSlot(slotId: number, paramName: string, knobIndex: number | null = null): void {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    // Get parameter definition
    const paramDef = getParameterDefinition(paramName);
    if (!paramDef) {
      throw new Error(`Parameter '${paramName}' not found in Strudel parameter library`);
    }

    // Check if parameter already exists in code
    const existingParams = extractParameters(slot.code);
    if (existingParams.includes(paramName)) {
      console.log(`⚠️ Parameter '${paramName}' already exists in slot ${slotId}`);

      // Just assign to knob if requested
      if (knobIndex !== null) {
        this.assignParameterToKnob(slotId, paramName, knobIndex);
      }
      return;
    }

    // Add parameter to code
    // Insert at the end of the pattern chain (before any trailing whitespace/comments)
    let newCode = slot.code.trim();

    // Add the parameter using the syntax from the definition
    newCode = `${newCode}${paramDef.syntax}`;

    // Update the slot's code
    slot.code = newCode;

    // Initialize the parameter in dynamicParameters
    const newParam: DynamicParameter = {
      name: paramDef.name,
      value: paramDef.defaultValue,
      minValue: paramDef.minValue,
      maxValue: paramDef.maxValue,
      assignedKnob: knobIndex,
      displayName: paramDef.displayName
    };

    if (!slot.dynamicParameters) {
      slot.dynamicParameters = [];
    }
    slot.dynamicParameters.push(newParam);

    console.log(`✨ Added parameter '${paramName}' to slot ${slotId} code: ${paramDef.syntax}`);

    // Trigger state change
    this.notifyStateChange(slot);

    // Rebuild if playing
    if (this.activeSlots.has(slotId)) {
      this.rebuildCombinedPattern();
    }
  }
}
