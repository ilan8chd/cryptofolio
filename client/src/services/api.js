const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(endpoint, options = {}) {
  const headers = {}
  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new Error(data.error || 'Erreur serveur')
  }
  return data
}

export function getAssets() {
  return request('/assets')
}

export function getAsset(id) {
  return request(`/assets/${id}`)
}

export function createAsset(asset) {
  return request('/assets', {
    method: 'POST',
    body: JSON.stringify(asset),
  })
}

export function updateAsset(id, asset) {
  return request(`/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(asset),
  })
}

export function deleteAsset(id) {
  return request(`/assets/${id}`, {
    method: 'DELETE',
  })
}
