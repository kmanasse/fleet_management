import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Vehicle } from './data';

interface Props { vehicle: Vehicle; }
declare global { interface Window { L: any; } }

// Real Kigali-area waypoints for different routes
const ROUTE_WAYPOINTS: Record<string, [number, number][]> = {
  'Kigali → Kampala': [
    [-1.9441, 30.0619], [-1.9200, 30.0800], [-1.8500, 30.1200],
    [-1.5081, 29.6347], [-1.2000, 29.8000], [-0.8000, 30.2000],
    [-0.3163, 32.5822],
  ],
  'Kigali → Mombasa': [
    [-1.9441, 30.0619], [-1.9336, 30.1538], [-2.0000, 30.5000],
    [-2.5000, 31.5000], [-3.3869, 36.6830], [-4.0435, 39.6682],
  ],
  'Kigali → Nairobi': [
    [-1.9441, 30.0619], [-1.9000, 30.3000], [-1.5000, 30.8000],
    [-0.8000, 31.5000], [-0.3163, 32.5822], [-1.2833, 36.8167],
  ],
  'Kigali → Bujumbura': [
    [-1.9441, 30.0619], [-2.1000, 29.9000], [-2.4833, 29.6000],
    [-3.0000, 29.3000], [-3.3869, 29.3600],
  ],
  'Kigali → Butare': [
    [-1.9441, 30.0619], [-2.1000, 29.9000], [-2.3384, 29.7394], [-2.5967, 29.7448],
  ],
  'Kigali → Gisenyi': [
    [-1.9441, 30.0619], [-1.8000, 29.9000], [-1.6667, 29.7000], [-1.5081, 29.6347],
  ],
  default: [
    [-1.9441, 30.0619], [-1.9300, 30.0800], [-1.9200, 30.1000],
    [-1.9100, 30.1200], [-1.9000, 30.1100], [-1.8900, 30.0950],
  ],
};

function getRouteWaypoints(route: string): [number, number][] {
  for (const key of Object.keys(ROUTE_WAYPOINTS)) {
    if (route.includes(key.split('→')[1]?.trim() || '') || route.includes(key.split('→')[0]?.trim() || '')) {
      if (ROUTE_WAYPOINTS[key]) return ROUTE_WAYPOINTS[key];
    }
  }
  return ROUTE_WAYPOINTS.default;
}

// Interpolate between two points
function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Deviation: offset from route by some metres
function deviatePoint(pt: [number, number], metres: number): [number, number] {
  const deg = metres / 111320;
  return [pt[0] + deg * (Math.random() > 0.5 ? 1 : -1), pt[1] + deg * (Math.random() > 0.5 ? 1 : -1)];
}

