<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio.js'
import { searchCoins, getCoinPrice, fetchCoinHistoryById, getCoinId, SYMBOL_TO_ID } from '@/services/crypto.js'
import PortfolioChart from '@/components/PortfolioChart.vue'

const router = useRouter()
const store = usePortfolioStore()

const form = ref({
  name: '',
  symbol: '',
  coinGeckoId: '',
  quantity: null,
  purchasePrice: null,
  purchaseDate: new Date().toISOString().slice(0, 10),
})

const submitting = ref(false)
const error = ref(null)

// Selected coin from CoinGecko
const selectedCoin = ref(null)
const coinPrice = ref(null)
const coinChart = ref([])
const chartLoading = ref(false)
const chartDays = ref(30)

// Search
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const showDropdown = ref(false)
let searchTimeout = null

const cryptoSuggestions = [
  { name: 'Bitcoin', symbol: 'BTC', id: 'bitcoin' },
  { name: 'Ethereum', symbol: 'ETH', id: 'ethereum' },
  { name: 'Solana', symbol: 'SOL', id: 'solana' },
  { name: 'Cardano', symbol: 'ADA', id: 'cardano' },
  { name: 'Ripple', symbol: 'XRP', id: 'ripple' },
  { name: 'Polkadot', symbol: 'DOT', id: 'polkadot' },
  { name: 'Avalanche', symbol: 'AVAX', id: 'avalanche-2' },
  { name: 'Chainlink', symbol: 'LINK', id: 'chainlink' },
]

const isValidCoin = computed(() => selectedCoin.value !== null)

