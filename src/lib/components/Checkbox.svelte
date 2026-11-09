<script lang="ts">
  import type { ChangeEventHandler } from "svelte/elements";

  let {
    text,
    checked = $bindable(),
    highlight = false,
    dimmed = false,
    onchange,
    labelClass
  }: {
    text: string,
    checked?: boolean,
    highlight?: boolean,
    dimmed?: boolean,
    onchange?: ChangeEventHandler<HTMLInputElement>,
    labelClass?: string
  } = $props();
</script>

<label class="relative flex items-center gap-2 cursor-pointer select-none transition-all duration-200 {highlight ? 'text-orange-300' : dimmed ? 'opacity-40 hover:opacity-75' : ''}">
  <input type="checkbox" class="sr-only peer" bind:checked={checked} onchange={onchange} />
  
  <div class="min-w-5 min-h-5 border-2 rounded transition-all duration-200
    {highlight ? 'border-orange-300 bg-orange-300/20 shadow-[0_0_8px_rgba(253,186,116,0.4)]' : dimmed ? 'border-neutral-500' : 'border-orange-300'}
    peer-checked:bg-orange-300 peer-checked:border-orange-300
    flex items-center justify-center">
  </div>
  <span class="{checked ? 'text-orange-300 font-bold' : ''} {labelClass}">{text}</span>
</label>