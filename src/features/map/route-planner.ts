import type { FloodAlert } from '../alerts/alert-data'
import { geocodePlace, type GeoPoint } from './place-search'

export type RouteEndpoint = {
  label: string
  location: GeoPoint | null
}

export type SafeRoutePlan = {
  origin: GeoPoint
  destination: GeoPoint
  path: GeoPoint[]
  distanceMeters: number
  durationSeconds: number
  hazards: FloodAlert[]
  avoidedCount: number
  isDetour: boolean
  noSafeAlternative: boolean
}

type OsrmRoute = {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
  }
}

type OsrmResponse = {
  code: string
  message?: string
  routes?: OsrmRoute[]
}

type RouteCandidate = {
  path: GeoPoint[]
  hazards: FloodAlert[]
  distanceMeters: number
  durationSeconds: number
}

class NoRouteError extends Error {}

const floodZoneRadiusMeters = 180
const detourMarginMeters = 220

function pointToSegmentDistanceMeters(point: GeoPoint, start: GeoPoint, end: GeoPoint) {
  const latitudeScale = 111_320
  const longitudeScale = latitudeScale * Math.cos((point.lat * Math.PI) / 180)
  const startX = (start.lng - point.lng) * longitudeScale
  const startY = (start.lat - point.lat) * latitudeScale
  const endX = (end.lng - point.lng) * longitudeScale
  const endY = (end.lat - point.lat) * latitudeScale
  const segmentX = endX - startX
  const segmentY = endY - startY
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY
  const projection = segmentLengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, -(startX * segmentX + startY * segmentY) / segmentLengthSquared))
  const closestX = startX + projection * segmentX
  const closestY = startY + projection * segmentY

  return Math.hypot(closestX, closestY)
}

function segmentDistanceMeters(firstStart: GeoPoint, firstEnd: GeoPoint, secondStart: GeoPoint, secondEnd: GeoPoint) {
  const referenceLatitude = (firstStart.lat + firstEnd.lat + secondStart.lat + secondEnd.lat) / 4
  const longitudeScale = 111_320 * Math.cos((referenceLatitude * Math.PI) / 180)
  const latitudeScale = 111_320
  const project = (point: GeoPoint) => ({ x: point.lng * longitudeScale, y: point.lat * latitudeScale })
  const a = project(firstStart)
  const b = project(firstEnd)
  const c = project(secondStart)
  const d = project(secondEnd)
  const orientation = (start: { x: number; y: number }, end: { x: number; y: number }, point: { x: number; y: number }) => (
    (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x)
  )
  const onSegment = (start: { x: number; y: number }, point: { x: number; y: number }, end: { x: number; y: number }) => (
    point.x >= Math.min(start.x, end.x) - 0.001
    && point.x <= Math.max(start.x, end.x) + 0.001
    && point.y >= Math.min(start.y, end.y) - 0.001
    && point.y <= Math.max(start.y, end.y) + 0.001
  )
  const firstStartOrientation = orientation(a, b, c)
  const firstEndOrientation = orientation(a, b, d)
  const secondStartOrientation = orientation(c, d, a)
  const secondEndOrientation = orientation(c, d, b)
  const segmentsIntersect = (
    (firstStartOrientation * firstEndOrientation < 0 && secondStartOrientation * secondEndOrientation < 0)
    || (Math.abs(firstStartOrientation) < 0.001 && onSegment(a, c, b))
    || (Math.abs(firstEndOrientation) < 0.001 && onSegment(a, d, b))
    || (Math.abs(secondStartOrientation) < 0.001 && onSegment(c, a, d))
    || (Math.abs(secondEndOrientation) < 0.001 && onSegment(c, b, d))
  )
  if (segmentsIntersect) return 0

  return Math.min(
    pointToSegmentDistanceMeters(firstStart, secondStart, secondEnd),
    pointToSegmentDistanceMeters(firstEnd, secondStart, secondEnd),
    pointToSegmentDistanceMeters(secondStart, firstStart, firstEnd),
    pointToSegmentDistanceMeters(secondEnd, firstStart, firstEnd),
  )
}

function isNearAlert(path: GeoPoint[], alert: FloodAlert) {
  const alertCenter = { lat: alert.lat, lng: alert.lng }
  const floodPoints = [alertCenter, ...alert.path]
  const routeSegments = path.length === 1
    ? [[path[0], path[0]] as const]
    : path.slice(0, -1).map((point, index) => [point, path[index + 1]] as const)
  if (floodPoints.some((point) => routeSegments.some(([start, end]) => (
    pointToSegmentDistanceMeters(point, start, end) <= floodZoneRadiusMeters
  )))) return true

  const floodSegments = alert.path.slice(0, -1).map((point, index) => [point, alert.path[index + 1]] as const)
  return routeSegments.some(([routeStart, routeEnd]) => floodSegments.some(([floodStart, floodEnd]) => (
    segmentDistanceMeters(routeStart, routeEnd, floodStart, floodEnd) <= floodZoneRadiusMeters
  )))
}

function getRiskScore(candidate: RouteCandidate) {
  return candidate.hazards.reduce((score, alert) => {
    const weight = alert.severity === 'critical' ? 100 : alert.severity === 'warning' ? 30 : 10
    return score + weight
  }, 0)
}

function getNearestSegmentIndex(point: GeoPoint, path: GeoPoint[]) {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  for (let index = 0; index < path.length - 1; index += 1) {
    const distance = pointToSegmentDistanceMeters(point, path[index], path[index + 1])
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  }
  return nearestIndex
}

