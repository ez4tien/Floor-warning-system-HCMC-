export type Severity = 'critical' | 'warning' | 'watch'

export type FloodAlert = {
  id: number
  title: string
  address: string
  severity: Severity
  depth: number
  updated: string
  lat: number
  lng: number
  path: { lat: number; lng: number }[]
}

export const alerts: FloodAlert[] = [
  {
    id: 1,
    title: 'Ngập sâu, không thể lưu thông',
    address: 'Đường Nguyễn Hữu Cảnh, Bình Thạnh',
    severity: 'critical',
    depth: 48,
    updated: '2 phút trước',
    lat: 10.7909,
    lng: 106.7202,
    path: [
      { lat: 10.7888, lng: 106.7181 },
      { lat: 10.7902, lng: 106.7192 },
      { lat: 10.7928, lng: 106.7216 },
    ],
  },
  {
    id: 2,
    title: 'Nước đang dâng nhanh',
    address: 'Ung Văn Khiêm, Bình Thạnh',
    severity: 'warning',
    depth: 31,
    updated: '5 phút trước',
    lat: 10.806,
    lng: 106.715,
    path: [
      { lat: 10.8032, lng: 106.713 },
      { lat: 10.806, lng: 106.715 },
      { lat: 10.8085, lng: 106.717 },
    ],
  },
  {
    id: 3,
    title: 'Ngập nhẹ, di chuyển chậm',
    address: 'Xô Viết Nghệ Tĩnh, Bình Thạnh',
    severity: 'watch',
    depth: 16,
    updated: '8 phút trước',
    lat: 10.7986,
    lng: 106.709,
    path: [
      { lat: 10.7968, lng: 106.707 },
      { lat: 10.7986, lng: 106.709 },
      { lat: 10.8002, lng: 106.711 },
    ],
  },
]

export const severityMeta: Record<Severity, { label: string; color: string }> = {
  critical: { label: 'Nguy hiểm', color: '#e3382f' },
  warning: { label: 'Cảnh báo', color: '#f18b2b' },
  watch: { label: 'Theo dõi', color: '#f3bd35' },
}
