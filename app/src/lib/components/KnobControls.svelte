<script lang="ts">
  import type { KnobParameter } from '../parameters';
  import { formatValue } from '../parameters';

  export let parameters: KnobParameter[] = [];
</script>

<div class="knob-controls">
  <h3>Parameter Controls</h3>
  <div class="knobs-grid">
    {#each parameters as param}
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
              stroke="#4caf50"
              stroke-width="8"
              stroke-dasharray="251.2"
              stroke-dashoffset={251.2 - (251.2 * ((param.currentValue - param.minValue) / (param.maxValue - param.minValue)))}
              stroke-linecap="round"
              transform="rotate(-90 50 50)"
            />

            <!-- Center dot -->
            <circle cx="50" cy="50" r="25" fill="#1a1a1a" />

            <!-- Knob index -->
            <text x="50" y="55" text-anchor="middle" font-size="20" fill="#4caf50" font-weight="bold">
              {param.id + 1}
            </text>
          </svg>
        </div>

        <div class="knob-info">
          <div class="knob-name">{param.name}</div>
          <div class="knob-value">{formatValue(param)}</div>
        </div>
      </div>
    {/each}
  </div>
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
    color: #4caf50;
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
  }

  .knob-name {
    font-size: 11px;
    font-weight: 600;
    color: #888;
    margin-bottom: 2px;
  }

  .knob-value {
    font-size: 13px;
    font-weight: bold;
    color: #4caf50;
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

    .knob-name {
      font-size: 9px;
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
