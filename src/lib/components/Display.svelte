<script lang="ts">
  let { name, value = $bindable(), edit = $bindable(), decimals, unit, wrapperClass, inputClass, compact }: { name: string, value: number, edit: boolean, decimals: number, unit: string, wrapperClass?: string, inputClass?: string, compact?: boolean } = $props();
</script>

<div class="
  flex justify-center items-center bg-[#0A0A0A] p-3 border border-[#3b3b3b] text-[#aae28d] text-xl relative
  [&:hover_.edit]:block {edit ? "[&:hover_.edit]:block" : "[&_.edit]:hidden"}
  {compact ? "flex-col" : "flex-row"}
  {wrapperClass}
">
  <!-- <input class="edit absolute top-0 right-0" type="checkbox" title="Edit" onchange={(e) => readonly = !(e.target as HTMLInputElement).checked} /> -->
  {#if compact}
    <span class="text-base text-neutral-400 font-bold">{name}</span>
  {:else}
    <span>{name}: </span>
  {/if}
  <div>
    <input type="text" class="text-xl bg-transparent border-0 text-right p-0 {inputClass}" value={value.toFixed(decimals)} oninput={(e) => {
      value = Number((e.target as HTMLInputElement).value)
    }} readonly={!edit} />
    <span>{unit}</span>
  </div>
</div>