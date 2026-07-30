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

  function handleInput(e: InputEvent) {
    if (onEdit) {
      onEdit(e);
    }
  }
</script>

<div class="
  flex justify-center items-center bg-[#0A0A0A] p-3 border border-neutral-800 text-[#aae28d] text-xl relative
  {compact ? "flex-col" : "flex-row"}
  {wrapperClass}
">
  {#if compact}
    <span class="text-xs uppercase tracking-wider text-neutral-400">{name}</span>
  {:else}
    <span>{name}: </span>
  {/if}
  <div>
    <span>{pre}</span>
    <input
      type={type}
      bind:value={model.val} step={(1/10**decimals).toString()} min={min} max={max}
      class="text-xl bg-transparent border-0 p-0 text-right {inputClass}"
      oninput={handleInput} readonly={!edit}
    />
    <span>{unit}</span>
  </div>
  {#if showUncertainty}<span class="text-xs text-gray-500">&#177;&#8239;{(uncertainty || 0).toFixed(decimals)}&#8239;{unit}</span>{/if}
</div>