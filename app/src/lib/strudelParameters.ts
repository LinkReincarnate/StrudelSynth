/**
 * Comprehensive list of available Strudel parameters
 * Based on official Strudel documentation
 */

export interface StrudelParameterDefinition {
  name: string;           // Parameter name (without $ prefix)
  displayName: string;    // Human-readable name
  category: string;       // Category for organization
  minValue: number;       // Default minimum value
  maxValue: number;       // Default maximum value
  defaultValue: number;   // Default starting value
  description: string;    // What this parameter does
  syntax: string;         // How to use it in code (e.g., ".gain($volume)")
}

/**
 * All available Strudel parameters organized by category
 */
export const STRUDEL_PARAMETERS: StrudelParameterDefinition[] = [
  // === TIME MODIFIERS ===
  {
    name: 'speed',
    displayName: 'Speed',
    category: 'Time',
    minValue: 0.1,
    maxValue: 4.0,
    defaultValue: 1.0,
    description: 'Speed up pattern playback',
    syntax: '.fast($speed)'
  },
  {
    name: 'slowness',
    displayName: 'Slowness',
    category: 'Time',
    minValue: 0.25,
    maxValue: 4.0,
    defaultValue: 1.0,
    description: 'Slow down pattern playback',
    syntax: '.slow($slowness)'
  },
  {
    name: 'timing',
    displayName: 'Timing Shift',
    category: 'Time',
    minValue: -0.5,
    maxValue: 0.5,
    defaultValue: 0.0,
    description: 'Shift pattern timing early/late',
    syntax: '.early($timing)'
  },

  // === FILTERS ===
  {
    name: 'cutoff',
    displayName: 'LP Cutoff',
    category: 'Filter',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.5,
    description: 'Low-pass filter cutoff frequency',
    syntax: '.lpf($cutoff * 10000)'
  },
  {
    name: 'resonance',
    displayName: 'LP Resonance',
    category: 'Filter',
    minValue: 0.0,
    maxValue: 10.0,
    defaultValue: 1.0,
    description: 'Low-pass filter resonance',
    syntax: '.lpq($resonance)'
  },
  {
    name: 'hcutoff',
    displayName: 'HP Cutoff',
    category: 'Filter',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.5,
    description: 'High-pass filter cutoff frequency',
    syntax: '.hpf($hcutoff * 10000)'
  },
  {
    name: 'hresonance',
    displayName: 'HP Resonance',
    category: 'Filter',
    minValue: 0.0,
    maxValue: 10.0,
    defaultValue: 1.0,
    description: 'High-pass filter resonance',
    syntax: '.hpq($hresonance)'
  },
  {
    name: 'bandfreq',
    displayName: 'BP Frequency',
    category: 'Filter',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.5,
    description: 'Band-pass filter center frequency',
    syntax: '.bandf($bandfreq * 10000)'
  },
  {
    name: 'bandq',
    displayName: 'BP Q-Factor',
    category: 'Filter',
    minValue: 0.1,
    maxValue: 10.0,
    defaultValue: 1.0,
    description: 'Band-pass filter Q-factor',
    syntax: '.bandq($bandq)'
  },

  // === VOLUME & DYNAMICS ===
  {
    name: 'volume',
    displayName: 'Volume',
    category: 'Dynamics',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.7,
    description: 'Volume/gain level',
    syntax: '.gain($volume)'
  },
  {
    name: 'velocity',
    displayName: 'Velocity',
    category: 'Dynamics',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.8,
    description: 'Note velocity (MIDI-style amplitude)',
    syntax: '.velocity($velocity)'
  },

  // === SPATIAL ===
  {
    name: 'pan',
    displayName: 'Pan',
    category: 'Spatial',
    minValue: -1.0,
    maxValue: 1.0,
    defaultValue: 0.0,
    description: 'Stereo pan position (left to right)',
    syntax: '.pan($pan)'
  },

  // === DISTORTION ===
  {
    name: 'shape',
    displayName: 'Wave Shape',
    category: 'Distortion',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.0,
    description: 'Wave shaping distortion amount',
    syntax: '.shape($shape)'
  },
  {
    name: 'crush',
    displayName: 'Bit Crush',
    category: 'Distortion',
    minValue: 0.0,
    maxValue: 16.0,
    defaultValue: 8.0,
    description: 'Bit depth reduction',
    syntax: '.crush($crush)'
  },
  {
    name: 'coarse',
    displayName: 'Sample Rate',
    category: 'Distortion',
    minValue: 1.0,
    maxValue: 32.0,
    defaultValue: 1.0,
    description: 'Sample rate reduction',
    syntax: '.coarse($coarse)'
  },

  // === DELAY ===
  {
    name: 'delay',
    displayName: 'Delay Level',
    category: 'Delay',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.3,
    description: 'Delay wet signal level',
    syntax: '.delay($delay)'
  },
  {
    name: 'delaytime',
    displayName: 'Delay Time',
    category: 'Delay',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.25,
    description: 'Delay time duration',
    syntax: '.delaytime($delaytime)'
  },
  {
    name: 'delayfeedback',
    displayName: 'Delay Feedback',
    category: 'Delay',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.5,
    description: 'Delay feedback/recirculation amount',
    syntax: '.delayfeedback($delayfeedback)'
  },

  // === REVERB ===
  {
    name: 'room',
    displayName: 'Reverb Level',
    category: 'Reverb',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.3,
    description: 'Reverb wet signal level',
    syntax: '.room($room)'
  },
  {
    name: 'roomsize',
    displayName: 'Room Size',
    category: 'Reverb',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.5,
    description: 'Reverb room/space size',
    syntax: '.size($roomsize)'
  },

  // === MODULATION ===
  {
    name: 'vowel',
    displayName: 'Vowel',
    category: 'Modulation',
    minValue: 0.0,
    maxValue: 4.0,
    defaultValue: 0.0,
    description: 'Formant filter vowel (0=a, 1=e, 2=i, 3=o, 4=u)',
    syntax: '.vowel(["a", "e", "i", "o", "u"][$vowel])'
  },

  // === ENVELOPE ===
  {
    name: 'attack',
    displayName: 'Attack',
    category: 'Envelope',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.01,
    description: 'Envelope attack time',
    syntax: '.attack($attack)'
  },
  {
    name: 'decay',
    displayName: 'Decay',
    category: 'Envelope',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.1,
    description: 'Envelope decay time',
    syntax: '.decay($decay)'
  },
  {
    name: 'sustain',
    displayName: 'Sustain',
    category: 'Envelope',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.5,
    description: 'Envelope sustain level',
    syntax: '.sustain($sustain)'
  },
  {
    name: 'release',
    displayName: 'Release',
    category: 'Envelope',
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 0.1,
    description: 'Envelope release time',
    syntax: '.release($release)'
  },

  // === RHYTHM ===
  {
    name: 'legato',
    displayName: 'Legato',
    category: 'Rhythm',
    minValue: 0.1,
    maxValue: 2.0,
    defaultValue: 1.0,
    description: 'Note duration multiplier',
    syntax: '.legato($legato)'
  },
];

/**
 * Get parameter definition by name
 */
export function getParameterDefinition(name: string): StrudelParameterDefinition | undefined {
  return STRUDEL_PARAMETERS.find(p => p.name === name);
}

/**
 * Get all parameters in a specific category
 */
export function getParametersByCategory(category: string): StrudelParameterDefinition[] {
  return STRUDEL_PARAMETERS.filter(p => p.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set(STRUDEL_PARAMETERS.map(p => p.category));
  return Array.from(categories).sort();
}

/**
 * Get parameter names for dropdown display
 */
export function getParameterOptions(): Array<{ value: string; label: string; category: string }> {
  return STRUDEL_PARAMETERS.map(p => ({
    value: p.name,
    label: p.displayName,
    category: p.category
  }));
}
