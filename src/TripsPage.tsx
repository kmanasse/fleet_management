import React, { useState } from 'react';
import { Map, Package, Fuel, Clock, CheckCircle, TrendingUp, Navigation, AlertTriangle } from 'lucide-react';
import { vehicles, VEHICLE_TYPE_LABELS } from './data';

type StatusFilter = 'all' | 'ongoing' | 'completed' | 'planned';

export default function TripsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const allTrips = vehicles.flatMap(v =>
    v.tripLogs.map(t => ({ ...t, plate: v.plate, driver: v.driver, vehicleType: v.type }))
  );

  const filtered = allTrips.filter(t => {
    const q = search.toLowerCase();
    const m = t.plate.toLowerCase().includes(q) || t.driver.toLowerCase().includes(q) ||
              t.origin.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q) ||
              t.cargo.toLowerCase().includes(q);
    if (!m) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const ongoing   = allTrips.filter(t => t.status === 'ongoing').length;
  const completed = allTrips.filter(t => t.status === 'completed').length;
  const planned   = allTrips.filter(t => t.status === 'planned').length;
  const totalKm   = allTrips.reduce((s, t) => s + t.distanceKm, 0);
  const flagged   = allTrips.filter(t => t.fuelUsedL > t.expectedFuelL * 1.1).length;

  const STATUS_COLOR = { ongoing: '#E8640A', completed: '#0f8c61', planned: '#3b82f6' };
  const STATUS_BG    = { ongoing: '#FEF0E6', completed: '#e8f7f2', planned: '#eff6ff' };

  return (
    <div style={s.page} className="page-enter">
      <div style={s.header}>
        <div>
          <h1 style={s.title}><Map size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Trip Tracker</h1>
          <p style={s.sub}>All routes across Rwanda and East Africa — real-time and historical trip data.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { label: 'Total trips', val: allTrips.length, color: '#162330' },
          { label: 'Ongoing', val: ongoing, color: '#E8640A' },
          { label: 'Completed', val: completed, color: '#0f8c61' },
          { label: 'Planned', val: planned, color: '#3b82f6' },
          { label: 'Fuel anomalies', val: flagged, color: '#ef4444' },
          { label: 'Total KM logged', val: `${(totalKm/1000).toFixed(0)}K`, color: '#253341' },
        ].map(item => (
          <div key={item.label} style={s.stat}>
            <div style={s.statL}>{item.label}</div>
            <div style={{ ...s.statV, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={s.controls}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search plate, driver, route, cargo…" style={s.searchInput} />
        <div style={s.pills}>
          {(['all', 'ongoing', 'completed', 'planned'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ ...s.pill, ...(statusFilter === f ? { background: f === 'all' ? '#0b161f' : STATUS_COLOR[f as keyof typeof STATUS_COLOR] || '#0b161f', color: '#fff', borderColor: 'transparent' } : {}) }}>
              {f === 'all' ? `All (${allTrips.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${allTrips.filter(t=>t.status===f).length})`}
            </button>
          ))}
        </div>
        <span style={s.countL}>{filtered.length} trips</span>
      </div>

      {/* Trip cards */}
      <div style={s.tripGrid}>
        {filtered.map(t => {
          const fuelOver = t.fuelUsedL > t.expectedFuelL * 1.1;
          const fuelPct = Math.round(t.fuelUsedL / t.expectedFuelL * 100);
          return (
            <div key={t.id} style={{
              ...s.tripCard,
              borderLeft: `3px solid ${STATUS_COLOR[t.status]}`,
            }}>
              {/* Header */}
              <div style={s.tripHead}>
                <div style={s.routeLine}>
                  <span style={s.origin}>{t.origin}</span>
                  <span style={s.arrow}>→</span>
                  <span style={s.dest}>{t.destination}</span>
                </div>
                <span style={{ ...s.statusBadge, background: STATUS_BG[t.status], color: STATUS_COLOR[t.status] }}>
                  {t.status === 'ongoing' && '🔴 '}{t.status === 'completed' && '✅ '}{t.status === 'planned' && '🔵 '}
                  {t.status}
                </span>
              </div>

              {/* Vehicle info */}
              <div style={s.vehicleRow}>
                <span style={s.platePill}>RW · {t.plate}</span>
                <span style={s.driverLabel}>{t.driver}</span>
                <span style={s.typeLabel}>{VEHICLE_TYPE_LABELS[t.vehicleType]}</span>
              </div>

              {/* Cargo */}
              <div style={s.cargoRow}>
                <Package size={12} color="#8a97a6" />
                <span style={s.cargoText}>{t.cargo}</span>
              </div>

              {/* Metrics grid */}
              <div style={s.metricsGrid}>
                <div style={s.metric}>
                  <Navigation size={13} color="#5e6e7d" />
                  <div>
                    <div style={s.mLabel}>Distance</div>
                    <div style={s.mVal}>{t.distanceKm.toLocaleString()} km</div>
                  </div>
                </div>
                <div style={s.metric}>
                  <Fuel size={13} color={fuelOver ? '#ef4444' : '#5e6e7d'} />
                  <div>
                    <div style={s.mLabel}>Fuel used</div>
                    <div style={{ ...s.mVal, color: fuelOver ? '#ef4444' : '#162330' }}>
                      {t.fuelUsedL}L
                      {fuelOver && <span style={s.fuelFlag}> +{Math.round(t.fuelUsedL - t.expectedFuelL)}L over</span>}
                    </div>
                  </div>
                </div>
                <div style={s.metric}>
                  <TrendingUp size={13} color="#5e6e7d" />
                  <div>
                    <div style={s.mLabel}>Expected</div>
                    <div style={s.mVal}>{t.expectedFuelL}L</div>
                  </div>
                </div>
                <div style={s.metric}>
                  <Clock size={13} color="#5e6e7d" />
                  <div>
                    <div style={s.mLabel}>Period</div>
                    <div style={{ ...s.mVal, fontSize: 11 }}>{t.startDate} → {t.endDate}</div>
                  </div>
                </div>
              </div>

              {/* Fuel efficiency bar */}
              <div style={s.effRow}>
                <span style={s.effLabel}>Fuel efficiency</span>
                <span style={{ ...s.effPct, color: fuelOver ? '#ef4444' : '#0f8c61' }}>{fuelPct}% of expected</span>
              </div>
              <div style={s.effTrack}>
                <div style={{ ...s.effFill, width: `${Math.min(fuelPct, 100)}%`, background: fuelOver ? '#ef4444' : '#0f8c61' }} />
                {fuelOver && <div style={{ ...s.effOver, left: '100%', width: `${Math.min(fuelPct - 100, 40)}%` }} />}
              </div>

              {fuelOver && (
                <div style={s.fuelAlert}><AlertTriangle size={12} /> This driver used {Math.round(t.fuelUsedL - t.expectedFuelL)}L more than the trip needed. The extra fuel ({Math.round((t.fuelUsedL - t.expectedFuelL)*3000).toLocaleString()} RWF worth) may have been stolen — check the driver's receipts.</div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={s.empty}><CheckCircle size={32} color="#0f8c61" /><div>No trips match your filters</div></div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1.5rem', overflowY: 'auto', flex: 1 },
  header: { marginBottom: '1.25rem' },
  title: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: '#0b161f', marginBottom: 4 },
  sub: { fontSize: 13, color: '#5e6e7d' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: '1.25rem' },
  stat: { background: '#fff', borderRadius: 10, padding: '11px 13px', border: '1px solid #eef1f4' },
  statL: { fontSize: 11, color: '#5e6e7d', marginBottom: 4 },
  statV: { fontSize: 21, fontWeight: 600, fontFamily: "'Syne',sans-serif" },
  controls: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' },
  searchInput: { padding: '8px 12px', border: '1.5px solid #dde3ea', borderRadius: 9, fontSize: 13, color: '#162330', width: 240, outline: 'none' },
  pills: { display: 'flex', gap: 5 },
  pill: { padding: '6px 14px', borderRadius: 20, border: '1.5px solid #dde3ea', background: '#fff', fontSize: 12, fontWeight: 500, color: '#5e6e7d', cursor: 'pointer' },
  countL: { fontSize: 12, color: '#8a97a6', marginLeft: 'auto' },
  tripGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 },
  tripCard: { background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #eef1f4' },
  tripHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  routeLine: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  origin: { fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#162330' },
  arrow: { color: '#E8640A', fontWeight: 700 },
  dest: { fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#162330' },
  statusBadge: { fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 },
  vehicleRow: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 },
  platePill: { background: '#0a6b4a', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  driverLabel: { fontSize: 12, color: '#5e6e7d' },
  typeLabel: { fontSize: 10, background: '#FEF0E6', color: '#E8640A', padding: '1px 6px', borderRadius: 20, fontWeight: 600, marginLeft: 'auto' },
  cargoRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, color: '#5e6e7d' },
  cargoText: {},
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 },
  metric: { display: 'flex', gap: 8, alignItems: 'flex-start', background: '#f8fafb', borderRadius: 8, padding: '7px 9px' },
  mLabel: { fontSize: 10, color: '#8a97a6' },
  mVal: { fontSize: 13, fontWeight: 500, color: '#162330' },
  fuelFlag: { fontSize: 10, color: '#ef4444', fontWeight: 600 },
  effRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5e6e7d', marginBottom: 4 },
  effLabel: {},
  effPct: { fontWeight: 600 },
  effTrack: { height: 6, background: '#eef1f4', borderRadius: 3, overflow: 'hidden', marginBottom: 6, position: 'relative' },
  effFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s' },
  effOver: { position: 'absolute', top: 0, height: '100%', background: '#fca5a5', borderRadius: 3 },
  fuelAlert: { display: 'flex', alignItems: 'center', gap: 6, background: '#fff1f1', color: '#b91c1c', fontSize: 11, padding: '6px 10px', borderRadius: 7, fontWeight: 500 },
  empty: { gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#5e6e7d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, fontSize: 14 },
};
