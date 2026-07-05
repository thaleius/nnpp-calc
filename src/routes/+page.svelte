<script lang="ts">
  import Checkbox from "$lib/components/Checkbox.svelte";
  import Display from "$lib/components/Display.svelte";
  import TurbineUtil from "$lib/components/TurbineUtil.svelte";
  import { FR, FRV, output } from "$lib/functions";

  let temp = $state(323.0);

  let flowRate1 = $state(0.00);
  let flowRate2 = $state(0.00);

  let flowRateValve1 = $state(0.00);
  let flowRateValve2 = $state(0.00);

  let powerOutput1 = $derived(output(flowRate1));
  let powerOutput2 = $derived(output(flowRate2));
  
  let excess = $derived(powerOutput1 + powerOutput2);

  const Temp = 1;
  const Excess = 2;
  const FlowRate = 3;
  const FowRateValve = 4;
  const Output = 5;

  const combinations = [
    [1, 3],
    [1, 4],
  ];

  let checked: Record<string, boolean> = $state({
    tempEdit: false,
    excEdit: false,
    frEdit: false,
    frvEdit: false,
    outEdit: false
  })

  $effect(() => {
    if (checked.frvEdit) {
      flowRate1 = FR(temp, flowRateValve1);
      flowRate2 = FR(temp, flowRateValve2);
    } else {
      flowRateValve1 = FRV(temp, flowRate1);
      flowRateValve2 = FRV(temp, flowRate2);
    }
  });

  const KEY_TO_ID: Record<keyof typeof checked, number> = {
    tempEdit: Temp,
    excEdit: Excess,
    frEdit: FlowRate,
    frvEdit: FowRateValve,
    outEdit: Output
  };

  function updateSelection(changedKey: keyof typeof checked, newValue: boolean) {
    checked[changedKey] = newValue;

    if (!newValue) return; 

    const activeIds = Object.entries(checked)
      .filter(([, isChecked]) => isChecked)
      .map(([key]) => KEY_TO_ID[key as keyof typeof checked]);

    const isValidSubset = combinations.some(combo =>
      activeIds.every(id => combo.includes(id))
    );

    if (!isValidSubset) {
      const changedId = KEY_TO_ID[changedKey];
      const matchingCombos = combinations.filter(combo => combo.includes(changedId));

      if (matchingCombos.length === 0) {
        (Object.keys(checked) as Array<keyof typeof checked>).forEach(key => {
          if (key !== changedKey) checked[key] = false;
        });
        return;
      }

      let bestCombo = matchingCombos[0];
      let maxOverlap = -1;

      for (const combo of matchingCombos) {
        const overlap = activeIds.filter(id => combo.includes(id)).length;
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestCombo = combo;
        }
      }

      (Object.keys(checked) as Array<keyof typeof checked>).forEach(key => {
        const id = KEY_TO_ID[key];
        if (!bestCombo.includes(id)) {
          checked[key] = false;
        }
      });
    }
  }
</script>

<div class="flex flex-row gap-5 justify-center items-center w-screen h-screen">
  <div class="flex flex-col gap-y-4 w-110 bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg monospace p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
    <div class="flex flex-col gap-y-1">
      <Display name="Temperature" bind:value={temp} bind:edit={checked.tempEdit} decimals={1} unit="K" inputClass="w-24" compact />
      <Display name="Excess" bind:value={excess} bind:edit={checked.excEdit} decimals={1} unit="kW" inputClass="w-26" compact />
    </div>
    <div class="flex gap-x-2 [&>div]:w-1/2">
      <div>
        <div class="title text-center">Turbine 1</div>
        <TurbineUtil bind:fr={flowRate1} bind:frEdit={checked.frEdit} bind:frv={flowRateValve1} bind:frvEdit={checked.frvEdit} bind:output={powerOutput1} bind:outEdit={checked.outEdit} />
      </div>
      <div>
        <div class="title text-center">Turbine 2</div>
        <TurbineUtil bind:fr={flowRate2} bind:frEdit={checked.frEdit} bind:frv={flowRateValve2} bind:frvEdit={checked.frvEdit} bind:output={powerOutput2} bind:outEdit={checked.outEdit} />
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-y-4 bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg monospace p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
    <div class="title">Edit</div>
    <div class="flex flex-col gap-y-2">
      <Checkbox text="Temperature" bind:checked={checked.tempEdit} onchange={(e) => updateSelection('tempEdit', e.currentTarget.checked)} />
      <!-- <Checkbox text="Excess" bind:checked={checked.excEdit} onchange={(e) => updateSelection('excEdit', e.currentTarget.checked)} /> -->
      <Checkbox text="Flow Rate" bind:checked={checked.frEdit} onchange={(e) => updateSelection('frEdit', e.currentTarget.checked)} />
      <Checkbox text="Flow Rate Valve" bind:checked={checked.frvEdit} onchange={(e) => updateSelection('frvEdit', e.currentTarget.checked)} />
      <!-- <Checkbox text="Power Output" bind:checked={checked.outEdit} onchange={(e) => updateSelection('outEdit', e.currentTarget.checked)} /> -->
    </div>
  </div>
</div>

<style lang="css" scoped>
  @reference "tailwindcss";
  .title {
    @apply text-xl;
    @apply font-bold;
    @apply mb-1;
    @apply text-orange-300;
    @apply uppercase;
  }
</style>