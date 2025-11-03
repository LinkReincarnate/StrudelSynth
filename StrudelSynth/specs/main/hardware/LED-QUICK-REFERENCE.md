# APCKEY25 mk2 LED Quick Reference

**For Implementation** - Use these values in your code!

---

## 🚨 CRITICAL: Dual Device Architecture

The APCKEY25 mk2 has **TWO separate MIDI devices**:

| Device | Purpose |
|--------|---------|
| **"APC Key 25 mk2"** | Keyboard only (input) |
| **"MIDIIN2"** / **"MIDIOUT2"** | Buttons, LEDs, knobs (input/output) |

⚠️ **LED control MUST be sent to "MIDIOUT2", NOT "APC Key 25 mk2"!**

---

## How to Control LEDs

**MIDI Device**: "MIDIOUT2" (the second device, NOT the keyboard)

**MIDI Message**: Note On to device OUTPUT port
- **Status Byte**: `0x90` (Note On, Channel 1)
- **Note Number**: Button position (0-39, see grid below)
- **Velocity**: Color code (see palette below)

**Example (JavaScript)**:
```javascript
// Light up button at row 0, col 0 (note 32) in bright green
midiOutput.send([0x90, 32, 13]);

// Turn off button at row 4, col 7 (note 7)
midiOutput.send([0x90, 7, 0]);
```

---

## Button Grid Note Numbers

```
ROW 0 (Top):    32  33  34  35  36  37  38  39
ROW 1:          24  25  26  27  28  29  30  31
ROW 2:          16  17  18  19  20  21  22  23
ROW 3:           8   9  10  11  12  13  14  15
ROW 4 (Bottom):  0   1   2   3   4   5   6   7
```

**Formula**: `noteNumber = (4 - row) * 8 + col`
- Row 0, Col 0 → Note 32
- Row 4, Col 7 → Note 7

---

## LED Color Palette

### Core Colors (StrudelSynth States)

| State | Color | Velocity | Hex | RGB Approx |
|-------|-------|----------|-----|------------|
| **Empty slot** | OFF | 0 | 0x00 | (0,0,0) |
| **Loaded** | Bright Yellow | 96 | 0x60 | (127,100,0) |
| **Playing** | Bright Green | 13 | 0x0D | (0,127,0) |
| **Recording** | Red | 5 | 0x05 | (127,0,0) |
| **Error** | Red | 5 | 0x05 | (127,0,0) |

### Bonus Colors (Future Features)

| Color | Velocity | Hex | RGB Approx |
|-------|----------|-----|------------|
| Bright Teal | 16 | 0x10 | (0,127,127) |
| Bright Sky Blue | 32 | 0x20 | (0,100,127) |
| Bright Purple | 48 | 0x30 | (100,0,127) |
| Bright Deep Purple | 80 | 0x50 | (80,0,127) |

---

## Code Examples

### TypeScript/JavaScript

```typescript
// LED Color Constants
const LED_COLORS = {
  OFF: 0,
  RED: 5,
  GREEN: 13,
  YELLOW: 96,
  TEAL: 16,
  BLUE: 32,
  PURPLE: 48
};

// Function to set LED color
function setLED(row: number, col: number, color: number) {
  const noteNumber = (4 - row) * 8 + col;
  midiOutput.send([0x90, noteNumber, color]);
}

// Usage
setLED(0, 0, LED_COLORS.GREEN);  // Top-left = green (playing)
setLED(1, 5, LED_COLORS.YELLOW); // Row 1, Col 5 = yellow (loaded)
setLED(2, 3, LED_COLORS.RED);    // Row 2, Col 3 = red (recording)
setLED(4, 7, LED_COLORS.OFF);    // Bottom-right = off (empty)
```

### Pattern State to LED Color Mapping

```typescript
function getPatternLEDColor(state: PatternState): number {
  switch (state) {
    case 'empty':     return 0;   // OFF
    case 'loaded':    return 96;  // Bright Yellow
    case 'playing':   return 13;  // Bright Green
    case 'recording': return 5;   // Red
    case 'error':     return 5;   // Red
    default:          return 0;   // OFF
  }
}
```

---

## Important Notes

1. **No blinking support detected** - All colors are solid
   - To simulate blinking: Toggle between color and OFF in your code
   - Example: `setInterval(() => toggle LED between 5 and 0, 500ms)`

2. **High velocities are ignored** - Velocity 127 = very dim red
   - Stick to velocities 0-96 for reliable colors

3. **Relative encoders** - Knobs send +/- values, not absolute positions
   - Must track knob state in software

4. **MIDI Channel 1** - All messages on channel 1 (status byte 0x90)

---

## Testing Your Implementation

```javascript
// Test all LEDs in sequence (rainbow effect)
const colors = [5, 13, 96, 16, 32, 48];
let colorIndex = 0;

for (let note = 0; note < 40; note++) {
  setTimeout(() => {
    midiOutput.send([0x90, note, colors[colorIndex % colors.length]]);
    colorIndex++;
  }, note * 100);  // 100ms delay between each LED
}

// Turn all off after test
setTimeout(() => {
  for (let note = 0; note < 40; note++) {
    midiOutput.send([0x90, note, 0]);
  }
}, 5000);
```

---

**Ready to implement!** 🎨
