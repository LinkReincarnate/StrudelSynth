/**
 * Parameter Detection Utility
 *
 * Detects and extracts parameter placeholders from Strudel code.
 * Supports syntax like: $speed, $cutoff, $volume, etc.
 */

import type { DynamicParameter } from './types';

/**
 * Extract parameter names from Strudel code
 * Looks for $paramName pattern
 *
 * @param code Strudel pattern code
 * @returns Array of unique parameter names (without $ prefix)
 *
 * @example
 * extractParameters('note("c4").fast($speed).lpf($cutoff * 1000)')
 * // Returns: ['speed', 'cutoff']
 */
export function extractParameters(code: string): string[] {
  // Match $paramName pattern
  // Allow letters, numbers, and underscores in param names
  const paramRegex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;

  const params = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = paramRegex.exec(code)) !== null) {
    params.add(match[1]); // match[1] is the capture group (param name without $)
  }

  return Array.from(params);
}

/**
 * Get default configuration for a parameter based on its name
 * Uses heuristics to guess appropriate min/max values
 *
 * @param paramName Parameter name
 * @returns Default min/max values
 */
function getDefaultRange(paramName: string): { min: number; max: number } {
  const lower = paramName.toLowerCase();

  // Speed/tempo parameters (0.1x to 4x)
  if (lower.includes('speed') || lower.includes('tempo') || lower.includes('rate')) {
    return { min: 0.1, max: 4.0 };
  }

  // Filter cutoff (normalized 0-1, will be multiplied in code)
  if (lower.includes('cutoff') || lower.includes('lpf') || lower.includes('hpf')) {
    return { min: 0.0, max: 1.0 };
  }

  // Resonance/Q (0-10)
  if (lower.includes('res') || lower.includes('q')) {
    return { min: 0.0, max: 10.0 };
  }

  // Volume/gain (0-1)
  if (lower.includes('vol') || lower.includes('gain') || lower.includes('amp')) {
    return { min: 0.0, max: 1.0 };
  }

  // Pan (-1 to 1)
  if (lower.includes('pan')) {
    return { min: -1.0, max: 1.0 };
  }

  // Delay/reverb/effects (0-1)
  if (lower.includes('delay') || lower.includes('reverb') || lower.includes('echo') ||
      lower.includes('fx') || lower.includes('effect')) {
    return { min: 0.0, max: 1.0 };
  }

  // Default: 0-1 normalized range
  return { min: 0.0, max: 1.0 };
}

/**
 * Create dynamic parameter definitions from detected parameter names
 *
 * @param paramNames Array of parameter names
 * @param existingParams Existing parameter definitions to preserve values/mappings
 * @returns Array of DynamicParameter objects
 */
export function createDynamicParameters(
  paramNames: string[],
  existingParams?: DynamicParameter[]
): DynamicParameter[] {
  const existingMap = new Map<string, DynamicParameter>();

  // Build map of existing parameters
  if (existingParams) {
    for (const param of existingParams) {
      existingMap.set(param.name, param);
    }
  }

  // Create parameter definitions
  return paramNames.map(name => {
    const existing = existingMap.get(name);

    if (existing) {
      // Preserve existing configuration
      return existing;
    }

    // Create new parameter with defaults
    const range = getDefaultRange(name);
    const defaultValue = (range.min + range.max) / 2; // Middle of range

    return {
      name,
      value: defaultValue,
      minValue: range.min,
      maxValue: range.max,
      assignedKnob: null, // Not assigned by default
      displayName: formatParameterName(name)
    };
  });
}

/**
 * Format parameter name for display
 * Converts camelCase/snake_case to Title Case
 *
 * @param name Parameter name
 * @returns Formatted display name
 */
function formatParameterName(name: string): string {
  // Convert camelCase to Title Case
  const withSpaces = name.replace(/([A-Z])/g, ' $1');

  // Convert snake_case to spaces
  const normalized = withSpaces.replace(/_/g, ' ');

  // Capitalize first letter of each word
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Replace parameter placeholders in code with actual values
 *
 * @param code Strudel pattern code with $param placeholders
 * @param parameters Array of DynamicParameter with current values
 * @returns Code with parameters replaced by values
 *
 * @example
 * injectParameterValues(
 *   'note("c4").fast($speed)',
 *   [{ name: 'speed', value: 2.0, ... }]
 * )
 * // Returns: 'note("c4").fast(2.0)'
 */
export function injectParameterValues(code: string, parameters: DynamicParameter[]): string {
  let result = code;

  for (const param of parameters) {
    // Replace all occurrences of $paramName with the value
    const regex = new RegExp(`\\$${param.name}\\b`, 'g');
    result = result.replace(regex, param.value.toString());
  }

  return result;
}

/**
 * Snap value to nearest whole number if close enough (directional snapping)
 * Only snaps when moving TOWARD a whole number, prevents getting stuck
 *
 * @param oldValue Previous value
 * @param newValue New value after delta applied
 * @param snapThreshold How close to whole number to trigger snap (default 0.08)
 * @returns Snapped value
 */
function snapToWholeNumber(oldValue: number, newValue: number, snapThreshold: number = 0.08): number {
  const nearestWhole = Math.round(newValue);
  const newDistance = Math.abs(newValue - nearestWhole);
  const oldDistance = Math.abs(oldValue - nearestWhole);

  // Only snap if:
  // 1. We're within the snap threshold
  // 2. We're moving TOWARD the whole number (getting closer)
  // This prevents getting stuck - if you're at 1.0 and move away, oldDistance is 0
  // and newDistance will be > 0, so we won't snap
  if (newDistance <= snapThreshold && newDistance < oldDistance) {
    return nearestWhole;
  }

  return newValue;
}

/**
 * Update parameter value based on knob input
 * Maps knob value (0-127) to parameter range (min-max)
 *
 * @param param Dynamic parameter to update
 * @param delta MIDI knob delta value
 * @returns Updated parameter
 */
export function updateParameterFromKnob(param: DynamicParameter, delta: number): DynamicParameter {
  const range = param.maxValue - param.minValue;
  const stepSize = range / 127; // 127 steps across full range

  const oldValue = param.value;
  let newValue = oldValue + (delta * stepSize);

  // Clamp to range
  newValue = Math.max(param.minValue, Math.min(param.maxValue, newValue));

  // Snap to whole numbers when approaching them (prevents getting stuck)
  newValue = snapToWholeNumber(oldValue, newValue);

  return {
    ...param,
    value: newValue
  };
}
