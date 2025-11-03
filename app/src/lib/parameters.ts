/**
 * Parameter Control System for Strudel Patterns
 * Maps 8 knobs (CC 48-55) to Strudel pattern functions
 */

export interface KnobParameter {
  id: number; // 0-7 (knob index)
  cc: number; // 48-55 (MIDI CC number)
  name: string;
  description: string;
  strudelFunction: string; // e.g., 'gain', 'speed', 'lpf'
  minValue: number;
  maxValue: number;
  defaultValue: number;
  currentValue: number;
}

/**
 * Default parameter mapping for the 8 knobs
 */
export const DEFAULT_KNOB_PARAMETERS: KnobParameter[] = [
  {
    id: 0,
    cc: 48,
    name: 'Volume',
    description: 'Master volume',
    strudelFunction: 'gain',
    minValue: 0,
    maxValue: 1,
    defaultValue: 0.7,
    currentValue: 0.7,
  },
  {
    id: 1,
    cc: 49,
    name: 'Speed',
    description: 'Playback speed',
    strudelFunction: 'speed',
    minValue: 0.25,
    maxValue: 4,
    defaultValue: 1,
    currentValue: 1,
  },
  {
    id: 2,
    cc: 50,
    name: 'Low-Pass',
    description: 'Low-pass filter cutoff',
    strudelFunction: 'lpf',
    minValue: 100,
    maxValue: 10000,
    defaultValue: 5000,
    currentValue: 5000,
  },
  {
    id: 3,
    cc: 51,
    name: 'High-Pass',
    description: 'High-pass filter cutoff',
    strudelFunction: 'hpf',
    minValue: 0,
    maxValue: 2000,
    defaultValue: 0,
    currentValue: 0,
  },
  {
    id: 4,
    cc: 52,
    name: 'Reverb',
    description: 'Reverb room size',
    strudelFunction: 'room',
    minValue: 0,
    maxValue: 1,
    defaultValue: 0,
    currentValue: 0,
  },
  {
    id: 5,
    cc: 53,
    name: 'Delay',
    description: 'Delay amount',
    strudelFunction: 'delay',
    minValue: 0,
    maxValue: 1,
    defaultValue: 0,
    currentValue: 0,
  },
  {
    id: 6,
    cc: 54,
    name: 'Pan',
    description: 'Stereo panning',
    strudelFunction: 'pan',
    minValue: -1,
    maxValue: 1,
    defaultValue: 0,
    currentValue: 0,
  },
  {
    id: 7,
    cc: 55,
    name: 'Crush',
    description: 'Bit crusher',
    strudelFunction: 'crush',
    minValue: 1,
    maxValue: 16,
    defaultValue: 16,
    currentValue: 16,
  },
];

/**
 * Convert MIDI value (0-127) to parameter range
 * @param midiValue MIDI CC value (0-127)
 * @param min Minimum parameter value
 * @param max Maximum parameter value
 * @returns Scaled parameter value
 */
export function scaleValue(midiValue: number, min: number, max: number): number {
  // Clamp MIDI value
  const midi = Math.max(0, Math.min(127, midiValue));

  // Scale to 0-1
  const normalized = midi / 127;

  // Scale to parameter range
  return min + normalized * (max - min);
}

/**
 * Convert parameter value back to MIDI value (0-127)
 * @param value Parameter value
 * @param min Minimum parameter value
 * @param max Maximum parameter value
 * @returns MIDI CC value (0-127)
 */
export function unscaleValue(value: number, min: number, max: number): number {
  // Clamp value
  const clamped = Math.max(min, Math.min(max, value));

  // Scale to 0-1
  const normalized = (clamped - min) / (max - min);

  // Scale to MIDI range
  return Math.round(normalized * 127);
}

/**
 * Build Strudel code with parameters applied
 * @param baseCode Base pattern code
 * @param parameters Array of parameters to apply
 * @returns Code with parameters applied
 */
export function applyParameters(baseCode: string, parameters: KnobParameter[]): string {
  let code = baseCode;

  // Filter out parameters at default values (no need to apply)
  const activeParams = parameters.filter(p => {
    // Skip if at default value
    if (Math.abs(p.currentValue - p.defaultValue) < 0.01) {
      return false;
    }

    // Skip if at "no effect" value
    if (p.strudelFunction === 'hpf' && p.currentValue === 0) return false;
    if (p.strudelFunction === 'room' && p.currentValue === 0) return false;
    if (p.strudelFunction === 'delay' && p.currentValue === 0) return false;
    if (p.strudelFunction === 'crush' && p.currentValue === 16) return false;

    return true;
  });

  // Apply each parameter as a chained function
  for (const param of activeParams) {
    const value = param.currentValue.toFixed(3);
    code += `.${param.strudelFunction}(${value})`;
  }

  return code;
}

/**
 * Format parameter value for display
 * @param param Parameter to format
 * @returns Formatted string
 */
export function formatValue(param: KnobParameter): string {
  const value = param.currentValue;

  // Integer values
  if (param.strudelFunction === 'crush') {
    return Math.round(value).toString();
  }

  // Frequency values (Hz)
  if (param.strudelFunction === 'lpf' || param.strudelFunction === 'hpf') {
    if (value === 0) return 'Off';
    return `${Math.round(value)} Hz`;
  }

  // Percentage values
  if (param.strudelFunction === 'gain' || param.strudelFunction === 'room' || param.strudelFunction === 'delay') {
    return `${Math.round(value * 100)}%`;
  }

  // Speed multiplier
  if (param.strudelFunction === 'speed') {
    return `${value.toFixed(2)}x`;
  }

  // Pan position
  if (param.strudelFunction === 'pan') {
    if (value === 0) return 'Center';
    if (value < 0) return `L${Math.abs(Math.round(value * 100))}`;
    return `R${Math.round(value * 100)}`;
  }

  return value.toFixed(2);
}
