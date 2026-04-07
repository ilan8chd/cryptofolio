<script setup>
import MarketTicker from '@/components/MarketTicker.vue'
</script>

<template>
  <div class="market-page">
    <div class="page-header">
      <h1>March&eacute;s</h1>
      <p class="subtitle">Cours en temps r&eacute;el &mdash; actualis&eacute; toutes les 60s</p>
    </div>
    <MarketTicker />
  </div>
</template>

<style scoped>
.market-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e0e4f0;
}

.subtitle {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #4a5068;
}
</style>
