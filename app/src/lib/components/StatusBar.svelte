<script lang="ts">
  export let midiConnected: boolean = false;
  export let strudelReady: boolean = false;
  export let playingCount: number = 0;
  export let onInitialize: () => void = () => {};
  export let onStopAll: () => void = () => {};
  export let initializing: boolean = false;
</script>

<div class="status-bar">
  <div class="status-section">
    <div class="status-item" class:connected={midiConnected}>
      <span class="status-icon">🎹</span>
      <span class="status-text">
        {midiConnected ? 'MIDI Connected' : 'MIDI Disconnected'}
      </span>
    </div>

    <div class="status-item" class:connected={strudelReady}>
      <span class="status-icon">🎵</span>
      <span class="status-text">
        {strudelReady ? 'Strudel Ready' : 'Strudel Not Ready'}
      </span>
    </div>

    <div class="status-item playing">
      <span class="status-icon">▶️</span>
      <span class="status-text">
        Playing: <strong>{playingCount}</strong>
      </span>
    </div>
  </div>

  <div class="control-section">
    {#if !midiConnected || !strudelReady}
      <button
        class="btn btn-primary"
        on:click={onInitialize}
        disabled={initializing}
      >
        {initializing ? '🔄 Initializing...' : '🚀 Initialize'}
      </button>
    {:else}
      <button
        class="btn btn-danger"
        on:click={onStopAll}
        disabled={playingCount === 0}
      >
        🛑 Stop All
      </button>
    {/if}
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: #1a1a1a;
    border-bottom: 2px solid #333;
    flex-wrap: wrap;
    gap: 15px;
  }

  .status-section {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    background: #0a0a0a;
    border-radius: 6px;
    border: 2px solid #333;
    transition: all 0.2s;
  }

  .status-item.connected {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
  }

  .status-item.playing {
    border-color: #2196f3;
    background: rgba(33, 150, 243, 0.1);
  }

  .status-icon {
    font-size: 18px;
  }

  .status-text {
    font-size: 14px;
    color: #888;
  }

  .status-item.connected .status-text {
    color: #4caf50;
  }

  .status-item.playing .status-text {
    color: #2196f3;
  }

  .control-section {
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #4caf50;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #45a049;
    transform: scale(1.05);
  }

  .btn-danger {
    background: #f44336;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #d32f2f;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    .status-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .status-section {
      justify-content: center;
    }

    .control-section {
      width: 100%;
    }

    .btn {
      width: 100%;
    }
  }
</style>
