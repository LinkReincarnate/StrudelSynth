# APCKEY25 mk2 Protocol Testing Checklist

**Quick Reference for Hardware Testing Session**

---

## Before You Start

- [ ] APCKEY25 mk2 connected via USB
- [ ] MIDI monitor tool installed (MIDI-OX, Protokol, etc.)
- [ ] Other MIDI apps closed (DAWs, etc.)
- [ ] Device detected in MIDI monitor
- [ ] Templates ready:
  - `specs/main/hardware/apckey25-mk2-protocol.md`
  - `src/midi/devices/apckey25-mk2.json`

---

## Part 1: Button Grid (30-45 min) ✋

**Goal**: Map all 40 buttons to MIDI note numbers

### Quick Test
1. Open MIDI monitor
2. Press top-left button → Record note number
3. Press all 40 buttons systematically (left→right, top→bottom)
4. Fill in `apckey25-mk2-protocol.md` button section

### Validation
- [ ] All 40 buttons mapped
- [ ] All note numbers unique
- [ ] Note On velocity = 127
- [ ] Note Off velocity = 0

---

## Part 2: LED Control (20-30 min) 💡

**Goal**: Determine how to control LEDs via MIDI

### Quick Test
1. In MIDI monitor, send Note On messages to device OUTPUT
2. Try different velocities: 0, 1, 3, 5, 7, 9, 11, 13, 15, 127
3. Observe LED color changes
4. Document velocity→color mapping

### Validation
- [ ] Off (velocity 0) works
- [ ] At least 3 colors identified (red, amber, green)
- [ ] Color mapping documented
- [ ] Blink/pulse tested (if supported)

---

## Part 3: Knobs - All Modes (30-45 min) 🎛️

**Goal**: Map all 8 knobs × 4 modes = 32 CC numbers

### Mode Switching
1. Hold **Shift** + Press **Pad 1** = Volume mode
2. Hold **Shift** + Press **Pad 2** = Pan mode
3. Hold **Shift** + Press **Pad 3** = Send mode
4. Hold **Shift** + Press **Pad 4** = Device mode

### For Each Mode
1. Switch to mode
2. Rotate knob 1 → Record CC number
3. Rotate knob 2 → Record CC number
4. ... (repeat for all 8 knobs)
5. Fill in table in `apckey25-mk2-protocol.md`

### Validation
- [ ] Volume mode: 8 CC numbers
- [ ] Pan mode: 8 CC numbers
- [ ] Send mode: 8 CC numbers
- [ ] Device mode: 8 CC numbers
- [ ] **Total: 32 CC mappings**

---

## Part 4: Keyboard (10 min) 🎹

**Goal**: Verify keyboard note range

### Quick Test
1. Press leftmost key → Record MIDI note
2. Press rightmost key → Record MIDI note
3. Test velocity: press soft, press hard → Observe values

### Expected
- Start: Likely MIDI note 36 (C1) or 48 (C2)
- End: Start + 24 notes (25 keys total)
- Velocity: 1-127 (sensitive)

### Validation
- [ ] Start note documented
- [ ] End note documented
- [ ] Velocity sensitivity confirmed

---

## Part 5: Special Buttons (10 min) ⚙️

**Goal**: Document Shift, Sustain, Octave buttons

### Quick Test
1. Press **Shift** → Record message type & number
2. Press **Sustain** → Record message type & number
3. Press **Octave +/-** (if present) → Record

### Validation
- [ ] Shift documented
- [ ] Sustain documented
- [ ] Other controls documented

---

## After Testing: Create Config File (15 min) 📝

1. **Transfer data** from `apckey25-mk2-protocol.md` to `apckey25-mk2.json`
2. **Replace all `null` values** with actual numbers
3. **Validate JSON** (use JSON validator or VS Code)
4. **Test**: Try loading config in a simple script

### Final Validation
- [ ] JSON is valid (no syntax errors)
- [ ] All button notes filled in (40 values)
- [ ] All knob CCs filled in (32 values)
- [ ] LED color map complete
- [ ] Keyboard range filled in
- [ ] Special buttons filled in

---

## Total Estimated Time

- **Minimum**: 1.5 hours (fast, systematic)
- **Average**: 2-3 hours (careful documentation)
- **Maximum**: 4 hours (thorough testing + troubleshooting)

**Recommendation**: Take breaks, be systematic, double-check your work.

---

## Tips for Success

1. **Be systematic**: Test in order (don't jump around)
2. **Document as you go**: Don't rely on memory
3. **Double-check**: Verify critical mappings (first/last button, all knobs)
4. **Take photos**: Photo of controller layout with labels can help
5. **Save frequently**: Don't lose your work!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No MIDI messages | Check USB, restart device, try different port |
| LED not changing | Ensure sending to OUTPUT port, not input |
| Knob values erratic | Normal for relative encoders, document behavior |
| Can't switch modes | Hold Shift firmly, press pad clearly |

---

## After Completion

1. Mark `apckey25-mk2-protocol.md` status as ✅
2. Commit files to git:
   ```bash
   git add specs/main/hardware/apckey25-mk2-protocol.md
   git add src/midi/devices/apckey25-mk2.json
   git commit -m "docs: Complete APCKEY25 mk2 MIDI protocol documentation"
   ```
3. Update `specs/main/clarifications.md`: Mark RT-2 as complete
4. Move to next task: Strudel API research (RT-1)

---

**Good luck! 🎹 You've got this!**
