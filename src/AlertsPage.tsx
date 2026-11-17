import React, { useState } from 'react';
import { AlertTriangle, Clock, Navigation, Fuel, WifiOff, CheckCircle, Bell } from 'lucide-react';
import { vehicles } from './data';

type AlertType = 'all' | 'theft' | 'lastseen' | 'deviation' | 'station';

export default function AlertsPage() {
  const [filter, setFilter] = useState<AlertType>('all');

  type AlertItem = { id: string; type: string; plate: string; driver: string; message: string; severity: 'high' | 'medium' | 'low'; time: string; phone: string; };

  const allAlerts: AlertItem[] = [];

  vehicles.forEach(b => {
    if (b.isAlert) allAlerts.push({
      id: `${b.plate}-theft`, type: 'theft', plate: b.plate, driver: b.driver,
      message: `Driver claimed ${b.claimed}L but the truck only needed ${b.expected}L for ${b.todayKm} km. That is +${b.diff}L unaccounted for — worth ${Math.round(b.diff * 3000).toLocaleString()} RWF.`,
      severity: 'high', time: `${Math.floor(Math.random()*120 + 5)}m ago`, phone: b.driverPhone
    });
    if (b.isWarn) allAlerts.push({
      id: `${b.plate}-warn`, type: 'theft', plate: b.plate, driver: b.driver,
      message: `Driver claimed ${b.diff}L more than the truck should need for this trip. This could be rounding or a small leak — needs a check.`,
      severity: 'medium', time: `${Math.floor(Math.random()*120 + 5)}m ago`, phone: b.driverPhone
    });
    if (b.lastSeenMinutes > 30) allAlerts.push({
      id: `${b.plate}-ls`, type: 'lastseen', plate: b.plate, driver: b.driver,
      message: `Vehicle offline for ${b.lastSeenMinutes} minutes during school run. Last seen at ${b.location}.`,
      severity: 'high', time: `${b.lastSeenMinutes}m ago`, phone: b.driverPhone
    });
    if (b.routeDeviation > 0) allAlerts.push({
      id: `${b.plate}-dev`, type: 'deviation', plate: b.plate, driver: b.driver,
      message: `Route deviation detected: +${b.routeDeviation} km beyond assigned route (${b.route}).`,
      severity: b.routeDeviation > 15 ? 'high' : 'medium', time: `${Math.floor(Math.random()*60+2)}m ago`, phone: b.driverPhone
    });
    if (!b.lastStationApproved) allAlerts.push({
      id: `${b.plate}-sta`, type: 'station', plate: b.plate, driver: b.driver,
      message: `Fueled at "${b.lastStation}" — not on the approved station list.`,
      severity: 'medium', time: `${Math.floor(Math.random()*180+10)}m ago`, phone: b.driverPhone
    });
  });

  const sorted = [...allAlerts].sort((a,b) => {
    const ord = {high:0,medium:1,low:2};
    return ord[a.severity] - ord[b.severity];
  });

  const filtered = filter === 'all' ? sorted : sorted.filter(a => a.type === filter);

  const counts = {
    all: sorted.length,
    theft: sorted.filter(a=>a.type==='theft').length,
    lastseen: sorted.filter(a=>a.type==='lastseen').length,
    deviation: sorted.filter(a=>a.type==='deviation').length,
    station: sorted.filter(a=>a.type==='station').length,
  };

  const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
    high:   { background: '#fff1f1', borderLeft: '3px solid #ef4444' },
    medium: { background: '#fff8e6', borderLeft: '3px solid #f59e0b' },
    low:    { background: '#eff6ff', borderLeft: '3px solid #3b82f6' },
  };
  const SEVERITY_BADGE: Record<string, React.CSSProperties> = {
    high:   { background: '#fff1f1', color: '#b91c1c' },
    medium: { background: '#fff8e6', color: '#b45309' },
    low:    { background: '#eff6ff', color: '#1d4ed8' },
  };
  const TYPE_ICON: Record<string, React.ReactNode> = {
    theft:     <AlertTriangle size={16} color="#ef4444" />,
    lastseen:  <Clock size={16} color="#b45309" />,
    deviation: <Navigation size={16} color="#3b82f6" />,
    station:   <Fuel size={16} color="#b91c1c" />,
  };

  return (
    <div style={s.page} className="page-enter">
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Alerts &amp; Safety</h1>
          <p style={s.sub}>Real-time alerts across all 30 vehicles. Last seen tracker, route deviations, unauthorized stations and theft risks.</p>
        </div>
        <div style={s.bellWrap}>
          <Bell size={18} color="#0f8c61" />
          <span style={s.bellCount}>{counts.all}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={s.summaryRow}>
        {[
          { label: 'Possible Fuel Theft', count: counts.theft, icon: <AlertTriangle size={18} color="#ef4444"/>, color: '#ef4444', type: 'theft' },
          { label: 'Bus Went Silent', count: counts.lastseen, icon: <Clock size={18} color="#b45309"/>, color: '#b45309', type: 'lastseen' },
          { label: 'Wrong Route Taken', count: counts.deviation, icon: <Navigation size={18} color="#3b82f6"/>, color: '#3b82f6', type: 'deviation' },
          { label: 'Unapproved Station', count: counts.station, icon: <Fuel size={18} color="#b91c1c"/>, color: '#b91c1c', type: 'station' },
        ].map(item => (
          <div key={item.type} onClick={() => setFilter(item.type as AlertType)}
            style={{ ...s.sumCard, outline: filter === item.type ? `2px solid ${item.color}` : 'none', cursor: 'pointer' }}>
            <div style={s.sumIcon}>{item.icon}</div>
            <div style={{ ...s.sumCount, color: item.color }}>{item.count}</div>
            <div style={s.sumLabel}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={s.pills}>
        {(['all','theft','lastseen','deviation','station'] as AlertType[]).map(f => (
          <button key={f} style={{ ...s.pill, ...(filter===f ? s.pillActive : {}) }} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${counts.all})` : f === 'theft' ? `Fuel theft (${counts.theft})` : f === 'lastseen' ? `Last seen (${counts.lastseen})` : f === 'deviation' ? `Deviation (${counts.deviation})` : `Station (${counts.station})`}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div style={s.list}>
        {filtered.length === 0 && (
          <div style={s.empty}><CheckCircle size={32} color="#0f8c61"/><div>No alerts in this category</div></div>
        )}
        {filtered.map(a => (
          <div key={a.id} style={{ ...s.alertCard, ...SEVERITY_STYLE[a.severity] }}>
            <div style={s.alertTop}>
              <div style={s.alertLeft}>
                {TYPE_ICON[a.type]}
                <div>
                  <div style={s.alertPlate}>
                    <span style={s.plateBadge}>RW</span>
                    {a.plate}
                    <span style={{ ...s.sevBadge, ...SEVERITY_BADGE[a.severity] }}>{a.severity}</span>
                  </div>
                  <div style={s.alertDriver}>{a.driver}</div>
                </div>
              </div>
              <div style={s.alertTime}>{a.time}</div>
            </div>
            <div style={s.alertMsg}>{a.message}</div>
            <div style={s.alertFoot}>
              <span style={s.alertPhone}>📞 {a.phone}</span>
              <button style={s.resolveBtn}>Mark resolved</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1.5rem', overflowY: 'auto', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#0b161f', marginBottom: 4 },
  sub: { fontSize: 13, color: '#5e6e7d', maxWidth: 500 },
  bellWrap: { position: 'relative', background: '#e8f7f2', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bellCount: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: '1.25rem' },
  sumCard: { background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #eef1f4', textAlign: 'center' },
  sumIcon: { display: 'flex', justifyContent: 'center', marginBottom: 6 },
  sumCount: { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1 },
  sumLabel: { fontSize: 11, color: '#5e6e7d', marginTop: 4 },
  pills: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' },
  pill: { padding: '6px 14px', borderRadius: 20, border: '1.5px solid #dde3ea', background: '#fff', fontSize: 12, fontWeight: 500, color: '#5e6e7d', cursor: 'pointer' },
  pillActive: { background: '#0b161f', color: '#fff', borderColor: '#0b161f' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  empty: { textAlign: 'center', padding: '3rem', color: '#5e6e7d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, fontSize: 14 },
  alertCard: { borderRadius: 12, padding: '14px 16px' },
  alertTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  alertLeft: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  alertPlate: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#162330' },
  plateBadge: { background: '#0a6b4a', color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 3, fontWeight: 600 },
  sevBadge: { fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' as const },
  alertDriver: { fontSize: 12, color: '#5e6e7d', marginTop: 2 },
  alertTime: { fontSize: 11, color: '#8a97a6', whiteSpace: 'nowrap' as const, marginLeft: 8 },
  alertMsg: { fontSize: 13, color: '#253341', lineHeight: 1.5, marginBottom: 10 },
  alertFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  alertPhone: { fontSize: 12, color: '#0f8c61', fontWeight: 500 },
  resolveBtn: { fontSize: 11, padding: '4px 12px', border: '1px solid #dde3ea', borderRadius: 7, background: '#fff', color: '#5e6e7d', cursor: 'pointer' },
};

