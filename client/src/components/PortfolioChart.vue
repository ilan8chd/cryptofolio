<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  data: { type: Array, default: () => [] },
  label: { type: String, default: 'Valeur du portefeuille' },
})

const canvas = ref(null)
let chart = null

function createChart() {
  if (chart) chart.destroy()
  if (!canvas.value || props.data.length === 0) return

  const isPositive = props.data.length < 2 || props.data[props.data.length - 1].value >= props.data[0].value
  const color = isPositive ? '#25d695' : '#ff5353'

  const ctx = canvas.value.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, isPositive ? 'rgba(37, 214, 149, 0.15)' : 'rgba(255, 83, 83, 0.15)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.map(d => d.label),
      datasets: [{
        label: props.label,
        data: props.data.map(d => d.value),
        borderColor: color,
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1f2e',
          titleColor: '#a0a4b8',
          bodyColor: '#fff',
          borderColor: '#2a2f3e',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) => `$${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#555', maxTicksLimit: 8, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: {
            color: '#555',
            font: { size: 11 },
            callback: (v) => '$' + v.toLocaleString(),
          },
          border: { display: false },
        },
      },
    },
  })
}

watch(() => props.data, createChart, { deep: true })
onMounted(createChart)
onUnmounted(() => { if (chart) chart.destroy() })
</script>

<template>
  <div class="chart-wrapper">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 300px;
  position: relative;
}
</style>
