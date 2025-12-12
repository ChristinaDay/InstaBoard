import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { NormalizedSavedPost } from '../types'

import './MapView.css'

type LatLng = { lat: number; lng: number }
type GeocodeCache = Record<string, LatLng>

const CACHE_KEY = 'instaboard_geocode_cache_v1'
const THROTTLE_MS = 850

function loadCache(): GeocodeCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as GeocodeCache
  } catch {
    return {}
  }
}

function saveCache(cache: GeocodeCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function geocodeNominatim(query: string, signal: AbortSignal): Promise<LatLng | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '1')

  const resp = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!resp.ok) return null
  const data = (await resp.json()) as Array<{ lat: string; lon: string }>
  const first = data?.[0]
  if (!first) return null
  const lat = Number(first.lat)
  const lng = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function locationKey(post: NormalizedSavedPost): string | null {
  const parts = [post.locationCity, post.locationRegion].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (post.locationName) return post.locationName
  return null
}

interface MapViewProps {
  posts: NormalizedSavedPost[]
  onSelect: (post: NormalizedSavedPost) => void
}

export function MapView({ posts, onSelect }: MapViewProps) {
  const locations = useMemo(() => {
    const map = new Map<string, NormalizedSavedPost[]>()
    for (const post of posts) {
      const key = locationKey(post)
      if (!key) continue
      const list = map.get(key)
      if (list) list.push(post)
      else map.set(key, [post])
    }
    return Array.from(map.entries()).map(([key, postsAtLocation]) => ({
      key,
      posts: postsAtLocation,
    }))
  }, [posts])

  const [cache, setCache] = useState<GeocodeCache>({})
  const [geocoding, setGeocoding] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setCache(loadCache())
  }, [])

  useEffect(() => {
    // Whenever locations change, try to geocode missing ones in the background (throttled).
    const missing = locations.map((l) => l.key).filter((key) => !cache[key])
    if (missing.length === 0) return

    // Avoid launching multiple loops.
    if (geocoding) return

    const controller = new AbortController()
    abortRef.current = controller
    setGeocoding(true)
    setProgress({ done: 0, total: missing.length })

    ;(async () => {
      let done = 0
      let nextCache = cache

      for (const key of missing) {
        if (controller.signal.aborted) break
        const result = await geocodeNominatim(key, controller.signal)
        if (result) {
          nextCache = { ...nextCache, [key]: result }
          setCache(nextCache)
          saveCache(nextCache)
        }
        done += 1
        setProgress({ done, total: missing.length })
        await sleep(THROTTLE_MS)
      }

      setGeocoding(false)
    })().catch(() => {
      setGeocoding(false)
    })

    return () => {
      controller.abort()
      abortRef.current = null
      setGeocoding(false)
    }
    // Intentionally depend on locations + cache keys, but not geocoding/progress to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations])

  const markers = useMemo(() => {
    return locations
      .map((loc) => ({
        ...loc,
        latlng: cache[loc.key],
      }))
      .filter((loc) => !!loc.latlng)
  }, [locations, cache])

  const center: LatLngExpression = markers.length
    ? ([markers[0]!.latlng!.lat, markers[0]!.latlng!.lng] as LatLngExpression)
    : ([20, 0] as LatLngExpression)

  return (
    <div className="mapview">
      <div className="mapview-bar">
        <div className="mapview-bar-left">
          <div className="mapview-title">Map</div>
          <div className="mapview-subtitle">
            Showing {markers.length} mapped locations (from {locations.length} with location labels)
          </div>
        </div>
        <div className="mapview-bar-right">
          {geocoding && (
            <div className="mapview-status">
              Geocoding… {progress.done} / {progress.total}
            </div>
          )}
        </div>
      </div>

      <div className="mapview-canvas">
        <MapContainer center={center} zoom={markers.length ? 5 : 2} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.map((loc) => {
            const latlng = loc.latlng!
            return (
              <CircleMarker key={loc.key} center={[latlng.lat, latlng.lng]} radius={8} pathOptions={{ color: '#4f46e5' }}>
                <Popup>
                  <div className="mapview-popup">
                    <div className="mapview-popup-title">{loc.key}</div>
                    <div className="mapview-popup-subtitle">{loc.posts.length} posts</div>
                    <div className="mapview-popup-list">
                      {loc.posts.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="mapview-popup-item"
                          onClick={() => onSelect(p)}
                        >
                          @{p.ownerUsername} — {p.shortcode}
                        </button>
                      ))}
                      {loc.posts.length > 8 && (
                        <div className="mapview-popup-more">…and {loc.posts.length - 8} more</div>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}


