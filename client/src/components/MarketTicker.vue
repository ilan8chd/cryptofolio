<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { fetchMarketData } from '@/services/crypto.js'

const coins = ref([])
const loading = ref(true)
const error = ref(null)
let interval = null

function formatPrice(price) {
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

function formatMarketCap(cap) {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
  return `$${cap.toLocaleString()}`
}

async function loadData() {
  try {
    const data = await fetchMarketData()
    coins.value = data
    error.value = null
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  interval = setInterval(loadData, 60000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="market-ticker">
    <div class="ticker-header">
      <h2>March&eacute;s</h2>
      <span class="live-dot"></span>
    </div>

    <p v-if="loading" class="status">Chargement des prix...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>

    <div v-else class="ticker-table-wrap">
      <table class="ticker-table">
        <thead>
          <tr>
            <th class="rank">#</th>
            <th>Nom</th>
            <th class="right">Prix</th>
            <th class="right">24h</th>
            <th class="right hide-mobile">7j</th>
            <th class="right hide-mobile">Market Cap</th>
            <th v-if="coins[0]?.sparkline_in_7d?.price" class="sparkline-col hide-mobile">7j Chart</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coin in coins" :key="coin.id">
            <td class="rank">{{ coin.market_cap_rank }}</td>
            <td class="coin-name">
              <img :src="coin.image" :alt="coin.name" class="coin-icon" />
              <span class="name">{{ coin.name }}</span>
              <span class="symbol">{{ coin.symbol.toUpperCase() }}</span>
            </td>
            <td class="right mono">${{ formatPrice(coin.current_price) }}</td>
            <td class="right mono" :class="coin.price_change_percentage_24h_in_currency >= 0 ? 'positive' : 'negative'">
              {{ coin.price_change_percentage_24h_in_currency >= 0 ? '+' : '' }}{{ coin.price_change_percentage_24h_in_currency?.toFixed(2) }}%
            </td>
            <td class="right mono hide-mobile" :class="coin.price_change_percentage_7d_in_currency >= 0 ? 'positive' : 'negative'">
              {{ coin.price_change_percentage_7d_in_currency >= 0 ? '+' : '' }}{{ coin.price_change_percentage_7d_in_currency?.toFixed(2) }}%
            </td>
            <td class="right mono hide-mobile">{{ formatMarketCap(coin.market_cap) }}</td>
            <td v-if="coin.sparkline_in_7d?.price" class="sparkline-col hide-mobile">
              <svg viewBox="0 0 100 30" class="sparkline" :class="coin.price_change_percentage_7d_in_currency >= 0 ? 'spark-green' : 'spark-red'">
                <polyline
                  fill="none"
                  stroke-width="1.5"
                  :points="coin.sparkline_in_7d.price
                    .filter((_, i) => i % 4 === 0)
                    .map((p, i, arr) => {
                      const min = Math.min(...arr)
                      const max = Math.max(...arr)
                      const range = max - min || 1
                      return `${(i / (arr.length - 1)) * 100},${30 - ((p - min) / range) * 28}`
                    }).join(' ')"
                />
              </svg>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.market-ticker {
  background: #111622;
  border-radius: 12px;
  border: 1px solid #1e2433;
  overflow: hidden;
}

.ticker-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #1e2433;
}

.ticker-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #e0e4f0;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #25d695;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.status {
  padding: 2rem;
  text-align: center;
  color: #555;
}

.status.error {
  color: #ff5353;
}

.ticker-table-wrap {
  overflow-x: auto;
}

.ticker-table {
  width: 100%;
  border-collapse: collapse;
}

.ticker-table th {
  padding: 0.6rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4a5068;
  font-weight: 500;
  border-bottom: 1px solid #1e2433;
}

.ticker-table td {
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  color: #c8ccda;
  border-bottom: 1px solid #151a28;
}

.ticker-table tbody tr:hover {
  background: #151a28;
}

.rank {
  width: 40px;
  color: #4a5068 !important;
}

.right {
  text-align: right !important;
}

.mono {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
}

.coin-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.coin-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.coin-name .name {
  font-weight: 500;
  color: #e0e4f0;
}

.coin-name .symbol {
  color: #4a5068;
  font-size: 0.75rem;
}

.positive {
  color: #25d695 !important;
}

.negative {
  color: #ff5353 !important;
}

.sparkline-col {
  width: 100px;
  padding: 0.4rem 1rem !important;
}

.sparkline {
  width: 100px;
  height: 30px;
}

.spark-green polyline {
  stroke: #25d695;
}

.spark-red polyline {
  stroke: #ff5353;
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none;
  }
}
</style>
