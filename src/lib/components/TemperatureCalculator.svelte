<script lang="ts">
    import Checkbox from "./Checkbox.svelte";
  import Display from "./Display.svelte";

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
      <div class="flex flex-col gap-y-1">
        <Checkbox text="Feedwater valves" bind:checked={feedwaterValves} />
        <Checkbox text="Coolant alpha" bind:checked={coolantValves.alpha} />
        <Checkbox text="Coolant beta" bind:checked={coolantValves.beta} />
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