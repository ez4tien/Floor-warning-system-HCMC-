export type GeoPoint = {
  lat: number
  lng: number
}

export type PlaceSuggestion = {
  placeId: number
  label: string
  location: GeoPoint
}

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

let lastNominatimRequestAt = 0

function waitForNominatimSlot(signal?: AbortSignal) {
  const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt))
  if (waitMs === 0) {
    if (signal?.aborted) return Promise.reject(new DOMException('Request cancelled', 'AbortError'))
    lastNominatimRequestAt = Date.now()
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request cancelled', 'AbortError'))
      return
    }

    let timeout: number
    const abort = () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Request cancelled', 'AbortError'))
    }
    timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      if (signal?.aborted) {
        reject(new DOMException('Request cancelled', 'AbortError'))
        return
      }
      lastNominatimRequestAt = Date.now()
      resolve()
    }, waitMs)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 2) return []

  await waitForNominatimSlot(signal)
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'vn',
    'accept-language': 'vi',
    viewbox: '106.48,10.92,106.92,10.62',
    q: trimmedQuery,
  })
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'vi' },
    signal,
  })
  if (!response.ok) {
    throw new Error(response.status === 429
      ? 'Dịch vụ gợi ý địa điểm đang giới hạn yêu cầu. Vui lòng đợi một chút rồi thử lại.'
      : `Không thể tìm địa điểm (HTTP ${response.status}). Vui lòng thử lại.`)
  }

  const results = await response.json() as NominatimResult[]
  return results.flatMap((result) => {
    const lat = Number(result.lat)
    const lng = Number(result.lon)
    if (!result.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) return []
    return [{ placeId: result.place_id, label: result.display_name, location: { lat, lng } }]
  })
}

export async function geocodePlace(query: string): Promise<PlaceSuggestion> {
  const [place] = await searchPlaces(query)
  if (!place) throw new Error(`Không tìm thấy tọa độ cho "${query}". Hãy chọn một gợi ý địa điểm.`)
  return place
}
