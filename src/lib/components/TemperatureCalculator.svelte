<script lang="ts">
  import LZString from "lz-string";
  import Checkbox from "./Checkbox.svelte";
  import Display from "./Display.svelte";
  import { Toggle } from "flowbite-svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { untrack } from "svelte";

  let { shareLink = $bindable() }: { shareLink: string } = $props();

  let controlRodInsertion = $state(100);
  let fuelLevel = $state(100);
  let feedwaterLevel = $state(100);
  let feedwaterValves = $state(true);
  let coolantValves = $state({
    alpha: true,
    beta: true
  });
  let reliefValves = $state({
    1: false,
    2: false,
    3: false,
    4: false
  });
  let meltdown = $state(false);
  let scram = $state(false);

  let baseHeating = $derived(fuelLevel === 0 ? -3 : 6);
  let fuelHeating = $derived(20 * (fuelLevel < 75 ? fuelLevel / 100 : 1));
  let controlRodCooling = $derived((4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) * controlRodInsertion / 100);
  let feedwaterCooling = $derived((feedwaterValves ? 5 : 0) * (feedwaterLevel < 80 ? feedwaterLevel / 80 : 1));
  let coolantCooling = $derived((feedwaterValves ? ((coolantValves.alpha ? 5 : 0) + (coolantValves.beta ? 5 : 0)) : 0) * (feedwaterLevel < 80 ? feedwaterLevel / 80 : 1));
  let rvCooling = $derived(Object.values(reliefValves).reduce((partialSum, a) => partialSum + (a ? 7.5 : 0), 0));

  let tempROC = $derived(baseHeating + fuelHeating + (meltdown ? 18 : 0) - (controlRodCooling + feedwaterCooling + coolantCooling + rvCooling + (scram ? 21 : 0)));

  const getPath = () => page.params.path?.replace(/\//g, '');
  $effect(() => {
    const shareData = page.url.searchParams.get('s');

    if (shareData) {
      try {
        const sharedConfig = untrack(() => LZString.decompressFromEncodedURIComponent(shareData));
        console.log(sharedConfig)
        if (sharedConfig) {
          const json = JSON.parse(sharedConfig);
          if (getPath() === 'temp') {
            if (json.hasOwnProperty('cr'))
              controlRodInsertion = json.cr;
            if (json.hasOwnProperty('fuel'))
              fuelLevel = json.fuel;
            if (json.hasOwnProperty('fw'))
              feedwaterLevel = json.fw;
            if (json.hasOwnProperty('fwv'))
              feedwaterValves = json.fwv;
            if (json.hasOwnProperty('cv1'))
              coolantValves.alpha = json.cv1;
            if (json.hasOwnProperty('cv2'))
              coolantValves.beta = json.cv2;
            if (json.hasOwnProperty('md'))
              meltdown = json.md;
            if (json.hasOwnProperty('scram'))
              scram = json.scram;
            if (json.hasOwnProperty('rv1'))
              reliefValves['1'] = json.rv1;
            if (json.hasOwnProperty('rv2'))
              reliefValves['2'] = json.rv2;
            if (json.hasOwnProperty('rv3'))
              reliefValves['3'] = json.rv3;
            if (json.hasOwnProperty('rv4'))
              reliefValves['4'] = json.rv4;
          }
        }
      } catch (error) {
        console.error('Error while decompressing share data:', error);
      }
    }
  });

  $effect(() => {
    const json = {
      cr: controlRodInsertion === 100 ? undefined : controlRodInsertion,
      fuel: fuelLevel === 100 ? undefined : fuelLevel,
      fw: feedwaterLevel === 100 ? undefined : feedwaterLevel,
      fwv: feedwaterValves === true ? undefined : false,
      cv1: coolantValves.alpha === true ? undefined : false,
      cv2: coolantValves.beta === true ? undefined : false,
      md: meltdown === false ? undefined : true,
      scram: scram === false ? undefined : true,
      rv1: reliefValves['1'] ? true : undefined,
      rv2: reliefValves['2'] ? true : undefined,
      rv3: reliefValves['3'] ? true : undefined,
      rv4: reliefValves['4'] ? true : undefined
    };

    const jsonString = JSON.stringify(json);
    const targetPath = resolve('/temp/');
    const url = new URL(targetPath, window.location.origin);

    if (jsonString !== '{}') {
      url.searchParams.set('s', LZString.compressToEncodedURIComponent(jsonString));
      shareLink = url.toString();
    } else {
      shareLink = '';
    }

    goto(targetPath + url.search, { 
      replaceState: true, 
      keepFocus: true, 
      noScroll: true 
    });
  });

  const activeClass = "bg-orange-300/10 border border-orange-300 text-orange-300";
  const inactiveClass = "bg-[#161616] border border-[#3b3b3b] text-gray-400 hover:text-gray-200 hover:border-gray-500 hover:bg-[#252525] focus:outline-none";
</script>

<div class="flex flex-col md:flex-row gap-4 md:justify-center md:items-center md:flex-wrap w-full overflow-y-auto p-4 md:pb-0">
  <div class="flex flex-col gap-y-2 bg-[#1e1e1e] box w-full md:w-70">
    <div class="title">Instructions</div>
    <div class="flex flex-col gap-y-2">
      <p>Enter your custom values to run the calculation.</p>
    </div>
  </div>

  <div class="flex flex-col gap-y-1 box w-full md:w-70">
    <Display name="Control Rod insertion" bind:value={controlRodInsertion} min={0} max={100} compact decimals={0} edit={true} showUncertainty={false} unit="%" inputClass="w-12" />
    <Display name="Fuel level" bind:value={fuelLevel} min={0} max={100} compact decimals={1} edit={true} showUncertainty={false} unit="%" inputClass="w-12" />
    <Display name="Feedwater level" bind:value={feedwaterLevel} min={0} max={100} compact decimals={1} edit={true} showUncertainty={false} unit="%" inputClass="w-12" />
    <Display name="Temperature Rate of Change"
      bind:value={tempROC} min={baseHeating + fuelHeating - ((4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) + feedwaterCooling + coolantCooling)} max={44}
      compact decimals={2} edit={true} showUncertainty={false} unit="K/s" inputClass="w-18" onEdit={(e) => {
      controlRodInsertion = (baseHeating + fuelHeating - (tempROC + feedwaterCooling + coolantCooling + rvCooling)) / (4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) * 100
    }} />
  </div>

  <div class="flex flex-col gap-y-4 w-full md:w-70">
    <div class="flex flex-col box w-full">
      <div class="title">Coolants</div>
      <div class="flex flex-col gap-y-2">
        <Toggle bind:checked={feedwaterValves} class="text-md cursor-pointer">Feedwater valve</Toggle>
        <Toggle bind:checked={coolantValves.alpha} class="text-md cursor-pointer">Coolant Alpha</Toggle>
        <Toggle bind:checked={coolantValves.beta} class="text-md cursor-pointer">Coolant Beta</Toggle>
      </div>
    </div>

    <div class="flex flex-col box w-full">
      <div class="title">Relief Valves</div>
      <div class="grid grid-cols-2 gap-3 text-sm">
          <button class={`flex flex-col items-start p-3 rounded transition-colors cursor-pointer ${reliefValves['1'] ? activeClass : inactiveClass}`} onclick={() => reliefValves['1'] = !reliefValves['1']}>
            <span class="text-s uppercase opacity-75 text-center w-full">RV 1</span>
          </button>

          <button class={`flex flex-col items-start p-3 rounded transition-colors cursor-pointer ${reliefValves['2'] ? activeClass : inactiveClass}`} onclick={() => reliefValves['2'] = !reliefValves['2']}>
            <span class="text-s uppercase opacity-75 text-center w-full">RV 2</span>
          </button>

          <button class={`flex flex-col items-start p-3 rounded transition-colors cursor-pointer ${reliefValves['3'] ? activeClass : inactiveClass}`} onclick={() => reliefValves['3'] = !reliefValves['3']}>
            <span class="text-s uppercase opacity-75 text-center w-full">RV 3</span>
          </button>

          <button class={`flex flex-col items-start p-3 rounded transition-colors cursor-pointer ${reliefValves['4'] ? activeClass : inactiveClass}`} onclick={() => reliefValves['4'] = !reliefValves['4']}>
            <span class="text-s uppercase opacity-75 text-center w-full">RV 4</span>
          </button>
        </div>
    </div>

    <div class="flex flex-col box w-full">
      <div class="title">Meltdown</div>
      <div class="flex flex-col gap-y-1">
        <Checkbox text="Meltdown" bind:checked={meltdown} onchange={() => {
          if (!meltdown) {
            scram = false;
          }
        }} />
        <Checkbox text="SCRAM" bind:checked={scram} onchange={() => {
          if (scram) {
            meltdown = true;
          }
        }} />
      </div>
    </div>
  </div>
</div>