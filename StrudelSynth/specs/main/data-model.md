# Data Model: StrudelSynth Entities

**Date**: 2025-11-02
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)

This document defines the core entities, their attributes, relationships, validation rules, and state transitions for the StrudelSynth application.

---

## Entity Overview

```
┌──────────────┐       manages      ┌──────────────┐
│MIDIController│◄──────────────────►│ PatternSlot  │
│              │                     │  (40 slots)  │
└──────┬───────┘                     └──────┬───────┘
       │                                    │
       │ controls                           │ contains
       │                                    │
       ▼                                    ▼
┌──────────────┐       generates     ┌──────────────┐
│ KnobMapping  │                     │   Pattern    │
└──────────────┘                     └──────┬───────┘
                                            │
                                            │ created from
                                            │
                                            ▼
       ┌───────────────┐             ┌──────────────┐
       │  Visualizer   │◄────────────┤  Recording   │
       └───────────────┘  drives     └──────────────┘
              LED
```

---

## 1. Pattern

Represents a Strudel code snippet or recorded MIDI sequence that generates audio output.

### Attributes

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | string (UUID) | Unique identifier | Required, immutable |
| `slotIndex` | number (0-39) | Position in 5×8 grid | Required, unique per slot |
| `name` | string | User-defined label | Optional, max 64 chars |
| `code` | string | Strudel DSL code | Required if type='code' |
| `midiData` | Recording | MIDI recording | Required if type='midi' |
| `type` | enum | 'code' \| 'midi' \| 'hybrid' | Required |
| `state` | enum | stopped \| playing \| recording | Required |
| `parameters` | Map<string, number> | Active parameter values | Optional |
| `assignedKnobs` | number[] | Knob indices (0-7) | Optional, max 8 |
| `createdAt` | timestamp | Creation time | Auto-generated |
| `lastModified` | timestamp | Last edit time | Auto-updated |

### Relationships

- **belongs to** one `PatternSlot` (1:1)
- **may reference** one `Recording` (1:0..1)
- **may have** multiple `KnobMapping` associations (1:N)

### Validation Rules

- `code` must be valid Strudel syntax (validated via `CodeValidator`)
- `slotIndex` must be 0-39 (grid bounds)
- `state` transitions must follow state machine (see below)
- `parameters` keys must match Strudel's supported parameter names
- `parameters` values must be numeric within parameter-specific ranges

### State Machine

```
           start()
  ┌──────────────────────────┐
  │                          │
  ▼                          │
[stopped] ──────────┐        │
  ▲                 │        │
  │ stop()          │ record()
  │                 │        │
  │                 ▼        ▼
[playing] ◄──── [recording]
```

**Transitions:**
- **stopped → playing**: `start()` evaluates code and begins playback
- **stopped → recording**: `record()` captures MIDI input
- **playing → stopped**: `stop()` halts audio output
- **recording → stopped**: `stopRecording()` finalizes capture
- **recording → playing**: `stopRecording()` + auto-play option

### Storage

- **In-memory**: Current state during runtime (PatternSlotManager)
- **Persistent**: IndexedDB (pattern library, user presets)
- **Export**: JSON format for sharing/backup

---

## 2. MIDIController

Represents the APCKEY25 hardware device and its current state.

### Attributes

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `deviceId` | string | Web MIDI API device ID | Required, from MIDIAccess |
| `name` | string | Device name | 'APC Key 25' or 'APC Key 25 mk2' |
| `variant` | enum | 'mk1' \| 'mk2' | Detected from device name |
| `connected` | boolean | Connection status | Auto-updated |
| `inputPort` | MIDIInput | MIDI input port | From Web MIDI API |
| `outputPort` | MIDIOutput | MIDI output port | From Web MIDI API |
| `buttonStates` | Map<number, ButtonState> | 40 button states (grid) | Auto-updated on input |
| `knobValues` | number[8] | Current knob positions (0-127) | Auto-updated on CC |
| `keyboardNotes` | Set<number> | Currently pressed keys | Auto-updated |
| `ledStates` | LedState[40] | Current LED colors/modes | Managed by visualizer |
| `knobMode` | enum | volume \| pan \| send \| device | User-selectable |
| `lastActivity` | timestamp | Last MIDI event received | Auto-updated |

