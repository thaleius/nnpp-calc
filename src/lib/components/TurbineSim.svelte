<script lang="ts">
  import * as echarts from 'echarts';
  import { simulate, optimizeTimeLimit } from '$lib/turbine-simulator';
    import Display from './Display.svelte';

  let {
    isPlaying = $bindable(),
    currentSimTime = $bindable(),
    currentRpm = $bindable(),
    currentFR = $bindable(),
    currentFRVState = $bindable(),
    temp = 2150,
    targetRpm = 2995,
    optimalSwitchTime = $bindable(),
    valveEndTime = $bindable(),
    class: className = ''
  } = $props();

  const dt = 0.1;
  let endTime = 200;

  // Reaktive Berechnung der Simulation, falls sich temp, targetRpm oder endTime ändern
  let simResult = $derived.by(() => {
    const opt = optimizeTimeLimit(temp, targetRpm);
    const steps = Math.ceil(endTime / dt);
    const res = simulate(opt.timeLimit, opt.valveEndTime, temp, endTime, steps);
    
    const arr = [];
    for (let i = 0; i <= steps; i++) {
      arr.push({
        time: res.time[i],
        rpm: res.rpm[i],
        drpm: res.drpm[i],
        s_val: res.s_vals[i],
        fr_val: res.fr_vals[i],
        frv_state: res.frv_state[i]
      });
    }
    return { data: arr, optimalTimeLimit: opt.timeLimit, valveEndTime: opt.valveEndTime };
  });

  let data = $derived(simResult.data);
  $effect(() => {
    optimalSwitchTime = simResult.optimalTimeLimit;
  });
  $effect(() => {
    valveEndTime = simResult.valveEndTime;
  })

  let rpmMax = $derived(Math.max(...data.map(d => Math.max(d.rpm, d.s_val))));
  let drpmMin = $derived(Math.min(...data.map(d => d.drpm)));
  let drpmMax = $derived(Math.max(...data.map(d => d.drpm)));

  let currentIndex = $derived(
    currentSimTime < 0 ? 0 : Math.min(data.length - 1, Math.max(0, Math.floor(currentSimTime / dt)))
  );
  let currentData = $derived(data.slice(0, currentIndex + 1));

  $effect(() => {
    if (data[currentIndex]) {
      currentRpm = data[currentIndex].rpm;
      currentFR = data[currentIndex].fr_val;
      currentFRVState = data[currentIndex].frv_state;
    }
  });

  $effect(() => {
    if (!isPlaying) return;
    
    let animationFrameId: number;
    let lastRealTime = performance.now();

    function frame(currentRealTime: number) {
      const elapsedRealTime = (currentRealTime - lastRealTime) / 1000;
      lastRealTime = currentRealTime;

      currentSimTime += elapsedRealTime;

      if (currentSimTime >= valveEndTime + 10) {
        currentSimTime = valveEndTime + 10;
        isPlaying = false;
      } else {
        animationFrameId = requestAnimationFrame(frame);
      }
    }

    animationFrameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrameId);
  });

  function chart(node: HTMLElement) {
    const chartInstance = echarts.init(node);
    const resizeObserver = new ResizeObserver(() => chartInstance.resize());
    resizeObserver.observe(node);

    $effect(() => {
      chartInstance.setOption(chartOptions, { replaceMerge: ['series'] });
    });

    return {
      destroy() {
        resizeObserver.disconnect();
        chartInstance.dispose();
      }
    };
  }

  let chartOptions = $derived<echarts.EChartsCoreOption>({
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { data: ['RPM', 'Target RPM', 'RPM per second'] },
    xAxis: {
      type: 'value',
      name: 'Time (s)',
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: { show: false },
      min: 0,
      max: Math.ceil(valveEndTime + 10)
    },
    yAxis: [
      {
        type: 'value',
        name: 'RPM',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#5470c6' } },
        splitLine: { show: false },
        min: 0,
        max: Math.ceil(rpmMax)
      },
      {
        type: 'value',
        name: 'RPM per second',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#ee6666' } },
        splitLine: { show: false },
        min: Math.floor(drpmMin),
        max: Math.ceil(drpmMax)
      }
    ],
    series: [
      {
        name: 'RPM',
        type: 'line',
        yAxisIndex: 0,
        showSymbol: false,
        color: '#5470c6',
        data: currentData.map(d => [d.time, d.rpm]),
        markLine: {
          symbol: ['none', 'none'],
          label: {
            position: 'insideEndTop',
            color: 'oklch(83.7% 0.128 66.29)',
            formatter: '{b}'
          },
          lineStyle: { color: 'oklch(83.7% 0.128 66.29)', type: 'dashed' },
          data: [
            { xAxis: optimalSwitchTime, name: `Opt. Switch Time: ${optimalSwitchTime.toFixed(2)}s` }
          ]
        }
      },
      {
        name: 'Target RPM',
        type: 'line',
        yAxisIndex: 0,
        showSymbol: false,
        color: '#a8a8a8',
        lineStyle: { type: 'dashed' },
        data: currentData.map(d => [d.time, d.s_val])
      },
      {
        name: 'RPM per second',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: false,
        color: '#ee6666',
        data: currentData.map(d => [d.time, d.drpm])
      }
    ]
  });
</script>

<div class="flex flex-col">
  <div class="flex flex-row justify-center gap-x-2">
    <Display name="Flow Rate" value={currentFR} edit={false} showUncertainty={false} decimals={2} unit="m³/s" inputClass="w-16" wrapperClass="text-orange-300 w-40" compact={true} />
    <Display name="RPM" value={currentRpm} edit={false} showUncertainty={false} decimals={0} unit="" inputClass="w-12" wrapperClass="text-orange-300 w-40" compact={true} />
    <Display name="FRV" type="text" value={currentFRVState} edit={false} showUncertainty={false} decimals={0} unit="" inputClass="w-12 text-center!" wrapperClass="text-orange-300 w-40" compact={true} />
  </div>
  <div use:chart class={className}></div>
</div>