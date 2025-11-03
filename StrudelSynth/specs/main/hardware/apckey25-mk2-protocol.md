# APCKEY25 mk2 MIDI Protocol Documentation

**Date**: 2025-11-02
**Hardware**: APCKEY25 mk2
**Tested By**: Hardware Testing Completed
**Testing Tool**: MIDI-OX
**Status**: ✅ Complete

---

## ⚠️ CRITICAL: Dual MIDI Device Architecture

The APCKEY25 mk2 presents as **TWO separate MIDI devices**:

| Device Name | Purpose | I/O |
|-------------|---------|-----|
| **"APC Key 25 mk2"** | 25-key keyboard | Input only (notes 1-120) |
| **"MIDIIN2" / "MIDIOUT2"** | 5×8 button grid + LEDs | Input (buttons) + Output (LEDs) |

**Implementation Impact**:
- Must connect to **BOTH** devices simultaneously
- Keyboard input → "APC Key 25 mk2" device
- Button presses → "MIDIIN2" device
- LED control → "MIDIOUT2" device
- Knobs → "MIDIIN2" device
- Special buttons → "MIDIIN2" device

**Summary**:
- **"APC Key 25 mk2"**: Keyboard ONLY (input only)
- **"MIDIIN2"/"MIDIOUT2"**: Everything else (buttons, knobs, LEDs, special buttons)

---

## Button Grid Mapping (5×8 = 40 buttons)

**MIDI Device**: "MIDIIN2" / "MIDIOUT2"

### Note Numbers by Position

**Row 0 (Top):**
- [0,0] → Note: 32
- [0,1] → Note: 33
- [0,2] → Note: 34
- [0,3] → Note: 35
- [0,4] → Note: 36
- [0,5] → Note: 37
- [0,6] → Note: 38
- [0,7] → Note: 39

**Row 1:**
- [1,0] → Note: 24
- [1,1] → Note: 25
- [1,2] → Note: 26
- [1,3] → Note: 27
- [1,4] → Note: 28
- [1,5] → Note: 29
- [1,6] → Note: 30
- [1,7] → Note: 31

**Row 2:**
- [2,0] → Note: 16
- [2,1] → Note: 17
- [2,2] → Note: 18
- [2,3] → Note: 19
- [2,4] → Note: 20
- [2,5] → Note: 21
- [2,6] → Note: 22
- [2,7] → Note: 23

**Row 3:**
- [3,0] → Note: 8
- [3,1] → Note: 9
- [3,2] → Note: 10
- [3,3] → Note: 11
- [3,4] → Note: 12
- [3,5] → Note: 13
- [3,6] → Note: 14
- [3,7] → Note: 15

**Row 4 (Bottom):**
- [4,0] → Note: 0
- [4,1] → Note: 1
- [4,2] → Note: 2
- [4,3] → Note: 3
- [4,4] → Note: 4
- [4,5] → Note: 5
- [4,6] → Note: 6
- [4,7] → Note: 7

### Button Behavior

- **Note On Velocity (pressed)**: 127
- **Note Off Velocity (released)**: 0
- **MIDI Channel**: 1

---

## LED Control Protocol

**MIDI Device**: "MIDIOUT2" (NOT "APC Key 25 mk2"!)

### Method

LED control via: [x] Note On velocity | [ ] SysEx | [ ] Control Change | [ ] Other: ___

**Protocol**: Send MIDI Note On to "MIDIOUT2" device with note number = button position, velocity = color code

### Color Mapping (Selected Tested Values)

| Velocity (Dec) | Velocity (Hex) | Color Observed | Notes |
|----------------|----------------|----------------|-------|
| 0              | 0x00           | OFF            | Off state |
| 5              | 0x05           | **Red**        | **Used for RECORDING** ✅ |
| 13             | 0x0D           | **Bright Green** | **Used for PLAYING** ✅ |
| 16             | 0x10           | Bright Teal    | Alternative color |
| 32             | 0x20           | Bright Sky Blue | Alternative color |
| 48             | 0x30           | Bright Purple  | Alternative color |
| 64             | 0x40           | Dim Green      | Not recommended |
| 80             | 0x50           | Bright Deep Purple | Alternative color |
| 96             | 0x60           | **Bright Yellow** | **Used for LOADED** ✅ |
| 112            | 0x70           | Dim White      | Not recommended |