### Relationships

- **manages** 40 `PatternSlot` entities (1:N)
- **has** 8 `KnobMapping` configurations (1:N)
- **drives** one `Visualizer` (1:1)

### Nested Types

**ButtonState:**
```typescript
{
  pressed: boolean
  timestamp: number
  assignedPatternId: string | null
}
```

**LedState:**
```typescript
{
  color: { r: number, g: number, b: number }  // 0-127 each
  mode: 'off' | 'solid' | 'blink' | 'pulse'
  brightness: number  // 0-127
}
```

### Validation Rules

- `deviceId` must match connected MIDI device
- `buttonStates` must have exactly 40 entries (0-39)
- `knobValues` must have exactly 8 entries (0-7)
- `ledStates` RGB values must be 0-127 (MIDI range)
- Hot-plug: `connected` must trigger reconnection logic

### Lifecycle

```
[disconnected] ──connect()──► [initializing] ──ready()──► [connected]
       ▲                                                        │
       │                                                        │
       └────────────────── disconnect() ◄─────────────────────┘
```

**Events:**
- `onConnect`: Device plugged in or page load
- `onDisconnect`: Device unplugged
- `onMIDIMessage`: Incoming MIDI event
- `onStateChange`: Connection state change (Web MIDI API)

### Storage

- **Session-only**: Connection state (not persisted)
- **Persistent**: Device preferences (last used knob mode, button assignments)

---

## 3. Recording

Captured MIDI note data from keyboard performance, used for pattern transcription.

### Attributes

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | string (UUID) | Unique identifier | Required, immutable |
| `notes` | MIDINote[] | Captured note events | Required, min 1 note |
| `startTime` | timestamp | Recording start | Auto-generated |
| `endTime` | timestamp | Recording end | Auto-generated |
| `duration` | number (ms) | Total length | Calculated: endTime - startTime |
| `tempo` | number (BPM) | Detected tempo | Auto-detected or user-set |
| `quantizationGrid` | enum | 1/4 \| 1/8 \| 1/16 \| 1/32 \| triplet | User-selectable |
| `quantized` | boolean | Whether quantization applied | Default: false |
| `generatedCode` | string | Strudel code output | Generated by transcription |
| `transcriptionAccuracy` | number (0-1) | Confidence score | From transcription engine |

### Nested Types

**MIDINote:**
```typescript
{
  pitch: number         // 0-127 (MIDI note number)
  velocity: number      // 0-127
  startTime: number     // ms from recording start
  duration: number      // ms (note-off - note-on)
  channel: number       // Usually 0 (omnichannel)
}
```

### Relationships

- **may belong to** one `Pattern` (0..1:1)
- **generates** one `Pattern` via transcription (1:0..1)

### Validation Rules

- `notes` array must not be empty
- `notes[].pitch` must be 0-127
- `notes[].velocity` must be 1-127 (0 = note-off)
- `notes[].duration` must be positive
- `tempo` must be 20-300 BPM (reasonable range)
- `quantizationGrid` determines snap resolution

### Processing Pipeline

```
Keyboard Input → MIDI Capture → Timestamp Normalization
                                         ↓
                              Tempo Detection (optional)
                                         ↓
                              Quantization (optional)
                                         ↓
                              Strudel Code Generation
                                         ↓
                              Code Validation
                                         ↓
                              Pattern Assignment
```

### Storage

- **In-memory**: During active recording
- **Persistent**: IndexedDB (recording history, pattern source)
- **Export**: MIDI file format (.mid) or JSON

---

## 4. KnobMapping

Associates hardware knobs with Strudel pattern parameters for real-time control.

### Attributes

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `knobIndex` | number (0-7) | Hardware knob ID | Required, unique per mode |
| `mode` | enum | volume \| pan \| send \| device | Required |
| `targetParameter` | string | Strudel parameter name | Required, must exist in Strudel |
| `minValue` | number | Minimum parameter value | Required, < maxValue |
| `maxValue` | number | Maximum parameter value | Required, > minValue |
| `curve` | enum | linear \| log \| exp | Default: linear |
| `ccNumber` | number (0-127) | MIDI CC number | From APCKEY25 spec |
| `label` | string | UI display name | Optional, max 32 chars |

