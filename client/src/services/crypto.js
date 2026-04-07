const COINGECKO_URL = 'https://api.coingecko.com/api/v3'

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
  const url = `${COINGECKO_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur API CoinGecko')
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
  const url = `${COINGECKO_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h,7d`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur API CoinGecko')
  return res.json()
}

export async function fetchCoinHistory(symbol, days = 30) {
  const id = getCoinId(symbol)
  const url = `${COINGECKO_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur API CoinGecko')
  const data = await res.json()
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
}

export async function searchCoins(query) {
  if (!query || query.length < 2) return []
  const url = `${COINGECKO_URL}/search?query=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur recherche CoinGecko')
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
  const url = `${COINGECKO_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (!data[coinId]) return null
  return { price: data[coinId].usd, change24h: data[coinId].usd_24h_change }
}

export async function fetchCoinHistoryById(coinId, days = 30) {
  const url = `${COINGECKO_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur API CoinGecko')
  const data = await res.json()
  return data.prices.map(([timestamp, price]) => ({ timestamp, price }))
}

export async function fetchPricesByIds(coinIds = []) {
  const ids = coinIds.join(',')
  const url = `${COINGECKO_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur API CoinGecko')
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
