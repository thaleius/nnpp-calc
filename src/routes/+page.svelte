<script lang="ts">
  import LZString from 'lz-string';
  import Checkbox from "$lib/components/Checkbox.svelte";
  import Display from "$lib/components/Display.svelte";
  import TurbineUtil from "$lib/components/TurbineUtil.svelte";
  import { dExc, dFR, dFRV, dT, excess_unc, FR, FR_power, FR_power_unc, FR_unc, FRV, FRV_unc, fw_flow, fw_flow_unc, fw_flow_util, fw_flow_util_unc, fw_util, fw_util_unc, power, power_unc, pressure, pressure_unc, T, T_fwFlow, T_fwFlow_unc, T_unc } from "$lib/functions";
  import { page } from '$app/state';
  import { Clipboard } from "flowbite-svelte";
  import { goto } from '$app/navigation';

  let temp = $state({
    value: 423,
    uncertainty: 0
  });
  let pres = $derived(pressure(temp.value));
  let pres_unc = $state(0);

  let flowRate1 = $state({
    value: 0,
    uncertainty: 0
  });
  let flowRate2 = $state({
    value: 0,
    uncertainty: 0
  });

  let flowRateValve1 = $state({
    value: 0,
    uncertainty: 0
  });
  let flowRateValve2 = $state({
    value: 0,
    uncertainty: 0
  });

  let powerOutput1 = $state({
    value: 0,
    uncertainty: 0
  });
  let powerOutput2 = $state({
    value: 0,
    uncertainty: 0
  });

  let turbsToPrimary = $state(false);
  let singleFWpump = $state(false);
  
  let excess = $state({
    value: 0,
    uncertainty: 0
  });

  let feedwater_flow = $state({
    value: fw_flow(temp.value),
    uncertainty: fw_flow_unc(temp.value, temp.uncertainty)
  })
  let feedwater_util = $state({
    value: fw_util(feedwater_flow.value),
    uncertainty: fw_util_unc(feedwater_flow.value, feedwater_flow.uncertainty)
  })

  let notes: string[] = $state([]);

  const Temp = 1;
  const Excess = 2;
  const FlowRateValve = 3;
  const FlowRate = 4;
  const Output = 5;
  const FWFlow = 6;
  const FWUtil = 7;

  const combinations = [
    [1, 3],    // temp & flow rate valve
    [1, 4],    // temp & flow rate

    [1, 5],    // temp & power output

    [2, 3],    // excess & frv

    [1, 2],    // temp & excess
    [1, 2, 3], // temp & excess & frv
  ];

  let checked: Record<string, boolean> = $state({
    tempEdit: false,
    excEdit: false,
    frEdit: false,
    frvEdit: false,
    outEdit: false,
    fwFlowEdit: false,
    fwUtilEdit: false
  });

  let lastEdited: 0|1|2 = 0;

  const handleEdit = (v: 1|2) => {
    lastEdited = v;
  }

  $effect(() => {
    let currentNotes: string[] = [];
    if (checked.tempEdit) {
      temp.uncertainty = 0;
      pres_unc = pressure_unc(temp.value, 0);
    } else {
      pres_unc = pressure_unc(temp.value, temp.uncertainty);
    }
    if (checked.fwFlowEdit && !checked.tempEdit) {
      temp.value = T_fwFlow(feedwater_flow.value);
      temp.uncertainty = T_fwFlow_unc(feedwater_flow.value);

      feedwater_util.value = fw_util(feedwater_flow.value, singleFWpump);
      feedwater_util.uncertainty = fw_util_unc(feedwater_flow.value, feedwater_flow.uncertainty, singleFWpump);
    } else if (checked.fwUtilEdit && !checked.tempEdit) {
      const
        fwFlow = fw_flow_util(feedwater_util.value, singleFWpump),
        fwFlow_unc = fw_flow_util_unc(feedwater_util.value, feedwater_util.uncertainty, singleFWpump);

      feedwater_flow.value = fwFlow;
      feedwater_flow.uncertainty = fwFlow_unc;

      temp.value = T_fwFlow(fwFlow);
      temp.uncertainty = T_fwFlow_unc(fwFlow);
    } else {
      feedwater_flow.value = fw_flow(temp.value);
      feedwater_flow.uncertainty = fw_flow_unc(temp.value, temp.uncertainty);

      feedwater_util.value = fw_util(feedwater_flow.value, singleFWpump);
      feedwater_util.uncertainty = fw_util_unc(feedwater_flow.value, feedwater_flow.uncertainty, singleFWpump);
    }
    if (checked.tempEdit && checked.excEdit) {
      excess.uncertainty = 0;

      if (lastEdited === 0 || !checked.frvEdit) {
        const fr = excess.value == 0 ? 0 : FR_power((excess.value + (turbsToPrimary ? 30000 : 0))/2);
        const fr_unc = fr == 0 ? 0 : FR_power_unc(0);
        const frv = FRV(temp.value, fr);
        const frv_unc = FRV_unc(temp.value, dT, fr, fr_unc);

        flowRate1.value = fr;
        flowRate2.value = fr;
        flowRate1.uncertainty = fr_unc;
        flowRate2.uncertainty = fr_unc;
        flowRateValve1.value = frv;
        flowRateValve2.value = frv;
        flowRateValve1.uncertainty = frv_unc;
        flowRateValve2.uncertainty = frv_unc;
        powerOutput1.value = power(fr);
        powerOutput2.value = power(fr);
        powerOutput1.uncertainty = power_unc(fr_unc);
        powerOutput2.uncertainty = power_unc(fr_unc);
      } else {
        let fr1, fr2;
        let fr1_unc = 0, fr2_unc = 0;
        if (lastEdited === 1) {
          fr1 = FR(temp.value, flowRateValve1.value);
          fr1_unc = FR_unc(temp.value, dT, flowRateValve1.value, dFRV);
          fr2 = FR_power(excess.value - power(fr1) + (turbsToPrimary ? 30000 : 0));
          fr2 = fr2 < 3.61 ? 0 : fr2;
          fr2_unc = fr2 == 0 ? 0 : FR_power_unc(dExc);

          const frv2 = FRV(temp.value, fr2);
          flowRateValve2.value = frv2;
          
          const frv2_unc = FRV_unc(temp.value, dT, fr2, fr2_unc);
          flowRateValve2.uncertainty = frv2_unc;
        } else if (lastEdited === 2) {
          fr2 = FR(temp.value, flowRateValve2.value);
          fr2_unc = FR_unc(temp.value, dT, flowRateValve2.value, dFRV);
          fr1 = FR_power(excess.value - power(fr2) + (turbsToPrimary ? 30000 : 0));
          fr1 = fr1 < 3.61 ? 0 : fr1;
          fr1_unc = fr1 == 0 ? 0 : FR_power_unc(dExc);

          const frv1 = FRV(temp.value, fr1)
          flowRateValve1.value = frv1;
          
          const frv1_unc = FRV_unc(temp.value, dT, fr1, fr1_unc);
          flowRateValve1.uncertainty = frv1_unc;
        }
        
        flowRate1.value = fr1!;
        flowRate2.value = fr2!;
        flowRate1.uncertainty = fr1_unc;
        flowRate2.uncertainty = fr2_unc;

        const po1 = power(fr1!);
        const po2 = power(fr2!);
        powerOutput1.value = po1;
        powerOutput2.value = po2;

        powerOutput1.uncertainty = power_unc(fr1_unc);
        powerOutput2.uncertainty = power_unc(fr2_unc);
      }
    } else {
      if (checked.frvEdit && checked.excEdit) {
        flowRateValve1.uncertainty = 0;
        flowRateValve2.uncertainty = 0;
        excess.uncertainty = 0;

        let fr = FR_power((excess.value + (turbsToPrimary ? 30000 : 0))) + 3.61;
        let frv1 = flowRateValve1.value;
        let frv2 = flowRateValve2.value;
        let frv = frv1+frv2;
        let newTemp = T(frv, fr);
        newTemp = isFinite(newTemp) ? newTemp : 323;
        
        let fr1 = FR(newTemp, frv1);
        let fr2 = FR(newTemp, frv2);
        
        if (fr1 <= 3.61 || fr2 <= 3.61) {
          fr = FR_power(excess.value + (turbsToPrimary ? 30000 : 0));
          frv = Math.max(frv1, frv2);
          newTemp = T(frv, fr);
          newTemp = isFinite(newTemp) ? newTemp : 323;
          
          fr1 = FR(newTemp, frv1);
          fr2 = FR(newTemp, frv2);
        }
        
        let temp_unc = T_unc(frv, dFRV, fr, dFR);
        let po1 = power(fr1);
        let po2 = power(fr2);

        currentNotes.push("This combination yields accurate results only if the resulting temperature is above 423&nbsp;K.");
        if (newTemp < 423) {
          currentNotes.push(`<span class="text-red-400">The temperature is currently ${newTemp.toFixed(1)}&nbsp;K.</span>`)
        }
        
        temp.value = newTemp;
        temp.uncertainty = temp_unc;
        pres_unc = pressure_unc(newTemp, temp_unc);

        flowRate1.value = fr1;
        flowRate2.value = fr2;

        const
          fr1_unc = fr1 == 0 ? 0 : FR_unc(newTemp, temp_unc, frv1, dFRV),
          fr2_unc = fr2 == 0 ? 0 : FR_unc(newTemp, temp_unc, frv2, dFRV);

        flowRate1.uncertainty = fr1_unc;
        flowRate2.uncertainty = fr2_unc;
        
        powerOutput1.value = po1;
        powerOutput2.value = po2;
        powerOutput1.uncertainty = po1 == 0 ? 0 : power_unc(fr1_unc);
        powerOutput2.uncertainty = po2 == 0 ? 0 : power_unc(fr2_unc);
      } else if (checked.tempEdit && checked.outEdit) {
        powerOutput1.uncertainty = 0;
        powerOutput2.uncertainty = 0;

        const po1 = powerOutput1.value;
        const po2 = powerOutput2.value;

        const fr1 = FR_power(po1);
        const fr2 = FR_power(po2);
        flowRate1.value = fr1;
        flowRate2.value = fr2;

        const fr1_unc = FR_power_unc(po1);
        const fr2_unc = FR_power_unc(po2);
        flowRate1.uncertainty = fr1_unc;
        flowRate2.uncertainty = fr2_unc;
        
        flowRateValve1.value = FRV(temp.value, fr1);
        flowRateValve2.value = FRV(temp.value, fr2);
        flowRateValve1.uncertainty = FRV_unc(temp.value, dT, fr1, fr1_unc);
        flowRateValve2.uncertainty = FRV_unc(temp.value, dT, fr2, fr2_unc);

        excess.value = po1 + po2 - (turbsToPrimary ? 30000 : 0);
        excess.uncertainty = 0;
      } else if (checked.frvEdit) {
        flowRateValve1.uncertainty = 0;
        flowRateValve2.uncertainty = 0;

        const temp_unc = checked.tempEdit ? 0 : temp.uncertainty;
        const fr1 = FR(temp.value, flowRateValve1.value);
        const fr2 = FR(temp.value, flowRateValve2.value);
        const fr1_unc = FR_unc(temp.value, temp_unc, flowRateValve1.value, dFRV);
        const fr2_unc = FR_unc(temp.value, temp_unc, flowRateValve2.value, dFRV);
        
        const out1 = power(fr1);
        const out2 = power(fr2);

        flowRate1.value = fr1;
        flowRate2.value = fr2;
        flowRate1.uncertainty = fr1_unc;
        flowRate2.uncertainty = fr2_unc;
        
        powerOutput1.value = out1;
        powerOutput2.value = out2;
        powerOutput1.uncertainty = power_unc(fr1_unc);
        powerOutput2.uncertainty = power_unc(fr2_unc);

        pres_unc = pressure_unc(temp.value, temp_unc);

        excess.value = out1 + out2 - (turbsToPrimary ? 30000 : 0);
        excess.uncertainty = excess_unc(fr1_unc, fr2_unc);
      } else if (checked.excEdit) {
        // do nothing
      } else {
        flowRate1.uncertainty = 0;
        flowRate2.uncertainty = 0;
        powerOutput1.uncertainty = 0;
        powerOutput2.uncertainty = 0;
        excess.uncertainty = 0;

        flowRateValve1.value = FRV(temp.value, flowRate1.value);
        flowRateValve2.value = FRV(temp.value, flowRate2.value);
        flowRateValve1.uncertainty = FRV_unc(temp.value, temp.uncertainty, flowRate1.value, dFR);
        flowRateValve2.uncertainty = FRV_unc(temp.value, temp.uncertainty, flowRate2.value, dFR);
        
        const out1 = power(flowRate1.value);
        const out2 = power(flowRate2.value);

        powerOutput1.value = out1;
        powerOutput2.value = out2;

        excess.value = out1 + out2 - (turbsToPrimary ? 30000 : 0);
      }
    }

    if (temp.value > 20000) {
      currentNotes.push("Temperatures higher than 20000 K cannot be achieved.");
    }

    if (temp.value < 323) {
      currentNotes.push("Temperatures lower than 323 K cannot be achieved.");
    }

    if (temp.value <= 370) {
      currentNotes.push("Keep in mind that the temperature must be higher than 370 K for flow to occur.");
    }

    if (excess.value > 50000) {
      currentNotes.push("Excess higher than 50000 kW cannot be achieved.");
    }

    if (flowRateValve1.value > 100 || flowRateValve2.value > 100) {
      currentNotes.push("At least one of the turbines is operating at more than 100 % capacity.");
    }
    
    notes = currentNotes;
  });

  const KEY_TO_ID: Record<keyof typeof checked, number> = {
    tempEdit: Temp,
    excEdit: Excess,
    frEdit: FlowRate,
    frvEdit: FlowRateValve,
    outEdit: Output,
    fwFlowEdit: FWFlow,
    fwUtilEdit: FWUtil
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

  let shareLink = $state('');
  let shareLinkCopied = $state(false);
  $effect(() => {
    const shareData = page.url.searchParams.get('s');

    if (shareData) {
      try {
        const sharedConfig = LZString.decompressFromEncodedURIComponent(shareData);
        if (sharedConfig) {
          const json = JSON.parse(sharedConfig);
          if (json.temp)
            temp.value = json.temp;
          if (json.excess)
            excess.value = json.excess;
          if (json.frv1)
            flowRateValve1.value = json.frv1;
          if (json.frv2)
            flowRateValve2.value = json.frv2;
          if (json.fr1)
            flowRate1.value = json.fr1;
          if (json.fr2)
            flowRate2.value = json.fr2;
          if (json.po1)
            powerOutput1.value = json.po1;
          if (json.po2)
            powerOutput2.value = json.po2;
          if (json.t2p)
            turbsToPrimary = json.t2p;
          if (json.fwFlow)
            feedwater_flow.value = json.fwFlow;
          if (json.fwUtil)
            feedwater_util.value = json.fwUtil;
          if (json.sFW)
            singleFWpump = json.sFW;

          if (json.checked) {
            checked.tempEdit = !!json.checked.tempEdit;
            checked.excEdit = !!json.checked.excEdit;
            checked.frEdit = !!json.checked.frEdit;
            checked.frvEdit = !!json.checked.frvEdit;
            checked.outEdit = !!json.checked.outEdit;
            checked.fwFlowEdit = !!json.checked.fwFlowEdit;
            checked.fwUtilEdit = !!json.checked.fwUtilEdit;
            
            if (json.checked.tempEdit) {
              temp.uncertainty = 0;
            }
            if (json.checked.excEdit) {
              excess.uncertainty = 0;
            }
            if (json.checked.frEdit) {
              flowRate1.uncertainty = 0;
              flowRate2.uncertainty = 0;
            }
            if (json.checked.frvEdit) {
              flowRateValve1.uncertainty = 0;
              flowRateValve2.uncertainty = 0;
            }
            if (json.checked.outEdit) {
              powerOutput1.uncertainty = 0;
              powerOutput2.uncertainty = 0;
            }
            if (json.checked.fwFlowEdit) {
              feedwater_flow.uncertainty = 0;
            }
            if (json.checked.fwUtilEdit) {
              feedwater_util.uncertainty = 0;
            }
          }
        }
      } catch (error) {
        console.error('Error while decompressing share data:', error);
      }
    }
  });

  $effect(() => {
    const c = {
      tempEdit: checked.tempEdit ? true : undefined,
      excEdit: checked.excEdit ? true : undefined,
      frEdit: checked.frEdit ? true : undefined,
      frvEdit: checked.frvEdit ? true : undefined,
      outEdit: checked.outEdit ? true : undefined,
      fwFlowEdit: checked.fwFlowEdit ? true : undefined,
      fwUtilEdit: checked.fwUtilEdit ? true : undefined
    };
    const json = {
      temp: temp.value === 423 ? undefined : temp.value,
      excess: excess.value === 0 ? undefined : excess.value,
      frv1: flowRateValve1.value === 0 ? undefined : flowRateValve1.value,
      frv2: flowRateValve2.value === 0 ? undefined : flowRateValve2.value,
      fr1: flowRate1.value === 0 ? undefined : flowRate1.value,
      fr2: flowRate2.value === 0 ? undefined : flowRate2.value,
      po1: powerOutput1.value === 0 ? undefined : powerOutput1.value,
      po2: powerOutput2.value === 0 ? undefined : powerOutput2.value,
      t2p: turbsToPrimary ? true : undefined,
      fwFlow: temp.value === 423 ? undefined : feedwater_flow.value,
      fwUtil: temp.value === 423 ? undefined : feedwater_util.value,
      checked: Object.values(c).some((e) => e) ? c : undefined,
      sFW: singleFWpump ? true : undefined,
    };

    const url = new URL(window.location.origin + window.location.pathname);

    const jsonString = JSON.stringify(json);
    if (jsonString !== "{}") {
      const compressed = LZString.compressToEncodedURIComponent(jsonString);
      url.searchParams.append('s', compressed);
    }

    shareLink = url.toString();
    goto(url.pathname + url.search, { 
      replaceState: true, 
      keepFocus: true, 
      noScroll: true 
    });
  });
</script>

<div class="flex flex-row gap-x-4 justify-center items-center w-screen h-screen font-mono">
  <div class="flex flex-col gap-y-4 w-110 bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)] max-h-screen overflow-y-auto">
    <div class="flex flex-col gap-y-1">
      <div class="flex flex-row gap-x-1">
        <Display name="Temperature" bind:value={temp.value} uncertainty={temp.uncertainty} bind:edit={checked.tempEdit} decimals={1} unit="K" inputClass="w-22" wrapperClass="w-full" compact />
        <Display name="Pressure" bind:value={pres} uncertainty={pres_unc} decimals={1} unit="kPa" inputClass="w-24" wrapperClass="w-full" compact />
        <!-- <Display name="Uncertainty" bind:value={pres_unc} decimals={1} unit="kPa" pre="&#177;" inputClass="w-12" wrapperClass="w-full" compact /> -->
      </div>
      <Display name="Excess" bind:value={excess.value} uncertainty={excess.uncertainty} bind:edit={checked.excEdit} decimals={1} unit="kW" inputClass="w-26" compact />
      <div class="flex flex-row gap-x-1">
        <Display name="Feedwater Flow" bind:value={feedwater_flow.value} uncertainty={feedwater_flow.uncertainty} bind:edit={checked.fwFlowEdit} decimals={2} unit="m³/s" inputClass="w-12" wrapperClass="w-full" compact />
        <Display name="Utilization" bind:value={feedwater_util.value} uncertainty={feedwater_util.uncertainty} bind:edit={checked.fwUtilEdit} decimals={1} unit="%" inputClass="w-16" wrapperClass="w-full" compact />
      </div>
    </div>
    <div class="flex gap-x-1 [&>div]:w-1/2">
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
  <div class="flex flex-col gap-y-4 w-66 max-h-screen overflow-y-auto">
    <div class="flex flex-col bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
      <div class="flex flex-col gap-y-2">
        <Checkbox text="Turbines powering Primary grid?" labelClass="leading-none" bind:checked={turbsToPrimary} />
        <Checkbox text="One feedwater pump unavailable?" labelClass="leading-none" bind:checked={singleFWpump} />
      </div>
    </div>

    <div class="flex flex-col bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
      <div class="title">Edit</div>
      <div class="flex flex-col gap-y-4 leading-none">
        <Checkbox text="Temperature" bind:checked={checked.tempEdit} onchange={(e) => updateSelection('tempEdit', e.currentTarget.checked)} />
        <Checkbox text="Excess" bind:checked={checked.excEdit} onchange={(e) => updateSelection('excEdit', e.currentTarget.checked)} />
        <Checkbox text="Feedwater Flow Rate" bind:checked={checked.fwFlowEdit} onchange={(e) => updateSelection('fwFlowEdit', e.currentTarget.checked)} />
        <Checkbox text="Feedwater Util." bind:checked={checked.fwUtilEdit} onchange={(e) => updateSelection('fwUtilEdit', e.currentTarget.checked)} />
        <Checkbox text="Flow Rate Valve" bind:checked={checked.frvEdit} onchange={(e) => updateSelection('frvEdit', e.currentTarget.checked)} />
        <Checkbox text="Flow Rate" bind:checked={checked.frEdit} onchange={(e) => updateSelection('frEdit', e.currentTarget.checked)} />
        <Checkbox text="Power Output" bind:checked={checked.outEdit} onchange={(e) => updateSelection('outEdit', e.currentTarget.checked)} />
      </div>
    </div>

    <Clipboard class="w-full rounded-lg border border-orange-300 text-orange-300 bg-[#1e1e1e] hover:bg-orange-300 focus:ring-2 focus:ring-orange-300 hover:cursor-pointer hover:text-gray-950" bind:value={shareLink} bind:success={shareLinkCopied}>
      {#if shareLinkCopied}Link copied to Clipboard{:else}Share configuration{/if}
    </Clipboard>

    {#if notes.length > 0}
      <div class="flex flex-col bg-[#1e1e1e] border-[#3b3b3b] border-2 rounded-lg p-6 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
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