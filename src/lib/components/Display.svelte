<script lang="ts">
  type InputEvent = Event & { currentTarget: EventTarget & HTMLInputElement };

  let {
    name,
    value = $bindable(),
    uncertainty,
    edit = $bindable(),
    decimals,
    unit,
    pre,
    min = -Infinity,
    max = Infinity,
    type = 'number',
    wrapperClass,
    inputClass,
    compact,
    showUncertainty = true,
    onEdit = () => {}
  }: {
    name: string,
    value: number | string,
    uncertainty?: number,
    edit?: boolean,
    decimals: number,
    unit: string,
    pre?: string,
    min?: number,
    max?: number,
    type?: 'number' | 'text',
    wrapperClass?: string,
    inputClass?: string,
    compact?: boolean,
    showUncertainty?: boolean,
    onEdit?: (e: InputEvent) => void
  } = $props();

  const model = {
    get val() {
      if (type === 'number' && typeof value === 'number' && typeof decimals === 'number') {
        return Number(value.toFixed(decimals));
      }
      return value;
    },
    set val(newValue) {
      if (type === 'number' && typeof newValue === 'number') {
        const clamped = Math.min(max, Math.max(min, newValue));
        value = Number(clamped.toFixed(decimals));
      } else {
        value = newValue;
      }
    }
  };

  let inputEl: HTMLInputElement;

  function handleInput(e: InputEvent) {
    if (onEdit) {
      onEdit(e);
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  onclick={() => { if (edit) inputEl?.focus(); }}
  class="
  flex justify-center items-center bg-[#0A0A0A] p-3 border text-[#aae28d] text-xl relative transition-colors duration-200
  {edit ? "border-orange-300 bg-orange-300/5 cursor-text" : "border-neutral-800"}
  {compact ? "flex-col" : "flex-row"}
  {wrapperClass}
">
  {#if compact}
    <span class="text-xs uppercase tracking-wider text-center transition-colors duration-200 {edit ? "text-orange-300 font-bold" : "text-neutral-400"}">{name}</span>
  {:else}
    <span class="transition-colors duration-200 {edit ? "text-orange-300 font-bold" : ""}">{name}: </span>
  {/if}
  <div>
    <span>{pre}</span>
    <input
      bind:this={inputEl}
      type={type}
      bind:value={model.val} step={(1/10**decimals).toString()} min={min} max={max}
      class="text-xl bg-transparent border-0 p-0 text-right {edit ? "cursor-text" : "cursor-default pointer-events-none"} {inputClass}"
      oninput={handleInput} readonly={!edit}
    />
    <span>{unit}</span>
  </div>
  {#if showUncertainty}<span class="text-xs text-gray-500">&#177;&#8239;{(uncertainty || 0).toFixed(decimals)}&#8239;{unit}</span>{/if}
</div>