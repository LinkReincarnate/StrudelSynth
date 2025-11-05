<script lang="ts">
  import type { PatternEngine } from '../../pattern/PatternEngine';
  import type { DynamicParameter } from '../types';

  export let patternEngine: PatternEngine;
  export let selectedSlotId: number | null;

  let parameters: DynamicParameter[] = [];

  // Update parameters when slot selection changes
  $: {
    if (selectedSlotId !== null) {
      const params = patternEngine.getDynamicParameters(selectedSlotId);
      parameters = params || [];
    } else {
      parameters = [];
    }
  }

  // Handle knob assignment change
  function handleKnobAssignment(paramName: string, knobIndex: string) {
    if (selectedSlotId === null) return;

    const knobNum = knobIndex === 'none' ? null : parseInt(knobIndex);
    try {
      patternEngine.assignParameterToKnob(selectedSlotId, paramName, knobNum);
      // Refresh parameters to show updated state
      const params = patternEngine.getDynamicParameters(selectedSlotId);
      parameters = params || [];
    } catch (error) {
      console.error('Failed to assign parameter to knob:', error);
    }
  }

  // Handle range update
  function handleRangeUpdate(paramName: string, minValue: number, maxValue: number) {
    if (selectedSlotId === null) return;

    try {
      patternEngine.updateParameterRange(selectedSlotId, paramName, minValue, maxValue);
      // Refresh parameters
      const params = patternEngine.getDynamicParameters(selectedSlotId);
      parameters = params || [];
    } catch (error) {
      console.error('Failed to update parameter range:', error);
    }
  }

  // Handle manual value update
  function handleValueUpdate(paramName: string, value: number) {
    if (selectedSlotId === null) return;

    try {
      patternEngine.setParameterValue(selectedSlotId, paramName, value);
      // Refresh parameters
      const params = patternEngine.getDynamicParameters(selectedSlotId);
      parameters = params || [];
    } catch (error) {
      console.error('Failed to set parameter value:', error);
    }
  }
</script>

<div class="parameter-mapper">
  <div class="mapper-header">
    <h3>Dynamic Parameters</h3>
    {#if selectedSlotId !== null}
      <span class="slot-indicator">Slot {selectedSlotId}</span>
    {/if}
  </div>

  <div class="mapper-content">
    {#if selectedSlotId === null}
      <div class="empty-state">
        <p>No slot selected</p>
        <span>Press a pattern button to edit its parameters</span>
      </div>
    {:else if parameters.length === 0}
      <div class="empty-state">
        <p>No parameters detected</p>
        <span>Add parameters to your pattern code using $paramName syntax</span>
        <div class="example">
          <strong>Example:</strong><br/>
          <code>note("c4").fast($speed).lpf($cutoff * 1000)</code>
        </div>
      </div>
    {:else}
      <div class="parameters-list">
        {#each parameters as param (param.name)}
          <div class="parameter-item">
            <div class="param-header">
              <div class="param-name-section">
                <span class="param-name">{param.displayName || param.name}</span>
                <code class="param-code">${param.name}</code>
              </div>
              <div class="param-value">
                {param.value.toFixed(3)}
              </div>
            </div>

            <div class="param-controls">
              <!-- Knob Assignment -->
              <div class="control-group">
                <label for={`knob-${param.name}`}>Knob:</label>
                <select
                  id={`knob-${param.name}`}
                  value={param.assignedKnob !== null ? param.assignedKnob.toString() : 'none'}
                  on:change={(e) => handleKnobAssignment(param.name, e.currentTarget.value)}
                >
                  <option value="none">Unassigned</option>
                  {#each Array(8) as _, i}
                    <option value={i.toString()}>Knob {i + 1}</option>
                  {/each}
                </select>
              </div>

              <!-- Range Configuration -->
              <div class="control-group range-group">
                <label>Range:</label>
                <div class="range-inputs">
                  <input
                    type="number"
                    step="0.01"
                    value={param.minValue}
                    placeholder="Min"
                    on:change={(e) => handleRangeUpdate(param.name, parseFloat(e.currentTarget.value), param.maxValue)}
                  />
                  <span class="range-separator">to</span>
                  <input
                    type="number"
                    step="0.01"
                    value={param.maxValue}
                    placeholder="Max"
                    on:change={(e) => handleRangeUpdate(param.name, param.minValue, parseFloat(e.currentTarget.value))}
                  />
                </div>
              </div>

              <!-- Manual Value Control -->
              <div class="control-group value-group">
                <label for={`value-${param.name}`}>Value:</label>
                <input
                  id={`value-${param.name}`}
                  type="range"
                  min={param.minValue}
                  max={param.maxValue}
                  step={(param.maxValue - param.minValue) / 100}
                  value={param.value}
                  on:input={(e) => handleValueUpdate(param.name, parseFloat(e.currentTarget.value))}
                />
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .parameter-mapper {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
    max-height: 500px;
    overflow-y: auto;
  }

  .mapper-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mapper-header h3 {
    margin: 0;
    font-size: 16px;
    color: #00d9ff;
  }

  .slot-indicator {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .mapper-content {
    min-height: 100px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state p {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 500;
  }

  .empty-state span {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .empty-state .example {
    margin-top: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    text-align: left;
  }

  .empty-state .example strong {
    color: #00d9ff;
    font-size: 12px;
  }

  .empty-state .example code {
    display: block;
    margin-top: 8px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    font-size: 11px;
    color: #00ff88;
    word-wrap: break-word;
  }

  .parameters-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .parameter-item {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 12px;
    transition: border-color 0.2s;
  }

  .parameter-item:hover {
    border-color: rgba(0, 217, 255, 0.3);
  }

  .param-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .param-name-section {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .param-name {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
  }

  .param-code {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .param-value {
    font-size: 14px;
    font-weight: 600;
    color: #00ff88;
    font-family: 'Courier New', monospace;
  }

  .param-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-group label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    min-width: 50px;
  }

  .control-group select,
  .control-group input[type="number"] {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 4px 8px;
    color: #fff;
    font-size: 12px;
    flex: 1;
  }

  .control-group select:focus,
  .control-group input:focus {
    outline: none;
    border-color: #00d9ff;
  }

  .range-group {
    flex-wrap: wrap;
  }

  .range-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  .range-inputs input {
    flex: 1;
    min-width: 60px;
  }

  .range-separator {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .value-group {
    margin-top: 4px;
  }

  .value-group input[type="range"] {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  .value-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #00d9ff;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }

  .value-group input[type="range"]::-webkit-slider-thumb:hover {
    background: #00ff88;
  }

  .value-group input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #00d9ff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }

  .value-group input[type="range"]::-moz-range-thumb:hover {
    background: #00ff88;
  }

  /* Scrollbar styling */
  .parameter-mapper::-webkit-scrollbar {
    width: 8px;
  }

  .parameter-mapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .parameter-mapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  .parameter-mapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
