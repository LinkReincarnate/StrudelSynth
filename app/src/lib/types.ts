/**
 * Core type definitions for StrudelSynth
 */

/**
 * Represents a Strudel pattern in a slot
 */
export interface PatternSlot {
  /** Unique slot identifier (0-39 mapped to APCKEY25 buttons) */
  id: number;

  /** Strudel pattern code as string */
  code: string;

  /** User-friendly name for the pattern */
  name: string;

  /** Category/tag for organization */
  category?: string;

  /** LED color when slot is active (0-127 velocity value) */
  ledColor: number;

  /** Whether this slot is currently playing */
  isPlaying: boolean;

  /** Timestamp of last modification */
  lastModified?: number;
}

/**
 * Strudel pattern instance (from CDN)
 * Note: This is a minimal type - actual Strudel Pattern has many more methods
 *
 * CRITICAL: Patterns returned by .play() have .hush() method, NOT .stop()!
 */
export interface Pattern {
  /**
   * Start playing the pattern
   * Returns the pattern instance (which has .hush() method to stop it)
   */
  play(): Pattern;

  /**
   * Stop this pattern specifically
   * IMPORTANT: Use .hush() NOT .stop() - .stop() does not exist!
   */
  hush(): void;

  /** Modify pattern speed */
  fast(factor: number): Pattern;
  slow(factor: number): Pattern;

  /** Apply sound/sample */
  s(sound: string): Pattern;
  sound(sound: string): Pattern;

  /** Apply note */
  n(note: string): Pattern;
  note(note: string): Pattern;

  /** Apply scale */
  scale(scale: string): Pattern;

  /** Low-pass filter */
  lpf(freq: number): Pattern;

  /** High-pass filter */
  hpf(freq: number): Pattern;

  /** Reverse pattern */
  rev(): Pattern;

  /** Apply function to left/right channels */
  jux(fn: (p: Pattern) => Pattern): Pattern;

  /** Gain/volume control */
  gain(value: number): Pattern;
}

/**
 * MIDI device information
 */
export interface MIDIDeviceInfo {
  /** Device unique ID */
  id: string;

  /** Device manufacturer name */
  manufacturer: string;

  /** Device model name */
  name: string;

  /** Input port (if available) */
  input?: MIDIInput;

  /** Output port (if available) */
  output?: MIDIOutput;

  /** Device state (connected/disconnected) */
  state: 'connected' | 'disconnected';
}

/**
 * APCKEY25 mk2 specific device structure
 */
export interface APCDevices {
  /** Keyboard device (notes 1-120) */
  keyboard: {
    input: MIDIInput;
  };

  /** Controller device (buttons, knobs, LEDs) */
  controller: {
    input: MIDIInput;
    output: MIDIOutput;
  };
}

/**
 * MIDI message structure
 */
export interface MIDIMessage {
  /** Status byte (command + channel) */
  status: number;

  /** Data byte 1 (note/CC number) */
  data1: number;

  /** Data byte 2 (velocity/value) */
  data2: number;

  /** Timestamp */
  timestamp: number;
}

/**
 * Button press event
 */
export interface ButtonEvent {
  /** Button note number (0-39 for grid) */
  note: number;

  /** Velocity (0 = off, 127 = on) */
  velocity: number;

  /** Shift key held during press */
  shiftHeld: boolean;

  /** Timestamp */
  timestamp: number;
}

/**
 * Knob change event
 */
export interface KnobEvent {
  /** Knob CC number (48-55) */
  cc: number;

  /** Knob index (0-7) */
  index: number;

  /** Relative value (+/- increment) */
  delta: number;

  /** Timestamp */
  timestamp: number;
}

/**
 * Pattern library structure
 */
export interface PatternLibrary {
  /** Library name */
  name: string;

  /** Library version */
  version: string;

  /** All pattern slots */
  slots: PatternSlot[];

  /** Timestamp of last save */
  lastSaved?: number;
}

/**
 * Application state
 */
export interface AppState {
  /** MIDI connection status */
  midiConnected: boolean;

  /** Strudel initialization status */
  strudelReady: boolean;

  /** Audio context state */
  audioState: 'suspended' | 'running' | 'closed';

  /** Currently loaded pattern library */
  library: PatternLibrary | null;

  /** Currently playing pattern slots */
  playingSlots: Set<number>;

  /** Error messages */
  errors: string[];
}

/**
 * Options for initStrudel()
 */
export interface InitStrudelOptions {
  /**
   * Prebake function to load samples before initialization
   * CRITICAL: Must use this to load samples or audio won't work!
   *
   * Example:
   * prebake: () => samples('github:tidalcycles/dirt-samples')
   */
  prebake?: () => any;
}

/**
 * Global Strudel functions (loaded from CDN)
 */
export interface StrudelGlobals {
  /**
   * Initialize Strudel
   * CRITICAL: Must be called with prebake option to load samples!
   *
   * Example:
   * await initStrudel({
   *   prebake: () => samples('github:tidalcycles/dirt-samples')
   * });
   */
  initStrudel(options?: InitStrudelOptions): Promise<void>;

  /**
   * Stop all playing patterns globally
   * This is the global hush, not the pattern-specific one
   */
  hush(): void;

  /**
   * Load samples from a source
   * Used in prebake option
   */
  samples(source: string): any;

  /** Create note pattern */
  note(pattern: string): Pattern;

  /** Create sample pattern */
  s(sample: string): Pattern;
  sound(sample: string): Pattern;

  /** Create number pattern (for sample indices) */
  n(pattern: string): Pattern;
}

/**
 * Extend Window with Strudel globals
 */
declare global {
  interface Window extends StrudelGlobals {
    // Strudel functions are available globally after CDN load
  }

  // Make Strudel functions available globally
  const initStrudel: (options?: InitStrudelOptions) => Promise<void>;
  const hush: () => void;
  const samples: (source: string) => any;
  const note: (pattern: string) => Pattern;
  const s: (sample: string) => Pattern;
  const sound: (sample: string) => Pattern;
  const n: (pattern: string) => Pattern;
}
