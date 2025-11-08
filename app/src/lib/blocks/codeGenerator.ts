/**
 * Code Generator
 * Converts block structures to Strudel code
 */

import type { Block, BlockProgram } from './blockTypes';
import { getBlockDefinition } from './blockTypes';

/**
 * Generate Strudel code from a block structure
 */
export function generateCode(block: Block): string {
  const def = getBlockDefinition(block.definitionId);
  if (!def) {
    throw new Error(`Block definition ${block.definitionId} not found`);
  }

  let code = '';

  // Handle different block categories
  switch (def.category) {
    case 'sound':
      code = generateSoundBlock(block, def);
      break;
    case 'pattern':
      code = generatePatternBlock(block, def);
      break;
    case 'data':
      code = generateDataBlock(block, def);
      break;
    case 'logic':
      code = generateLogicBlock(block, def);
      break;
    case 'time':
    case 'effect':
    case 'control':
    case 'value':
      code = generateModifierBlock(block, def);
      break;
    default:
      code = `${def.strudelFunction}()`;
  }

  // Apply children (chained methods)
  if (block.children && block.children.length > 0) {
    for (const child of block.children) {
      const childCode = generateCode(child);
      // Remove any leading pattern call if it's a modifier
      const childDef = getBlockDefinition(child.definitionId);
      if (childDef && (childDef.category === 'time' || childDef.category === 'effect' || childDef.category === 'control')) {
        code += childCode;
      } else {
        code += `.${childCode}`;
      }
    }
  }

  return code;
}

/**
 * Generate code for sound blocks (s, note, sound)
 */
function generateSoundBlock(block: Block, def: any): string {
  const { strudelFunction, inputs: inputDefs } = def;

  // Get the input values
  const values = inputDefs.map((inputDef: any) => {
    const value = block.inputs[inputDef.name];

    // Check if value is a parameter reference (starts with $)
    if (typeof value === 'string' && value.startsWith('$')) {
      return value; // Output parameter reference as-is
    }

    if (inputDef.type === 'string') {
      return `"${value}"`;
    }
    return value;
  });

  return `${strudelFunction}(${values.join(', ')})`;
}

/**
 * Generate code for pattern blocks (stack, cat, seq)
 */
function generatePatternBlock(block: Block, def: any): string {
  const { strudelFunction } = def;

  // Pattern combinators take children as arguments
  if (block.children && block.children.length > 0) {
    const childPatterns = block.children.map(child => generateCode(child));
    return `${strudelFunction}(${childPatterns.join(', ')})`;
  }

  return `${strudelFunction}()`;
}

/**
 * Generate code for modifier blocks (effects, time mods, control flow)
 */
function generateModifierBlock(block: Block, def: any): string {
  const { strudelFunction, inputs: inputDefs } = def;

  // Get the input values
  const values = inputDefs.map((inputDef: any) => {
    const value = block.inputs[inputDef.name];

    // Check if value is a parameter reference (starts with $)
    if (typeof value === 'string' && value.startsWith('$')) {
      return value; // Output parameter reference as-is
    }

    // Handle different input types
    if (inputDef.type === 'string') {
      // Don't quote transformation functions (for jux, superimpose, off, layer, etc.)
      if (inputDef.name === 'transform' || inputDef.name === 'function') {
        return value; // Don't quote function names
      }
      return `"${value}"`;
    } else if (inputDef.type === 'dropdown') {
      // For control flow blocks with function names
      if (inputDef.name === 'function') {
        return value; // Don't quote function names
      }
      return `"${value}"`;
    }
    return value;
  });

  return `.${strudelFunction}(${values.join(', ')})`;
}

/**
 * Generate code for data blocks (knobs, variables)
 */
function generateDataBlock(block: Block, def: any): string {
  const blockId = def.id;

  switch (blockId) {
    case 'data_knob':
      // Generate $paramName syntax for knob inputs
      return `$${block.inputs.paramName}`;

    case 'data_variable':
      // Generate variable declaration
      return `const ${block.inputs.varName} = ${block.inputs.value}`;

    case 'data_get_variable':
      // Generate variable reference
      return block.inputs.varName;

    default:
      return `${def.strudelFunction}()`;
  }
}

/**
 * Generate code for logic blocks (conditionals, loops, structures)
 */
function generateLogicBlock(block: Block, def: any): string {
  const { strudelFunction, inputs: inputDefs } = def;

  // Get the input values
  const values = inputDefs.map((inputDef: any) => {
    const value = block.inputs[inputDef.name];

    // Check if value is a parameter reference (starts with $)
    if (typeof value === 'string' && value.startsWith('$')) {
      return value; // Output parameter reference as-is
    }

    // Handle different input types
    if (inputDef.type === 'string') {
      // Don't quote condition functions
      if (inputDef.name === 'condition') {
        return value;
      }
      return `"${value}"`;
    }
    return value;
  });

  return `.${strudelFunction}(${values.join(', ')})`;
}

/**
 * Generate complete Strudel code from a program (multiple top-level blocks)
 */
export function generateProgramCode(program: BlockProgram): string {
  if (program.blocks.length === 0) {
    return '// Empty pattern';
  }

  if (program.blocks.length === 1) {
    return generateCode(program.blocks[0]);
  }

  // Multiple blocks - stack them
  const patterns = program.blocks.map(block => generateCode(block));
  return `stack(${patterns.join(', ')})`;
}

/**
 * Pretty print the generated code with indentation
 */
export function formatCode(code: string): string {
  // Add line breaks for readability
  let formatted = code;

  // Break after major combinators
  formatted = formatted.replace(/stack\(/g, 'stack(\n  ');
  formatted = formatted.replace(/cat\(/g, 'cat(\n  ');
  formatted = formatted.replace(/seq\(/g, 'seq(\n  ');

  // Add line breaks between chained methods (every 3 methods)
  const parts = formatted.split('.');
  if (parts.length > 4) {
    const grouped = [];
    for (let i = 0; i < parts.length; i += 3) {
      grouped.push(parts.slice(i, i + 3).join('.'));
    }
    formatted = grouped.join('\n  .');
  }

  return formatted;
}

/**
 * Validate a block structure
 * Returns error message or null if valid
 */
export function validateBlock(block: Block): string | null {
  const def = getBlockDefinition(block.definitionId);
  if (!def) {
    return `Unknown block type: ${block.definitionId}`;
  }

  // Check required inputs
  for (const inputDef of def.inputs) {
    const value = block.inputs[inputDef.name];
    if (value === undefined || value === null || value === '') {
      return `Missing required input: ${inputDef.name}`;
    }

    // Type validation
    if (inputDef.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return `${inputDef.name} must be a number`;
      }
    }
  }

  // Recursively validate children
  if (block.children) {
    for (const child of block.children) {
      const childError = validateBlock(child);
      if (childError) return childError;
    }
  }

  return null; // Valid
}

/**
 * Example: Convert block structure to readable description
 */
export function describeBlock(block: Block): string {
  const def = getBlockDefinition(block.definitionId);
  if (!def) return 'Unknown block';

  let desc = def.name;

  // Add input values
  if (def.inputs.length > 0) {
    const inputDesc = def.inputs
      .map(inputDef => `${inputDef.name}: ${block.inputs[inputDef.name]}`)
      .join(', ');
    desc += ` (${inputDesc})`;
  }

  // Add children count
  if (block.children && block.children.length > 0) {
    desc += ` → ${block.children.length} effect${block.children.length > 1 ? 's' : ''}`;
  }

  return desc;
}
