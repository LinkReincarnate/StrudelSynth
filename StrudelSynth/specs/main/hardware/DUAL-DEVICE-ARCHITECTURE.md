# APCKEY25 mk2 Dual Device Architecture

**CRITICAL IMPLEMENTATION NOTE**

---

## Overview

The APCKEY25 mk2 presents as **TWO separate MIDI devices** to the operating system and Web MIDI API. This is NOT a bug - it's the hardware design.

## Device Breakdown

```
Physical Hardware: APCKEY25 mk2
        │
        ├─── Device 1: "APC Key 25 mk2"
        │    └─── 25-key keyboard (input only)
        │         • MIDI notes 1-120
        │         • Velocity sensitive
        │
        └─── Device 2: "MIDIIN2" / "MIDIOUT2"
             └─── Everything else (input + output)
                  • 5×8 button grid (40 buttons, notes 0-39)
                  • RGB LEDs (40 LEDs, controlled via MIDIOUT2)
                  • 8 knobs (CC 48-55)
                  • Special buttons (Shift, mode buttons, etc.)
```

---

## Implementation Requirements

### 1. Connect to BOTH Devices

Your `MIDIControllerManager` must:
- Enumerate all MIDI devices
- Find **both** "APC Key 25 mk2" AND "MIDIIN2"/"MIDIOUT2"
- Connect to both simultaneously
- Handle disconnect/reconnect for BOTH devices

**Example (Web MIDI API):**

```typescript
interface APCDevices {
  keyboard: {
    input: MIDIInput;
  };
  controller: {
    input: MIDIInput;
    output: MIDIOutput;
  };
}

async function connectAPCKey25mk2(): Promise<APCDevices> {
  const midiAccess = await navigator.requestMIDIAccess();

  // Find keyboard device
  const keyboardInput = Array.from(midiAccess.inputs.values())
    .find(input => input.name === "APC Key 25 mk2");

  // Find controller device
  const controllerInput = Array.from(midiAccess.inputs.values())
    .find(input => input.name?.includes("MIDIIN2"));

  const controllerOutput = Array.from(midiAccess.outputs.values())
    .find(output => output.name?.includes("MIDIOUT2"));

  if (!keyboardInput || !controllerInput || !controllerOutput) {
    throw new Error("APCKEY25 mk2 not fully connected");
  }

  return {
    keyboard: { input: keyboardInput },
    controller: { input: controllerInput, output: controllerOutput }
  };
}
```

---

### 2. Route Messages to Correct Device

| Message Type | Device | Port | Direction |
|--------------|--------|------|-----------|
| Keyboard notes | "APC Key 25 mk2" | Input | IN |
| Button presses | "MIDIIN2" | Input | IN |
| Knob rotation | "MIDIIN2" | Input | IN |
| Special buttons | "MIDIIN2" | Input | IN |
| LED control | "MIDIOUT2" | Output | OUT |

**Example (Event Handling):**

```typescript
// Listen to keyboard (musical notes)
apcDevices.keyboard.input.onmidimessage = (event) => {
  const [status, note, velocity] = event.data;
  if ((status & 0xF0) === 0x90) {  // Note On
    console.log(`Keyboard note: ${note}, velocity: ${velocity}`);
    handleKeyboardNote(note, velocity);
  }
};

// Listen to controller (buttons, knobs)
apcDevices.controller.input.onmidimessage = (event) => {
  const [status, data1, data2] = event.data;

  if ((status & 0xF0) === 0x90) {  // Note On (button press)
    if (data1 >= 0 && data1 <= 39) {
      console.log(`Button ${data1} pressed`);
      handleButtonPress(data1);
    } else if (data1 === 98) {
      console.log("Shift button pressed");
      handleShiftButton();
    }
  }

  if ((status & 0xF0) === 0xB0) {  // Control Change (knob)
    if (data1 >= 48 && data1 <= 55) {
      const knobIndex = data1 - 48;
      console.log(`Knob ${knobIndex} changed: ${data2}`);
      handleKnobChange(knobIndex, data2);
    }
  }
};

// Send LED commands (to controller output)
function setLED(row: number, col: number, velocity: number) {
  const noteNumber = (4 - row) * 8 + col;
  apcDevices.controller.output.send([0x90, noteNumber, velocity]);
}
```

---

### 3. Handle Device Detection

**Problem**: Users might plug in the controller after the app starts.

**Solution**: Listen for MIDI device state changes:

```typescript
midiAccess.onstatechange = (event) => {
  const port = event.port;

  if (port.state === "connected") {
    if (port.name === "APC Key 25 mk2") {
      console.log("Keyboard connected");
      connectKeyboard(port as MIDIInput);
    } else if (port.name?.includes("MIDIIN2")) {
      console.log("Controller input connected");
      connectControllerInput(port as MIDIInput);
    } else if (port.name?.includes("MIDIOUT2")) {
      console.log("Controller output connected");
      connectControllerOutput(port as MIDIOutput);
    }
  }

  if (port.state === "disconnected") {
    console.warn(`Device disconnected: ${port.name}`);
    handleDisconnect(port);
  }
};
```

---

### 4. Graceful Degradation

