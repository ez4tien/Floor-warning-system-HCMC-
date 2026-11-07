import { useEffect, useRef, useState } from 'react'
import { severityMeta } from '../alerts/alert-data'
import type { FloodAlert } from '../alerts/alert-data'

type FloodMapProps = {
  alerts: FloodAlert[]
  selectedAlertId: number | null
  onSelectAlert: (alert: FloodAlert) => void
}

const mapBounds = { south: 10.784, north: 10.812, west: 106.704, east: 106.729 }

function projectPoint(point: { lat: number; lng: number }) {
  return {
    x: ((point.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 430,
    y: ((mapBounds.north - point.lat) / (mapBounds.north - mapBounds.south)) * 720,
  }
}

function FallbackMap({ alerts, selectedAlertId, onSelectAlert }: FloodMapProps) {
  return (
    <div className="fallback-map" aria-label="Bản đồ mô phỏng khu vực Bình Thạnh">
      <svg viewBox="0 0 430 720" preserveAspectRatio="xMidYMid slice">
        <rect width="430" height="720" fill="#dfe8e1" />
        <path d="M-20 90 450 420M-30 480 390 90M55-20 380 730M-10 320 450 570M170-20 30 740M250-20 445 240" stroke="#f9faf6" strokeWidth="18" />
        <path d="M-20 90 450 420M-30 480 390 90M55-20 380 730M-10 320 450 570M170-20 30 740M250-20 445 240" stroke="#c9d2cb" strokeWidth="1.5" />
        <path d="M355-20c-60 120 45 190-22 290s42 170 6 265 22 160 4 205" fill="none" stroke="#aacfd3" strokeWidth="46" />
        <g fill="#cad7c9" opacity=".75">
          <path d="m50 115 82 55-34 70-88-61Z" />
          <path d="m205 80 100 66-32 55-104-63Z" />
          <path d="m65 390 84 50-42 96-83-55Z" />
          <path d="m230 480 72 49-38 89-84-53Z" />
        </g>
        {alerts.map((alert) => {
          const color = severityMeta[alert.severity].color
          const selected = alert.id === selectedAlertId
          const path = alert.path.map(projectPoint).map(({ x, y }) => `${x},${y}`).join(' ')
          const point = projectPoint(alert)

          return (
            <g key={alert.id} className={`fallback-alert ${selected ? 'selected' : ''}`}>
              <polyline className="flood-route-underlay" points={path} />
              <polyline className="flood-route-line" points={path} style={{ stroke: color }} />
              <polyline className="flood-route-flow" points={path} />
              <circle cx={point.x} cy={point.y} r="23" fill={color} opacity=".13" />
              <g
                className="fallback-alert-marker"
                transform={`translate(${point.x} ${point.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${alert.title}, ${alert.depth} cm`}
                onClick={() => onSelectAlert(alert)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectAlert(alert)
                  }
                }}
              >
                <circle r="9" fill={color} stroke="white" strokeWidth="3" />
                <rect x="11" y="-11" width="43" height="22" rx="11" fill={color} stroke="white" strokeWidth="2" />
                <text x="32.5" y="4" textAnchor="middle">{alert.depth}cm</text>
              </g>
            </g>
          )
        })}
        <g fontFamily="Arial, sans-serif" fontSize="10" fill="#78837c">
          <text x="38" y="290">Đ. Điện Biên Phủ</text>
          <text x="231" y="455">Nguyễn Hữu Cảnh</text>
          <text x="50" y="600">QUẬN 1</text>
          <text x="176" y="180">BÌNH THẠNH</text>
        </g>
      </svg>
    </div>
  )
}

export default function FloodMap({ alerts, selectedAlertId, onSelectAlert }: FloodMapProps) {
  const mapNode = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)

  useEffect(() => {
    if (!apiKey) return

    let cancelled = false
    const setupMap = () => {
      if (cancelled || !mapNode.current || mapRef.current) return
      const google = (window as any).google
      if (!google?.maps) return
      mapRef.current = new google.maps.Map(mapNode.current, {
        center: { lat: 10.797, lng: 106.714 },
        zoom: 14,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        mapId: 'flood-watch-map',
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      })
      setMapReady(true)
    }
    const handleError = () => setMapFailed(true)

    if ((window as any).google?.maps) {
      setupMap()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]')
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', setupMap)
    script.addEventListener('error', handleError)
    if (!existing) {
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`
      script.async = true
      script.dataset.googleMaps = 'true'
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      script.removeEventListener('load', setupMap)
      script.removeEventListener('error', handleError)
    }
  }, [apiKey])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const google = (window as any).google
    const overlays: any[] = []
    alerts.forEach((alert) => {
      const color = severityMeta[alert.severity].color
      overlays.push(new google.maps.Polyline({
        path: alert.path,
        map: mapRef.current,
        strokeColor: '#ffffff',
        strokeOpacity: 0.9,
        strokeWeight: alert.id === selectedAlertId ? 15 : 13,
      }))
      overlays.push(new google.maps.Polyline({
        path: alert.path,
        map: mapRef.current,
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: alert.id === selectedAlertId ? 10 : 8,
      }))
      overlays.push(new google.maps.Circle({
        center: { lat: alert.lat, lng: alert.lng },
        radius: 190,
        map: mapRef.current,
        fillColor: color,
        fillOpacity: 0.13,
        strokeColor: color,
        strokeOpacity: 0.35,
        strokeWeight: 1,
      }))
      const marker = new google.maps.Marker({
        position: { lat: alert.lat, lng: alert.lng },
        map: mapRef.current,
        title: alert.title,
        label: { text: `${alert.depth}cm`, color: '#ffffff', fontSize: '10px', fontWeight: '700' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      })
      marker.addListener('click', () => onSelectAlert(alert))
      overlays.push(marker)
    })

    const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId)
    if (selectedAlert) {
      mapRef.current.panTo({ lat: selectedAlert.lat, lng: selectedAlert.lng })
      mapRef.current.setZoom(16)
    }

    return () => overlays.forEach((overlay) => overlay.setMap(null))
  }, [alerts, mapReady, onSelectAlert, selectedAlertId])

  if (!apiKey || mapFailed) {
    return <FallbackMap alerts={alerts} selectedAlertId={selectedAlertId} onSelectAlert={onSelectAlert} />
  }

  return <div ref={mapNode} className="google-map" aria-label="Bản đồ cảnh báo ngập trực tiếp" />
}
