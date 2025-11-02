# API Contract: MIDI Controller Manager

**Module**: `src/midi/MIDIControllerManager.ts`
**Date**: 2025-11-02
**Dependencies**: Web MIDI API, ringbuf.js

This document defines the public API for the MIDI Controller Manager, which handles device detection, I/O routing, and LED control for the APCKEY25.

---

## Core Interfaces

### MIDIControllerManager

Main class for managing MIDI controller lifecycle and I/O.

```typescript
export class MIDIControllerManager {
  /**
   * Initialize MIDI system and detect devices
   * @throws {MIDIAccessError} if Web MIDI API not supported or permission denied
   */
  async initialize(): Promise<void>

  /**
   * Connect to specific MIDI device by ID
   * @param deviceId - Web MIDI API device identifier
   * @returns Promise resolving to device info
   */
  async connect(deviceId: string): Promise<MIDIDeviceInfo>

  /**
   * Disconnect from current device
   */
  disconnect(): void

  /**
   * Get list of available MIDI devices
   * @returns Array of detected MIDI input/output pairs
   */
  getAvailableDevices(): MIDIDeviceInfo[]

  /**
   * Get current connection state
   */
  getConnectionState(): MIDIConnectionState

  /**
   * Send LED control message to controller
   * @param slotIndex - Button slot (0-39)
   * @param color - RGB color (0-127 per channel)
   * @param mode - LED behavior mode
   */
  setLED(slotIndex: number, color: RGBColor, mode: LEDMode): void

  /**
   * Batch update multiple LEDs (optimized)
   * @param updates - Array of LED updates
   */
  setLEDs(updates: LEDUpdate[]): void

  /**
   * Register callback for MIDI input events
   * @param event - Event type to listen for
   * @param handler - Callback function
   * @returns Unsubscribe function
   */
  on<T extends MIDIEventType>(
    event: T,
    handler: MIDIEventHandler<T>
  ): () => void

  /**
   * Remove event handler
   */
  off<T extends MIDIEventType>(
    event: T,
    handler: MIDIEventHandler<T>
  ): void

  /**
   * Get current knob values (0-127)
   */
  getKnobValues(): number[]

  /**
   * Get current button states
   */
  getButtonStates(): Map<number, ButtonState>

  /**
   * Enable/disable MIDI Learn mode
   */
  setMIDILearnMode(enabled: boolean): void
}
```

---

## Type Definitions

### MIDIDeviceInfo

```typescript
export interface MIDIDeviceInfo {
  id: string                    // Web MIDI API device ID
  name: string                  // Device name (e.g., "APC Key 25 mk2")
  manufacturer: string          // Manufacturer name
  variant: 'mk1' | 'mk2'        // Detected hardware variant
  inputPort: MIDIInput | null   // MIDI input port
  outputPort: MIDIOutput | null // MIDI output port
  state: 'connected' | 'disconnected'
}
```

### MIDIConnectionState

```typescript
export type MIDIConnectionState =
  | 'disconnected'   // No device connected
  | 'initializing'   // Connecting to device
  | 'connected'      // Device ready
  | 'error'          // Connection error
```

### RGBColor

```typescript
export interface RGBColor {
  r: number  // Red (0-127)
  g: number  // Green (0-127)
  b: number  // Blue (0-127)
}

// Preset colors
export const LEDColors = {
  OFF: { r: 0, g: 0, b: 0 },
  RED: { r: 127, g: 0, b: 0 },
  GREEN: { r: 0, g: 127, b: 0 },
  AMBER: { r: 127, g: 64, b: 0 },
  YELLOW: { r: 127, g: 127, b: 0 },
  BLUE: { r: 0, g: 0, b: 127 },
  CYAN: { r: 0, g: 127, b: 127 },
  MAGENTA: { r: 127, g: 0, b: 127 },
  WHITE: { r: 127, g: 127, b: 127 }
} as const
```

### LEDMode

```typescript
export type LEDMode =
  | 'off'      // LED off
  | 'solid'    // Constant illumination
  | 'blink'    // Flash on/off (1 Hz)
  | 'pulse'    // Breathing effect
```

### LEDUpdate

```typescript
export interface LEDUpdate {
  slotIndex: number     // Button slot (0-39)
  color: RGBColor       // RGB color
  mode: LEDMode         // Behavior mode
}
```

### ButtonState

```typescript
export interface ButtonState {
  pressed: boolean              // Currently pressed
  timestamp: number             // Last event timestamp (ms)
  assignedPatternId: string | null  // Pattern ID (if assigned)
}
```

---

## Event System

### MIDIEventType

```typescript
export type MIDIEventType =
  | 'noteOn'           // Button press or keyboard note
  | 'noteOff'          // Button release or keyboard note off
  | 'controlChange'    // Knob rotation
  | 'connectionChange' // Device connect/disconnect
  | 'error'            // MIDI error
```

### MIDIEventHandler

Generic event handler type:

