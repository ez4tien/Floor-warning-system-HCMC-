import { useCallback, useMemo, useState } from 'react'
import { alerts, severityMeta } from './features/alerts/alert-data'
import type { FloodAlert, Severity } from './features/alerts/alert-data'
import FloodMap from './features/map/FloodMap'

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

export default function App() {
  const [tab, setTab] = useState<Tab>('map')
  const [activeFilter, setActiveFilter] = useState<'all' | Severity>('all')
  const [selectedAlert, setSelectedAlert] = useState<FloodAlert | null>(alerts[0])
  const [panelOpen, setPanelOpen] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState('Đang xác định vị trí...')
  const [routeReady, setRouteReady] = useState(false)

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => activeFilter === 'all' || alert.severity === activeFilter),
    [activeFilter],
  )
  const selectAlert = useCallback((alert: FloodAlert) => {
    setSelectedAlert(alert)
    setPanelOpen(true)
  }, [])

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
        </>}

        {tab === 'alerts' && <section className="app-page">
          <PageHeader title="Tuyến đường ngập" subtitle="Cập nhật trực tiếp toàn thành phố" />
          <div className="summary-card"><div><span>Đang ảnh hưởng</span><strong>{alerts.length} tuyến đường</strong></div><div><span>Mức nghiêm trọng</span><strong className="danger">1 nguy hiểm</strong></div></div>
          <label className="search-box"><Icon name="search" size={19} /><input placeholder="Tìm tên đường, quận..." /></label>
          <div className="section-title"><h2>Tất cả cảnh báo</h2><span>Mới cập nhật</span></div>
          <div className="page-alert-list">{alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onClick={() => goToAlert(alert)} />)}</div>
        </section>}

        {tab === 'route' && <section className="app-page route-page">
          <PageHeader title="Tìm đường an toàn" subtitle="Tự động tránh tuyến đang ngập" />
          <div className="route-inputs">
            <span className="route-dots"><i /><i /><i /></span>
            <label><small>Điểm bắt đầu</small><input defaultValue="Vị trí của bạn" /></label>
            <label><small>Điểm đến</small><input placeholder="Bạn muốn đi đâu?" /></label>
          </div>
          <button className="primary-button" onClick={() => setRouteReady(true)}><Icon name="route" size={19} /> Tìm lộ trình an toàn</button>
          {routeReady ? <div className="route-result">
            <div className="route-visual"><span className="route-path" /><i className="start-dot" /><i className="end-dot" /><span className="blocked-road">Đường ngập</span></div>
            <div className="route-choice"><div><span>Khuyến nghị · tránh 3 điểm ngập</span><strong>26 phút <small>· 8,4 km</small></strong></div><button>Bắt đầu</button></div>
            <p><Icon name="shield" size={17} /> Lộ trình ưu tiên đường cao, không đi qua vùng ngập đã xác nhận.</p>
          </div> : <div className="route-empty"><span><Icon name="route" size={32} /></span><h2>Đi an toàn hơn khi trời mưa</h2><p>Nhập điểm đến, ứng dụng sẽ đối chiếu tất cả cảnh báo để đề xuất đường tránh.</p></div>}
        </section>}

        {tab === 'profile' && <section className="app-page profile-page">
          <PageHeader title="Cá nhân" subtitle="Hồ sơ & thiết lập" />
          <div className="profile-card">
            <div className="avatar">NA</div><div><h2>Nguyễn An</h2><p>Thành viên cộng đồng</p></div><button aria-label="Sửa hồ sơ"><Icon name="edit" size={18} /></button>
          </div>
          <div className="contribution"><div><strong>08</strong><span>Báo cáo đã gửi</span></div><div><strong>21</strong><span>Lượt xác nhận</span></div><div><strong>120</strong><span>Điểm cộng đồng</span></div></div>
          <h3 className="settings-title">Thiết lập</h3>
          <div className="settings-list">
            <button><span><Icon name="bell" /></span><div><strong>Khu vực nhận cảnh báo</strong><small>Bình Thạnh, Quận 1</small></div><Icon name="chevron" size={18} /></button>
            <button><span><Icon name="shield" /></span><div><strong>Quyền riêng tư</strong><small>Vị trí chỉ dùng khi cần</small></div><Icon name="chevron" size={18} /></button>
            <button><span><Icon name="settings" /></span><div><strong>Cài đặt ứng dụng</strong><small>Thông báo, ngôn ngữ</small></div><Icon name="chevron" size={18} /></button>
          </div>
        </section>}

        <nav className="bottom-nav">
          <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}><Icon name="home" /><span>Bản đồ</span></button>
          <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}><Icon name="alert" /><span>Cảnh báo</span></button>
          <button className="report-button" onClick={() => { setReportOpen(true); locate() }}><span><Icon name="camera" size={23} /></span>Báo ngập</button>
          <button className={tab === 'route' ? 'active' : ''} onClick={() => setTab('route')}><Icon name="route" /><span>Lộ trình</span></button>
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
