<script setup>
import { onMounted, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio.js'
import PortfolioChart from '@/components/PortfolioChart.vue'

const store = usePortfolioStore()

onMounted(() => {
  store.fetchAssets()
})

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const chartData = computed(() => {
  if (store.assets.length === 0) return []

  const sorted = [...store.assets].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate))
  let cumulative = 0
  const points = []

  for (const asset of sorted) {
    const priceData = store.getAssetPrice(asset)
    const currentPrice = priceData?.price || asset.purchasePrice
    cumulative += asset.quantity * currentPrice
    points.push({
      label: new Date(asset.purchaseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      value: cumulative,
    })
  }

  if (points.length === 1) {
    points.unshift({ label: '', value: 0 })
  }

  return points
})

const topAssets = computed(() => {
  return [...store.assets]
    .map(a => {
      const priceData = store.getAssetPrice(a)
      const currentPrice = priceData?.price || a.purchasePrice
      const currentValue = a.quantity * currentPrice
      const cost = a.quantity * a.purchasePrice
      const pnl = currentValue - cost
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0
      const change24h = priceData?.change24h || 0
      return { ...a, currentPrice, currentValue, pnl, pnlPercent, change24h }
    })
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
})
</script>

<template>
  <div class="dashboard">
    <div class="stats-row">
      <div class="stat-card main-stat">
        <span class="stat-label">Valeur du portefeuille</span>
        <span class="stat-value">{{ formatCurrency(store.totalValue) }}</span>
        <span class="stat-change" :class="store.totalPnl >= 0 ? 'positive' : 'negative'">
          {{ store.totalPnl >= 0 ? '+' : '' }}{{ formatCurrency(store.totalPnl) }}
          ({{ store.totalPnlPercent >= 0 ? '+' : '' }}{{ store.totalPnlPercent.toFixed(2) }}%)
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Co&ucirc;t total</span>
        <span class="stat-value small">{{ formatCurrency(store.totalCost) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Actifs</span>
        <span class="stat-value small">{{ store.assetCount }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">P&L</span>
        <span class="stat-value small" :class="store.totalPnl >= 0 ? 'positive' : 'negative'">
          {{ store.totalPnl >= 0 ? '+' : '' }}{{ store.totalPnlPercent.toFixed(2) }}%
        </span>
      </div>
    </div>

    <div class="grid">
      <div class="card chart-card">
        <div class="card-header">
          <h2>&Eacute;volution du portefeuille</h2>
        </div>
        <div v-if="store.loading" class="card-empty">Chargement...</div>
        <div v-else-if="chartData.length === 0" class="card-empty">
          Ajoutez des actifs pour voir le graphique
        </div>
        <PortfolioChart v-else :data="chartData" />
      </div>

      <div class="card holdings-card">
        <div class="card-header">
          <h2>Top Holdings</h2>
          <RouterLink to="/portfolio" class="card-link">Tout voir</RouterLink>
        </div>
        <div v-if="store.loading" class="card-empty">Chargement...</div>
        <div v-else-if="topAssets.length === 0" class="card-empty">
          <RouterLink to="/add" class="empty-link">Ajouter votre premier actif</RouterLink>
        </div>
        <div v-else class="holdings-list">
          <div v-for="asset in topAssets" :key="asset._id" class="holding-row">
            <div class="holding-info">
              <span class="holding-symbol">{{ asset.symbol }}</span>
              <span class="holding-name">{{ asset.name }}</span>
            </div>
            <div class="holding-data">
              <span class="holding-value">{{ formatCurrency(asset.currentValue) }}</span>
              <span class="holding-change" :class="asset.pnl >= 0 ? 'positive' : 'negative'">
                {{ asset.pnl >= 0 ? '+' : '' }}{{ asset.pnlPercent.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.stats-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 0.75rem;
}

.stat-card {
  background: #111622;
  border: 1px solid #1e2433;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4a5068;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #e0e4f0;
  font-family: 'JetBrains Mono', monospace;
}

.stat-value.small {
  font-size: 1.25rem;
}

.stat-change {
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
}

.positive { color: #25d695; }
.negative { color: #ff5353; }

.grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 0.75rem;
}

.card {
  background: #111622;
  border: 1px solid #1e2433;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #1e2433;
}

.card-header h2 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e0e4f0;
}

.card-link {
  font-size: 0.75rem;
  color: #25d695;
  text-decoration: none;
  font-weight: 500;
}

.card-link:hover {
  text-decoration: underline;
}

.card-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #4a5068;
  font-size: 0.85rem;
}

.empty-link {
  color: #25d695;
  text-decoration: none;
}

.chart-card {
  padding-bottom: 0.5rem;
}

.chart-card .chart-wrapper {
  padding: 0.75rem 1rem;
}

.holdings-list {
  padding: 0.25rem 0;
}

.holding-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  transition: background 0.1s;
}

.holding-row:hover {
  background: #151a28;
}

.holding-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.holding-symbol {
  font-weight: 600;
  color: #e0e4f0;
  font-size: 0.9rem;
}

.holding-name {
  color: #4a5068;
  font-size: 0.8rem;
}

.holding-data {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.holding-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #e0e4f0;
  font-weight: 500;
}

.holding-change {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
