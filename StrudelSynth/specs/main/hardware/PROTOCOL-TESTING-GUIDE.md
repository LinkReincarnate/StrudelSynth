# APCKEY25 mk2 Protocol Testing Guide

**Date**: 2025-11-02
**Hardware**: APCKEY25 mk2
**Goal**: Document complete MIDI protocol for implementation
**Estimated Time**: 2-4 hours

---

## Prerequisites

### Required Software

**Windows (Your Platform)**:
- **MIDI-OX**: Free MIDI monitoring tool
  - Download: http://www.midiox.com/
  - Alternative: MIDIberry (Microsoft Store)

**macOS** (for reference):
- MIDI Monitor: https://www.snoize.com/MIDIMonitor/

**Cross-platform**:
- **Protokol**: https://hexler.net/protokol (Recommended - modern UI)
- Web-based: https://studiocode.dev/midi-monitor/

### Setup Instructions

1. **Connect APCKEY25 mk2** via USB
2. **Install MIDI monitor** (choose one from above)
3. **Close other MIDI applications** (DAWs, etc.) to avoid conflicts
4. **Verify device detection**:
   - Open MIDI monitor
   - Look for "APC Key 25" or "APC Key 25 mk2" in device list

---

## Part 1: Button Grid Mapping (40 buttons)

### Goal
Map each of the 40 buttons (5 rows × 8 columns) to their MIDI note numbers.

### Procedure

1. **Open MIDI monitor** and ensure APCKEY25 mk2 input is selected
2. **Create mapping spreadsheet** (or use table below)
3. **Press each button systematically**:
   - Start from top-left (row 0, col 0)
   - Go left-to-right, top-to-bottom
   - Record the MIDI note number for each button

### Data Collection Template

Copy this template to a text file and fill it in:

```
APCKEY25 mk2 Button Grid Mapping
=================================

Row 0 (Top row):
[0,0] → Note: ___ | [0,1] → Note: ___ | [0,2] → Note: ___ | [0,3] → Note: ___
[0,4] → Note: ___ | [0,5] → Note: ___ | [0,6] → Note: ___ | [0,7] → Note: ___

Row 1:
[1,0] → Note: ___ | [1,1] → Note: ___ | [1,2] → Note: ___ | [1,3] → Note: ___
[1,4] → Note: ___ | [1,5] → Note: ___ | [1,6] → Note: ___ | [1,7] → Note: ___

Row 2:
[2,0] → Note: ___ | [2,1] → Note: ___ | [2,2] → Note: ___ | [2,3] → Note: ___
[2,4] → Note: ___ | [2,5] → Note: ___ | [2,6] → Note: ___ | [2,7] → Note: ___

Row 3:
[3,0] → Note: ___ | [3,1] → Note: ___ | [3,2] → Note: ___ | [3,3] → Note: ___
[3,4] → Note: ___ | [3,5] → Note: ___ | [3,6] → Note: ___ | [3,7] → Note: ___

Row 4 (Bottom row):
[4,0] → Note: ___ | [4,1] → Note: ___ | [4,2] → Note: ___ | [4,3] → Note: ___
[4,4] → Note: ___ | [4,5] → Note: ___ | [4,6] → Note: ___ | [4,7] → Note: ___
```

### Expected Pattern

Based on typical AKAI protocol, you'll likely see:
- Sequential note numbers (e.g., 0-39 or 32-71)
- Possible gap between rows
- Standard range: MIDI notes 0-127

### Validation

After mapping all 40 buttons:
- ✅ All note numbers are unique
- ✅ No missing slots (all 40 mapped)
- ✅ Note On velocity = 127 when pressed
- ✅ Note Off velocity = 0 when released (or Note On velocity 0)

---

## Part 2: LED Control Protocol

### Goal
Determine how to control RGB LEDs via MIDI output.

### Procedure

#### Test 1: Basic LED Control

1. **Use MIDI-OX "Send" feature** (or similar in your tool)
2. **Send Note On messages** to the device's MIDI output:
   ```
   Status: Note On (0x90, Channel 1)
   Note: [button note number from Part 1]
   Velocity: [test different values]
   ```

3. **Test velocity values**:
   - Velocity 0 → LED off?
   - Velocity 1-127 → Different colors/intensities?

#### Test 2: Color Mapping

**For mk2, test these common AKAI LED modes**:

