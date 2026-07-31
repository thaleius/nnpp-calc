<script lang="ts">
  import LZString from "lz-string";
  import Checkbox from "./Checkbox.svelte";
  import Display from "./Display.svelte";
  import { Clipboard, Toggle } from "flowbite-svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { untrack } from "svelte";

  let controlRodInsertion = $state(100);
  let fuelLevel = $state(100);
  let feedwaterLevel = $state(100);
  let feedwaterValves = $state(true);
  let coolantValves = $state({
    alpha: true,
    beta: true
  });
  let meltdown = $state(false);
  let scram = $state(false);

  const baseHeating = 6;
  let fuelHeating = $derived(20 * (fuelLevel < 75 ? fuelLevel / 100 : 1));
  let controlRodCooling = $derived((4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) * controlRodInsertion / 100);
  let feedwaterCooling = $derived((feedwaterValves ? 5 : 0) * (feedwaterLevel < 80 ? feedwaterLevel / 80 : 1));
  let coolantCooling = $derived((feedwaterValves ? ((coolantValves.alpha ? 5 : 0) + (coolantValves.beta ? 5 : 0)) : 0) * (feedwaterLevel < 80 ? feedwaterLevel / 80 : 1));

  let tempROC = $derived(baseHeating + fuelHeating + (meltdown ? 18 : 0) - (controlRodCooling + feedwaterCooling + coolantCooling + (scram ? 21 : 0)));

  let shareLink = $state('');
  let shareLinkCopied = $state(false);

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
      scram: scram === false ? undefined : true
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
</script>

<div class="flex flex-row gap-4 justify-center items-center flex-wrap">
  <div class="flex flex-col gap-y-1 box w-full md:w-70">
    <Display name="Control Rod insertion" bind:value={controlRodInsertion} min={0} max={100} compact decimals={0} edit={true} showUncertainty={false} unit="%" inputClass="w-12" />
    <Display name="Fuel level" bind:value={fuelLevel} min={0} max={100} compact decimals={1} edit={true} showUncertainty={false} unit="%" inputClass="w-12" />
    <Display name="Feedwater level" bind:value={feedwaterLevel} min={0} max={100} compact decimals={1} edit={true} showUncertainty={false} unit="%" inputClass="w-12" />
    <Display name="Temperature Rate of Change"
      bind:value={tempROC} min={baseHeating + fuelHeating - ((4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) + feedwaterCooling + coolantCooling)} max={44}
      compact decimals={2} edit={true} showUncertainty={false} unit="K/s" inputClass="w-18" onEdit={(e) => {
      controlRodInsertion = (baseHeating + fuelHeating - (tempROC + feedwaterCooling + coolantCooling)) / (4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) * 100
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
{#if shareLink}
  <Clipboard class="button focusring w-full md:w-80 absolute bottom-4" bind:value={shareLink} bind:success={shareLinkCopied}>
    {#if shareLinkCopied}Link copied to Clipboard{:else}Share configuration{/if}
  </Clipboard>
{/if}