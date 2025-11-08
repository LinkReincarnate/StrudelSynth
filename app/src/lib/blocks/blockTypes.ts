/**
 * Block-based programming system for Strudel
 * Similar to Scratch - visual programming interface
 */

export type BlockCategory =
  | 'sound'      // Sound/sample generators
  | 'pattern'    // Pattern combinators
  | 'time'       // Time modifiers
  | 'effect'     // Audio effects
  | 'control'    // Control flow
  | 'data'       // Variables and knobs
  | 'logic'      // Conditional logic
  | 'value';     // Value generators

export type InputType =
  | 'string'     // Text input
  | 'number'     // Numeric input
  | 'pattern'    // Pattern connection
  | 'array'      // Array of values
  | 'dropdown'   // Dropdown selection
  | 'knob';      // Knob-controlled parameter

export interface BlockInput {
  name: string;
  type: InputType;
  defaultValue?: any;
  options?: string[];  // For dropdown
  placeholder?: string;
  canBeKnob?: boolean; // If true, can toggle between value and knob param
  knobParamName?: string; // Active knob parameter name (if in knob mode)
}

export interface BlockDefinition {
  id: string;
  category: BlockCategory;
  name: string;           // Display name
  strudelFunction: string; // Actual Strudel function name
  color: string;          // Block color (hex)
  inputs: BlockInput[];
  description: string;
  example?: string;
  returnsPattern: boolean; // Can be chained with more blocks
}

/**
 * A block instance in the workspace
 */
export interface Block {
  instanceId: string;     // Unique ID for this instance
  definitionId: string;   // References BlockDefinition
  inputs: Record<string, any>; // Input values
  children: Block[];      // Nested/chained blocks
  position?: { x: number; y: number }; // Position in workspace
}

/**
 * Complete block workspace/program
 */
export interface BlockProgram {
  blocks: Block[];        // Top-level blocks
  name?: string;
  description?: string;
}

