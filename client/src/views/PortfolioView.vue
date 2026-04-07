<script setup>
import { onMounted, ref, computed } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio.js'

const store = usePortfolioStore()
const deletingId = ref(null)
const deleteModal = ref({ show: false, asset: null })

onMounted(() => {
  store.fetchAssets()
})

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR')
}

const enrichedAssets = computed(() => {
  return store.assets.map(a => {
    const priceData = store.getAssetPrice(a)
    const currentPrice = priceData?.price || a.purchasePrice
    const currentValue = a.quantity * currentPrice
    const cost = a.quantity * a.purchasePrice
    const pnl = currentValue - cost
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0
    const change24h = priceData?.change24h || 0
    return { ...a, currentPrice, currentValue, cost, pnl, pnlPercent, change24h }
  })
})

function openDeleteModal(asset) {
  deleteModal.value = { show: true, asset }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, asset: null }
}

async function confirmDelete() {
  const id = deleteModal.value.asset._id
  closeDeleteModal()
  deletingId.value = id
  try {
    await store.removeAsset(id)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="portfolio">
    <div class="page-header">
      <div>
        <h1>Portefeuille</h1>
        <p class="subtitle">
          Valeur totale :
          <span class="mono value">{{ formatCurrency(store.totalValue) }}</span>
          <span class="mono pnl" :class="store.totalPnl >= 0 ? 'positive' : 'negative'">
            {{ store.totalPnl >= 0 ? '+' : '' }}{{ formatCurrency(store.totalPnl) }}
            ({{ store.totalPnlPercent >= 0 ? '+' : '' }}{{ store.totalPnlPercent.toFixed(2) }}%)
          </span>
        </p>
      </div>
      <RouterLink to="/add" class="btn-add">+ Ajouter un actif</RouterLink>
    </div>

    <p v-if="store.loading" class="status">Chargement...</p>
    <p v-else-if="store.error" class="status error">{{ store.error }}</p>
    <div v-else-if="store.assets.length === 0" class="empty-state">
      <p>Aucun actif dans votre portefeuille</p>
      <RouterLink to="/add" class="btn-add">Ajouter votre premier actif</RouterLink>
    </div>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Actif</th>
            <th class="right">Prix actuel</th>
            <th class="right">24h</th>
            <th class="right">Quantit&eacute;</th>
            <th class="right">Co&ucirc;t</th>
            <th class="right">Valeur</th>
            <th class="right">P&L</th>
            <th class="right">Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in enrichedAssets" :key="asset._id">
            <td class="asset-name">
              <span class="symbol">{{ asset.symbol }}</span>
              <span class="name">{{ asset.name }}</span>
            </td>
            <td class="right mono">{{ formatCurrency(asset.currentPrice) }}</td>
            <td class="right mono" :class="asset.change24h >= 0 ? 'positive' : 'negative'">
              {{ asset.change24h >= 0 ? '+' : '' }}{{ asset.change24h.toFixed(2) }}%
            </td>
            <td class="right mono">{{ asset.quantity }}</td>
            <td class="right mono dim">{{ formatCurrency(asset.cost) }}</td>
            <td class="right mono">{{ formatCurrency(asset.currentValue) }}</td>
            <td class="right mono" :class="asset.pnl >= 0 ? 'positive' : 'negative'">
              {{ asset.pnl >= 0 ? '+' : '' }}{{ formatCurrency(asset.pnl) }}
              <small>{{ asset.pnlPercent >= 0 ? '+' : '' }}{{ asset.pnlPercent.toFixed(2) }}%</small>
            </td>
            <td class="right dim">{{ formatDate(asset.purchaseDate) }}</td>
            <td>
              <button
                class="btn-delete"
                :disabled="deletingId === asset._id"
                @click="openDeleteModal(asset)"
              >
                &times;
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteModal.show" class="modal-overlay" @click.self="closeDeleteModal">
          <div class="modal">
            <div class="modal-header">
              <h3>Supprimer l'actif</h3>
              <button class="modal-close" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p>Voulez-vous vraiment supprimer</p>
              <div class="modal-asset">
                <span class="modal-symbol">{{ deleteModal.asset?.symbol }}</span>
                <span class="modal-name">{{ deleteModal.asset?.name }}</span>
              </div>
              <p class="modal-detail">
                {{ deleteModal.asset?.quantity }} {{ deleteModal.asset?.symbol }}
                &mdash; achet&eacute; &agrave; {{ formatCurrency(deleteModal.asset?.purchasePrice) }}
              </p>
              <p class="modal-warning">Cette action est irr&eacute;versible.</p>
            </div>
            <div class="modal-actions">
              <button class="modal-btn cancel" @click="closeDeleteModal">Annuler</button>
              <button class="modal-btn delete" @click="confirmDelete">Supprimer</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.portfolio {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e0e4f0;
}

.subtitle {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: #4a5068;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.value {
  color: #e0e4f0;
  font-weight: 600;
}

.pnl {
  font-size: 0.8rem;
}

.btn-add {
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  background: #25d695;
  color: #000;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-add:hover {
  background: #1fc084;
}

.status {
  text-align: center;
  padding: 3rem;
  color: #4a5068;
}

.status.error { color: #ff5353; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: #4a5068;
}

.table-wrap {
  background: #111622;
  border: 1px solid #1e2433;
  border-radius: 12px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 0.7rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4a5068;
  font-weight: 500;
  border-bottom: 1px solid #1e2433;
}

td {
  padding: 0.7rem 1rem;
  font-size: 0.82rem;
  color: #c8ccda;
  border-bottom: 1px solid #151a28;
}

tbody tr:hover {
  background: #151a28;
}

tbody tr:last-child td {
  border-bottom: none;
}

.right { text-align: right; }

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.dim { color: #4a5068; }

.positive { color: #25d695; }
.negative { color: #ff5353; }

.asset-name {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.symbol {
  font-weight: 600;
  color: #e0e4f0;
}

.name {
  color: #4a5068;
  font-size: 0.75rem;
}

td small {
  display: block;
  font-size: 0.7rem;
  margin-top: 0.1rem;
}

.btn-delete {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid #2a2f3e;
  color: #4a5068;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
}

.btn-delete:hover {
  border-color: #ff5353;
  color: #ff5353;
  background: rgba(255, 83, 83, 0.1);
}

.btn-delete:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #111622;
  border: 1px solid #1e2433;
  border-radius: 14px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #1e2433;
}

.modal-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e0e4f0;
}

.modal-close {
  background: none;
  border: none;
  color: #4a5068;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}

.modal-close:hover {
  color: #c8ccda;
}

.modal-body {
  padding: 1.25rem;
}

.modal-body > p {
  color: #8890a4;
  font-size: 0.85rem;
}

.modal-asset {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: #151a28;
  border-radius: 8px;
  border: 1px solid #1e2433;
}

.modal-symbol {
  font-weight: 700;
  font-size: 1rem;
  color: #e0e4f0;
}

.modal-name {
  color: #4a5068;
  font-size: 0.85rem;
}

.modal-detail {
  font-size: 0.8rem;
  color: #4a5068;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 0.75rem;
}

.modal-warning {
  font-size: 0.78rem;
  color: #ff5353;
  opacity: 0.8;
}

.modal-actions {
  display: flex;
  gap: 0.6rem;
  padding: 0 1.25rem 1.25rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.modal-btn.cancel {
  background: #151a28;
  color: #8890a4;
  border: 1px solid #1e2433;
}

.modal-btn.cancel:hover {
  background: #1e2433;
  color: #c8ccda;
}

.modal-btn.delete {
  background: #ff5353;
  color: #fff;
}

.modal-btn.delete:hover {
  background: #e04444;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(8px);
}
</style>