### Relationships

- **belongs to** one `MIDIController` (N:1)
- **targets** one or more `Pattern` parameters (N:N)

### Validation Rules

- `knobIndex` must be 0-7 (8 hardware knobs)
- `targetParameter` must match Strudel's API (e.g., 'gain', 'lpf', 'delay')
- `minValue` and `maxValue` must respect parameter-specific ranges:
  - `gain`: 0.0-2.0
  - `lpf` (cutoff): 20-20000 Hz
  - `delay`: 0.0-1.0
  - `room` (reverb): 0.0-1.0
- `ccNumber` must match APCKEY25 protocol specification

### Preset Modes

**Volume Mode:**
```typescript
[
  { knobIndex: 0, targetParameter: 'gain', minValue: 0, maxValue: 1.5 },
  { knobIndex: 1, targetParameter: 'gain', minValue: 0, maxValue: 1.5 },
  // ... pattern 0-7 gain controls
]
```

**Device Mode:**
```typescript
[
  { knobIndex: 0, targetParameter: 'speed', minValue: 0.5, maxValue: 2.0, curve: 'log' },
  { knobIndex: 1, targetParameter: 'lpf', minValue: 200, maxValue: 8000, curve: 'log' },
  { knobIndex: 2, targetParameter: 'lpq', minValue: 0, maxValue: 20 },
  { knobIndex: 3, targetParameter: 'delay', minValue: 0, maxValue: 0.9 },
  // ... more parameters
]
```

### MIDI Learn

User can assign knobs dynamically:
1. Enter MIDI Learn mode
2. Rotate target knob → capture CC number
3. Select target parameter → create mapping
4. Set min/max/curve → store mapping

### Storage

- **Persistent**: IndexedDB (user presets, mode configurations)
- **Export**: JSON format (shareable presets)

---

## 5. PatternSlot

Represents one of the 40 slots in the APCKEY25 button grid.

### Attributes

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `index` | number (0-39) | Grid position (row * 8 + col) | Required, immutable |
| `row` | number (0-4) | Grid row | Calculated: floor(index / 8) |
| `col` | number (0-7) | Grid column | Calculated: index % 8 |
| `pattern` | Pattern \| null | Assigned pattern | Optional |
| `buttonNote` | number | MIDI note for this button | From APCKEY25 spec |
| `ledColor` | { r, g, b } | Current LED color | From visualizer or pattern state |

### Relationships

- **contains** zero or one `Pattern` (1:0..1)
- **managed by** one `MIDIController` (N:1)

### Validation Rules

- `index` must be 0-39
- `row` must be 0-4
- `col` must be 0-7
- `buttonNote` must match APCKEY25 MIDI specification

### LED Color by State

| Pattern State | LED Color | Mode |
|--------------|-----------|------|
| Empty slot | Off (0,0,0) | - |
| Loaded, not playing | Amber (127,64,0) | Solid |
| Playing | Green (0,127,0) | Solid |
| Recording | Red (127,0,0) | Blink |
| Error | Red (127,0,0) | Pulse |

### Storage

- **In-memory**: Grid state (PatternSlotManager)
- **Persistent**: Slot assignments (IndexedDB)

---

## 6. Visualizer

Configuration for audio-reactive LED visualizations on the APCKEY25 grid.

### Attributes

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `mode` | enum | pattern \| vuMeter \| beatPulse \| spectrum | Required |
| `enabled` | boolean | Visualization active | Default: false |
| `colorScheme` | ColorScheme | Color palette | Required |
| `sensitivity` | number (0-1) | Audio responsiveness | Default: 0.5 |
| `updateRate` | number (Hz) | FPS for LED updates | Min: 15, Max: 60 |
| `audioSource` | enum | master \| perPattern | Audio analysis source |

### Nested Types

