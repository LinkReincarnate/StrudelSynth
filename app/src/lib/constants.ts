/**
 * Constants for StrudelSynth
 */

import type { PatternLibrary } from './types';

/**
 * LED color values (velocity-based)
 * Based on APCKEY25 mk2 protocol testing
 */
export const LED_COLORS = {
  OFF: 0,
  RED: 5,
  GREEN: 13,
  YELLOW: 96,
  // Additional colors discovered during testing
  DIM_WHITE: 1,
  BRIGHT_PURPLE: 48,
  BRIGHT_YELLOW: 96,
} as const;

/**
 * APCKEY25 mk2 button grid note mapping
 * Row 0 (top) = Notes 32-39
 * Row 4 (bottom) = Notes 0-7
 */
export const BUTTON_NOTE_MAP = {
  // Row 0 (top row)
  ROW_0: [32, 33, 34, 35, 36, 37, 38, 39],
  // Row 1
  ROW_1: [24, 25, 26, 27, 28, 29, 30, 31],
  // Row 2 (middle)
  ROW_2: [16, 17, 18, 19, 20, 21, 22, 23],
  // Row 3
  ROW_3: [8, 9, 10, 11, 12, 13, 14, 15],
  // Row 4 (bottom row)
  ROW_4: [0, 1, 2, 3, 4, 5, 6, 7],
} as const;

/**
 * Flatten button grid to array of all 40 notes
 */
export const ALL_BUTTON_NOTES = [
  ...BUTTON_NOTE_MAP.ROW_0,
  ...BUTTON_NOTE_MAP.ROW_1,
  ...BUTTON_NOTE_MAP.ROW_2,
  ...BUTTON_NOTE_MAP.ROW_3,
  ...BUTTON_NOTE_MAP.ROW_4,
] as const;

/**
 * Knob CC numbers (0-7 for the 8 knobs)
 */
export const KNOB_CC_MAP = {
  KNOB_0: 48,
  KNOB_1: 49,
  KNOB_2: 50,
  KNOB_3: 51,
  KNOB_4: 52,
  KNOB_5: 53,
  KNOB_6: 54,
  KNOB_7: 55,
} as const;

/**
 * All knob CC numbers as array
 */
export const ALL_KNOB_CCS = Object.values(KNOB_CC_MAP);

/**
 * Special buttons (not in main grid)
 */
export const SPECIAL_BUTTONS = {
  SHIFT: 98,
  SUSTAIN: 64, // (pedal input)
  STOP_ALL_CLIPS: 81,
  PLAY: 91,
  RECORD: 93,
  // Mode switches
  CLIP_STOP: 82,
  SOLO: 83,
  REC_ARM: 84,
  MUTE: 85,
  SELECT: 86,
  // Arrow keys
  UP: 87,
  DOWN: 89,
  LEFT: 90,
  RIGHT: 92,
} as const;

/**
 * MIDI device names for APCKEY25 mk2
 * Note: Windows includes parent device name in parentheses
 */
export const MIDI_DEVICE_NAMES = {
  // Keyboard device (notes 1-120)
  KEYBOARD: 'APC Key 25 mk2',
  // Controller device (buttons, knobs, LEDs)
  CONTROLLER_INPUT: 'MIDIIN2 (APC Key 25 mk2)',
  CONTROLLER_OUTPUT: 'MIDIOUT2 (APC Key 25 mk2)',
} as const;

/**
 * MIDI status bytes
 */
export const MIDI_STATUS = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
} as const;

/**
 * Default pattern library for Phase 1 MVP
 * Contains 40 pre-coded patterns (one per button)
 */