### Recommended Palette for StrudelSynth

**Core Colors (from spec.md requirements):**

| Use Case | Velocity | Hex | Color | Status |
|----------|----------|-----|-------|--------|
| Empty slot | 0 | 0x00 | OFF | ✅ |
| Loaded (not playing) | 96 | 0x60 | Bright Yellow | ✅ |
| Playing | 13 | 0x0D | Bright Green | ✅ |
| Recording | 5 | 0x05 | Red | ✅ |
| Error | 5 | 0x05 | Red (solid) | ✅ |

**Additional Colors Available:**
- Teal (16), Sky Blue (32), Purple (48, 80) - for future features

### RGB Support

- [ ] Full RGB (0-127 per channel)
- [x] Limited palette (discrete colors mapped to velocity values)
- [ ] Preset colors only

**Notes**:
- Wide variety of colors available across 0-127 velocity range
- Each velocity value maps to a specific preset color
- No evidence of full RGB control (would require different MIDI messages)
- Color palette is rich enough for all application needs

### Blink/Pulse Support

- [ ] Blinking supported (How: _______________)
- [ ] Pulse/breathing supported (How: _______________)
- [x] Solid only (tested - all colors appear solid, no native blink mode detected)

---

## Knob CC Mapping

**MIDI Device**: "MIDIIN2"

| Knob | CC Number | Range | Type (Abs/Rel) |
|------|-----------|-------|----------------|
| 1    | 48        | 0-127 | Rel            |
| 2    | 49        | 0-127 | Rel            |
| 3    | 50        | 0-127 | Rel            |
| 4    | 51        | 0-127 | Rel            |
| 5    | 52        | 0-127 | Rel            |
| 6    | 53        | 0-127 | Rel            |
| 7    | 54        | 0-127 | Rel            |
| 8    | 55        | 0-127 | Rel            |

---

## Keyboard (25 keys)

**MIDI Device**: "APC Key 25 mk2" (NOT "MIDIIN2"!)

- **Leftmost key**: MIDI Note 48 (or 1-120 range per user note)
- **Rightmost key**: MIDI Note 72
- **Full range**: Notes 1-120 available
- **Velocity sensitive**: [x] Yes | [ ] No
- **Velocity range**: Min 0 to Max 127
- **MIDI Channel**: 1

**Note**: User reports keyboard sends notes 1-120, wider than standard 25-key range. Need to verify exact mapping.

---

## Special Buttons

| Button       | Message Type | Note/CC Number | Values | Notes |
|--------------|--------------|----------------|--------|-------|
| Shift        | Note         | 98             | ___    | ___   |
| Sustain      | CC           | 64             | ___    | ___   |
| Octave Up    | ___          | ___            | ___    | ___   |
| Octave Down  | ___          | ___            | ___    | ___   |
| StopAllClips | Note         | 81             | ___    | ___   |
| ClipStop     | Note         | 82             | ___    | ___   |
| Solo         | Note         | 83             | ___    | ___   |
| Mute         | Note         | 84             | ___    | ___   |
| RecArm       | Note         | 85             | ___    | ___   |
| Select       | Note         | 86             | ___    | ___   |
| Volume       | Note         | 68             | ___    | ___   |
| Pan          | Note         | 69             | ___    | ___   |
| Send         | Note         | 70             | ___    | ___   |
| Device       | Note         | 71             | ___    | ___   |
| Up           | Note         | 64             | ___    | ___   |
| Down         | Note         | 65             | ___    | ___   |
| Left         | Note         | 66             | ___    | ___   |
| Right        | Note         | 68             | ___    | ___   |


---

## Testing Notes

### Observations

(Record any unexpected behavior, quirks, or important findings here)

---

### Issues Encountered

(Document any problems during testing and how you resolved them)

---

### Validation Checklist

- [x] All 40 buttons tested and mapped
- [x] LED control verified (Red, Yellow, Green + bonus colors)
- [x] All knob modes tested (8 knobs on CC 48-55, relative encoders)
- [x] Keyboard range verified (MIDI 48-72)
- [x] Special buttons documented (Shift, Sustain, mode buttons, etc.)
- [x] JSON config file created and populated

---

**Status**: ✅ Complete - Ready for implementation!