**ColorScheme:**
```typescript
{
  primary: { r: number, g: number, b: number }
  secondary: { r: number, g: number, b: number }
  background: { r: number, g: number, b: number }
  gradient: boolean  // Interpolate between primary/secondary
}
```

### Relationships

- **controlled by** one `MIDIController` (1:1)
- **extends** Strudel visualizers (integration point)

### Visualization Modes

**1. Pattern Mode** (default):
- Shows pattern states (amber/green/red per slot)
- No audio reactivity, state-based only

**2. VU Meter Mode**:
- Columns represent volume levels (RMS)
- Rows light up based on amplitude (bottom-to-top)
- Color gradient: green (low) → yellow (mid) → red (peak)

**3. Beat Pulse Mode**:
- Flashes all LEDs on beat detection
- Uses onset detection algorithm
- Color pulses in sync with rhythm

**4. Spectrum Mode**:
- FFT frequency analysis
- Rows = frequency bands (low at bottom, high at top)
- Brightness = magnitude per band

### Audio Analysis Requirements

- **RMS**: For VU meter, calculated per audio frame
- **FFT**: For spectrum, 512-2048 bin FFT
- **Beat Detection**: Onset detection via energy flux

### Integration with Strudel

Strudel's `@strudel/draw` package provides:
```javascript
import { getDrawContext } from '@strudel/draw'

getDrawContext().on('draw', ({ haps, time, ctx }) => {
  // haps = scheduled events (notes, samples)
  // Map to LED grid
})
```

### Storage

- **Session-only**: Active visualization state
- **Persistent**: User-preferred mode, color schemes (IndexedDB)

---

## Data Persistence Strategy

### IndexedDB Schema

```typescript
// Database name: 'strudelsynth'
// Version: 1

// Object stores:
{
  patterns: {
    keyPath: 'id',
    indexes: ['slotIndex', 'createdAt']
  },
  recordings: {
    keyPath: 'id',
    indexes: ['createdAt']
  },
  knobMappings: {
    keyPath: ['knobIndex', 'mode'],
    indexes: ['mode']
  },
  patternSlots: {
    keyPath: 'index'
  },
  settings: {
    keyPath: 'key'  // Key-value store
  }
}
```

### LocalStorage

Lightweight settings:
```typescript
{
  'lastKnobMode': 'device',
  'visualizerEnabled': true,
  'autoQuantize': true,
  'defaultTempo': 120
}
```

### Export Format (JSON)

**Performance Setup:**
```json
{
  "version": "1.0.0",
  "createdAt": "2025-11-02T10:30:00Z",
  "patterns": [
    {
      "slotIndex": 0,
      "name": "Kick Pattern",
      "code": "note(\"c2\").s(\"bd\")",
      "parameters": { "gain": 0.8 }
    }
  ],
  "knobMappings": {
    "device": [
      { "knobIndex": 0, "targetParameter": "speed", "minValue": 0.5, "maxValue": 2.0 }
    ]
  },
  "visualizer": {
    "mode": "beatPulse",
    "colorScheme": { "primary": { "r": 0, "g": 127, "b": 127 } }
  }
}
```

---

## Summary: Entity Relationships

```
MIDIController (1) ──manages──► PatternSlot (40)
      │                              │
      │                              │ contains
      │                              ▼
      │                         Pattern (0..40)
      │                              │
      │ has                          │ created from
      ▼                              ▼
KnobMapping (8×4) ──controls──► Recording (0..N)
      │
      │ drives
      ▼
Visualizer (1)
```

**Key Constraints:**
- Maximum 40 patterns (grid size)
- Maximum 8 concurrent playing patterns (polyphony)
- 8 knobs × 4 modes = 32 knob mappings
- Real-time updates: <10ms MIDI, <5ms audio, 30+ FPS LEDs

**Data Flow:**
1. MIDI input → `MIDIController` → update `buttonStates`/`knobValues`
2. Button press → `PatternSlot` → trigger `Pattern` state change
3. Knob rotate → `KnobMapping` → update `Pattern.parameters`
4. Recording → `Recording` → generate `Pattern.code`
5. Audio output → `Visualizer` → update `MIDIController.ledStates`

---

**Next Steps**: Define API contracts in `contracts/` directory.
