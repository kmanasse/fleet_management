import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Place, estimateMinutes, estimateRoadKm } from './places';

export interface RouteSummary {
  km: number;
  minutes: number;
  source: 'mapbox' | 'estimate';
}

const ENV_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const TOKEN_KEY = 'truckguard.mapboxToken';

interface Props {
  origin: Place;
  destination: Place;
  onSummary: (summary: RouteSummary) => void;
}

interface DirectionsResponse {
  message?: string;
  routes?: { distance: number; duration: number; geometry: GeoJSON.LineString }[];
}

export default function RouteMap({ origin, destination, onSummary }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onSummaryRef = useRef(onSummary);
  onSummaryRef.current = onSummary;

  const [token, setToken] = useState(ENV_TOKEN || window.localStorage.getItem(TOKEN_KEY) || '');
  const [draft, setDraft] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [origin.lng, origin.lat],
      zoom: 5.2,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      map.resize();
      setMapReady(true);
    });
    map.on('error', (event) => {
      const message = event.error?.message || 'Mapbox could not load the map.';
      if (/token|unauthorized|forbidden|401/i.test(message)) setMapError(message);
    });
    mapRef.current = map;
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Recreate the map only when the token changes. Route updates are drawn below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const same = origin.name === destination.name;
    const fallbackKm = same ? 0 : estimateRoadKm(origin, destination);
    const fallback: RouteSummary = {
      km: fallbackKm,
      minutes: same ? 0 : estimateMinutes(fallbackKm),
      source: 'estimate',
    };
    if (!token || same) {
      onSummaryRef.current(fallback);
      return;
    }

    const controller = new AbortController();
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;

    fetch(url, { signal: controller.signal })
      .then(response => response.json())
      .then((data: DirectionsResponse) => {
        const route = data.routes?.[0];
        if (!route) {
          setMapError(data.message || 'Mapbox has no driving route for these places.');
          onSummaryRef.current(fallback);
          return;
        }
        setMapError('');
        onSummaryRef.current({
          km: Math.max(1, Math.round(route.distance / 1000)),
          minutes: Math.max(1, Math.round(route.duration / 60)),
          source: 'mapbox',
        });
        const feature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: route.geometry,
        };
        const draw = () => {
          const map = mapRef.current;
          if (!map) return;
          const existing = map.getSource('route');
          if (existing instanceof mapboxgl.GeoJSONSource) existing.setData(feature);
          else {
            map.addSource('route', { type: 'geojson', data: feature });
            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': '#E8640A', 'line-width': 4 },
            });
          }
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [
            new mapboxgl.Marker({ color: '#0f8c61' }).setLngLat([origin.lng, origin.lat]).addTo(map),
            new mapboxgl.Marker({ color: '#E8640A' }).setLngLat([destination.lng, destination.lat]).addTo(map),
          ];
          const bounds = new mapboxgl.LngLatBounds();
          route.geometry.coordinates.forEach(coord => bounds.extend(coord as [number, number]));
          map.fitBounds(bounds, { padding: 48, duration: 500 });
        };
        if (mapReady) draw();
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setMapError('Could not reach the Mapbox directions service.');
        onSummaryRef.current(fallback);
      });

    return () => controller.abort();
  }, [origin, destination, token, mapReady]);

  const saveToken = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) return;
    window.localStorage.setItem(TOKEN_KEY, next);
    setMapError('');
    setToken(next);
  };

  return (
    <div>
      {token ? (
        <div ref={containerRef} style={{ height: 320, borderRadius: 12, overflow: 'hidden' }} />
      ) : (
        <form onSubmit={saveToken} style={box}>
          <div style={{ fontWeight: 600, color: '#162330' }}>Mapbox public token</div>
          <div>Paste a token that starts with pk. The driving route is drawn once Mapbox accepts it.</div>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="pk.…"
              style={tokenInput}
            />
            <button type="submit" style={saveBtn}>Use token</button>
          </div>
        </form>
      )}
      {mapError && <div style={errorLine}>{mapError}</div>}
    </div>
  );
}

const box: React.CSSProperties = {
  minHeight: 140,
  borderRadius: 12,
  background: '#f8fafb',
  border: '1px dashed #dde3ea',
  color: '#5e6e7d',
  fontSize: 13,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 8,
  padding: '14px 16px',
  lineHeight: 1.45,
};

const tokenInput: React.CSSProperties = {
  flex: 1,
  padding: '9px 12px',
  border: '1.5px solid #dde3ea',
  borderRadius: 9,
  fontSize: 13,
  color: '#162330',
  outline: 'none',
};

const saveBtn: React.CSSProperties = {
  background: '#0b161f',
  color: '#fff',
  border: 'none',
  borderRadius: 9,
  padding: '9px 12px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const errorLine: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: '#b91c1c',
};
