<script lang="ts">
  import Display from "./Display.svelte";

  let {
    fr = $bindable(),
    frv = $bindable(),
    rpm = $bindable(),
    output = $bindable(),
    vibration,
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
    rpm: {
      value: number,
      uncertainty: number
    },
    output: {
      value: number,
      uncertainty: number
    },
    vibration: {
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
  <Display onEdit={onEdit} name="RPM (unsynced)" bind:value={rpm.value} uncertainty={rpm.uncertainty} decimals={0} unit="" inputClass="w-15" compact={true} />
  <Display onEdit={onEdit} name="Power Output" bind:value={output.value} uncertainty={output.uncertainty} bind:edit={outEdit} decimals={1} unit="kW" inputClass="w-24" compact={true} />
  <Display name="Vibration" value={vibration.value} uncertainty={vibration.uncertainty} decimals={0} unit="µm" inputClass="w-9" compact={true} />
</div>