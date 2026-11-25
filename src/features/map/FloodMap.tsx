import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { severityMeta } from '../alerts/alert-data'
import type { FloodAlert } from '../alerts/alert-data'
import type { SafeRoutePlan } from './route-planner'

type FloodMapProps = {
  alerts: FloodAlert[]
  selectedAlertId: number | null
  onSelectAlert: (alert: FloodAlert) => void
  route: SafeRoutePlan | null
}

function toLatLng(point: { lat: number; lng: number }) {
  return L.latLng(point.lat, point.lng)
}

export default function FloodMap({ alerts, selectedAlertId, onSelectAlert, route }: FloodMapProps) {
  const mapNode = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapNode.current) return

    const map = L.map(mapNode.current, { zoomControl: false }).setView([10.797, 106.714], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    mapRef.current = map
    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      window.cancelAnimationFrame(resizeFrame)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const overlays = L.layerGroup().addTo(map)
    const routePath = route?.path.map(toLatLng) ?? []
    alerts.forEach((alert) => {
      const color = severityMeta[alert.severity].color
      const line = alert.path.map(toLatLng)
      L.polyline(line, {
        color: '#ffffff',
        opacity: 0.9,
        weight: alert.id === selectedAlertId ? 15 : 13,
      }).addTo(overlays)
      L.polyline(line, {
        color,
        opacity: 1,
        weight: alert.id === selectedAlertId ? 10 : 8,
      }).addTo(overlays)
      L.circle([alert.lat, alert.lng], {
        radius: 180,
        color,
        fillColor: color,
        fillOpacity: 0.13,
        opacity: 0.35,
        weight: 1,
      }).addTo(overlays)
    })

    if (route) {
      L.polyline(routePath, { color: '#ffffff', opacity: 0.96, weight: 11 }).addTo(overlays)
      L.polyline(routePath, { color: '#147b59', opacity: 1, weight: 7 }).addTo(overlays)
    }

    alerts.forEach((alert) => {
      const color = severityMeta[alert.severity].color
      const marker = L.circleMarker([alert.lat, alert.lng], {
        radius: alert.id === selectedAlertId ? 10 : 8,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 1,
        weight: 3,
      }).bindTooltip(`${alert.depth}cm`, { permanent: true, direction: 'right', className: 'flood-marker-label' })
      marker.on('click', () => onSelectAlert(alert))
      marker.addTo(overlays)
    })

    if (route) {
      route.hazards.forEach((alert) => {
        const marker = L.circleMarker([alert.lat, alert.lng], {
          radius: 11,
          color: '#ffffff',
          fillColor: severityMeta[alert.severity].color,
          fillOpacity: 1,
          weight: 3,
        }).bindTooltip('!', { permanent: true, direction: 'center', className: 'route-hazard-label' })
        marker.on('click', () => onSelectAlert(alert))
        marker.addTo(overlays)
      })
      L.circleMarker(toLatLng(route.origin), {
        radius: 9,
        color: '#ffffff',
        fillColor: '#147b59',
        fillOpacity: 1,
        weight: 3,
      }).bindTooltip('A', { permanent: true, direction: 'center', className: 'route-origin-label' }).addTo(overlays)
      L.circleMarker(toLatLng(route.destination), {
        radius: 9,
        color: '#ffffff',
        fillColor: '#e3382f',
        fillOpacity: 1,
        weight: 3,
      }).bindTooltip('B', { permanent: true, direction: 'center', className: 'route-destination-label' }).addTo(overlays)

      const selectedRouteAlert = route.hazards.find((alert) => alert.id === selectedAlertId)
      const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId) ?? selectedRouteAlert
      if (selectedAlert) {
        map.panTo([selectedAlert.lat, selectedAlert.lng])
        map.setZoom(16)
      } else {
        map.fitBounds(L.latLngBounds(routePath), { paddingTopLeft: [32, 120], paddingBottomRight: [32, 230], maxZoom: 16 })
      }
    } else {
      const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId)
      if (selectedAlert) {
        map.panTo([selectedAlert.lat, selectedAlert.lng])
        map.setZoom(16)
      }
    }

    return () => {
      overlays.remove()
    }
  }, [alerts, onSelectAlert, route, selectedAlertId])

  return <div ref={mapNode} className="osm-map" aria-label="Bản đồ OpenStreetMap cảnh báo ngập" />
}
