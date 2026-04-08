const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const SYMBOL_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  ATOM: 'cosmos',
}

function getCoinId(symbol) {
  return SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase()
}

export async function fetchPrices(symbols = []) {
  const ids = symbols.map(getCoinId).join(',')
  const res = await fetch(`${API_URL}/market/prices?ids=${ids}`)
  if (!res.ok) throw new Error('Erreur API')
  const data = await res.json()

  const prices = {}
  for (const symbol of symbols) {
    const id = getCoinId(symbol)
    if (data[id]) {
      prices[symbol.toUpperCase()] = {
        price: data[id].usd,
        change24h: data[id].usd_24h_change,
        marketCap: data[id].usd_market_cap,
      }
    }
  }
  return prices
}

export async function fetchMarketData() {
  const res = await fetch(`${API_URL}/market/coins`)
  if (!res.ok) throw new Error('Erreur API')
  return res.json()
}

export async function fetchCoinHistory(symbol, days = 30) {
  const id = getCoinId(symbol)
  const res = await fetch(`${API_URL}/market/history?id=${id}&days=${days}`)
  if (!res.ok) throw new Error('Erreur API')
  const data = await res.json()
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
}

export async function searchCoins(query) {
  if (!query || query.length < 2) return []
  const res = await fetch(`${API_URL}/market/search?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Erreur recherche')
  const data = await res.json()
  return data.coins.slice(0, 10).map(coin => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    thumb: coin.thumb,
    marketCapRank: coin.market_cap_rank,
  }))
}

export async function getCoinPrice(coinId) {
  const res = await fetch(`${API_URL}/market/prices?ids=${coinId}`)
  if (!res.ok) return null
  const data = await res.json()
  if (!data[coinId]) return null
  return { price: data[coinId].usd, change24h: data[coinId].usd_24h_change }
}

export async function fetchCoinHistoryById(coinId, days = 30) {
  const res = await fetch(`${API_URL}/market/history?id=${coinId}&days=${days}`)
  if (!res.ok) throw new Error('Erreur API')
  const data = await res.json()
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
}

export async function fetchPricesByIds(coinIds = []) {
  const ids = coinIds.join(',')
  const res = await fetch(`${API_URL}/market/prices?ids=${ids}`)
  if (!res.ok) throw new Error('Erreur API')
  const data = await res.json()

  const prices = {}
  for (const id of coinIds) {
    if (data[id]) {
      prices[id] = {
        price: data[id].usd,
        change24h: data[id].usd_24h_change,
        marketCap: data[id].usd_market_cap,
      }
    }
  }
  return prices
}

export { SYMBOL_TO_ID, getCoinId }
