<script lang="ts">
  import Display from "./Display.svelte";

  let controlRodInsertion = $state(100);
  let fuelLevel = $state(100);
  let feedwaterLevel = $state(100);
  let feedwaterValves = $state(true);
  let coolantValves = $state({
    alpha: true,
    beta: true
  });

  const baseHeating = 6;
  let fuelHeating = $derived(20 * (fuelLevel < 75 ? fuelLevel / 100 : 1));
  let controlRodCooling = $derived((4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) * controlRodInsertion / 100);
  let feedwaterCooling = $derived((feedwaterValves ? 5 : 0) * (feedwaterLevel < 80 ? feedwaterLevel / 80 : 1));
  let coolantCooling = $derived(((coolantValves.alpha ? 5 : 0) + (coolantValves.beta ? 5 : 0)) * (feedwaterLevel < 80 ? feedwaterLevel / 80 : 1));

  let tempROC = $derived(baseHeating + fuelHeating - (controlRodCooling + feedwaterCooling + coolantCooling));
</script>

<div class="flex flex-col gap-y-2 box">
  <Display name="Control Rod insertion" bind:value={controlRodInsertion} min={0} max={100} compact decimals={0} edit={true} showUncertainty={false} unit="%" />
  <Display name="Fuel level" bind:value={fuelLevel} compact decimals={1} edit={true} showUncertainty={false} unit="%" />
  <Display name="Feedwater level" bind:value={feedwaterLevel} compact decimals={1} edit={true} showUncertainty={false} unit="%" />
  <Display name="Temperature Rate of Change" bind:value={tempROC} compact decimals={2} edit={true} showUncertainty={false} unit="K/s" onEdit={(e) => {
    controlRodInsertion = (baseHeating + fuelHeating - (tempROC + feedwaterCooling + coolantCooling)) / (4 + 16 * (fuelLevel < 75 ? fuelLevel / 100 : 1)) * 100
  }} />
</div>