export const DEFAULT_PATTERN_LIBRARY: PatternLibrary = {
  name: 'Default Library',
  version: '1.0.0',
  slots: [
    // Row 0 (Notes 32-39) - Melodic patterns
    {
      id: 32,
      code: 'note("c4 e4 g4 c5").s("casio")',
      name: 'C Major Chord',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 33,
      code: 'note("a3 c4 e4 a4").s("gtr")',
      name: 'A Minor Chord',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 34,
      code: 'note("c4 d4 e4 g4 a4 g4 e4 d4").slow(2).s("sine")',
      name: 'C Major Scale',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 35,
      code: 'note("c4 e4 g4 b4 c5").fast(4).s("triangle")',
      name: 'Arpeggio Up',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 36,
      code: 'note("<c4 e4 g4>*4").s("sawtooth").lpf(800)',
      name: 'Filtered Chord',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 37,
      code: 'note("c5 c5 g4 g4 a4 a4 g4").slow(2).s("arpy")',
      name: 'Twinkle Melody',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 38,
      code: 'note("c4 eb4 g4").s("casio").fast(2)',
      name: 'C Minor Fast',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 39,
      code: 'note("c4 d4 e4 f4 g4 a4 b4 c5").fast(8).s("sine")',
      name: 'Fast Scale Run',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },

    // Row 1 (Notes 24-31) - Bass patterns
    {
      id: 24,
      code: 's("bd").fast(2)',
      name: 'Kick Drum x2',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 25,
      code: 's("bd sd")',
      name: 'Kick-Snare',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 26,
      code: 's("bd*2 sd")',
      name: 'Double Kick',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 27,
      code: 's("bd ~ sd ~")',
      name: 'Four on Floor',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 28,
      code: 'note("c2 c2 eb2 g2").s("sawtooth").lpf(800)',
      name: 'Bass Line',
      category: 'bass',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },
    {
      id: 29,
      code: 'note("c2").s("sawtooth").fast(4)',
      name: 'Bass Pulse',
      category: 'bass',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },
    {
      id: 30,
      code: 'note("c2 ~ eb2 ~").s("triangle")',
      name: 'Sub Bass',
      category: 'bass',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },
    {
      id: 31,
      code: 'note("c2 g1 c2 g1").s("sawtooth").lpf(400)',
      name: 'Deep Bass',
      category: 'bass',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },

    // Row 2 (Notes 16-23) - Percussion
    {
      id: 16,
      code: 's("hh*8")',
      name: 'Hi-Hat 8th',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 17,
      code: 's("hh*16").fast(0.5)',
      name: 'Hi-Hat 16th',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 18,
      code: 's("cp, rm*4")',
      name: 'Clap + Rim',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 19,
      code: 's("~ cp")',
      name: 'Clap on 2',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 20,
      code: 's("perc*4").fast(2)',
      name: 'Percussion Loop',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 21,
      code: 's("oh ~ oh ~")',
      name: 'Open Hi-Hat',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 22,
      code: 's("rm*4")',
      name: 'Rim Shots',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 23,
      code: 's("tabla*8").fast(2)',
      name: 'Fast Tabla',
      category: 'drums',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },

    // Row 3 (Notes 8-15) - Textures
    {
      id: 8,
      code: 'sound("sine").note("c3").lpf(600)',
      name: 'Filtered Sine',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 9,
      code: 'sound("sawtooth").note("<c3 e3 g3>").fast(2)',
      name: 'Saw Chord',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 10,
      code: 'sound("square").note("c4 e4 g4").slow(2)',
      name: 'Square Wave',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 11,
      code: 'sound("triangle").note("c4").fast(8).lpf(1200)',
      name: 'Triangle Pulse',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 12,
      code: 's("pad").note("c3 e3 g3").slow(4)',
      name: 'Pad Slow',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 13,
      code: 's("space").slow(2)',
      name: 'Space Ambient',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 14,
      code: 's("wind").fast(0.5)',
      name: 'Wind Texture',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 15,
      code: 's("noise").lpf(400).hpf(200)',
      name: 'Filtered Noise',
      category: 'texture',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },

    // Row 4 (Notes 0-7) - Effects & Combinations
    {
      id: 0,
      code: 's("bd sd").fast(2).rev()',
      name: 'Reversed Beat',
      category: 'effect',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },
    {
      id: 1,
      code: 'note("c4 e4 g4").s("arpy").jux(rev)',
      name: 'Stereo Reverse',
      category: 'effect',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },
    {
      id: 2,
      code: 's("bd hh sd hh").fast(2)',
      name: 'Full Beat',
      category: 'combo',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 3,
      code: 'note("c2 c2 eb2 g2").s("sawtooth").lpf(800)',
      name: 'Bass + Filter',
      category: 'combo',
      ledColor: LED_COLORS.YELLOW,
      isPlaying: false,
    },
    {
      id: 4,
      code: 's("bd*4, hh*8, ~ cp")',
      name: 'Layered Drums',
      category: 'combo',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 5,
      code: 'note("<c4 e4 g4 c5>*4").s("sine").lpf(1200)',
      name: 'Melodic Pulse',
      category: 'combo',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
    {
      id: 6,
      code: 's("bd sd, hh*16").fast(2)',
      name: 'Breakbeat',
      category: 'combo',
      ledColor: LED_COLORS.RED,
      isPlaying: false,
    },
    {
      id: 7,
      code: 'note("c4 d4 e4 g4").s("gtr").slow(4)',
      name: 'Slow Melody',
      category: 'melody',
      ledColor: LED_COLORS.GREEN,
      isPlaying: false,
    },
  ],
  lastSaved: Date.now(),
};

/**
 * Strudel CDN version
 */
export const STRUDEL_VERSION = '1.2.6';

/**
 * Strudel CDN URL
 */
export const STRUDEL_CDN_URL = `https://unpkg.com/@strudel/web@${STRUDEL_VERSION}`;

/**
 * App configuration
 */
export const APP_CONFIG = {
  /** Max number of simultaneously playing patterns */
  MAX_PLAYING_PATTERNS: 40,

  /** Default tempo (BPM) */
  DEFAULT_TEMPO: 120,

  /** Audio init overlay timeout (ms) */
  AUDIO_INIT_TIMEOUT: 5000,

  /** MIDI connection timeout (ms) */
  MIDI_CONNECTION_TIMEOUT: 3000,

  /** IndexedDB database name */
  DB_NAME: 'strudelsynth',

  /** IndexedDB version */
  DB_VERSION: 1,

  /** LocalStorage key for pattern library */
  STORAGE_KEY_LIBRARY: 'strudelsynth:library',
} as const;