**What if only one device is connected?**

| Scenario | Behavior |
|----------|----------|
| Only keyboard connected | Recording works, pattern triggering doesn't, no LED feedback |
| Only controller connected | Pattern triggering works, recording doesn't |
| Both connected | Full functionality ✅ |

**Recommendation**: Show clear UI warnings when a device is missing.

```typescript
function checkDeviceStatus(): DeviceStatus {
  return {
    keyboardConnected: !!apcDevices.keyboard.input,
    controllerConnected: !!apcDevices.controller.input && !!apcDevices.controller.output,
    fullyFunctional: keyboardConnected && controllerConnected
  };
}

// Show warning in UI
if (!status.fullyFunctional) {
  showWarning("APCKEY25 mk2 not fully connected. Some features unavailable.");
}
```

---

## Common Pitfalls

### ❌ WRONG: Sending LEDs to keyboard device

```typescript
// This will NOT work!
keyboardDevice.output.send([0x90, 32, 13]);  // No effect
```

**Why**: Keyboard device has no output, and doesn't control LEDs.

---

### ❌ WRONG: Expecting keyboard notes on controller device

```typescript
// This will miss keyboard input!
controllerDevice.input.onmidimessage = (event) => {
  // Keyboard notes never arrive here
};
```

**Why**: Keyboard notes come from the separate keyboard device.

---

### ❌ WRONG: Connecting to only one device

```typescript
// Incomplete connection
const device = midiInputs.find(d => d.name.includes("APC"));
// Missing the second device!
```

**Why**: You need BOTH devices for full functionality.

---

## Testing Your Implementation

### Test 1: Keyboard Input

```typescript
// Press a key on the 25-key keyboard
// Expected: Event on "APC Key 25 mk2" input
// Note: 48-72 (C2 to C4)
```

### Test 2: Button Press

```typescript
// Press top-left button on the grid
// Expected: Event on "MIDIIN2" input
// Note: 32, Velocity: 127
```

### Test 3: LED Control

```typescript
// Send command to MIDIOUT2
apcDevices.controller.output.send([0x90, 0, 13]);  // Bottom-left = green

// Expected: Bottom-left LED lights up green
// Wrong device → No effect
```

### Test 4: Knob Rotation

```typescript
// Rotate knob 1
// Expected: Event on "MIDIIN2" input
// CC: 48, Value: 1-127 (relative +/-)
```

---

## Device Name Variations

**Windows:**
- Input: "MIDIIN2 (APC Key 25 mk2)"
- Output: "MIDIOUT2 (APC Key 25 mk2)"

**macOS:**
- Input: "APC Key 25 mk2 Port 2"
- Output: "APC Key 25 mk2 Port 2"

**Linux:**
- Input: "APC Key 25 mk2:APC Key 25 mk2 MIDI 2"
- Output: "APC Key 25 mk2:APC Key 25 mk2 MIDI 2"

**Solution**: Use fuzzy matching for device names:

```typescript
function isControllerDevice(deviceName: string): boolean {
  return deviceName.includes("MIDIIN2") ||
         deviceName.includes("MIDIOUT2") ||
         deviceName.includes("Port 2") ||
         deviceName.includes("MIDI 2");
}

function isKeyboardDevice(deviceName: string): boolean {
  return deviceName === "APC Key 25 mk2" ||
         (deviceName.includes("APC Key 25 mk2") && deviceName.includes("Port 1"));
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Web MIDI API / OS                      │
└─────────┬───────────────────────────────┬───────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│  "APC Key 25 mk2"   │    │  "MIDIIN2" / "MIDIOUT2"      │
│  ─────────────────  │    │  ────────────────────────    │
│  • Input Only       │    │  • Input + Output            │
│  • Keyboard (25keys)│    │  • 40 Buttons (notes 0-39)   │
│  • Notes 1-120      │    │  • 40 LEDs (send to OUT)     │
│  • Velocity sens.   │    │  • 8 Knobs (CC 48-55)        │
│                     │    │  • Special buttons (98, etc.)│
└─────────┬───────────┘    └──────────┬───────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│           MIDIControllerManager (Your Code)             │
│  ─────────────────────────────────────────────────────  │
│  • Connects to BOTH devices                             │
│  • Routes keyboard → recording                          │
│  • Routes buttons → pattern triggers                    │
│  • Routes knobs → parameter control                     │
│  • Sends LED commands → MIDIOUT2                        │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

**Key Takeaways:**

1. ✅ APCKEY25 mk2 = 2 MIDI devices (keyboard + controller)
2. ✅ Connect to BOTH devices simultaneously
3. ✅ Keyboard input comes from "APC Key 25 mk2"
4. ✅ Button/knob input comes from "MIDIIN2"
5. ✅ LED output goes to "MIDIOUT2"
6. ✅ Handle disconnect/reconnect for BOTH devices
7. ✅ Use fuzzy matching for device names (OS variations)

**This is the #1 most important thing to get right in your implementation!**

---

**See also:**
- `apckey25-mk2-protocol.md` - Complete MIDI protocol reference
- `LED-QUICK-REFERENCE.md` - LED color codes and examples
- `../contracts/midi-controller-api.md` - API design