function createDetourWaypoints(route: RouteCandidate, hazards: FloodAlert[], side: 1 | -1) {
  return hazards
    .map((alert) => ({ alert, segmentIndex: getNearestSegmentIndex({ lat: alert.lat, lng: alert.lng }, route.path) }))
    .sort((first, second) => first.segmentIndex - second.segmentIndex)
    .slice(0, 23)
    .map(({ alert, segmentIndex }) => {
      const start = route.path[segmentIndex]
      const end = route.path[Math.min(segmentIndex + 1, route.path.length - 1)]
      const latitudeScale = 111_320
      const longitudeScale = latitudeScale * Math.cos((alert.lat * Math.PI) / 180)
      const directionX = (end.lng - start.lng) * longitudeScale
      const directionY = (end.lat - start.lat) * latitudeScale
      const length = Math.hypot(directionX, directionY) || 1
      const offset = (floodZoneRadiusMeters + detourMarginMeters) * side
      return {
        lat: alert.lat + ((directionX / length) * offset) / latitudeScale,
        lng: alert.lng + ((-directionY / length) * offset) / longitudeScale,
      }
    })
}

async function requestRoutes(points: GeoPoint[], alternatives: boolean): Promise<OsrmRoute[]> {
  const coordinates = points.map(({ lat, lng }) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false&alternatives=${alternatives}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Không thể tìm lộ trình (OSRM HTTP ${response.status}). Vui lòng thử lại.`)
  const result = await response.json() as OsrmResponse
  if (result.code !== 'Ok' || !result.routes?.length) {
    if (result.code === 'NoRoute' || result.code === 'NoSegment') {
      throw new NoRouteError(result.message ?? 'Không có đường phù hợp với các điểm đã chọn.')
    }
    throw new Error(result.message
      ? `Không tìm thấy đường đi: ${result.message}`
      : 'Không tìm thấy lộ trình phù hợp. Hãy kiểm tra lại điểm đi và điểm đến.')
  }
  return result.routes
}

function makeCandidates(routes: OsrmRoute[], alerts: FloodAlert[]): RouteCandidate[] {
  return routes.flatMap((route) => {
    const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
    if (path.length < 2 || route.distance <= 0 || route.duration <= 0) return []
    return [{
      path,
      hazards: alerts.filter((alert) => isNearAlert(path, alert)),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    }]
  })
}

function shortestFirst(candidates: RouteCandidate[]) {
  return [...candidates].sort((first, second) => first.distanceMeters - second.distanceMeters)
}

function safestFirst(candidates: RouteCandidate[]) {
  return [...candidates].sort((first, second) => (
    getRiskScore(first) - getRiskScore(second) || first.distanceMeters - second.distanceMeters
  ))
}

export async function findSafeRoute(
  origin: RouteEndpoint,
  destination: RouteEndpoint,
  alerts: FloodAlert[],
  avoidFloodedRoads: boolean,
): Promise<SafeRoutePlan> {
  const resolvedOrigin = origin.location ?? (await geocodePlace(origin.label)).location
  const resolvedDestination = destination.location ?? (await geocodePlace(destination.label)).location
  const initialCandidates = makeCandidates(await requestRoutes([resolvedOrigin, resolvedDestination], true), alerts)
  if (initialCandidates.length === 0) throw new Error('Dịch vụ định tuyến không trả về lộ trình hợp lệ.')

  const shortestRoute = shortestFirst(initialCandidates)[0]
  let chosenRoute = shortestRoute

  if (avoidFloodedRoads) {
    const safeAlternatives = initialCandidates.filter((candidate) => candidate.hazards.length === 0)
    if (safeAlternatives.length > 0) {
      chosenRoute = shortestFirst(safeAlternatives)[0]
    } else if (shortestRoute.hazards.length > 0) {
      const detourCandidates: RouteCandidate[] = []
      for (const side of [1, -1] as const) {
        try {
          const waypoints = createDetourWaypoints(shortestRoute, shortestRoute.hazards, side)
          detourCandidates.push(...makeCandidates(
            await requestRoutes([resolvedOrigin, ...waypoints, resolvedDestination], false),
            alerts,
          ))
        } catch (error) {
          if (error instanceof NoRouteError) continue
          throw error
        }
      }

      const safeDetours = detourCandidates.filter((candidate) => candidate.hazards.length === 0)
      if (safeDetours.length > 0) chosenRoute = shortestFirst(safeDetours)[0]
      else if (detourCandidates.length > 0) chosenRoute = safestFirst([...initialCandidates, ...detourCandidates])[0]
      else chosenRoute = safestFirst(initialCandidates)[0]
    }
  }

  const avoidedAlerts = shortestRoute.hazards.filter((alert) => (
    !chosenRoute.hazards.some((routeAlert) => routeAlert.id === alert.id)
  ))

  return {
    origin: resolvedOrigin,
    destination: resolvedDestination,
    path: chosenRoute.path,
    distanceMeters: chosenRoute.distanceMeters,
    durationSeconds: chosenRoute.durationSeconds,
    hazards: chosenRoute.hazards,
    avoidedCount: avoidedAlerts.length,
    isDetour: chosenRoute !== shortestRoute,
    noSafeAlternative: avoidFloodedRoads && chosenRoute.hazards.length > 0,
  }
}
