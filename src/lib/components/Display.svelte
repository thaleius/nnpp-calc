<script lang="ts">
  let {
    name,
    value = $bindable(),
    uncertainty,
    edit = $bindable(),
    decimals,
    unit,
    pre,
    wrapperClass,
    inputClass,
    compact,
    showUncertainty = true,
    onEdit = () => {}
  }: {
    name: string,
    value: number,
    uncertainty?: number,
    edit?: boolean,
    decimals: number,
    unit: string,
    pre?: string,
    wrapperClass?: string,
    inputClass?: string,
    compact?: boolean,
    showUncertainty?: boolean,
    onEdit?: () => void
  } = $props();

  // svelte-ignore state_referenced_locally
  let displayValue = $state(value !== undefined && value !== null ? value.toFixed(decimals) : '');
  let isInternalUpdate = false;

  $effect(() => {
    if (value !== undefined && value !== null) {
      if (isInternalUpdate) {
        isInternalUpdate = false;
      } else {
        displayValue = value.toFixed(decimals);
      }
    }
  });

  function sanitizeInput(input: string) {
    let sanitized = input.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    return sanitized;
  }
</script>

<div class="
  flex justify-center items-center bg-[#0A0A0A] p-3 border border-neutral-800 text-[#aae28d] text-xl relative
  [&:hover_.edit]:block {edit ? "[&:hover_.edit]:block" : "[&_.edit]:hidden"}
  {compact ? "flex-col" : "flex-row"}
  {wrapperClass}
">
  <!-- <input class="edit absolute top-0 right-0" type="checkbox" title="Edit" onchange={(e) => readonly = !(e.target as HTMLInputElement).checked} /> -->
  {#if compact}
    <span class="text-xs uppercase tracking-wider text-neutral-400">{name}</span>
  {:else}
    <span>{name}: </span>
  {/if}
  <div>
      <span>{pre}</span><input type="text" class="text-xl bg-transparent border-0 text-right p-0 {inputClass}" value={displayValue} oninput={(e) => {
      const input = sanitizeInput((e.target as HTMLInputElement).value);
      displayValue = input;
      isInternalUpdate = true;
      value = input === '' ? 0 : Number(input);
      onEdit();
    }} readonly={!edit} />
    <span>{unit}</span>
  </div>
  {#if showUncertainty}<span class="text-xs text-gray-500">&#177;&#8239;{(uncertainty || 0).toFixed(decimals)}&#8239;{unit}</span>{/if}
</div>