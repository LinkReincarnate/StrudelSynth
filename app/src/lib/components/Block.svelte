<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Block, BlockDefinition, BlockInput } from '../blocks/blockTypes';
  import { getBlockDefinition } from '../blocks/blockTypes';

  export let block: Block;
  export let depth: number = 0; // Nesting depth for indentation

  const dispatch = createEventDispatcher();

  $: definition = getBlockDefinition(block.definitionId);
  $: categoryColor = definition?.color || '#999';

  function handleInputChange(inputName: string, value: any) {
    block.inputs[inputName] = value;
    dispatch('change', { block });
  }

  function handleAddChild() {
    dispatch('addChild', { parentBlock: block });
  }

  function handleRemoveChild(childIndex: number) {
    block.children.splice(childIndex, 1);
    dispatch('change', { block });
  }

  function handleDelete() {
    dispatch('delete', { block });
  }

  function renderInput(input: BlockInput, value: any) {
    switch (input.type) {
      case 'dropdown':
        return 'dropdown';
      case 'number':
        return 'number';
      case 'string':
      default:
        return 'text';
    }
  }
</script>

{#if definition}
  <div class="block" style="margin-left: {depth * 20}px; border-left-color: {categoryColor};">
    <div class="block-header" style="background: {categoryColor};">
      <span class="block-name">{definition.name}</span>
      <button class="btn-delete" on:click={handleDelete} title="Delete block">×</button>
    </div>

    <div class="block-body">
      {#if definition.inputs.length > 0}
        <div class="block-inputs">
          {#each definition.inputs as input}
            <div class="input-row">
              <label>{input.name}:</label>
              {#if input.type === 'dropdown' && input.options}
                <select bind:value={block.inputs[input.name]} on:change={() => handleInputChange(input.name, block.inputs[input.name])}>
                  {#each input.options as option}
                    <option value={option}>{option}</option>
                  {/each}
                </select>
              {:else if input.type === 'number'}
                <input
                  type="text"
                  bind:value={block.inputs[input.name]}
                  on:input={() => handleInputChange(input.name, block.inputs[input.name])}
                  placeholder={input.placeholder || 'Number or $param'}
                  step="0.1"
                />
              {:else}
                <input
                  type="text"
                  bind:value={block.inputs[input.name]}
                  on:input={() => handleInputChange(input.name, block.inputs[input.name])}
                  placeholder={input.placeholder}
                />
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if definition.returnsPattern}
        <div class="block-children">
          {#if block.children.length > 0}
            <div class="children-label">Then:</div>
            {#each block.children as child, i}
              <svelte:self
                block={child}
                depth={depth + 1}
                on:change
                on:addChild
                on:delete={() => handleRemoveChild(i)}
              />
            {/each}
          {/if}
          <button class="btn-add-child" on:click={handleAddChild}>
            + Add Effect
          </button>
        </div>
      {/if}

      {#if definition.description}
        <div class="block-description">{definition.description}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .block {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-left-width: 6px;
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .block:hover {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .block-header {
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  .block-name {
    font-weight: 600;
    font-size: 14px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .btn-delete {
    background: rgba(0, 0, 0, 0.3);
    border: none;
    color: #fff;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-delete:hover {
    background: rgba(255, 0, 0, 0.6);
  }

  .block-body {
    padding: 12px;
  }

  .block-inputs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-row label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    min-width: 60px;
    font-weight: 500;
  }

  .input-row input,
  .input-row select {
    flex: 1;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 6px 8px;
    color: #fff;
    font-size: 13px;
    font-family: 'Courier New', monospace;
  }

  .input-row input:focus,
  .input-row select:focus {
    outline: none;
    border-color: #00d9ff;
    background: rgba(0, 217, 255, 0.1);
  }

  .block-children {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .children-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .btn-add-child {
    width: 100%;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
  }

  .btn-add-child:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .block-description {
    margin-top: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
  }
</style>
