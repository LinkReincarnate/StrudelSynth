<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PatternEngine } from '../../pattern/PatternEngine';
  import type { DynamicParameter } from '../types';
  import { STRUDEL_PARAMETERS, getParameterOptions } from '../strudelParameters';

  export let patternEngine: PatternEngine | null = null;
  export let selectedSlotId: number | null = null;
  export let refreshCounter: number = 0; // Used to force refresh when parameters change

  const dispatch = createEventDispatcher();

  // All available Strudel parameters (static list)
  const allParameters = getParameterOptions();

  // Currently assigned parameters from the slot
  let knobAssignments: (DynamicParameter | null)[] = Array(8).fill(null);

  // Update knob assignments when slot selection changes or refresh is triggered
  $: {
    // Include refreshCounter in the reactive statement to force re-run
    const _ = refreshCounter;

    if (patternEngine && selectedSlotId !== null) {
      const params = patternEngine.getDynamicParameters(selectedSlotId);
      const currentParams = params || [];

      // Build knob assignments array (index = knob number, value = assigned parameter)
      knobAssignments = Array(8).fill(null);
      for (const param of currentParams) {
        if (param.assignedKnob !== null && param.assignedKnob >= 0 && param.assignedKnob < 8) {
          knobAssignments[param.assignedKnob] = param;
        }
      }
    } else {
      knobAssignments = Array(8).fill(null);
    }
  }

  // Handle parameter assignment to knob
  function handleAssignment(knobIndex: number, paramName: string) {
    if (!patternEngine || selectedSlotId === null) return;

    if (paramName === 'none') {
      // Unassign - find which parameter was assigned to this knob and unassign it
      const assignedParam = knobAssignments[knobIndex];
      if (assignedParam) {
        patternEngine.assignParameterToKnob(selectedSlotId, assignedParam.name, null);
      }
    } else {
      // Add parameter to slot (will automatically add to code if needed) and assign to knob
      try {
        patternEngine.addParameterToSlot(selectedSlotId, paramName, knobIndex);
      } catch (error) {
        console.error('Failed to add parameter:', error);
      }
    }

    // Notify parent to refresh
    dispatch('refresh');
  }

  // Get normalized value (0-1) for knob visual
  function getNormalizedValue(param: DynamicParameter | null): number {
    if (!param) return 0;
    const range = param.maxValue - param.minValue;
    if (range === 0) return 0;
    return (param.value - param.minValue) / range;
  }

  // Format value for display
  function formatValue(param: DynamicParameter | null): string {
    if (!param) return '--';
    return param.value.toFixed(2);
  }
</script>

<div class="knob-controls">
  <h3>Parameter Controls</h3>
  {#if selectedSlotId === null}
    <div class="empty-state">
      <p>No pattern selected</p>
      <span>Select a pattern to assign parameters to knobs</span>
    </div>
  {:else}
    <div class="knobs-grid">
      {#each Array(8) as _, knobIndex}
        {@const assignedParam = knobAssignments[knobIndex]}
        <div class="knob-item">
          <div class="knob-visual">
            <svg viewBox="0 0 100 100" class="knob-svg">
              <!-- Background circle -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#333" stroke-width="8" />

              <!-- Value arc -->
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={assignedParam ? "#00d9ff" : "#444"}
                stroke-width="8"
                stroke-dasharray="251.2"
                stroke-dashoffset={251.2 - (251.2 * getNormalizedValue(assignedParam))}
                stroke-linecap="round"
                transform="rotate(-90 50 50)"
              />

              <!-- Center dot -->
              <circle cx="50" cy="50" r="25" fill="#1a1a1a" />

              <!-- Knob index -->
              <text x="50" y="55" text-anchor="middle" font-size="20" fill={assignedParam ? "#00d9ff" : "#666"} font-weight="bold">
                {knobIndex + 1}
              </text>
            </svg>
          </div>

          <div class="knob-info">
            <!-- Parameter selection dropdown -->
            <select
              class="param-select"
              value={assignedParam?.name || 'none'}
              on:change={(e) => handleAssignment(knobIndex, e.currentTarget.value)}
            >
              <option value="none">Unassigned</option>
              {#each allParameters as param}
                <option value={param.value}>{param.label}</option>
              {/each}
            </select>

            <!-- Value display -->
            <div class="knob-value">{formatValue(assignedParam)}</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .knob-controls {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #333;
  }

  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #00d9ff;
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
    margin-top: 12px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state code {
    background: rgba(0, 0, 0, 0.4);
    padding: 4px 8px;
    border-radius: 3px;
    color: #00ff88;
  }

  .knobs-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
  }

  .knob-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .knob-visual {
    width: 80px;
    height: 80px;
  }

  .knob-svg {
    width: 100%;
    height: 100%;
  }

  .knob-info {
    text-align: center;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .param-select {
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 4px 6px;
    color: #000;
    font-size: 11px;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.2s;
  }

  .param-select option {
    color: #000;
    background: #fff;
  }

  .param-select:hover {
    border-color: #00d9ff;
  }

  .param-select:focus {
    outline: none;
    border-color: #00d9ff;
    background: rgba(0, 217, 255, 0.1);
  }

  .knob-value {
    font-size: 13px;
    font-weight: bold;
    color: #00d9ff;
    font-family: 'Courier New', monospace;
  }

  @media (max-width: 1024px) {
    .knobs-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 768px) {
    .knobs-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .knob-visual {
      width: 60px;
      height: 60px;
    }

    .param-select {
      font-size: 9px;
      padding: 3px 4px;
    }

    .knob-value {
      font-size: 11px;
    }
  }

  @media (max-width: 480px) {
    .knobs-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