```typescript
export type MIDIEventHandler<T extends MIDIEventType> =
  T extends 'noteOn' ? (event: NoteOnEvent) => void :
  T extends 'noteOff' ? (event: NoteOffEvent) => void :
  T extends 'controlChange' ? (event: ControlChangeEvent) => void :
  T extends 'connectionChange' ? (event: ConnectionChangeEvent) => void :
  T extends 'error' ? (event: ErrorEvent) => void :
  never
```

### Event Schemas

**NoteOnEvent:**
```typescript
export interface NoteOnEvent {
  type: 'noteOn'
  note: number        // MIDI note number (0-127)
  velocity: number    // Velocity (1-127)
  timestamp: number   // Event timestamp (ms)
  source: 'grid' | 'keyboard'  // Button grid or keyboard
  slotIndex?: number  // If source='grid', slot index (0-39)
}
```

**NoteOffEvent:**
```typescript
export interface NoteOffEvent {
  type: 'noteOff'
  note: number
  velocity: number    // Release velocity (0-127)
  timestamp: number
  source: 'grid' | 'keyboard'
  slotIndex?: number
}
```

**ControlChangeEvent:**
```typescript
export interface ControlChangeEvent {
  type: 'controlChange'
  controller: number  // CC number (MIDI spec)
  value: number       // CC value (0-127)
  knobIndex: number   // Knob index (0-7)
  timestamp: number
}
```

**ConnectionChangeEvent:**
```typescript
export interface ConnectionChangeEvent {
  type: 'connectionChange'
  state: MIDIConnectionState
  device: MIDIDeviceInfo | null
  timestamp: number
}
```

**ErrorEvent:**
```typescript
export interface ErrorEvent {
  type: 'error'
  code: MIDIErrorCode
  message: string
  timestamp: number
}

export type MIDIErrorCode =
  | 'ACCESS_DENIED'      // Permission denied
  | 'NOT_SUPPORTED'      // Web MIDI API not available
  | 'DEVICE_NOT_FOUND'   // Device disconnected
  | 'SEND_FAILED'        // Failed to send MIDI message
  | 'INVALID_MESSAGE'    // Malformed MIDI data
```

---

## Usage Examples

### Basic Setup

```typescript
import { MIDIControllerManager, LEDColors } from './midi/MIDIControllerManager'

const midiManager = new MIDIControllerManager()

// Initialize MIDI system
await midiManager.initialize()

// Get available devices
const devices = midiManager.getAvailableDevices()
console.log('Available devices:', devices)

// Connect to first APCKEY25 device
const apcDevice = devices.find(d => d.name.includes('APC Key 25'))
if (apcDevice) {
  await midiManager.connect(apcDevice.id)
}
```

### Listen for Button Presses

```typescript
// Handle button presses
const unsubscribe = midiManager.on('noteOn', (event) => {
  if (event.source === 'grid') {
    console.log(`Button ${event.slotIndex} pressed`)

    // Light up the button in green
    midiManager.setLED(event.slotIndex!, LEDColors.GREEN, 'solid')
  }
})

// Later: cleanup
unsubscribe()
```

### Handle Knob Rotation

```typescript
midiManager.on('controlChange', (event) => {
  console.log(`Knob ${event.knobIndex} changed to ${event.value}`)

  // Map CC value (0-127) to parameter range
  const normalizedValue = event.value / 127

  // Update pattern parameter (handled by Parameter Router)
  // ... (see pattern-engine-api.md)
})
```

### Update Multiple LEDs

```typescript
import { LEDColors } from './midi/MIDIControllerManager'

// Batch update for better performance
const updates = [
  { slotIndex: 0, color: LEDColors.GREEN, mode: 'solid' },
  { slotIndex: 1, color: LEDColors.AMBER, mode: 'solid' },
  { slotIndex: 2, color: LEDColors.RED, mode: 'blink' }
]

midiManager.setLEDs(updates)
```

### Handle Connection Changes

```typescript
midiManager.on('connectionChange', (event) => {
  if (event.state === 'disconnected') {
    console.warn('MIDI controller disconnected')
    // Continue audio playback, show warning to user
  } else if (event.state === 'connected') {
    console.log('MIDI controller reconnected:', event.device?.name)
    // Restore LED states
  }
})
```

---

## Real-Time Performance Constraints

Per constitution (Principle III: Real-Time Performance):

### Latency Requirements

- **MIDI Input Processing**: <10ms (99th percentile)
- **LED Output**: <33ms (30 FPS minimum)
- **Event Handler Execution**: <5ms (non-blocking)

### Implementation Constraints

```typescript
// ✅ CORRECT: Non-blocking event handlers
midiManager.on('noteOn', (event) => {
  // Quick parameter update
  patternSlot.trigger(event.slotIndex)
})

// ❌ WRONG: Blocking operations
midiManager.on('noteOn', async (event) => {
  // DO NOT: Await promises in event handlers
  await fetch('/api/log')  // Blocks MIDI processing!
})
```

---

**Status**: Complete
**Next**: See `pattern-engine-api.md`
