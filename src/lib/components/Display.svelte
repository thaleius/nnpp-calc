<script lang="ts">
  type inputEvent = Event & { currentTarget: EventTarget & HTMLInputElement };

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
    onEdit?: (e: inputEvent) => void
  } = $props();

  // svelte-ignore state_referenced_locally
  let displayValue = $state(value !== undefined && value !== null ? type === 'number' ? (value as number).toFixed(decimals) : value : '');

  $effect(() => {
    if (type === 'number') {
      value = Math.min(max, Math.max(min, value as number));
    }
  })
</script>

<div class="
  flex justify-center items-center bg-[#0A0A0A] p-3 border border-neutral-800 text-[#aae28d] text-xl relative
  [&:hover_.edit]:block {edit ? "[&:hover_.edit]:block" : "[&_.edit]:hidden"}
  {compact ? "flex-col" : "flex-row"}
  {wrapperClass}
">
  {#if compact}
    <span class="text-xs uppercase tracking-wider text-neutral-400">{name}</span>
  {:else}
    <span>{name}: </span>
  {/if}
  <div>
    <span>{pre}</span><input type={type} step={(1/10**decimals).toString()} min={min} max={max} class="text-xl bg-transparent border-0 p-0 text-right {inputClass}" value={displayValue} oninput={onEdit} readonly={!edit} />
    <span>{unit}</span>
  </div>
  {#if showUncertainty}<span class="text-xs text-gray-500">&#177;&#8239;{(uncertainty || 0).toFixed(decimals)}&#8239;{unit}</span>{/if}
</div>