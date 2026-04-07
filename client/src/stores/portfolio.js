import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getAssets, createAsset, deleteAsset } from '@/services/api.js'
import { fetchPricesByIds } from '@/services/crypto.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const assets = ref([])
  const loading = ref(false)
  const error = ref(null)
  const marketPrices = ref({})
  const pricesLoading = ref(false)

  const totalValue = computed(() => {
    return assets.value.reduce((sum, a) => {
      const key = a.coinGeckoId || a.symbol.toUpperCase()
      const currentPrice = marketPrices.value[key]?.price
      return sum + a.quantity * (currentPrice || a.purchasePrice)
    }, 0)
  })

  const totalCost = computed(() => {
    return assets.value.reduce((sum, a) => sum + a.quantity * a.purchasePrice, 0)
  })

  const totalPnl = computed(() => totalValue.value - totalCost.value)
  const totalPnlPercent = computed(() => totalCost.value > 0 ? (totalPnl.value / totalCost.value) * 100 : 0)
  const assetCount = computed(() => assets.value.length)

  function getAssetPrice(asset) {
    const key = asset.coinGeckoId || asset.symbol.toUpperCase()
    return marketPrices.value[key] || null
  }

  async function fetchAssets() {
    loading.value = true
    error.value = null
    try {
      const data = await getAssets()
      assets.value = data.assets
      if (data.assets.length > 0) {
        await loadPrices()
      }
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadPrices() {
    const coinIds = [...new Set(
      assets.value.map(a => a.coinGeckoId).filter(Boolean)
    )]
    if (coinIds.length === 0) return
    pricesLoading.value = true
    try {
      marketPrices.value = await fetchPricesByIds(coinIds)
    } catch {
      // Prices unavailable, continue with purchase prices
    } finally {
      pricesLoading.value = false
    }
  }

  async function addAsset(asset) {
    const data = await createAsset(asset)
    assets.value.unshift(data.asset)
    await loadPrices()
    return data.asset
  }

  async function removeAsset(id) {
    await deleteAsset(id)
    assets.value = assets.value.filter(a => a._id !== id)
  }

  return {
    assets, loading, error, marketPrices, pricesLoading,
    totalValue, totalCost, totalPnl, totalPnlPercent, assetCount,
    fetchAssets, addAsset, removeAsset, loadPrices, getAssetPrice,
  }
})
