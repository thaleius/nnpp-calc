<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";

  let { text, checked = $bindable(), onchange, labelClass }: { text: string, checked?: boolean, onchange?: ChangeEventHandler<HTMLInputElement>, labelClass?: string } = $props();
</script>

<label class="relative flex items-center gap-2 cursor-pointer select-none">
  <input type="checkbox" class="sr-only peer" bind:checked={checked} onchange={onchange} />
  
  <div class="min-w-5 min-h-5 border-2 rounded transition-colors
    border-orange-300 
    peer-checked:bg-orange-300 
    flex items-center justify-center">
  </div>
  <span class={labelClass}>{text}</span>
</label>