/**
 * MIDIManager - Handles MIDI device connection and communication
 *
 * CRITICAL: APCKEY25 mk2 has TWO separate MIDI devices:
 * 1. "APC Key 25 mk2" - Keyboard only (notes 1-120)
 * 2. "MIDIIN2"/"MIDIOUT2" - Buttons, knobs, LEDs
 *
 * Must connect to BOTH devices for full functionality!
 */

import type { APCDevices, MIDIMessage, ButtonEvent, KnobEvent } from '../lib/types';
import { MIDI_DEVICE_NAMES, BUTTON_NOTE_MAP, ALL_BUTTON_NOTES, KNOB_CC_MAP, ALL_KNOB_CCS, SPECIAL_BUTTONS, MIDI_STATUS } from '../lib/constants';

export type MIDIMessageHandler = (message: MIDIMessage) => void;
export type ButtonEventHandler = (event: ButtonEvent) => void;
export type KnobEventHandler = (event: KnobEvent) => void;

export class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private devices: APCDevices | null = null;
  private shiftHeld = false;

  // Event handlers
  private buttonHandlers: ButtonEventHandler[] = [];
  private knobHandlers: KnobEventHandler[] = [];
  private rawHandlers: MIDIMessageHandler[] = [];

  /**
   * Request MIDI access and connect to APCKEY25 mk2 devices
   * @throws Error if MIDI not supported or devices not found
   */
  async connect(): Promise<void> {
    // Check browser support
    if (!navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API not supported in this browser. Use Chrome, Edge, or Opera.');
    }

    // Request MIDI access
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
    } catch (error) {
      throw new Error(`Failed to get MIDI access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Find both devices
    this.devices = this.findDevices();

    if (!this.devices) {
      throw new Error('APCKEY25 mk2 not found. Please connect the device and try again.');
    }

    // Set up message listeners
    this.setupListeners();

    console.log('✅ MIDI connected:', {
      keyboard: this.devices.keyboard.input.name,
      controller: {
        input: this.devices.controller.input.name,
        output: this.devices.controller.output.name,
      }
    });
  }

  /**
   * Find and connect to both APCKEY25 mk2 devices
   * @returns APCDevices if both found, null otherwise
   */
  private findDevices(): APCDevices | null {
    if (!this.midiAccess) return null;

    let keyboardInput: MIDIInput | null = null;
    let controllerInput: MIDIInput | null = null;
    let controllerOutput: MIDIOutput | null = null;

    // Search inputs
    for (const input of this.midiAccess.inputs.values()) {
      if (input.name === MIDI_DEVICE_NAMES.KEYBOARD) {
        keyboardInput = input;
      } else if (input.name === MIDI_DEVICE_NAMES.CONTROLLER_INPUT) {
        controllerInput = input;
      }
    }

    // Search outputs
    for (const output of this.midiAccess.outputs.values()) {
      if (output.name === MIDI_DEVICE_NAMES.CONTROLLER_OUTPUT) {
        controllerOutput = output;
      }
    }

    // Verify all devices found
    if (!keyboardInput || !controllerInput || !controllerOutput) {
      console.warn('Missing devices:', {
        keyboard: !!keyboardInput,
        controllerInput: !!controllerInput,
        controllerOutput: !!controllerOutput,
      });
      return null;
    }

    return {
      keyboard: { input: keyboardInput },
      controller: { input: controllerInput, output: controllerOutput },
    };
  }

  /**
   * Set up MIDI message listeners
   */
  private setupListeners(): void {
    if (!this.devices) return;

    // Listen to keyboard device
    this.devices.keyboard.input.onmidimessage = (event) => {
      this.handleMIDIMessage(event, 'keyboard');
    };

    // Listen to controller device (buttons, knobs)
    this.devices.controller.input.onmidimessage = (event) => {
      this.handleMIDIMessage(event, 'controller');
    };
  }

  /**
   * Handle incoming MIDI message
   */
  private handleMIDIMessage(event: WebMidi.MIDIMessageEvent, source: 'keyboard' | 'controller'): void {
    const [status, data1, data2] = event.data;

    const message: MIDIMessage = {
      status,
      data1,
      data2,
      timestamp: event.timeStamp,
    };

    // Notify raw handlers
    this.rawHandlers.forEach(handler => handler(message));

    // Only process controller messages for buttons/knobs
    if (source !== 'controller') return;

    const command = status & 0xf0;

    // Button press (Note On/Off)
    if (command === MIDI_STATUS.NOTE_ON || command === MIDI_STATUS.NOTE_OFF) {
      this.handleButtonMessage(data1, data2, event.timeStamp);
    }
    // Knob change (Control Change)
    else if (command === MIDI_STATUS.CONTROL_CHANGE) {
      this.handleKnobMessage(data1, data2, event.timeStamp);
    }
  }

  /**
   * Handle button press/release
   */
  private handleButtonMessage(note: number, velocity: number, timestamp: number): void {
    // Track shift key state
    if (note === SPECIAL_BUTTONS.SHIFT) {
      this.shiftHeld = velocity > 0;
    }

    // Only process button grid notes (0-39)
    if (!ALL_BUTTON_NOTES.includes(note as any)) {
      return;
    }

    const event: ButtonEvent = {
      note,
      velocity,
      shiftHeld: this.shiftHeld,
      timestamp,
    };

    this.buttonHandlers.forEach(handler => handler(event));
  }

  /**
   * Handle knob change
   */
  private handleKnobMessage(cc: number, value: number, timestamp: number): void {
    // Only process knob CCs (48-55)
    if (!ALL_KNOB_CCS.includes(cc)) {
      return;
    }

    // Calculate knob index (0-7)
    const index = cc - 48;

    // Convert to relative delta (+/- for encoder)
    // Values 1-63 = clockwise, 65-127 = counter-clockwise
    let delta = 0;
    if (value >= 1 && value <= 63) {
      delta = value; // Clockwise
    } else if (value >= 65 && value <= 127) {
      delta = -(128 - value); // Counter-clockwise
    }

    const event: KnobEvent = {
      cc,
      index,
      delta,
      timestamp,
    };

    this.knobHandlers.forEach(handler => handler(event));
  }

  /**
   * Set LED color for a button
   * @param note Button note number (0-39)
   * @param color LED color (0-127, see LED_COLORS constant)
   */
  setLED(note: number, color: number): void {
    if (!this.devices) {
      console.warn('Cannot set LED: MIDI not connected');
      return;
    }

    // Validate note is in button grid
    if (!ALL_BUTTON_NOTES.includes(note as any)) {
      console.warn(`Invalid button note: ${note} (must be 0-39)`);
      return;
    }

    // Send Note On message with velocity = color
    // CRITICAL: Send to MIDIOUT2, not keyboard device!
    const message = [MIDI_STATUS.NOTE_ON, note, color];
    this.devices.controller.output.send(message);
  }

  /**
   * Set multiple LEDs at once
   * @param updates Array of [note, color] pairs
   */
  setLEDs(updates: Array<[number, number]>): void {
    updates.forEach(([note, color]) => this.setLED(note, color));
  }

  /**
   * Turn off all LEDs
   */
  clearLEDs(): void {
    ALL_BUTTON_NOTES.forEach(note => this.setLED(note, 0));
  }

  /**
   * Register button event handler
   */
  onButton(handler: ButtonEventHandler): () => void {
    this.buttonHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      const index = this.buttonHandlers.indexOf(handler);
      if (index > -1) this.buttonHandlers.splice(index, 1);
    };
  }

  /**
   * Register knob event handler
   */
  onKnob(handler: KnobEventHandler): () => void {
    this.knobHandlers.push(handler);
    return () => {
      const index = this.knobHandlers.indexOf(handler);
      if (index > -1) this.knobHandlers.splice(index, 1);
    };
  }

  /**
   * Register raw MIDI message handler
   */
  onMIDI(handler: MIDIMessageHandler): () => void {
    this.rawHandlers.push(handler);
    return () => {
      const index = this.rawHandlers.indexOf(handler);
      if (index > -1) this.rawHandlers.splice(index, 1);
    };
  }

  /**
   * Disconnect from MIDI devices
   */
  disconnect(): void {
    if (this.devices) {
      this.devices.keyboard.input.onmidimessage = null;
      this.devices.controller.input.onmidimessage = null;
    }

    this.buttonHandlers = [];
    this.knobHandlers = [];
    this.rawHandlers = [];
    this.devices = null;
    this.midiAccess = null;

    console.log('✅ MIDI disconnected');
  }

  /**
   * Check if MIDI is currently connected
   */
  isConnected(): boolean {
    return this.devices !== null;
  }

  /**
   * Get current device info
   */
  getDevices(): APCDevices | null {
    return this.devices;
  }
}