| Velocity | Expected Color | Actual Result |
|----------|----------------|---------------|
| 0        | Off            | _____________ |
| 1        | Red (dim)      | _____________ |
| 3        | Red (bright)   | _____________ |
| 5        | Amber (dim)    | _____________ |
| 7        | Amber (bright) | _____________ |
| 9        | Yellow (dim)   | _____________ |
| 11       | Yellow (bright)| _____________ |
| 13       | Green (dim)    | _____________ |
| 15       | Green (bright) | _____________ |
| 127      | ?              | _____________ |

**Important**: mk2 may support full RGB (0-127 per channel) or only preset colors. Document what you observe.

#### Test 3: RGB Control (if supported)

If the above test shows limited colors, try:
- **SysEx messages** (manufacturer-specific)
- **Different MIDI channels** (some devices use channels for R/G/B)
- **Control Change messages** (CC for color selection)

**Document**: If RGB is not directly supported, note the available preset colors.

### LED Behavior Modes

Test if the following are supported:

**Solid LED**:
- Send Note On, LED stays lit
- Send Note On velocity 0, LED turns off

**Blinking** (if mk2 supports it):
- Certain velocity ranges may trigger blinking
- Test velocities 64-127

**Pulse/Breathing** (if mk2 supports it):
- Advanced feature, may require SysEx

---

## Part 3: Knob CC Mapping

### Goal
Map each of the 8 knobs to their MIDI CC (Control Change) numbers across all 4 modes.

### Knob Modes on APCKEY25

The APCKEY25 has 4 knob modes:
1. **Volume** (Shift + Pad 1)
2. **Pan** (Shift + Pad 2)
3. **Send** (Shift + Pad 3)
4. **Device** (Shift + Pad 4)

### Procedure

#### Step 1: Identify Mode Buttons

1. Press **Shift** (hold) + Pad buttons to switch modes
2. Observe LED indicators (if any) showing current mode
3. Document mode switching behavior

#### Step 2: Map Knobs in Each Mode

For **each mode** (Volume, Pan, Send, Device):

1. **Switch to the mode**
2. **Rotate each knob (1-8)** and record the CC number
3. **Note the value range** (typically 0-127)
4. **Check if knobs are absolute or relative**:
   - Absolute: Value = knob position (0-127)
   - Relative: Sends +1/-1 increments

### Data Collection Template

```
APCKEY25 mk2 Knob CC Mapping
=============================

Mode: VOLUME
------------
Knob 1 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 2 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 3 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 4 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 5 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 6 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 7 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 8 → CC: ___ (Range: ___-___, Type: Absolute/Relative)

Mode: PAN
---------
Knob 1 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 2 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 3 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 4 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 5 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 6 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 7 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
Knob 8 → CC: ___ (Range: ___-___, Type: Absolute/Relative)

Mode: SEND
----------
Knob 1 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
[... repeat for all 8 knobs ...]

Mode: DEVICE
------------
Knob 1 → CC: ___ (Range: ___-___, Type: Absolute/Relative)
[... repeat for all 8 knobs ...]
```

### Expected Pattern

Typical AKAI CC mappings:
- **Volume mode**: CC 7 (volume) or CC 48-55
- **Pan mode**: CC 10 (pan) or CC 56-63
- **Send mode**: CC 91-93 (effects) or CC 64-71
- **Device mode**: CC 16-23 (user-assignable)

Your mk2 may differ - document actual behavior.

---

## Part 4: Keyboard (25 keys)

### Goal
Verify standard MIDI note behavior for the 25-key keyboard.

### Procedure

1. **Play keys from left to right** (low to high)
2. **Record the MIDI note number** for each key
3. **Test velocity sensitivity**:
   - Press softly → Low velocity (e.g., 30-60)
   - Press hard → High velocity (e.g., 100-127)

### Data Collection

```
Keyboard Mapping
================

Leftmost key (C?) → MIDI Note: ___
[... continue for 2-3 keys to establish pattern ...]
Rightmost key → MIDI Note: ___

Velocity Range: Min ___ to Max ___

Expected: Standard MIDI keyboard (likely C1=36 to C3=60 or similar)
```

Most likely: Your keyboard starts at **C1 (MIDI note 36)** and goes to **C3 (MIDI note 60)**.

---

## Part 5: Special Buttons

### Goal
Document any special control buttons (Shift, Sustain, etc.)

### Buttons to Test

