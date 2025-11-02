# API Contract: Pattern Engine

**Modules**: `src/pattern/PatternSlotManager.ts`, `src/pattern/PatternTrigger.ts`
**Date**: 2025-11-02

## PatternSlotManager

Manages 40 pattern slots and pattern lifecycle.

```typescript
export class PatternSlotManager {
  /**
   * Initialize slot manager with 40 empty slots
   */
  constructor()

  /**
   * Assign pattern to slot
   * @param slotIndex - Slot position (0-39)
   * @param pattern - Pattern object
   */
  assignPattern(slotIndex: number, pattern: Pattern): void

  /**
   * Remove pattern from slot
   */
  clearSlot(slotIndex: number): void

  /**
   * Get pattern at slot
   */
  getPattern(slotIndex: number): Pattern | null

  /**
   * Get all active (playing) patterns
   */
  getActivePatterns(): Pattern[]

  /**
   * Start pattern playback
   * @throws {PolyphonyLimitError} if 8 patterns already playing
   */
  startPattern(slotIndex: number): void

  /**
   * Stop pattern playback
   */
  stopPattern(slotIndex: number): void

  /**
   * Toggle pattern (start if stopped, stop if playing)
   */
  togglePattern(slotIndex: number): void

  /**
   * Stop all patterns
   */
  stopAll(): void

  /**
   * Start recording to slot
   */
  startRecording(slotIndex: number): Recording

  /**
   * Stop recording and generate pattern
   */
  stopRecording(slotIndex: number): Pattern

  /**
   * Listen for pattern state changes
   */
  on<T extends PatternEventType>(
    event: T,
    handler: PatternEventHandler<T>
  ): () => void
}
```

## Pattern Interface

```typescript
export interface Pattern {
  id: string
  slotIndex: number
  name: string
  code: string
  type: 'code' | 'midi' | 'hybrid'
  state: PatternState
  parameters: Map<string, number>
  assignedKnobs: number[]
  createdAt: number
  lastModified: number
}

export type PatternState = 'stopped' | 'playing' | 'recording'
```

## Events

```typescript
export type PatternEventType =
  | 'patternStarted'
  | 'patternStopped'
  | 'patternAssigned'
  | 'patternCleared'
  | 'recordingStarted'
  | 'recordingStopped'
  | 'stateChanged'

export interface PatternStartedEvent {
  type: 'patternStarted'
  slotIndex: number
  pattern: Pattern
  timestamp: number
}

export interface PatternStoppedEvent {
  type: 'patternStopped'
  slotIndex: number
  pattern: Pattern
  timestamp: number
}
```

## Usage Example

```typescript
const slotManager = new PatternSlotManager()

// Assign pattern to slot 0
const pattern: Pattern = {
  id: crypto.randomUUID(),
  slotIndex: 0,
  name: 'Kick Pattern',
  code: 'note("c2").s("bd")',
  type: 'code',
  state: 'stopped',
  parameters: new Map([['gain', 0.8]]),
  assignedKnobs: [],
  createdAt: Date.now(),
  lastModified: Date.now()
}

slotManager.assignPattern(0, pattern)

// Listen for pattern start
slotManager.on('patternStarted', (event) => {
  console.log(`Pattern ${event.pattern.name} started`)
  // Update LED to green
})

// Toggle pattern
slotManager.togglePattern(0) // Start
slotManager.togglePattern(0) // Stop
```

---

**Status**: Complete
**Next**: See `transcription-api.md`