const chartData = computed(() => {
  return coinChart.value.map(point => ({
    label: new Date(point.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    value: point.price,
  }))
})

function formatCurrency(value) {
  if (value >= 1) return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

async function selectCoin(coin) {
  selectedCoin.value = coin
  form.value.name = coin.name
  form.value.symbol = coin.symbol
  form.value.coinGeckoId = coin.id
  searchQuery.value = ''
  showDropdown.value = false

  chartLoading.value = true
  try {
    const [priceData, history] = await Promise.all([
      getCoinPrice(coin.id),
      fetchCoinHistoryById(coin.id, chartDays.value),
    ])
    coinPrice.value = priceData
    coinChart.value = history
    if (priceData && !form.value.purchasePrice) {
      form.value.purchasePrice = Math.round(priceData.price * 100) / 100
    }
  } catch {
    coinPrice.value = null
    coinChart.value = []
  } finally {
    chartLoading.value = false
  }
}

async function changeChartDays(days) {
  if (!selectedCoin.value) return
  chartDays.value = days
  chartLoading.value = true
  try {
    coinChart.value = await fetchCoinHistoryById(selectedCoin.value.id, days)
  } catch {
    coinChart.value = []
  } finally {
    chartLoading.value = false
  }
}

watch(searchQuery, (query) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!query || query.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }
  searchLoading.value = true
  showDropdown.value = true
  searchTimeout = setTimeout(async () => {
    try {
      searchResults.value = await searchCoins(query)
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 400)
})

function clearSelection() {
  selectedCoin.value = null
  coinPrice.value = null
  coinChart.value = []
  form.value.name = ''
  form.value.symbol = ''
  form.value.coinGeckoId = ''
  form.value.purchasePrice = null
}

async function handleSubmit() {
  if (!isValidCoin.value) {
    error.value = 'Veuillez sélectionner un actif valide depuis la liste'
    return
  }
  error.value = null
  submitting.value = true
  try {
    await store.addAsset(form.value)
    router.push('/portfolio')
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="add-page">
    <!-- Left: Form -->
    <div class="form-side">
      <div class="page-header">
        <h1>Ajouter un actif</h1>
      </div>

      <div class="card">
        <!-- Quick picks -->
        <div class="section-label">S&eacute;lection rapide</div>
        <div class="suggestions">
          <button
            v-for="crypto in cryptoSuggestions"
            :key="crypto.symbol"
            class="chip"
            :class="{ active: selectedCoin?.id === crypto.id }"
            @click="selectCoin(crypto)"
          >
            {{ crypto.symbol }}
          </button>
        </div>

        <!-- Search -->
        <div class="section-label">Rechercher un actif</div>
        <div class="search-wrap">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Rechercher par nom ou symbole..."
            @focus="searchQuery.length >= 2 && (showDropdown = true)"
            @blur="setTimeout(() => showDropdown = false, 200)"
          />
          <div v-if="showDropdown" class="search-dropdown">
            <div v-if="searchLoading" class="dropdown-status">Recherche...</div>
            <div v-else-if="searchResults.length === 0" class="dropdown-status">Aucun r&eacute;sultat</div>
            <button
              v-for="coin in searchResults"
              :key="coin.id"
              class="dropdown-item"
              @mousedown.prevent="selectCoin(coin)"
            >
              <img :src="coin.thumb" :alt="coin.name" class="coin-thumb" />
              <span class="coin-result-name">{{ coin.name }}</span>
              <span class="coin-result-symbol">{{ coin.symbol }}</span>
              <span v-if="coin.marketCapRank" class="coin-rank">#{{ coin.marketCapRank }}</span>
            </button>
          </div>
        </div>

        <!-- Selected coin badge -->
        <div v-if="selectedCoin" class="selected-badge">
          <span class="badge-name">{{ selectedCoin.name }} ({{ selectedCoin.symbol }})</span>
          <button class="badge-clear" @click="clearSelection">&times;</button>
        </div>

        <!-- Form fields -->
        <form @submit.prevent="handleSubmit" class="form">
          <div class="form-row">
            <div class="field">
              <label>Nom</label>
              <input v-model="form.name" type="text" disabled placeholder="S&eacute;lectionnez un actif" />
            </div>
            <div class="field small">
              <label>Symbole</label>
              <input v-model="form.symbol" type="text" disabled placeholder="---" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="quantity">Quantit&eacute;</label>
              <input id="quantity" v-model.number="form.quantity" type="number" step="any" min="0.000001" placeholder="0.5" required />
            </div>
            <div class="field">
              <label for="purchasePrice">Prix d'achat (USD)</label>
              <input id="purchasePrice" v-model.number="form.purchasePrice" type="number" step="any" min="0.01" placeholder="45000" required />
            </div>
          </div>

          <div class="field">
            <label for="purchaseDate">Date d'achat</label>
            <input id="purchaseDate" v-model="form.purchaseDate" type="date" required />
          </div>

          <p v-if="error" class="error">{{ error }}</p>

          <div class="form-actions">
            <RouterLink to="/portfolio" class="btn-cancel">Annuler</RouterLink>
            <button type="submit" class="btn-submit" :disabled="submitting || !isValidCoin">
              {{ submitting ? 'Ajout...' : 'Ajouter au portefeuille' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Right: Chart -->
    <div class="chart-side">
      <div class="card chart-card">
        <template v-if="!selectedCoin">
          <div class="chart-placeholder">
            <div class="placeholder-icon">&#x1F4C8;</div>
            <p>S&eacute;lectionnez un actif pour voir son graphique</p>
          </div>
        </template>
        <template v-else>
          <div class="chart-header">
            <div class="chart-coin-info">
              <span class="chart-coin-name">{{ selectedCoin.name }}</span>
              <span class="chart-coin-symbol">{{ selectedCoin.symbol }}</span>
            </div>
            <div v-if="coinPrice" class="chart-price-info">
              <span class="chart-price">{{ formatCurrency(coinPrice.price) }}</span>
              <span class="chart-change" :class="coinPrice.change24h >= 0 ? 'positive' : 'negative'">
                {{ coinPrice.change24h >= 0 ? '+' : '' }}{{ coinPrice.change24h?.toFixed(2) }}%
              </span>
            </div>
          </div>

          <div class="chart-period-tabs">
            <button :class="{ active: chartDays === 1 }" @click="changeChartDays(1)">24H</button>
            <button :class="{ active: chartDays === 7 }" @click="changeChartDays(7)">7J</button>
            <button :class="{ active: chartDays === 30 }" @click="changeChartDays(30)">1M</button>
            <button :class="{ active: chartDays === 90 }" @click="changeChartDays(90)">3M</button>
            <button :class="{ active: chartDays === 365 }" @click="changeChartDays(365)">1A</button>
          </div>

          <div v-if="chartLoading" class="chart-loading">Chargement du graphique...</div>
          <PortfolioChart v-else-if="chartData.length > 0" :data="chartData" :label="selectedCoin.name" />
          <div v-else class="chart-loading">Graphique indisponible</div>

          <div v-if="coinPrice" class="chart-stats">
            <div class="chart-stat">
              <span class="chart-stat-label">Prix actuel</span>
              <span class="chart-stat-value">{{ formatCurrency(coinPrice.price) }}</span>
            </div>
            <div class="chart-stat">
              <span class="chart-stat-label">Variation 24h</span>
              <span class="chart-stat-value" :class="coinPrice.change24h >= 0 ? 'positive' : 'negative'">
                {{ coinPrice.change24h >= 0 ? '+' : '' }}{{ coinPrice.change24h?.toFixed(2) }}%
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e0e4f0;
  margin-bottom: 1rem;
}

.card {
  background: #111622;
  border: 1px solid #1e2433;
  border-radius: 12px;
  padding: 1.5rem;
}

.section-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4a5068;
  font-weight: 500;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

.section-label:first-child {
  margin-top: 0;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #1e2433;
  background: #151a28;
  color: #8890a4;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #25d695;
  color: #25d695;
}

.chip.active {
  background: #25d695;
  color: #000;
  border-color: #25d695;
  font-weight: 600;
}

/* Search */
.search-wrap {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #1e2433;
  background: #0b0e14;
  color: #e0e4f0;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: #25d695;
}

.search-input::placeholder {
  color: #2a3040;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #151a28;
  border: 1px solid #1e2433;
  border-radius: 8px;
  max-height: 280px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-status {
  padding: 0.75rem 1rem;
  color: #4a5068;
  font-size: 0.82rem;
  text-align: center;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 1rem;
  background: none;
  border: none;
  color: #c8ccda;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: #1e2433;
}

.coin-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.coin-result-name {
  flex: 1;
  font-weight: 500;
}

.coin-result-symbol {
  color: #4a5068;
  font-size: 0.75rem;
  font-weight: 500;
}

.coin-rank {
  color: #2a3040;
  font-size: 0.7rem;
}

/* Selected badge */
.selected-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.4rem 0.75rem;
  background: rgba(37, 214, 149, 0.1);
  border: 1px solid rgba(37, 214, 149, 0.25);
  border-radius: 6px;
}

.badge-name {
  font-size: 0.82rem;
  color: #25d695;
  font-weight: 500;
}

.badge-clear {
  background: none;
  border: none;
  color: #4a5068;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
  line-height: 1;
}

.badge-clear:hover {
  color: #ff5353;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1.25rem;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.form-row .field { flex: 1; }
.form-row .field.small { flex: 0 0 110px; }

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4a5068;
  font-weight: 500;
}

.field input {
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #1e2433;
  background: #0b0e14;
  color: #e0e4f0;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.15s;
}

.field input:disabled {
  color: #4a5068;
  background: #0d1018;
  cursor: not-allowed;
}

.field input:focus {
  outline: none;
  border-color: #25d695;
}

.field input::placeholder {
  color: #2a3040;
}

.error {
  color: #ff5353;
  font-size: 0.82rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 83, 83, 0.08);
  border-radius: 6px;
  border: 1px solid rgba(255, 83, 83, 0.2);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

.btn-cancel {
  padding: 0.55rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.82rem;
  background: #151a28;
  color: #8890a4;
  border: 1px solid #1e2433;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: #1e2433;
  color: #c8ccda;
}

.btn-submit {
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  background: #25d695;
  color: #000;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-submit:hover {
  background: #1fc084;
}

.btn-submit:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Chart side */
.chart-card {
  position: sticky;
  top: 72px;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.chart-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #2a3040;
  min-height: 380px;
}

.placeholder-icon {
  font-size: 2.5rem;
  opacity: 0.4;
}

.chart-placeholder p {
  font-size: 0.85rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.chart-coin-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e0e4f0;
}

.chart-coin-symbol {
  margin-left: 0.4rem;
  font-size: 0.8rem;
  color: #4a5068;
}

.chart-price-info {
  text-align: right;
}

.chart-price {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e4f0;
}

.chart-change {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 500;
}

.positive { color: #25d695; }
.negative { color: #ff5353; }

.chart-period-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.chart-period-tabs button {
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: none;
  background: #151a28;
  color: #4a5068;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.chart-period-tabs button:hover {
  color: #c8ccda;
}

.chart-period-tabs button.active {
  background: #1e2433;
  color: #25d695;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #4a5068;
  font-size: 0.82rem;
}

.chart-stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #1e2433;
}

.chart-stat-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4a5068;
  margin-bottom: 0.2rem;
}

.chart-stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: #e0e4f0;
}

@media (max-width: 768px) {
  .add-page {
    grid-template-columns: 1fr;
  }
  .chart-card {
    position: static;
  }
}
</style>