/**
 * All available block definitions
 * Organized by category for the palette
 */
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ===== SOUND BLOCKS =====
  {
    id: 'sound_s',
    category: 'sound',
    name: 'Sound',
    strudelFunction: 's',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'sample',
        type: 'string',
        defaultValue: 'bd',
        placeholder: 'bd, hh, sd...'
      }
    ],
    description: 'Play a drum sample',
    example: 's("bd hh sd hh")',
    returnsPattern: true
  },
  {
    id: 'sound_note',
    category: 'sound',
    name: 'Note',
    strudelFunction: 'note',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'notes',
        type: 'string',
        defaultValue: 'c4',
        placeholder: 'c4 e4 g4...'
      }
    ],
    description: 'Play musical notes',
    example: 'note("c4 e4 g4")',
    returnsPattern: true
  },
  {
    id: 'sound_sound',
    category: 'sound',
    name: 'Synth',
    strudelFunction: 'sound',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'synth',
        type: 'dropdown',
        defaultValue: 'sawtooth',
        options: ['sawtooth', 'sine', 'square', 'triangle']
      }
    ],
    description: 'Use a synthesizer',
    example: 'sound("sawtooth")',
    returnsPattern: true
  },

  // ===== TIME MODIFIERS =====
  {
    id: 'time_fast',
    category: 'time',
    name: 'Fast',
    strudelFunction: 'fast',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'speed',
        type: 'number',
        defaultValue: 2
      }
    ],
    description: 'Speed up the pattern',
    example: '.fast(2)',
    returnsPattern: true
  },
  {
    id: 'time_slow',
    category: 'time',
    name: 'Slow',
    strudelFunction: 'slow',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'speed',
        type: 'number',
        defaultValue: 2
      }
    ],
    description: 'Slow down the pattern',
    example: '.slow(2)',
    returnsPattern: true
  },
  {
    id: 'time_every',
    category: 'time',
    name: 'Every',
    strudelFunction: 'every',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'n',
        type: 'number',
        defaultValue: 4
      },
      {
        name: 'function',
        type: 'dropdown',
        defaultValue: 'fast',
        options: ['fast', 'slow', 'rev']
      },
      {
        name: 'amount',
        type: 'number',
        defaultValue: 2
      }
    ],
    description: 'Apply effect every N cycles',
    example: '.every(4, fast, 2)',
    returnsPattern: true
  },

  // ===== EFFECTS =====
  {
    id: 'effect_gain',
    category: 'effect',
    name: 'Volume',
    strudelFunction: 'gain',
    color: '#95E1D3',
    inputs: [
      {
        name: 'volume',
        type: 'number',
        defaultValue: 0.8
      }
    ],
    description: 'Set volume level',
    example: '.gain(0.8)',
    returnsPattern: true
  },
  {
    id: 'effect_lpf',
    category: 'effect',
    name: 'Low Pass Filter',
    strudelFunction: 'lpf',
    color: '#95E1D3',
    inputs: [
      {
        name: 'cutoff',
        type: 'number',
        defaultValue: 2000
      }
    ],
    description: 'Apply low-pass filter',
    example: '.lpf(2000)',
    returnsPattern: true
  },
  {
    id: 'effect_hpf',
    category: 'effect',
    name: 'High Pass Filter',
    strudelFunction: 'hpf',
    color: '#95E1D3',
    inputs: [
      {
        name: 'cutoff',
        type: 'number',
        defaultValue: 1000
      }
    ],
    description: 'Apply high-pass filter',
    example: '.hpf(1000)',
    returnsPattern: true
  },
  {
    id: 'effect_pan',
    category: 'effect',
    name: 'Pan',
    strudelFunction: 'pan',
    color: '#95E1D3',
    inputs: [
      {
        name: 'position',
        type: 'number',
        defaultValue: 0.5
      }
    ],
    description: 'Pan stereo position (0=left, 1=right)',
    example: '.pan(0.5)',
    returnsPattern: true
  },
  {
    id: 'effect_delay',
    category: 'effect',
    name: 'Delay',
    strudelFunction: 'delay',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5
      }
    ],
    description: 'Add delay effect',
    example: '.delay(0.5)',
    returnsPattern: true
  },
  {
    id: 'effect_room',
    category: 'effect',
    name: 'Reverb',
    strudelFunction: 'room',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5
      }
    ],
    description: 'Add reverb/room effect',
    example: '.room(0.5)',
    returnsPattern: true
  },

  // ===== PATTERN COMBINATORS =====
  {
    id: 'pattern_stack',
    category: 'pattern',
    name: 'Stack',
    strudelFunction: 'stack',
    color: '#FFD93D',
    inputs: [],
    description: 'Play multiple patterns at once',
    example: 'stack(pattern1, pattern2)',
    returnsPattern: true
  },
  {
    id: 'pattern_cat',
    category: 'pattern',
    name: 'Cat',
    strudelFunction: 'cat',
    color: '#FFD93D',
    inputs: [],
    description: 'Play patterns in sequence (one per cycle)',
    example: 'cat(pattern1, pattern2)',
    returnsPattern: true
  },
  {
    id: 'pattern_seq',
    category: 'pattern',
    name: 'Sequence',
    strudelFunction: 'seq',
    color: '#FFD93D',
    inputs: [],
    description: 'Play patterns in sequence (within one cycle)',
    example: 'seq(pattern1, pattern2)',
    returnsPattern: true
  },

  // ===== CONTROL FLOW =====
  {
    id: 'control_sometimes',
    category: 'control',
    name: 'Sometimes',
    strudelFunction: 'sometimes',
    color: '#A78BFA',
    inputs: [],
    description: 'Apply effect randomly (50%)',
    example: '.sometimes(fast(2))',
    returnsPattern: true
  },
  {
    id: 'control_often',
    category: 'control',
    name: 'Often',
    strudelFunction: 'often',
    color: '#A78BFA',
    inputs: [],
    description: 'Apply effect frequently (75%)',
    example: '.often(fast(2))',
    returnsPattern: true
  },
  {
    id: 'control_rarely',
    category: 'control',
    name: 'Rarely',
    strudelFunction: 'rarely',
    color: '#A78BFA',
    inputs: [],
    description: 'Apply effect rarely (25%)',
    example: '.rarely(fast(2))',
    returnsPattern: true
  },

  // ===== DATA BLOCKS (Variables & Knobs) =====
  {
    id: 'data_knob',
    category: 'data',
    name: 'Knob Input',
    strudelFunction: 'knob',
    color: '#F59E0B',
    inputs: [
      {
        name: 'paramName',
        type: 'string',
        defaultValue: 'knob1',
        placeholder: 'speed, cutoff, volume...'
      },
      {
        name: 'min',
        type: 'number',
        defaultValue: 0
      },
      {
        name: 'max',
        type: 'number',
        defaultValue: 1
      }
    ],
    description: 'Use a MIDI knob as input ($paramName)',
    example: '$speed',
    returnsPattern: false
  },
  {
    id: 'data_variable',
    category: 'data',
    name: 'Set Variable',
    strudelFunction: 'setVar',
    color: '#F59E0B',
    inputs: [
      {
        name: 'varName',
        type: 'string',
        defaultValue: 'myVar',
        placeholder: 'Variable name'
      },
      {
        name: 'value',
        type: 'number',
        defaultValue: 0
      }
    ],
    description: 'Store a value in a variable',
    example: 'const myVar = 0.5',
    returnsPattern: false
  },
  {
    id: 'data_get_variable',
    category: 'data',
    name: 'Get Variable',
    strudelFunction: 'getVar',
    color: '#F59E0B',
    inputs: [
      {
        name: 'varName',
        type: 'string',
        defaultValue: 'myVar',
        placeholder: 'Variable name'
      }
    ],
    description: 'Use a stored variable value',
    example: 'myVar',
    returnsPattern: false
  },

  // ===== LOGIC BLOCKS (Conditionals & Loops) =====
  {
    id: 'logic_when',
    category: 'logic',
    name: 'When',
    strudelFunction: 'when',
    color: '#EC4899',
    inputs: [
      {
        name: 'condition',
        type: 'string',
        defaultValue: '() => true',
        placeholder: 'Condition function'
      }
    ],
    description: 'Apply effect when condition is true',
    example: '.when(() => true, fast(2))',
    returnsPattern: true
  },
  {
    id: 'logic_chance',
    category: 'logic',
    name: 'Chance',
    strudelFunction: 'sometimesBy',
    color: '#EC4899',
    inputs: [
      {
        name: 'probability',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Apply effect with custom probability',
    example: '.sometimesBy(0.5, fast(2))',
    returnsPattern: true
  },
  {
    id: 'logic_repeat',
    category: 'logic',
    name: 'Repeat',
    strudelFunction: 'repeatCycles',
    color: '#EC4899',
    inputs: [
      {
        name: 'times',
        type: 'number',
        defaultValue: 4
      }
    ],
    description: 'Repeat pattern for N cycles',
    example: '.repeatCycles(4)',
    returnsPattern: true
  },
  {
    id: 'logic_iter',
    category: 'logic',
    name: 'Iterate',
    strudelFunction: 'iter',
    color: '#EC4899',
    inputs: [
      {
        name: 'count',
        type: 'number',
        defaultValue: 4
      }
    ],
    description: 'Iterate through pattern elements',
    example: '.iter(4)',
    returnsPattern: true
  },
  {
    id: 'logic_struct',
    category: 'logic',
    name: 'Structure',
    strudelFunction: 'struct',
    color: '#EC4899',
    inputs: [
      {
        name: 'pattern',
        type: 'string',
        defaultValue: 'x x x x',
        placeholder: 'Binary pattern'
      }
    ],
    description: 'Apply a rhythmic structure (x = play, . = rest)',
    example: '.struct("x . x .")',
    returnsPattern: true
  },
  {
    id: 'logic_mask',
    category: 'logic',
    name: 'Mask',
    strudelFunction: 'mask',
    color: '#EC4899',
    inputs: [
      {
        name: 'pattern',
        type: 'string',
        defaultValue: '1 0 1 0',
        placeholder: 'Binary mask'
      }
    ],
    description: 'Filter pattern with a binary mask (1 = play, 0 = silence)',
    example: '.mask("1 0 1 0")',
    returnsPattern: true
  },

  // ===== ADDITIONAL CONTROL BLOCKS =====
  {
    id: 'control_euclid',
    category: 'control',
    name: 'Euclidean',
    strudelFunction: 'euclid',
    color: '#A78BFA',
    inputs: [
      {
        name: 'pulses',
        type: 'number',
        defaultValue: 3
      },
      {
        name: 'steps',
        type: 'number',
        defaultValue: 8
      }
    ],
    description: 'Generate Euclidean rhythm (pulses distributed over steps)',
    example: '.euclid(3, 8)',
    returnsPattern: true
  },
  {
    id: 'control_degradeBy',
    category: 'control',
    name: 'Degrade',
    strudelFunction: 'degradeBy',
    color: '#A78BFA',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Randomly remove events (glitch effect)',
    example: '.degradeBy(0.5)',
    returnsPattern: true
  },

  // ===== SOUND GENERATION (Extended) =====
  {
    id: 'sound_n',
    category: 'sound',
    name: 'Sample Index',
    strudelFunction: 'n',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'index',
        type: 'string',
        defaultValue: '0',
        placeholder: '0 1 2 3...'
      }
    ],
    description: 'Select sample variation/index',
    example: '.n("0 1 2 3")',
    returnsPattern: true
  },
  {
    id: 'sound_bank',
    category: 'sound',
    name: 'Sample Bank',
    strudelFunction: 'bank',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'bankName',
        type: 'string',
        defaultValue: 'default',
        placeholder: 'Bank name'
      }
    ],
    description: 'Select sample bank',
    example: '.bank("default")',
    returnsPattern: true
  },

  // ===== PITCH & HARMONY =====
  {
    id: 'pitch_scale',
    category: 'sound',
    name: 'Scale',
    strudelFunction: 'scale',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'scale',
        type: 'dropdown',
        defaultValue: 'C major',
        options: ['C major', 'C minor', 'D major', 'D minor', 'E minor', 'F major', 'G major', 'A minor', 'chromatic']
      }
    ],
    description: 'Set musical scale',
    example: '.scale("C major")',
    returnsPattern: true
  },
  {
    id: 'pitch_chord',
    category: 'sound',
    name: 'Chord',
    strudelFunction: 'chord',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'chord',
        type: 'string',
        defaultValue: 'C major',
        placeholder: 'Chord name'
      }
    ],
    description: 'Play chord',
    example: '.chord("C major")',
    returnsPattern: true
  },
  {
    id: 'pitch_add',
    category: 'sound',
    name: 'Transpose',
    strudelFunction: 'add',
    color: '#FF6B6B',
    inputs: [
      {
        name: 'semitones',
        type: 'number',
        defaultValue: 0,
        placeholder: 'Semitones to transpose'
      }
    ],
    description: 'Transpose notes by semitones',
    example: 'note("c3").add(7)',
    returnsPattern: true
  },

  // ===== ADDITIONAL EFFECTS =====
  {
    id: 'effect_crush',
    category: 'effect',
    name: 'Bit Crusher',
    strudelFunction: 'crush',
    color: '#95E1D3',
    inputs: [
      {
        name: 'bits',
        type: 'number',
        defaultValue: 4,
        placeholder: '1-16'
      }
    ],
    description: 'Bit crusher distortion',
    example: '.crush(4)',
    returnsPattern: true
  },
  {
    id: 'effect_coarse',
    category: 'effect',
    name: 'Sample Rate Reduction',
    strudelFunction: 'coarse',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 2,
        placeholder: 'Sample rate divisor'
      }
    ],
    description: 'Reduce sample rate (lo-fi effect)',
    example: '.coarse(2)',
    returnsPattern: true
  },
  {
    id: 'effect_shape',
    category: 'effect',
    name: 'Waveshaper',
    strudelFunction: 'shape',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Waveshaping distortion',
    example: '.shape(0.5)',
    returnsPattern: true
  },
  {
    id: 'effect_vowel',
    category: 'effect',
    name: 'Vowel Filter',
    strudelFunction: 'vowel',
    color: '#95E1D3',
    inputs: [
      {
        name: 'vowel',
        type: 'dropdown',
        defaultValue: 'a',
        options: ['a', 'e', 'i', 'o', 'u']
      }
    ],
    description: 'Formant filter (vowel sounds)',
    example: '.vowel("a")',
    returnsPattern: true
  },
  {
    id: 'effect_phaser',
    category: 'effect',
    name: 'Phaser',
    strudelFunction: 'phaser',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Phaser effect',
    example: '.phaser(0.5)',
    returnsPattern: true
  },
  {
    id: 'effect_chorus',
    category: 'effect',
    name: 'Chorus',
    strudelFunction: 'chorus',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Chorus effect',
    example: '.chorus(0.5)',
    returnsPattern: true
  },
  {
    id: 'effect_tremolo',
    category: 'effect',
    name: 'Tremolo',
    strudelFunction: 'tremolo',
    color: '#95E1D3',
    inputs: [
      {
        name: 'rate',
        type: 'number',
        defaultValue: 4,
        placeholder: 'Hz'
      }
    ],
    description: 'Amplitude modulation (tremolo)',
    example: '.tremolo(4)',
    returnsPattern: true
  },
  {
    id: 'effect_orbit',
    category: 'effect',
    name: 'Orbit',
    strudelFunction: 'orbit',
    color: '#95E1D3',
    inputs: [
      {
        name: 'channel',
        type: 'number',
        defaultValue: 0,
        placeholder: 'Output channel'
      }
    ],
    description: 'Route to different output channel',
    example: '.orbit(0)',
    returnsPattern: true
  },
  {
    id: 'effect_resonance',
    category: 'effect',
    name: 'Resonance',
    strudelFunction: 'resonance',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 10.0'
      }
    ],
    description: 'Filter resonance/Q',
    example: '.resonance(0.5)',
    returnsPattern: true
  },

  // ===== PATTERN MANIPULATION =====
  {
    id: 'pattern_rev',
    category: 'pattern',
    name: 'Reverse',
    strudelFunction: 'rev',
    color: '#FFD93D',
    inputs: [],
    description: 'Reverse pattern playback',
    example: '.rev()',
    returnsPattern: true
  },
  {
    id: 'pattern_jux',
    category: 'pattern',
    name: 'Jux',
    strudelFunction: 'jux',
    color: '#FFD93D',
    inputs: [
      {
        name: 'transform',
        type: 'string',
        defaultValue: 'rev',
        placeholder: 'Function name'
      }
    ],
    description: 'Apply transformation to right channel',
    example: '.jux(rev)',
    returnsPattern: true
  },
  {
    id: 'pattern_superimpose',
    category: 'pattern',
    name: 'Superimpose',
    strudelFunction: 'superimpose',
    color: '#FFD93D',
    inputs: [
      {
        name: 'transform',
        type: 'string',
        defaultValue: 'fast(2)',
        placeholder: 'Transformation'
      }
    ],
    description: 'Layer pattern with transformed version',
    example: '.superimpose(fast(2))',
    returnsPattern: true
  },
  {
    id: 'pattern_layer',
    category: 'pattern',
    name: 'Layer',
    strudelFunction: 'layer',
    color: '#FFD93D',
    inputs: [],
    description: 'Layer multiple transformations',
    example: '.layer(fast(2), rev)',
    returnsPattern: true
  },
  {
    id: 'pattern_off',
    category: 'pattern',
    name: 'Off',
    strudelFunction: 'off',
    color: '#FFD93D',
    inputs: [
      {
        name: 'time',
        type: 'number',
        defaultValue: 0.25,
        placeholder: 'Time offset'
      },
      {
        name: 'transform',
        type: 'string',
        defaultValue: 'fast(2)',
        placeholder: 'Transformation'
      }
    ],
    description: 'Echo pattern with transformation',
    example: '.off(0.25, fast(2))',
    returnsPattern: true
  },
  {
    id: 'pattern_ply',
    category: 'pattern',
    name: 'Ply',
    strudelFunction: 'ply',
    color: '#FFD93D',
    inputs: [
      {
        name: 'times',
        type: 'number',
        defaultValue: 2,
        placeholder: 'Repetitions'
      }
    ],
    description: 'Repeat each step N times',
    example: '.ply(2)',
    returnsPattern: true
  },
  {
    id: 'pattern_echo',
    category: 'pattern',
    name: 'Echo',
    strudelFunction: 'echo',
    color: '#FFD93D',
    inputs: [
      {
        name: 'times',
        type: 'number',
        defaultValue: 4,
        placeholder: 'Number of echoes'
      },
      {
        name: 'time',
        type: 'number',
        defaultValue: 0.125,
        placeholder: 'Time between echoes'
      },
      {
        name: 'feedback',
        type: 'number',
        defaultValue: 0.8,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Create echo/feedback effect',
    example: '.echo(4, 0.125, 0.8)',
    returnsPattern: true
  },

  // ===== TIME MANIPULATION =====
  {
    id: 'time_speed',
    category: 'time',
    name: 'Speed',
    strudelFunction: 'speed',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'rate',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Playback speed'
      }
    ],
    description: 'Change sample playback speed',
    example: '.speed(2)',
    returnsPattern: true
  },
  {
    id: 'time_hurry',
    category: 'time',
    name: 'Hurry',
    strudelFunction: 'hurry',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 2,
        placeholder: 'Speed multiplier'
      }
    ],
    description: 'Speed up with pitch shift',
    example: '.hurry(2)',
    returnsPattern: true
  },
  {
    id: 'time_early',
    category: 'time',
    name: 'Early',
    strudelFunction: 'early',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.125,
        placeholder: 'Time shift'
      }
    ],
    description: 'Shift pattern earlier in time',
    example: '.early(0.125)',
    returnsPattern: true
  },
  {
    id: 'time_late',
    category: 'time',
    name: 'Late',
    strudelFunction: 'late',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 0.125,
        placeholder: 'Time shift'
      }
    ],
    description: 'Shift pattern later in time',
    example: '.late(0.125)',
    returnsPattern: true
  },
  {
    id: 'time_compress',
    category: 'time',
    name: 'Compress',
    strudelFunction: 'compress',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'start',
        type: 'number',
        defaultValue: 0,
        placeholder: '0.0 - 1.0'
      },
      {
        name: 'end',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Squeeze pattern into time range',
    example: '.compress(0, 0.5)',
    returnsPattern: true
  },
  {
    id: 'time_zoom',
    category: 'time',
    name: 'Zoom',
    strudelFunction: 'zoom',
    color: '#4ECDC4',
    inputs: [
      {
        name: 'start',
        type: 'number',
        defaultValue: 0,
        placeholder: '0.0 - 1.0'
      },
      {
        name: 'end',
        type: 'number',
        defaultValue: 0.5,
        placeholder: '0.0 - 1.0'
      }
    ],
    description: 'Focus on part of pattern',
    example: '.zoom(0, 0.5)',
    returnsPattern: true
  },

  // ===== SAMPLE MANIPULATION =====
  {
    id: 'sample_chop',
    category: 'effect',
    name: 'Chop',
    strudelFunction: 'chop',
    color: '#95E1D3',
    inputs: [
      {
        name: 'slices',
        type: 'number',
        defaultValue: 16,
        placeholder: 'Number of slices'
      }
    ],
    description: 'Slice sample into pieces',
    example: '.chop(16)',
    returnsPattern: true
  },
  {
    id: 'sample_striate',
    category: 'effect',
    name: 'Striate',
    strudelFunction: 'striate',
    color: '#95E1D3',
    inputs: [
      {
        name: 'grains',
        type: 'number',
        defaultValue: 16,
        placeholder: 'Number of grains'
      }
    ],
    description: 'Granular synthesis effect',
    example: '.striate(16)',
    returnsPattern: true
  },
  {
    id: 'sample_cut',
    category: 'effect',
    name: 'Cut Group',
    strudelFunction: 'cut',
    color: '#95E1D3',
    inputs: [
      {
        name: 'group',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Cut group number'
      }
    ],
    description: 'Assign to cut group (stops previous)',
    example: '.cut(1)',
    returnsPattern: true
  },
  {
    id: 'sample_splice',
    category: 'effect',
    name: 'Splice',
    strudelFunction: 'splice',
    color: '#95E1D3',
    inputs: [
      {
        name: 'slices',
        type: 'number',
        defaultValue: 8,
        placeholder: 'Number of slices'
      },
      {
        name: 'pattern',
        type: 'string',
        defaultValue: '0 1 2 3',
        placeholder: 'Slice pattern'
      }
    ],
    description: 'Splice and rearrange sample',
    example: '.splice(8, "0 1 2 3")',
    returnsPattern: true
  },
  {
    id: 'sample_loopAt',
    category: 'effect',
    name: 'Loop At',
    strudelFunction: 'loopAt',
    color: '#95E1D3',
    inputs: [
      {
        name: 'cycles',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Loop length in cycles'
      }
    ],
    description: 'Set loop length to match tempo',
    example: '.loopAt(1)',
    returnsPattern: true
  },
  {
    id: 'sample_legato',
    category: 'effect',
    name: 'Legato',
    strudelFunction: 'legato',
    color: '#95E1D3',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Note length multiplier'
      }
    ],
    description: 'Set note/sample duration',
    example: '.legato(0.5)',
    returnsPattern: true
  },

  // ===== VALUE TRANSFORMERS =====
  {
    id: 'value_range',
    category: 'value',
    name: 'Range',
    strudelFunction: 'range',
    color: '#10B981',
    inputs: [
      {
        name: 'min',
        type: 'number',
        defaultValue: 0,
        placeholder: 'Minimum value'
      },
      {
        name: 'max',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Maximum value'
      }
    ],
    description: 'Scale 0-1 values to min-max range',
    example: '.range(100, 1000)',
    returnsPattern: true
  },
  {
    id: 'value_rangex',
    category: 'value',
    name: 'Range (Exponential)',
    strudelFunction: 'rangex',
    color: '#10B981',
    inputs: [
      {
        name: 'min',
        type: 'number',
        defaultValue: 0.01,
        placeholder: 'Minimum value'
      },
      {
        name: 'max',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Maximum value'
      }
    ],
    description: 'Exponentially scale 0-1 to min-max',
    example: '.rangex(100, 10000)',
    returnsPattern: true
  },
  {
    id: 'value_round',
    category: 'value',
    name: 'Round',
    strudelFunction: 'round',
    color: '#10B981',
    inputs: [],
    description: 'Round to nearest integer',
    example: '.round()',
    returnsPattern: true
  },
  {
    id: 'value_floor',
    category: 'value',
    name: 'Floor',
    strudelFunction: 'floor',
    color: '#10B981',
    inputs: [],
    description: 'Round down to integer',
    example: '.floor()',
    returnsPattern: true
  },
  {
    id: 'value_ceil',
    category: 'value',
    name: 'Ceiling',
    strudelFunction: 'ceil',
    color: '#10B981',
    inputs: [],
    description: 'Round up to integer',
    example: '.ceil()',
    returnsPattern: true
  },
  {
    id: 'value_mul',
    category: 'value',
    name: 'Multiply',
    strudelFunction: 'mul',
    color: '#10B981',
    inputs: [
      {
        name: 'factor',
        type: 'number',
        defaultValue: 2,
        placeholder: 'Multiplier'
      }
    ],
    description: 'Multiply values by factor',
    example: '.mul(2)',
    returnsPattern: true
  },
  {
    id: 'value_div',
    category: 'value',
    name: 'Divide',
    strudelFunction: 'div',
    color: '#10B981',
    inputs: [
      {
        name: 'divisor',
        type: 'number',
        defaultValue: 2,
        placeholder: 'Divisor'
      }
    ],
    description: 'Divide values by divisor',
    example: '.div(2)',
    returnsPattern: true
  },
  {
    id: 'value_add_math',
    category: 'value',
    name: 'Add',
    strudelFunction: 'add',
    color: '#10B981',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Amount to add'
      }
    ],
    description: 'Add to values',
    example: '.add(1)',
    returnsPattern: true
  },
  {
    id: 'value_sub',
    category: 'value',
    name: 'Subtract',
    strudelFunction: 'sub',
    color: '#10B981',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        defaultValue: 1,
        placeholder: 'Amount to subtract'
      }
    ],
    description: 'Subtract from values',
    example: '.sub(1)',
    returnsPattern: true
  },
];

/**
 * Get block definition by ID
 */
export function getBlockDefinition(id: string): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find(def => def.id === id);
}

/**
 * Get all blocks in a category
 */
export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_DEFINITIONS.filter(def => def.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): BlockCategory[] {
  return ['sound', 'time', 'effect', 'pattern', 'control', 'data', 'logic', 'value'];
}

/**
 * Create a new block instance
 */
export function createBlock(definitionId: string): Block {
  const def = getBlockDefinition(definitionId);
  if (!def) throw new Error(`Block definition ${definitionId} not found`);

  const inputs: Record<string, any> = {};
  def.inputs.forEach(input => {
    inputs[input.name] = input.defaultValue ?? '';
  });

  return {
    instanceId: crypto.randomUUID(),
    definitionId,
    inputs,
    children: []
  };
}
