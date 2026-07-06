<script lang="ts">
  import Checkbox from "$lib/components/Checkbox.svelte";
  import Display from "$lib/components/Display.svelte";
  import TurbineUtil from "$lib/components/TurbineUtil.svelte";
  import { FR, FR_power, FRV, power, pressure, T } from "$lib/functions";

  let temp = $state(423.0);
  let pres = $derived(pressure(temp));

  let flowRate1 = $state(0.00);
  let flowRate2 = $state(0.00);

  let flowRateValve1 = $state(0.00);
  let flowRateValve2 = $state(0.00);

  let powerOutput1 = $state(0);
  let powerOutput2 = $state(0);

  let turbsToPrimary = $state(false);
  
  let excess = $state(0);

  let notes: string[] = $state([]);

  const Temp = 1;
  const Excess = 2;
  const FlowRateValve = 3;
  const FlowRate = 4;
  const Output = 5;

  const combinations = [
    [1, 3],   // temp & flow rate valve
    [1, 4],   // temp & flow rate

    [1, 5],   // temp & power output

    [2, 3],   // excess & frv

    [1, 2],   // temp & excess
    [1, 2, 3] // temp & excess & frv
  ];

  let checked: Record<string, boolean> = $state({
    tempEdit: false,
    excEdit: false,
    frEdit: false,
    frvEdit: false,
    outEdit: false
  })

  let lastEdited: 0|1|2 = 0;

  const handleEdit = (v: 1|2) => {
    lastEdited = v;
  }

  $effect(() => {
    let currentNotes: string[] = [];
    if (checked.tempEdit && checked.excEdit) {
      console.log(lastEdited)
      if (lastEdited === 0 || !checked.frvEdit) {
        const fr = excess == 0 ? 0 : FR_power((excess + (turbsToPrimary ? 30000 : 0))/2);
        const frv = FRV(temp, fr);

        flowRate1 = fr;
        flowRate2 = fr;
        flowRateValve1 = frv;
        flowRateValve2 = frv;
        powerOutput1 = power(fr);
        powerOutput2 = power(fr);
      } else {
        let fr1, fr2;
        if (lastEdited === 1) {
          fr1 = FR(temp, flowRateValve1);
          fr2 = FR_power(excess - power(fr1) + (turbsToPrimary ? 30000 : 0));
          fr2 = fr2 < 3.61 ? 0 : fr2;
          const frv2 = FRV(temp, fr2)
          
          flowRateValve2 = frv2;
        } else if (lastEdited === 2) {
          fr2 = FR(temp, flowRateValve2);
          fr1 = FR_power(excess - power(fr2) + (turbsToPrimary ? 30000 : 0));
          fr1 = fr1 < 3.61 ? 0 : fr1;
          const frv1 = FRV(temp, fr1)
          
          flowRateValve1 = frv1;
        }
        
        flowRate1 = fr1!;
        flowRate2 = fr2!;
        powerOutput1 = power(fr1!);
        powerOutput2 = power(fr2!);
      }
    } else if (checked.frvEdit && checked.excEdit) {
      currentNotes.push("This combination yields accurate results only if the resulting temperature is above 423&nbsp;K.");
      let newTemp = T(flowRateValve1+flowRateValve2, FR_power((excess + (turbsToPrimary ? 30000 : 0))) + 3.61);
      newTemp = isFinite(newTemp) ? newTemp : 323;

      let fr1 = FR(newTemp, flowRateValve1);
      let fr2 = FR(newTemp, flowRateValve2);

      if (fr1 <= 3.61 || fr2 <= 3.61) {
        newTemp = T(Math.max(flowRateValve1, flowRateValve2), FR_power(excess + (turbsToPrimary ? 30000 : 0)));
        newTemp = isFinite(newTemp) ? newTemp : 323;
        
        fr1 = FR(newTemp, flowRateValve1);
        fr2 = FR(newTemp, flowRateValve2);
      }

      if (newTemp < 423) {
        currentNotes.push(`<span class="text-red-400">The temperature is currently ${newTemp.toFixed(1)}&nbsp;K.</span>`)
      }

      temp = newTemp;

      flowRate1 = fr1;
      flowRate2 = fr2;
      
      powerOutput1 = power(fr1);
      powerOutput2 = power(fr2);
    } else if (checked.tempEdit && checked.outEdit) {
      const fr1 = FR_power(powerOutput1);
      const fr2 = FR_power(powerOutput2);

      flowRate1 = fr1;
      flowRate2 = fr2;
      
      flowRateValve1 = FRV(temp, fr1);
      flowRateValve2 = FRV(temp, fr2);

      excess = powerOutput1 + powerOutput2 - (turbsToPrimary ? 30000 : 0);
    } else if (checked.frvEdit) {
      const fr1 = FR(temp, flowRateValve1);
      const fr2 = FR(temp, flowRateValve2);
      
      const out1 = power(fr1);
      const out2 = power(fr2);

      flowRate1 = fr1;
      flowRate2 = fr2;
      
      powerOutput1 = out1;
      powerOutput2 = out2;

      excess = out1 + out2 - (turbsToPrimary ? 30000 : 0);
    } else if (checked.excEdit) {
      // do nothing
    } else {
      flowRateValve1 = FRV(temp, flowRate1);
      flowRateValve2 = FRV(temp, flowRate2);
      
      const out1 = power(flowRate1);
      const out2 = power(flowRate2);

      powerOutput1 = out1;
      powerOutput2 = out2;

      excess = out1 + out2 - (turbsToPrimary ? 30000 : 0);
    }

    if (temp > 20000) {
      currentNotes.push("Temperatures higher than 20000 K cannot be achieved.");
    }

    if (temp < 323) {
      currentNotes.push("Temperatures lower than 323 K cannot be achieved.");
    }

    if (temp <= 370) {
      currentNotes.push("Keep in mind that the temperature must be higher than 370 K for flow to occur.");
    }

    if (excess > 50000) {
      currentNotes.push("Excess higher than 50000 kW cannot be achieved.");
    }

    if (flowRateValve1 > 100 || flowRateValve2 > 100) {
      currentNotes.push("At least one of the turbines is operating at more than 100 % capacity.");
    }
    
    notes = currentNotes;
  });

  const KEY_TO_ID: Record<keyof typeof checked, number> = {
    tempEdit: Temp,
    excEdit: Excess,
    frEdit: FlowRate,
    frvEdit: FlowRateValve,
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

<div class="flex flex-row gap-x-4 justify-center items-center w-screen h-screen">
  <div class="flex flex-col gap-y-4 w-110 bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg monospace p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
    <div class="flex flex-col gap-y-1">
      <Display name="Temperature" bind:value={temp} bind:edit={checked.tempEdit} decimals={1} unit="K" inputClass="w-22" compact />
      <Display name="Pressure" bind:value={pres} decimals={1} unit="kPa" inputClass="w-24" compact />
      <Display name="Excess" bind:value={excess} bind:edit={checked.excEdit} decimals={1} unit="kW" inputClass="w-26" compact />
    </div>
    <div class="flex gap-x-2 [&>div]:w-1/2">
      <div>
        <div class="title text-center">Turbine 1</div>
        <TurbineUtil onEdit={() => handleEdit(1)} bind:fr={flowRate1} bind:frEdit={checked.frEdit} bind:frv={flowRateValve1} bind:frvEdit={checked.frvEdit} bind:output={powerOutput1} bind:outEdit={checked.outEdit} />
      </div>
      <div>
        <div class="title text-center">Turbine 2</div>
        <TurbineUtil onEdit={() => handleEdit(2)} bind:fr={flowRate2} bind:frEdit={checked.frEdit} bind:frv={flowRateValve2} bind:frvEdit={checked.frvEdit} bind:output={powerOutput2} bind:outEdit={checked.outEdit} />
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-y-4 w-64">
    <div class="flex flex-col bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg monospace p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
      <div class="flex flex-col gap-y-2">
        <Checkbox text="Turbines powering Primary grid?" labelClass="" bind:checked={turbsToPrimary} />
      </div>
    </div>

    <div class="flex flex-col bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg monospace p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
      <div class="title">Edit</div>
      <div class="flex flex-col gap-y-2">
        <Checkbox text="Temperature" bind:checked={checked.tempEdit} onchange={(e) => updateSelection('tempEdit', e.currentTarget.checked)} />
        <Checkbox text="Excess" bind:checked={checked.excEdit} onchange={(e) => updateSelection('excEdit', e.currentTarget.checked)} />
        <Checkbox text="Flow Rate Valve" bind:checked={checked.frvEdit} onchange={(e) => updateSelection('frvEdit', e.currentTarget.checked)} />
        <Checkbox text="Flow Rate" bind:checked={checked.frEdit} onchange={(e) => updateSelection('frEdit', e.currentTarget.checked)} />
        <Checkbox text="Power Output" bind:checked={checked.outEdit} onchange={(e) => updateSelection('outEdit', e.currentTarget.checked)} />
      </div>
    </div>

    {#if notes.length > 0}
      <div class="flex flex-col bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg monospace p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
        <div class="title">Notes</div>
        <div class="flex flex-col gap-y-1">
          {#each notes as note}
            <span>{@html note}</span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss" scoped>
  @reference "tailwindcss";
  .title {
    @apply text-xl;
    @apply font-bold;
    @apply mb-2;
    @apply text-orange-300;
    @apply uppercase;
  }
</style>