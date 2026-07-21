<script lang="ts">
  import type { CalcResult } from "$lib/socket";
  import * as echarts from 'echarts';

  let {
    props,
    isPlaying = $bindable(),
    currentTemp = $bindable(),
    currentSimTime = $bindable(),
    class: className
  }: {
    props: CalcResult,
    isPlaying: boolean,
    currentSimTime: number,
    currentTemp: number,
    class: string
  } = $props();

  let { meltdownTime, scramTime, startTime, endTime, endTemp, data } = $derived(props);

  const dt = 0.1;

  let tempMin = $derived(Math.min(...data.map(d => d.temperature)));
  let tempMax = $derived(Math.max(...data.map(d => d.temperature)));
  let changeMin = $derived(Math.min(...data.map(d => d.temperature_change)));
  let changeMax = $derived(Math.max(...data.map(d => d.temperature_change)));

  let currentIndex = $derived(
    Math.min(data.length, Math.max(0, Math.floor((currentSimTime - startTime) / dt) + 1))
  );
  let currentData = $derived(data.slice(0, currentIndex));

  $effect(() => {
    if (data[currentIndex])
      currentTemp = data[currentIndex].temperature;
  });

  $effect(() => {
    if (!isPlaying) return;
    
    let animationFrameId: number;
    let lastRealTime = performance.now();

    function frame(currentRealTime: number) {
      const elapsedRealTime = (currentRealTime - lastRealTime) / 1000; // in Sekunden
      lastRealTime = currentRealTime;

      currentSimTime += elapsedRealTime;

      if (currentSimTime >= endTime) {
        currentSimTime = endTime;
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
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Temperature', 'Temperature change']
    },
    xAxis: {
      type: 'value',
      name: 'Time (s)',
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: { show: false },
      min: startTime,
      max: endTime
    },
    yAxis: [
      {
        type: 'value',
        name: 'Temperature (K)',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#fff' } },
        splitLine: { show: false },
        min: Math.floor(tempMin),
        max: Math.ceil(tempMax)
      },
      {
        type: 'value',
        name: 'Temperature change (K/s)',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#ee6666' } },
        splitLine: { show: false },
        min: Math.floor(changeMin),
        max: Math.ceil(changeMax)
      }
    ],
    series: [
      {
        name: 'Temperature',
        type: 'line',
        yAxisIndex: 0,
        showSymbol: false,
        color: '#fff',
        data: currentData.map(d => [d.time, d.temperature]),
        markLine: {
          symbol: ['none', 'none'],
          label: {
            position: 'insideEndTop',
            color: 'oklch(83.7% 0.128 66.29)',
            formatter: '{b}'
          },
          lineStyle: { color: 'oklch(83.7% 0.128 66.29)', type: 'dashed' },
          data: [
            { xAxis: 0, name: 'Insert Control Rods' },
            { xAxis: 50 / 9, name: 'Open FW valves' },
            { xAxis: meltdownTime, name: 'Meltdown' + (Math.round(meltdownTime) === 50 ? ', activate all coolant systems' : '') },
            { xAxis: 50, name: (Math.round(meltdownTime) === 50 || Math.round(scramTime) === 50) ? '' : 'Activate all coolant systems' },
            { xAxis: scramTime, name: 'SCRAM' + (Math.round(scramTime) === 50 ? ', activate all coolant systems' : '') },
            { xAxis: meltdownTime + 240, name: 'SCRAM time limit' },
            { yAxis: 800, name: '' }
          ]
        }
      },
      {
        name: 'Temperature change',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: false,
        color: '#ee6666',
        data: currentData.map(d => [d.time, d.temperature_change])
      }
    ]
  });
</script>

<div use:chart class={className}></div>