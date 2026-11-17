export interface Place {
  name: string;
  lng: number;
  lat: number;
}

/** Depots and corridor cities a driver can start a trip between. Coordinates are [lng, lat] for Mapbox. */
export const PLACES: Place[] = [
  { name: 'Kigali', lng: 30.0619, lat: -1.9441 },
  { name: 'Nyabugogo', lng: 30.0444, lat: -1.9394 },
  { name: 'Rwamagana', lng: 30.4347, lat: -1.9489 },
  { name: 'Muhanga', lng: 29.7564, lat: -2.085 },
  { name: 'Huye (Butare)', lng: 29.7441, lat: -2.5967 },
  { name: 'Musanze', lng: 29.634, lat: -1.4996 },
  { name: 'Rubavu (Gisenyi)', lng: 29.2565, lat: -1.7028 },
  { name: 'Rusizi (Cyangugu)', lng: 28.907, lat: -2.4846 },
  { name: 'Nyagatare', lng: 30.325, lat: -1.298 },
  { name: 'Gatuna Border', lng: 30.0708, lat: -1.4414 },
  { name: 'Rusumo Border', lng: 30.783, lat: -2.383 },
  { name: 'Kampala', lng: 32.5825, lat: 0.3476 },
  { name: 'Nairobi', lng: 36.8219, lat: -1.2921 },
  { name: 'Mombasa', lng: 39.6682, lat: -4.0435 },
  { name: 'Arusha', lng: 36.683, lat: -3.3869 },
  { name: 'Bujumbura', lng: 29.3599, lat: -3.3614 },
  { name: 'Goma', lng: 29.2285, lat: -1.679 },
  { name: 'Dar es Salaam', lng: 39.2083, lat: -6.7924 },
];

export const QUICK_ROUTES: { from: string; to: string }[] = [
  { from: 'Kigali', to: 'Mombasa' },
  { from: 'Kigali', to: 'Kampala' },
  { from: 'Kigali', to: 'Nairobi' },
  { from: 'Kigali', to: 'Bujumbura' },
  { from: 'Kigali', to: 'Dar es Salaam' },
  { from: 'Kigali', to: 'Rubavu (Gisenyi)' },
  { from: 'Kigali', to: 'Huye (Butare)' },
];

export function findPlace(name: string): Place {
  return PLACES.find(p => p.name === name) ?? PLACES[0];
}

/** Rough road distance when the Mapbox Directions call is unavailable. */
export function estimateRoadKm(a: Place, b: Place): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const straight = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.max(1, Math.round(straight * 1.28));
}

export function estimateMinutes(km: number): number {
  return Math.max(10, Math.round((km / 55) * 60));
}
