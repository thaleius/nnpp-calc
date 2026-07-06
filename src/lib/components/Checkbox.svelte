<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";

  let { text, checked = $bindable(), onchange, labelClass }: { text: string, checked?: boolean, onchange?: ChangeEventHandler<HTMLInputElement>, labelClass?: string } = $props();
</script>

<label>
  <label class="flex items-center gap-2 cursor-pointer select-none">
  <input type="checkbox" class="sr-only peer" bind:checked={checked} onchange={onchange} />
  
  <div class="min-w-5 min-h-5 border-2 rounded transition-colors
    border-orange-300 
    peer-checked:bg-orange-300 
    flex items-center justify-center">
    
    <!-- <svg class="w-3 h-3 text-white hidden peer-checked:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg> -->
  </div>
  <span class={labelClass}>{text}</span>
</label>
</label>