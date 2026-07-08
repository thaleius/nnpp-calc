<script lang="ts">
  import Display from "./Display.svelte";

  let {
    fr = $bindable(),
    frv = $bindable(),
    output = $bindable(),
    frEdit = $bindable(),
    frvEdit = $bindable(),
    outEdit = $bindable(),
    onEdit
  }: {
    fr: {
      value: number,
      uncertainty: number
    },
    frv: {
      value: number,
      uncertainty: number
    },
    output: {
      value: number,
      uncertainty: number
    },
    frEdit: boolean,
    frvEdit: boolean,
    outEdit: boolean,
    onEdit?: () => void
  } = $props();
</script>

<div class="flex flex-col gap-y-1">
  <Display onEdit={onEdit} name="Flow Rate Valve" bind:value={frv.value} uncertainty={frv.uncertainty} bind:edit={frvEdit} decimals={1} unit="%" inputClass="w-16" compact={true} />
  <Display onEdit={onEdit} name="Flow Rate" bind:value={fr.value} uncertainty={fr.uncertainty} bind:edit={frEdit} decimals={2} unit="m³/s" inputClass="w-16" compact={true} />
  <Display onEdit={onEdit} name="Power Output" bind:value={output.value} uncertainty={output.uncertainty} bind:edit={outEdit} decimals={1} unit="kW" inputClass="w-26" compact={true} />
</div>