1. **Shift** button
2. **Sustain** button (if present)
3. **Octave Up/Down** buttons (if present)
4. **Any other controls**

### Procedure

For each button:
1. **Press the button** while monitoring MIDI
2. **Record message type**:
   - Note On/Off?
   - Control Change?
   - Program Change?
3. **Record values**

### Data Collection

```
Special Buttons
===============

Shift → Message Type: ___, Value: ___
Sustain → Message Type: ___, Value: ___
Octave Up → Message Type: ___, Value: ___
Octave Down → Message Type: ___, Value: ___
[... any others ...]
```

---

## Part 6: Create Device Configuration File

### Goal
Generate JSON configuration file for StrudelSynth.

### Template

After collecting all data above, create:
`StrudelSynth/src/midi/devices/apckey25-mk2.json`

```json
{
  "deviceName": "APC Key 25 mk2",
  "manufacturer": "AKAI Professional",
  "variant": "mk2",
  "midiSpec": {
    "buttonGrid": {
      "rows": 5,
      "cols": 8,
      "noteMap": [
        [/* Row 0: 8 note numbers */],
        [/* Row 1: 8 note numbers */],
        [/* Row 2: 8 note numbers */],
        [/* Row 3: 8 note numbers */],
        [/* Row 4: 8 note numbers */]
      ]
    },
    "leds": {
      "type": "velocity-based",
      "colorMap": {
        "0": { "name": "off", "r": 0, "g": 0, "b": 0 },
        "3": { "name": "red", "r": 127, "g": 0, "b": 0 },
        "7": { "name": "amber", "r": 127, "g": 64, "b": 0 },
        "15": { "name": "green", "r": 0, "g": 127, "b": 0 }
      }
    },
    "knobs": {
      "count": 8,
      "type": "absolute",
      "modes": {
        "volume": [/* 8 CC numbers */],
        "pan": [/* 8 CC numbers */],
        "send": [/* 8 CC numbers */],
        "device": [/* 8 CC numbers */]
      }
    },
    "keyboard": {
      "keys": 25,
      "startNote": 36,
      "endNote": 60,
      "velocitySensitive": true
    },
    "specialButtons": {
      "shift": { "type": "note", "number": 98 },
      "sustain": { "type": "cc", "number": 64 }
    }
  }
}
```

**Note**: Replace all placeholder values with your actual findings.

---

## Validation Checklist

Before finishing, verify:

- [ ] All 40 button notes documented
- [ ] LED control protocol tested and working
- [ ] All 8 knobs mapped in all 4 modes (32 CC mappings total)
- [ ] Keyboard note range verified
- [ ] Special buttons documented
- [ ] JSON configuration file created
- [ ] Test: Can you send LED commands and see colors change?
- [ ] Test: Can you detect all button presses correctly?

---

## Common Issues & Troubleshooting

### Issue: No MIDI messages received

**Solution**:
- Check USB cable connection
- Verify device shows in Windows Device Manager
- Check MIDI monitor is listening to correct input
- Try different USB port
- Restart the device

### Issue: LED commands not working

**Solution**:
- Ensure you're sending to MIDI **output** (not input)
- Check note number matches button mapping
- Some LEDs only respond to specific velocity ranges
- mk2 may require specific mode (check manual)

### Issue: Knob values jumping/erratic

**Solution**:
- This is normal for endless encoders (relative mode)
- Document as "relative" type if you see +1/-1 values
- If absolute, values should be 0-127 stable

### Issue: Can't switch knob modes

**Solution**:
- Hold Shift + Press pads 1-4
- Some modes may require specific firmware
- Check if LED indicators show current mode

---

## Next Steps

After completing this protocol documentation:

1. **Create protocol document**: `specs/main/hardware/apckey25-mk2-protocol.md`
2. **Save findings** in structured format
3. **Create device config**: `src/midi/devices/apckey25-mk2.json`
4. **Update clarifications.md**: Mark RT-2 as complete ✅
5. **Proceed to Strudel API research** (RT-1)

---

## Resources

- **APCKEY25 User Manual**: Check AKAI website for official MIDI implementation chart
- **MIDI Specification**: https://www.midi.org/specifications
- **Web MIDI API**: https://webaudio.github.io/web-midi-api/

---

**Good luck with the testing! 🎹**

Take your time, be systematic, and document everything you observe. This data is critical for the implementation.
