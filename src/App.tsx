import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { alerts, severityMeta } from './features/alerts/alert-data'
import type { FloodAlert, Severity } from './features/alerts/alert-data'
import AccountPage from './features/account/AccountPage'
import FloodMap from './features/map/FloodMap'
import { searchPlaces, type PlaceSuggestion } from './features/map/place-search'
import { findSafeRoute } from './features/map/route-planner'
import type { RouteEndpoint, SafeRoutePlan } from './features/map/route-planner'

function Icon({
  name,
  size = 22,
}: {
  name: 'menu' | 'bell' | 'location' | 'layers' | 'route' | 'home' | 'alert' | 'user' | 'chevron' | 'close' | 'camera' | 'search' | 'back' | 'check' | 'settings' | 'shield' | 'edit'
  size?: number
}) {
  const paths = {
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    location: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></>,
    layers: <><path d="m12 3-9 5 9 5 9-5-9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M6 17v-5a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    alert: <><path d="M10.3 3.5 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z" /><circle cx="12" cy="13" r="3.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    shield: <><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

type Tab = 'map' | 'alerts' | 'route' | 'profile'
type RouteFieldName = 'origin' | 'destination'

function AlertCard({ alert, selected, onClick }: { alert: FloodAlert; selected?: boolean; onClick?: () => void }) {
  return (
    <button className={`alert-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className="severity-line" style={{ background: severityMeta[alert.severity].color }} />
      <div className="depth" style={{ color: severityMeta[alert.severity].color }}><b>{alert.depth}</b><small>cm</small></div>
      <div className="alert-copy">
        <span className="severity-label" style={{ color: severityMeta[alert.severity].color }}>{severityMeta[alert.severity].label} · {alert.updated}</span>
        <strong>{alert.title}</strong><p>{alert.address}</p>
      </div>
      <Icon name="chevron" size={19} />
    </button>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <div><p>{subtitle}</p><h1>{title}</h1></div>
      <button className="icon-button has-badge" aria-label="Thông báo"><Icon name="bell" /><i /></button>
    </header>
  )
}

function formatRouteDuration(seconds: number) {
  const minutes = Math.ceil(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours} giờ ${minutes % 60} phút` : `${minutes} phút`
}

function RouteResult({ plan, onSelectAlert }: { plan: SafeRoutePlan; onSelectAlert: (alert: FloodAlert) => void }) {
  const routeStatus = plan.noSafeAlternative
    ? 'Không tìm được tuyến tránh hoàn toàn'
    : plan.hazards.length > 0
      ? 'Tuyến này vẫn đi gần điểm ngập'
      : plan.isDetour
        ? `Đã vòng tránh ${plan.avoidedCount} điểm ngập`
        : 'Không phát hiện điểm ngập gần tuyến'

  return (
    <section className="route-result" aria-live="polite">
      <div className={`route-result-summary ${plan.noSafeAlternative ? 'has-warning' : ''}`}>
        <span><Icon name={plan.noSafeAlternative ? 'alert' : 'shield'} size={20} /></span>
        <div><strong>{routeStatus}</strong><small>{plan.distanceMeters / 1000 < 10 ? (plan.distanceMeters / 1000).toFixed(1) : Math.round(plan.distanceMeters / 1000)} km · {formatRouteDuration(plan.durationSeconds)}</small></div>
        <b>{plan.hazards.length}</b>
      </div>
      <div className="route-alert-heading"><strong>Cảnh báo cần lưu ý</strong><span>{plan.hazards.length} điểm gần tuyến</span></div>
      {plan.hazards.length > 0 ? <div className="route-alert-list">{plan.hazards.map((alert) => (
        <button key={alert.id} className="route-alert-item" onClick={() => onSelectAlert(alert)}>
          <span className="route-alert-depth" style={{ background: severityMeta[alert.severity].color }}>{alert.depth}<small>cm</small></span>
          <span className="route-alert-copy"><strong>{alert.address}</strong><small>{severityMeta[alert.severity].label} · {alert.updated}</small></span>
          <Icon name="chevron" size={18} />
        </button>
      ))}</div> : <p className="route-no-hazards"><Icon name="check" size={16} /> Không có điểm ngập trong bán kính 180 m quanh lộ trình.</p>}
      {plan.noSafeAlternative && <p className="route-result-note"><Icon name="alert" size={16} /> Đã thử tuyến vòng thay thế nhưng vẫn còn điểm ngập gần đường. Hãy xem các điểm cảnh báo và cân nhắc đổi hành trình.</p>}
    </section>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('map')
  const [activeFilter, setActiveFilter] = useState<'all' | Severity>('all')
  const [selectedAlert, setSelectedAlert] = useState<FloodAlert | null>(alerts[0])
  const [panelOpen, setPanelOpen] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState('Đang xác định vị trí...')
  const [routeOrigin, setRouteOrigin] = useState<RouteEndpoint>({ label: 'Vị trí của bạn', location: null })
  const [routeDestination, setRouteDestination] = useState<RouteEndpoint>({ label: '', location: null })
  const [avoidFloodedRoads, setAvoidFloodedRoads] = useState(true)
  const [routePlan, setRoutePlan] = useState<SafeRoutePlan | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [gpsStatus, setGpsStatus] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [activeRouteField, setActiveRouteField] = useState<RouteFieldName | null>(null)
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([])

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => activeFilter === 'all' || alert.severity === activeFilter),
    [activeFilter],
  )
  const selectAlert = useCallback((alert: FloodAlert) => {
    setSelectedAlert(alert)
    setPanelOpen(true)
  }, [])

  const focusRouteField = (field: RouteFieldName) => {
    setActiveRouteField(field)
  }

  const locateRouteOrigin = useCallback(() => {
    setRouteError(null)
    setRoutePlan(null)
    setActiveRouteField(null)
    setOriginSuggestions([])
    setGpsLoading(true)
    setGpsStatus('Đang xác định vị trí GPS...')
    let completed = false
    const finishWithFallback = (message: string) => {
      if (completed) return
      completed = true
      window.clearTimeout(fallbackTimer)
      setRouteOrigin({ label: 'Vị trí của bạn', location: { lat: 10.8014, lng: 106.7148 } })
      setGpsStatus(message)
      setGpsLoading(false)
    }
    const fallbackTimer = window.setTimeout(
      () => finishWithFallback('Không lấy được GPS sau 3 giây. Đang dùng vị trí mặc định tại Bình Thạnh.'),
      3000,
    )

    if (!navigator.geolocation) {
      finishWithFallback('Thiết bị không hỗ trợ GPS. Đang dùng vị trí mặc định tại Bình Thạnh.')
      return
    }

    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (completed) return
          completed = true
          window.clearTimeout(fallbackTimer)
          setRouteOrigin({
            label: 'Vị trí của bạn',
            location: { lat: coords.latitude, lng: coords.longitude },
          })
          setGpsStatus('Điểm đi đang dùng vị trí GPS hiện tại.')
          setGpsLoading(false)
        },
        () => finishWithFallback('Không lấy được GPS. Đang dùng vị trí mặc định tại Bình Thạnh.'),
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 30000 },
      )
    } catch {
      finishWithFallback('Không thể truy cập GPS. Đang dùng vị trí mặc định tại Bình Thạnh.')
    }
  }, [])

  useEffect(() => {
    if (tab !== 'route' || !activeRouteField) return

    const endpoint = activeRouteField === 'origin' ? routeOrigin : routeDestination
    const setSuggestions = activeRouteField === 'origin' ? setOriginSuggestions : setDestinationSuggestions
    if (endpoint.location || endpoint.label.trim().length < 2) {
      setSuggestions((current) => current.length === 0 ? current : [])
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        const suggestions = await searchPlaces(endpoint.label, controller.signal)
        if (!controller.signal.aborted) setSuggestions(suggestions)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions([])
          setRouteError(error instanceof Error ? error.message : 'Không thể tải gợi ý địa điểm.')
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [activeRouteField, routeDestination, routeOrigin, tab])

  const locate = () => {
    setLocation('Đang lấy GPS...')
    if (!navigator.geolocation) {
      setLocation('Nguyễn Hữu Cảnh, Bình Thạnh')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} · gần Nguyễn Hữu Cảnh`),
      () => setLocation('Nguyễn Hữu Cảnh, Bình Thạnh'),
      { enableHighAccuracy: true, timeout: 7000 },
    )
  }

  const searchRoute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRouteError(null)
    if (!routeOrigin.label.trim() || !routeDestination.label.trim()) {
      setRouteError('Hãy nhập cả điểm đi và điểm đến.')
      return
    }
    setRouteLoading(true)
    setRoutePlan(null)
    try {
      const plan = await findSafeRoute(routeOrigin, routeDestination, alerts, avoidFloodedRoads)
      setRoutePlan(plan)
      setSelectedAlert(null)
      setPanelOpen(false)
      setTab('map')
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Không thể tìm lộ trình. Hãy kiểm tra địa chỉ và thử lại.')
    } finally {
      setRouteLoading(false)
    }
  }

  const openRouteTab = () => {
    setTab('route')
    if (!gpsLoading && !routeOrigin.location && routeOrigin.label === 'Vị trí của bạn') locateRouteOrigin()
  }

  const chooseRouteSuggestion = (field: RouteFieldName, prediction: PlaceSuggestion) => {
    setActiveRouteField(null)
    setRouteError(null)
    setRoutePlan(null)
    if (field === 'origin') setOriginSuggestions([])
    else setDestinationSuggestions([])

    if (field === 'origin') {
      setRouteOrigin({ label: prediction.label, location: prediction.location })
      setGpsStatus('')
    } else {
      setRouteDestination({ label: prediction.label, location: prediction.location })
    }
  }

  const submitReport = () => {
    setReportOpen(false)
    setReportSent(true)
    setTimeout(() => setReportSent(false), 2800)
  }

  const goToAlert = (alert: FloodAlert) => {
    setSelectedAlert(alert)
    setTab('map')
    setPanelOpen(true)
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <FloodMap
          alerts={visibleAlerts}
          selectedAlertId={selectedAlert?.id ?? null}
          onSelectAlert={selectAlert}
          route={routePlan}
        />
        <div className="map-shade" />

        {tab === 'map' && <>
          <header className="top-bar">
            <button className="icon-button" aria-label="Mở menu"><Icon name="menu" /></button>
            <div className="brand"><span className="brand-mark"><span /></span><div><strong>Ngập?</strong><small>TP. Hồ Chí Minh</small></div></div>
            <button className="icon-button has-badge" aria-label="Thông báo"><Icon name="bell" /><i /></button>
          </header>
          <div className="live-status"><span /> TRỰC TIẾP <b>{alerts.length} tuyến đang ngập</b></div>
          <div className="map-tools">
            <button aria-label="Về vị trí của tôi" onClick={locate}><Icon name="location" /></button>
            <button aria-label="Chọn lớp bản đồ"><Icon name="layers" /></button>
          </div>
          <section className={`bottom-panel ${panelOpen ? '' : 'collapsed'}`}>
            <button className="panel-handle" onClick={() => setPanelOpen((value) => !value)} aria-label="Thu gọn bảng cảnh báo"><span /></button>
            <div className="panel-heading"><div><p>Tổng hợp theo tuyến đường</p><h1>{visibleAlerts.length} khu vực đang ngập</h1></div><button onClick={() => setPanelOpen(false)} aria-label="Đóng"><Icon name="close" size={20} /></button></div>
            <div className="filter-row">
              {[['all', 'Tất cả'], ['critical', 'Nguy hiểm'], ['warning', 'Cảnh báo'], ['watch', 'Theo dõi']].map(([value, label]) => (
                <button key={value} className={activeFilter === value ? 'active' : ''} onClick={() => setActiveFilter(value as 'all' | Severity)}>
                  {value !== 'all' && <span style={{ background: severityMeta[value as Severity].color }} />}{label}
                </button>
              ))}
            </div>
            <div className="alert-list">{visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} selected={selectedAlert?.id === alert.id} onClick={() => setSelectedAlert(alert)} />)}</div>
          </section>
          {routePlan && !panelOpen && <section className="map-route-card" aria-live="polite">
            <header><div><small>LỘ TRÌNH ĐÃ TÍNH</small><strong>{(routePlan.distanceMeters / 1000).toFixed(1)} km · {formatRouteDuration(routePlan.durationSeconds)}</strong></div><button onClick={() => { setRoutePlan(null); setPanelOpen(true) }} aria-label="Đóng lộ trình"><Icon name="close" size={18} /></button></header>
            <p className={routePlan.noSafeAlternative ? 'route-card-warning' : ''}>
              {routePlan.noSafeAlternative
                ? `Chưa tìm được đường tránh hết ${routePlan.hazards.length} điểm ngập.`
                : routePlan.hazards.length
                  ? `${routePlan.hazards.length} điểm ngập gần tuyến, xem và cân nhắc trước khi đi.`
                  : routePlan.isDetour
                    ? `Đã tìm đường vòng, tránh ${routePlan.avoidedCount} điểm ngập.`
                    : 'Không phát hiện điểm ngập gần tuyến.'}
            </p>
            <button className="map-route-details" onClick={() => setTab('route')}>Quay lại màn hình Lộ trình <Icon name="chevron" size={16} /></button>
          </section>}
        </>}

        {tab === 'alerts' && <section className="app-page">
          <PageHeader title="Tuyến đường ngập" subtitle="Cập nhật trực tiếp toàn thành phố" />
          <div className="summary-card"><div><span>Đang ảnh hưởng</span><strong>{alerts.length} tuyến đường</strong></div><div><span>Mức nghiêm trọng</span><strong className="danger">1 nguy hiểm</strong></div></div>
          <label className="search-box"><Icon name="search" size={19} /><input placeholder="Tìm tên đường, quận..." /></label>
          <div className="section-title"><h2>Tất cả cảnh báo</h2><span>Mới cập nhật</span></div>
          <div className="page-alert-list">{alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onClick={() => goToAlert(alert)} />)}</div>
        </section>}

        {tab === 'route' && <section className="app-page route-page">
          <PageHeader title="Tìm đường an toàn" subtitle="TỰ ĐỘNG TRÁNH TUYẾN ĐANG NGẬP" />
          <form className="route-form" onSubmit={searchRoute}>
            <div className="route-inputs">
              <span className="route-dots"><i /><i /><i /></span>
              <div className="route-field">
                <div className="route-field-heading"><label htmlFor="route-origin">Điểm bắt đầu</label><button type="button" onClick={locateRouteOrigin} disabled={gpsLoading || routeLoading}>Dùng GPS</button></div>
                <input
                  id="route-origin"
                  value={routeOrigin.label}
                  onFocus={() => focusRouteField('origin')}
                  onBlur={() => setActiveRouteField((field) => field === 'origin' ? null : field)}
                  onChange={(event) => {
                    setRouteOrigin({ label: event.target.value, location: null })
                    setRoutePlan(null)
                    setRouteError(null)
                    setGpsStatus('')
                  }}
                  placeholder="Vị trí GPS hoặc địa chỉ"
                  spellCheck={false}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="route-origin-suggestions"
                  aria-expanded={activeRouteField === 'origin' && originSuggestions.length > 0}
                  required
                  disabled={routeLoading || gpsLoading}
                />
                {activeRouteField === 'origin' && originSuggestions.length > 0 && <div id="route-origin-suggestions" className="route-suggestions" role="listbox">
                  {originSuggestions.map((prediction) => (
                    <button key={prediction.placeId} type="button" role="option" className="route-suggestion" onPointerDown={(event) => event.preventDefault()} onClick={() => void chooseRouteSuggestion('origin', prediction)}>
                      <strong>{prediction.label}</strong>
                    </button>
                  ))}
                </div>}
              </div>
              <div className="route-field">
                <div className="route-field-heading"><label htmlFor="route-destination">ĐIỂM ĐẾN</label></div>
                <input
                  id="route-destination"
                  value={routeDestination.label}
                  onFocus={() => focusRouteField('destination')}
                  onBlur={() => setActiveRouteField((field) => field === 'destination' ? null : field)}
                  onChange={(event) => {
                    setRouteDestination({ label: event.target.value, location: null })
                    setRoutePlan(null)
                    setRouteError(null)
                  }}
                  placeholder="Nhập địa chỉ hoặc tên đường"
                  spellCheck={false}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="route-destination-suggestions"
                  aria-expanded={activeRouteField === 'destination' && destinationSuggestions.length > 0}
                  required
                  disabled={routeLoading}
                />
                {activeRouteField === 'destination' && destinationSuggestions.length > 0 && <div id="route-destination-suggestions" className="route-suggestions" role="listbox">
                  {destinationSuggestions.map((prediction) => (
                    <button key={prediction.placeId} type="button" role="option" className="route-suggestion" onPointerDown={(event) => event.preventDefault()} onClick={() => void chooseRouteSuggestion('destination', prediction)}>
                      <strong>{prediction.label}</strong>
                    </button>
                  ))}
                </div>}
              </div>
            </div>
            <div className="route-preference">
              <div><strong>Tránh tuyến có cảnh báo</strong><small>{avoidFloodedRoads ? 'Luôn tránh điểm ngập nguy hiểm' : 'Đường ngắn nhất, vẫn hiện cảnh báo'}</small></div>
              <button type="button" className={`route-switch ${avoidFloodedRoads ? 'on' : ''}`} role="switch" aria-checked={avoidFloodedRoads} aria-label="Tránh các tuyến có cảnh báo ngập" disabled={routeLoading} onClick={() => { setAvoidFloodedRoads((value) => !value); setRoutePlan(null) }}><span /></button>
            </div>
            {gpsStatus && <p className="route-form-hint">{gpsStatus}</p>}
            {routeError && <p className="route-form-error" role="alert">{routeError}</p>}
            <p className="route-form-hint route-attribution">Địa điểm: © OpenStreetMap contributors · Định tuyến: OSRM</p>
            <button className="primary-button" type="submit" disabled={routeLoading || gpsLoading}><Icon name={routeLoading || gpsLoading ? 'location' : 'route'} size={19} /> {routeLoading ? 'Đang tìm đường...' : gpsLoading ? 'Đang xác định vị trí...' : 'Tra cứu cảnh báo ngập'}</button>
          </form>
          {routeLoading ? <div className="route-empty route-loading"><span><Icon name="route" size={32} /></span><h2>Đang tính lộ trình</h2><p>Đang so sánh tuyến đường với các điểm ngập hiện có.</p></div>
            : routePlan ? <RouteResult plan={routePlan} onSelectAlert={goToAlert} />
              : <div className="route-empty"><span><Icon name="route" size={32} /></span><h2>Đi an toàn hơn khi trời mưa</h2><p>Chọn điểm đi và đến. Ứng dụng sẽ tính lộ trình, đánh dấu điểm ngập gần đường và tìm phương án vòng tránh.</p></div>}
        </section>}

        {tab === 'profile' && <AccountPage />}

        <nav className="bottom-nav">
          <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}><Icon name="home" /><span>Bản đồ</span></button>
          <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}><Icon name="alert" /><span>Cảnh báo</span></button>
          <button className="report-button" onClick={() => { setReportOpen(true); locate() }}><span><Icon name="camera" size={23} /></span>Báo ngập</button>
          <button className={tab === 'route' ? 'active' : ''} onClick={openRouteTab}><Icon name="route" /><span>Lộ trình</span></button>
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}><Icon name="user" /><span>Cá nhân</span></button>
        </nav>

        {reportOpen && <div className="modal-backdrop">
          <section className="report-sheet">
            <header><button onClick={() => setReportOpen(false)} aria-label="Quay lại"><Icon name="back" /></button><div><small>Đóng góp cộng đồng</small><h2>Báo cáo điểm ngập</h2></div><span /></header>
            <label className={`photo-upload ${photo ? 'has-photo' : ''}`}>
              {photo ? <img src={photo} alt="Ảnh điểm ngập được chọn" /> : <><span><Icon name="camera" size={28} /></span><strong>Chụp ảnh hiện trường</strong><small>Ảnh giúp xác minh nhanh hơn</small></>}
              <input type="file" accept="image/*" capture="environment" onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) setPhoto(URL.createObjectURL(file))
              }} />
            </label>
            <div className="form-block"><label>Vị trí ghi nhận</label><button className="location-field" onClick={locate}><span><Icon name="location" size={20} /></span><div><strong>{location}</strong><small>Chạm để cập nhật vị trí chính xác</small></div><Icon name="chevron" size={18} /></button></div>
            <div className="form-block"><label>Mức nước ước tính</label><div className="depth-options">{['Dưới 20cm', '20–40cm', 'Trên 40cm'].map((value, index) => <button key={value} className={index === 1 ? 'active' : ''}>{value}</button>)}</div></div>
            <div className="form-block"><label>Ghi chú <span>Không bắt buộc</span></label><textarea placeholder="Ví dụ: xe máy không thể đi qua..." /></div>
            <button className="submit-report" onClick={submitReport}><Icon name="check" size={19} /> Gửi báo cáo</button>
            <p className="report-note"><Icon name="shield" size={15} /> Vị trí và ảnh chỉ được dùng để xác minh cảnh báo.</p>
          </section>
        </div>}

        {reportSent && <div className="toast"><b>Đã ghi nhận báo cáo</b><span>Đội ngũ sẽ xác minh và cập nhật lên bản đồ.</span></div>}
      </section>
    </main>
  )
}