export default function LiveMap({ vehicle }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const truckMarker = useRef<any>(null);
  const deviationMarker = useRef<any>(null);
  const routeLine = useRef<any>(null);
  const travelledLine = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [isDeviated, setIsDeviated] = useState(vehicle.routeDeviation > 0);
  const [deviationAlertShown, setDeviationAlertShown] = useState(false);
  const stepsRef = useRef<[number, number][]>([]);
  const deviationStartRef = useRef<number>(-1);

  // Build interpolated steps from waypoints
  const buildSteps = useCallback((waypoints: [number, number][]): [number, number][] => {
    const steps: [number, number][] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      for (let t = 0; t <= 1; t += 0.04) {
        steps.push(interpolate(waypoints[i], waypoints[i + 1], t));
      }
    }
    return steps;
  }, []);

  // Load Leaflet
  useEffect(() => {
    if (window.L) { setLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Init map once loaded
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInst.current) return;
    const L = window.L;
    const waypoints = getRouteWaypoints(vehicle.route);
    const steps = buildSteps(waypoints);
    stepsRef.current = steps;

    // Inject deviation into ~30% of journey if vehicle has deviation flag
    if (vehicle.routeDeviation > 0) {
      const deviStart = Math.floor(steps.length * 0.35);
      const deviEnd = Math.floor(steps.length * 0.55);
      deviationStartRef.current = deviStart;
      for (let i = deviStart; i < deviEnd; i++) {
        steps[i] = deviatePoint(steps[i], vehicle.routeDeviation * 120);
      }
    }

    const start = waypoints[0];
    const end = waypoints[waypoints.length - 1];
    const mid = steps[Math.floor(steps.length / 2)];

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      .setView(mid, 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Planned route (dotted grey)
    const plannedCoords = getRouteWaypoints(vehicle.route);
    const planned = L.polyline(plannedCoords, {
      color: '#bcc6d0', weight: 3, dashArray: '8 6', opacity: 0.7
    }).addTo(map);

    // Travelled path (orange solid — updated as truck moves)
    const travelled = L.polyline([steps[0]], { color: '#E8640A', weight: 4, opacity: 0.9 }).addTo(map);
    travelledLine.current = travelled;
    routeLine.current = planned;

    // Start marker (green flag)
    L.marker(start, {
      icon: L.divIcon({
        html: `<div style="background:#0f8c61;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">🟢 ${vehicle.route.split('→')[0].trim()}</div>`,
        className: '', iconAnchor: [20, 12]
      })
    }).addTo(map);

    // End marker (destination flag)
    const destName = vehicle.route.split('→')[1]?.trim() || 'Destination';
    L.marker(end, {
      icon: L.divIcon({
        html: `<div style="background:#162330;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">🏁 ${destName}</div>`,
        className: '', iconAnchor: [20, 12]
      })
    }).addTo(map);

    // Truck marker
    const truckIcon = L.divIcon({
      html: `<div style="background:#E8640A;border:3px solid #fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(232,100,10,0.5);font-size:20px;transition:all 0.3s;">🚛</div>`,
      className: '', iconSize: [40, 40], iconAnchor: [20, 20]
    });
    const marker = L.marker(steps[0], { icon: truckIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:sans-serif;min-width:190px;padding:2px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${vehicle.plate}</div>
          <div style="font-size:12px;color:#5e6e7d;">${vehicle.driver}</div>
          <div style="font-size:12px;margin-top:6px;">🛣 ${vehicle.route}</div>
          <div style="font-size:12px;">⚡ ${vehicle.offline ? 'Offline' : vehicle.speed + ' km/h'}</div>
          <div style="font-size:12px;">⛽ ${vehicle.totalFuelL}L fuel remaining</div>
          <div style="font-size:12px;">📦 ${vehicle.cargoType} · ${vehicle.loadWeight}</div>
        </div>
      `);
    truckMarker.current = marker;
    mapInst.current = map;

    // Fit map to route
    try { map.fitBounds(planned.getBounds(), { padding: [30, 30] }); } catch(e) {}
  }, [loaded]);

  // Animate truck movement
  useEffect(() => {
    if (!loaded || vehicle.offline) return;
    const steps = stepsRef.current;
    if (!steps.length) return;

    // Pick starting position at ~20-40% through the route (bus is already en route)
    const startStep = Math.floor(steps.length * 0.2);
    setStepIdx(startStep);

    const id = setInterval(() => {
      setStepIdx(prev => {
        const next = prev + 1 >= steps.length ? 0 : prev + 1; // loop
        return next;
      });
    }, 800);
    return () => clearInterval(id);
  }, [loaded, vehicle.offline]);

  // Update truck position on map
  useEffect(() => {
    const steps = stepsRef.current;
    if (!truckMarker.current || !steps.length || stepIdx >= steps.length) return;
    const pos = steps[stepIdx];
    truckMarker.current.setLatLng(pos);

    // Update travelled polyline
    if (travelledLine.current) {
      const travelledCoords = steps.slice(0, stepIdx + 1);
      travelledLine.current.setLatLngs(travelledCoords);
    }

    // Detect deviation
    const devStart = deviationStartRef.current;
    const isOnDeviation = devStart > 0 && stepIdx >= devStart && stepIdx < devStart + Math.floor(steps.length * 0.2);

    if (isOnDeviation && !deviationAlertShown) {
      setIsDeviated(true);
      setDeviationAlertShown(true);

      // Show deviation marker
      if (mapInst.current && window.L) {
        if (deviationMarker.current) deviationMarker.current.remove();
        const devIcon = window.L.divIcon({
          html: `<div style="background:#ef4444;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:5px;white-space:nowrap;animation:pulse 1s infinite;">⚠ ROUTE DEVIATION</div>`,
          className: '', iconAnchor: [60, 10]
        });
        deviationMarker.current = window.L.marker(pos, { icon: devIcon }).addTo(mapInst.current);
      }
    }

    if (!isOnDeviation && deviationAlertShown && stepIdx > devStart + Math.floor(steps.length * 0.22)) {
      setIsDeviated(false);
      if (deviationMarker.current) { deviationMarker.current.remove(); deviationMarker.current = null; }
    }

    // Pan map smoothly to follow truck
    if (mapInst.current) {
      mapInst.current.panTo(pos, { animate: true, duration: 0.6 });
    }
  }, [stepIdx]);

  const progress = stepsRef.current.length > 0 ? Math.round((stepIdx / stepsRef.current.length) * 100) : 0;

  return (
    <div style={{ position: 'relative' }}>
      {!loaded && (
        <div style={s.loading}>
          <div style={s.spinner} />
          <span>Loading live route map…</span>
        </div>
      )}
      <div ref={mapRef} style={{ ...s.map, opacity: loaded ? 1 : 0 }} />

      {/* Live badge */}
      {loaded && !vehicle.offline && (
        <div style={s.liveBadge}>
          <span style={s.liveDot} /> LIVE · {vehicle.speed} km/h
        </div>
      )}

      {/* Route progress bar */}
      {loaded && !vehicle.offline && (
        <div style={s.progressWrap}>
          <div style={s.progressInner}>
            <span style={s.progressFrom}>{vehicle.route.split('→')[0]?.trim()}</span>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${progress}%` }} />
              <span style={{ ...s.progressTruck, left: `${Math.min(progress, 95)}%` }}>🚛</span>
            </div>
            <span style={s.progressTo}>{vehicle.route.split('→')[1]?.trim()}</span>
            <span style={s.progressPct}>{progress}%</span>
          </div>
        </div>
      )}

      {/* Deviation alert banner */}
      {loaded && isDeviated && (
        <div style={s.deviationBanner}>
          <span>⚠️</span>
          <div>
            <div style={s.devTitle}>Route Deviation Detected!</div>
            <div style={s.devSub}>{vehicle.plate} is {vehicle.routeDeviation} km off the planned route. Expected: {vehicle.route}</div>
          </div>
        </div>
      )}

      {/* Offline badge */}
      {vehicle.offline && (
        <div style={s.offlineBadge}>⚠ Bus offline — last known position shown</div>
      )}

      {/* Coordinates */}
      {loaded && (
        <div style={s.coordBadge}>
          {stepsRef.current[stepIdx]?.[0].toFixed(5) ?? vehicle.lat.toFixed(5)}, {stepsRef.current[stepIdx]?.[1].toFixed(5) ?? vehicle.lng.toFixed(5)}
        </div>
      )}

      {/* Legend */}
      {loaded && (
        <div style={s.legend}>
          <span style={s.legItem}><span style={{ ...s.legLine, background: '#E8640A' }} /> Travelled</span>
          <span style={s.legItem}><span style={{ ...s.legLine, background: '#bcc6d0', borderTop: '2px dashed #bcc6d0' }} /> Planned route</span>
          {isDeviated && <span style={s.legItem}><span style={{ ...s.legLine, background: '#ef4444' }} /> Deviation</span>}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  map: { width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', transition: 'opacity 0.3s' },
  loading: { height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#f8fafb', borderRadius: 12, fontSize: 13, color: '#5e6e7d' },
  spinner: { width: 28, height: 28, border: '3px solid #dde3ea', borderTop: '3px solid #E8640A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  liveBadge: { position: 'absolute', top: 10, left: 10, background: '#0b161f', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, zIndex: 1000 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#E8640A', display: 'inline-block', animation: 'pulse 1.5s infinite' },
  progressWrap: { position: 'absolute', bottom: 44, left: 10, right: 10, zIndex: 1000 },
  progressInner: { background: 'rgba(11,22,31,0.88)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 },
  progressFrom: { fontSize: 10, color: '#0f8c61', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' },
  progressBar: { flex: 1, height: 6, background: '#253341', borderRadius: 3, position: 'relative', overflow: 'visible' },
  progressFill: { height: '100%', background: '#E8640A', borderRadius: 3, transition: 'width 0.8s ease' },
  progressTruck: { position: 'absolute', top: -9, fontSize: 16, transform: 'translateX(-50%)', transition: 'left 0.8s ease' },
  progressTo: { fontSize: 10, color: '#bcc6d0', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' },
  progressPct: { fontSize: 10, color: '#E8640A', fontWeight: 700, whiteSpace: 'nowrap' },
  deviationBanner: { position: 'absolute', top: 10, right: 10, background: '#b91c1c', color: '#fff', borderRadius: 10, padding: '8px 12px', zIndex: 1000, display: 'flex', gap: 8, alignItems: 'flex-start', maxWidth: 240, boxShadow: '0 4px 16px rgba(185,28,28,0.4)' },
  devTitle: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  devSub: { fontSize: 10, opacity: 0.85, lineHeight: 1.4 },
  offlineBadge: { position: 'absolute', top: 10, left: 10, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, zIndex: 1000 },
  coordBadge: { position: 'absolute', bottom: 10, right: 10, background: 'rgba(11,22,31,0.75)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 6, zIndex: 1000, fontFamily: 'monospace' },
  legend: { position: 'absolute', bottom: 10, left: 10, background: 'rgba(11,22,31,0.82)', borderRadius: 8, padding: '5px 10px', display: 'flex', gap: 12, zIndex: 1000 },
  legItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#fff' },
  legLine: { width: 14, height: 3, display: 'inline-block', borderRadius: 2 },
};
