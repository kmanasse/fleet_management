export type Role = 'admin' | 'supervisor' | 'viewer' | 'driver';
export type VehicleType = 'truck' | 'tanker' | 'refrigerated' | 'flatbed' | 'tipper' | 'container';

export interface User {
  id: string; name: string; email: string; password: string;
  role: Role; avatar: string; vehiclePlate?: string;
}

export interface HistoryEntry {
  week: string; km: number; expected: number; claimed: number; diff: number; flag: boolean;
}
export interface MonthHistory { month: string; entries: HistoryEntry[]; }

export interface Receipt {
  id: string; date: string; station: string; liters: number; amount: number;
  approved: boolean | null; photoUrl: string; submittedBy: string;
  submittedAt: string; notes: string; gpsLocation: string; vehiclePlate: string;
}

export interface BorderCrossing {
  border: string; country: string; arrivalTime: string; clearanceTime: string; date: string;
}

export interface TripLog {
  id: string; origin: string; destination: string; startDate: string; endDate: string;
  distanceKm: number; fuelUsedL: number; expectedFuelL: number; cargo: string; status: 'completed'|'ongoing'|'planned';
}

export interface ActiveTrip {
  id: string;
  plate: string;
  driver: string;
  origin: string;
  destination: string;
  startedAt: string;
  distanceKm: number;
  durationMin: number;
  distanceSource: 'mapbox' | 'estimate';
  endedAt?: string;
}

export interface Vehicle {
  plate: string; type: VehicleType; make: string; model: string;
  driver: string; driverPhone: string; driverAlt: string;
  location: string; route: string;
  tankAL: number; tankAPct: number;   // primary tank
  tankBL: number; tankBPct: number;   // secondary tank (trucks have 2)
  tankACapacity: number; tankBCapacity: number;
  totalFuelL: number; totalFuelPct: number;
  km: number; todayKm: number;
  expected: number; claimed: number; diff: number;
  isAlert: boolean; isWarn: boolean; offline: boolean; speed: number;
  lastRefuel: string; vehicleYear: number; capacity: string; // payload e.g. "30 tonnes"
  engine: string; lastService: string; totalFuelMonth: number;
  lastSeenMinutes: number; routeDeviation: number;
  approvedStations: string[]; lastStation: string; lastStationApproved: boolean;
  history: MonthHistory[]; receipts: Receipt[];
  registrationDate: string; insuranceExpiry: string; inspectionExpiry: string;
  lat: number; lng: number;
  currentRoute: string; // e.g. Kigali → Mombasa
  cargoType: string;
  loadWeight: string; // e.g. "28.5 tonnes"
  borderCrossings: BorderCrossing[];
  tripLogs: TripLog[];
  idlingHours: number;
  harshBrakes: number;
  speedingEvents: number;
  nextServiceKm: number;
}

function rnd(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rndF(a: number, b: number, d = 1) { return parseFloat((Math.random() * (b - a) + a).toFixed(d)); }

const VEHICLE_TYPES: VehicleType[] = ['truck','tanker','refrigerated','flatbed','tipper','container'];
const TYPE_LABELS: Record<VehicleType, string> = {
  truck: 'Cargo Truck', tanker: 'Fuel Tanker', refrigerated: 'Reefer Truck',
  flatbed: 'Flatbed', tipper: 'Tipper/Dump', container: 'Container Truck'
};
const MAKES = ['Volvo FH','Mercedes Actros','MAN TGS','DAF XF','Scania R500','Isuzu FVZ','Hino 700','UD Quon'];
const ENGINES_T = ['Volvo D13 460hp','Mercedes OM471 450hp','MAN D2676 480hp','DAF MX-13 480hp','Scania DC13 500hp','Isuzu 6WG1 360hp','Hino E13C 430hp'];

// Rwandan + regional truck plates (RAC, RAD, RAE, RAF series for commercial)
const PLATES = [
  'RAC 001 T','RAC 045 T','RAC 112 T','RAD 003 T','RAD 078 T','RAD 156 T',
  'RAE 007 T','RAE 089 T','RAE 201 T','RAF 012 T','RAF 067 T','RAF 189 T',
  'RAG 023 T','RAG 134 T','RAG 278 T','RAH 034 T','RAH 145 T','RAH 290 T',
  'RAI 056 T','RAI 167 T','RAI 312 T','RAJ 078 T','RAJ 189 T','RAJ 334 T',
  'RBB 011 T','RBB 122 T','RBC 033 T','RBC 144 T','RBD 055 T','RBD 177 T',
];

const DRIVERS = [
  'Innocent Nkurunziza','Théoneste Mugabo','Damascène Habyarimana','Anastase Rwigema','Félicien Nzabonimpa',
  'Protais Bizumuremyi','Evariste Karekezi','Théodore Ndagijimana','Anselme Twagirayezu','Fulgence Ntakirutimana',
  'Léonard Niyonsaba','Sylvestre Habimana','Cyprien Kayitare','Augustin Uwitonze','Médard Nkurunziza',
  'Gratien Hakizimana','Venuste Niyomugabo','Boniface Rutayisire','Ambroise Nzeyimana','Didier Ndikumana',
  'Célestin Bizimana','Gaspard Murekezi','Alphonse Tuyisenge','Ignace Uwimana','Modeste Habimana',
  'Barnabé Nkurunziza','Vianney Gasana','Callixte Ndayisenga','Ephrem Ntawukuliryayo','Siméon Gahima'
];

const PHONES = Array.from({length:30}, () => `+250 78${rnd(1,9)} ${rnd(100,999)} ${rnd(100,999)}`);
const ALT_PHONES = Array.from({length:30}, () => `+250 72${rnd(1,9)} ${rnd(100,999)} ${rnd(100,999)}`);

// Real coordinates across Rwanda + border points
const COORDS: [number,number][] = [
  [-1.9441,30.1063],[-1.9299,30.1199],[-1.9355,30.0619],[-1.9845,30.0412],[-1.9214,30.0927],
  [-1.9164,30.1082],[-1.9536,30.0634],[-1.9700,30.0823],[-2.5967,29.7448],[-2.3384,29.3494],
  [-1.5081,29.6347],[-2.0236,30.0623],[-1.6667,29.5833],[-2.4833,28.9167],[-1.0722,29.7394],
  [-0.3163,32.5822],[-1.2833,36.8167],[-3.3869,36.6830],[-4.0435,39.6682],[-2.5000,32.9000],
  [-1.9441,30.1063],[-1.8000,30.0800],[-2.1000,30.3000],[-1.5000,29.9000],[-2.8000,29.4000],
  [-3.0000,29.0000],[-1.9500,29.8500],[-2.2000,30.1000],[-1.7000,29.7000],[-2.6000,29.6000],
];

const LOCATIONS_T = [
  'Kigali Industrial Zone','Remera, Kigali','Kacyiru, Kigali','Nyamirambo, Kigali','Kanombe, Kigali',
  'Gikondo, Kigali','Kicukiro, Kigali','Gasabo, Kigali','Butare (Huye)','Cyangugu (Rusizi)',
  'Gisenyi (Rubavu)','Rwamagana','Kibuye (Karongi)','Cyangugu Border','Gatuna Border (Uganda)',
  'Kampala, Uganda','Nairobi, Kenya','Arusha, Tanzania','Mombasa Port','Dodoma, Tanzania',
  'Kigali CBD','Kigali Heights','Nyabugogo Terminal','Masaka, Kigali','Bugesera',
  'Bujumbura, Burundi','Muhanga','Musanze','Nyagatare','Rusizi'
];

const LONG_ROUTES = [
  'Kigali → Mombasa (1,410 km)','Kigali → Kampala (510 km)','Kigali → Nairobi (940 km)',
  'Kigali → Bujumbura (280 km)','Kigali → Dar es Salaam (1,350 km)','Kigali → Goma (220 km)',
  'Kigali → Butare (130 km)','Kigali → Gisenyi (160 km)','Kigali → Cyangugu (220 km)',
  'Kigali → Musanze (100 km)','Kampala → Mombasa (900 km)','Nairobi → Mombasa (480 km)',
  'Kigali → Gatuna Border (85 km)','Kigali → Rusizi Border (225 km)','Kigali → Cyanika Border (145 km)',
  'Kigali → Nyabugogo Hub (5 km)','Butare → Cyangugu (190 km)','Musanze → Gisenyi (80 km)',
  'Kigali → Nyagatare (185 km)','Kigali → Rwamagana (55 km)','Kigali → Muhanga (75 km)',
  'Mombasa → Nairobi (480 km)','Kampala → Jinja (80 km)','Nairobi → Arusha (270 km)',
  'Kigali → Arusha (680 km)','Butare → Bujumbura (200 km)','Gisenyi → Goma (5 km)',
  'Kigali → Cyangugu (220 km)','Nyagatare → Uganda Border (45 km)','Kigali → Bugesera (45 km)',
];

const CARGO_TYPES = [
  'Construction Materials','Consumer Goods','Fuel/Petroleum','Pharmaceutical Products',
  'Agricultural Produce','Electronics','Building Materials','Food & Beverages',
  'Mining Equipment','Textile Products','Chemical Products','Machinery Parts',
  'Cement','Steel Rods','Rice/Grain','Cooking Oil','Empty Containers','Livestock Feed'
];

const BORDERS = [
  {border:'Gatuna/Katuna',country:'Uganda'},{border:'Cyanika',country:'Uganda'},
  {border:'Kagitumba',country:'Uganda'},{border:'Rusizi/Bugarama',country:'Burundi/DRC'},
  {border:'Nemba',country:'Burundi'},{border:'Rusumo',country:'Tanzania'},
];

const APPROVED_STATIONS_T = [
  ['Total Energies Kigali','Kobil Nyabugogo','Puma Gikondo'],
  ['OiLibya Kigali','SP Kanombe','Engen Butare'],
  ['Oryx Kigali','Total Kampala','KenolKobil Nairobi'],
];
const ALL_STATIONS_T = [
  'Total Energies Kigali','Kobil Nyabugogo','Puma Gikondo','OiLibya Kigali',
  'SP Kanombe','Engen Butare','Oryx Kigali','Total Kampala',
  'KenolKobil Nairobi','National Oil Nairobi','Total Mombasa','Puma Mombasa',
  'Shell Kampala','Oryx Bujumbura','Total Bujumbura'
];
const SUBMIT_TIMES = ['06:14','07:32','09:05','11:47','13:22','15:55','17:10','20:30','22:15'];

// Tank capacities by vehicle type
const TANK_CAPS: Record<VehicleType,[number,number]> = {
  truck:        [300, 200],
  tanker:       [600, 400],
  refrigerated: [350, 250],
  flatbed:      [280, 180],
  tipper:       [250, 0],   // tippers often single tank
  container:    [400, 300],
};

export let currentFuelPrice = 3000;
export function setFuelPrice(p: number) { currentFuelPrice = p; }

function genHistory(): MonthHistory[] {
  return ['March 2025','April 2025','May 2025'].map(month => ({
    month,
    entries: [1,2,3,4].map(w => {
      const km = rnd(1200, 8000);
      const expected = parseFloat((km * 0.35).toFixed(1)); // trucks: ~35L/100km
      const inflate = Math.random() < 0.2 ? rndF(20, 80) : rndF(-5, 10);
      const claimed = parseFloat((expected + inflate).toFixed(1));
      const diff = parseFloat((claimed - expected).toFixed(1));
      return { week:`Week ${w}`, km, expected, claimed, diff, flag: diff > 20 };
    })
  }));
}

function genReceipts(driverName: string, plate: string): Receipt[] {
  return Array.from({length: rnd(5,10)}, (_, i) => {
    const liters = rnd(100, 500);
    return {
      id: `RCP-${2000+i}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,
      date: `2025-0${rnd(3,5)}-${String(rnd(1,28)).padStart(2,'0')}`,
      station: ALL_STATIONS_T[rnd(0, ALL_STATIONS_T.length-1)],
      liters, amount: liters * currentFuelPrice,
      approved: Math.random() > 0.15,
      photoUrl:'', submittedBy: driverName,
      submittedAt: SUBMIT_TIMES[rnd(0, SUBMIT_TIMES.length-1)],
      notes:'', gpsLocation: `Kigali (-1.944${rnd(0,9)}, 30.10${rnd(10,99)})`,
      vehiclePlate: plate,
    };
  });
}

function genBorderCrossings(): BorderCrossing[] {
  if (Math.random() < 0.4) return [];
  return Array.from({length: rnd(1,3)}, () => {
    const b = BORDERS[rnd(0, BORDERS.length-1)];
    const hour = rnd(5,22);
    const wait = rnd(1,6);
    return {
      border: b.border, country: b.country,
      arrivalTime: `${String(hour).padStart(2,'0')}:${String(rnd(0,59)).padStart(2,'0')}`,
      clearanceTime: `${String(hour+wait).padStart(2,'0')}:${String(rnd(0,59)).padStart(2,'0')}`,
      date: `2025-0${rnd(3,5)}-${String(rnd(1,28)).padStart(2,'0')}`,
    };
  });
}

function genTripLogs(): TripLog[] {
  const destinations = ['Mombasa','Kampala','Nairobi','Bujumbura','Dar es Salaam','Butare','Gisenyi'];
  return Array.from({length: rnd(3,6)}, (_, i) => {
    const dest = destinations[rnd(0,destinations.length-1)];
    const distKm = rnd(80, 1500);
    const expected = parseFloat((distKm * 0.35).toFixed(0));
    const used = parseFloat((expected * rndF(0.9, 1.2)).toFixed(0));
    const statuses: TripLog['status'][] = ['completed','completed','completed','ongoing','planned'];
    return {
      id: `TRIP-${100+i}`,
      origin: 'Kigali',
      destination: dest,
      startDate: `2025-0${rnd(3,5)}-${String(rnd(1,20)).padStart(2,'0')}`,
      endDate: `2025-0${rnd(4,5)}-${String(rnd(1,28)).padStart(2,'0')}`,
      distanceKm: distKm,
      fuelUsedL: used,
      expectedFuelL: expected,
      cargo: CARGO_TYPES[rnd(0,CARGO_TYPES.length-1)],
      status: statuses[rnd(0,statuses.length-1)],
    };
  });
}

export const vehicles: Vehicle[] = PLATES.map((plate, idx) => {
  const type = VEHICLE_TYPES[idx % VEHICLE_TYPES.length];
  const [capA, capB] = TANK_CAPS[type];
  const pctA = rnd(15,100), pctB = capB > 0 ? rnd(15,100) : 0;
  const lA = Math.round(capA * pctA/100), lB = Math.round(capB * pctB/100);
  const totalCap = capA + capB;
  const totalL = lA + lB;
  const totalPct = Math.round(totalL/totalCap*100);
  const todayKm = rnd(50, 800);
  const expected = parseFloat((todayKm * 0.35).toFixed(1));
  const inflate = Math.random() < 0.25 ? rndF(20, 80) : rndF(-5, 10);
  const claimed = parseFloat((expected + inflate).toFixed(1));
  const diff = parseFloat((claimed - expected).toFixed(1));
  const offline = Math.random() < 0.07;
  const [baseLat, baseLng] = COORDS[idx % COORDS.length];
  const approvedSet = APPROVED_STATIONS_T[idx % APPROVED_STATIONS_T.length];
  const lastStation = ALL_STATIONS_T[rnd(0,ALL_STATIONS_T.length-1)];
  return {
    plate, type,
    make: MAKES[rnd(0,MAKES.length-1)],
    model: `${rnd(2018,2023)} series`,
    driver: DRIVERS[idx], driverPhone: PHONES[idx], driverAlt: ALT_PHONES[idx],
    location: LOCATIONS_T[idx % LOCATIONS_T.length],
    route: LONG_ROUTES[idx % LONG_ROUTES.length],
    tankAL: lA, tankAPct: pctA, tankBL: lB, tankBPct: pctB,
    tankACapacity: capA, tankBCapacity: capB,
    totalFuelL: totalL, totalFuelPct: totalPct,
    km: rnd(50000,800000), todayKm, expected, claimed, diff,
    isAlert: diff > 20, isWarn: diff > 10 && diff <= 20,
    offline, speed: offline ? 0 : rnd(0,110),
    lastRefuel: `${rnd(1,5)} days ago`,
    vehicleYear: rnd(2015,2023),
    capacity: `${rnd(15,35)}.${rnd(0,9)} tonnes`,
    engine: ENGINES_T[rnd(0,ENGINES_T.length-1)],
    lastService: `${rnd(2,60)} days ago`,
    totalFuelMonth: rnd(1200,8000),
    lastSeenMinutes: offline ? rnd(31,180) : rnd(0,10),
    routeDeviation: Math.random()<0.2 ? rnd(10,80) : 0,
    approvedStations: approvedSet, lastStation,
    lastStationApproved: approvedSet.includes(lastStation),
    history: genHistory(), receipts: genReceipts(DRIVERS[idx], plate),
    registrationDate: `${rnd(2015,2022)}-${String(rnd(1,12)).padStart(2,'0')}-${String(rnd(1,28)).padStart(2,'0')}`,
    insuranceExpiry: `202${rnd(5,7)}-${String(rnd(1,12)).padStart(2,'0')}-${String(rnd(1,28)).padStart(2,'0')}`,
    inspectionExpiry: `202${rnd(5,7)}-${String(rnd(1,12)).padStart(2,'0')}-${String(rnd(1,28)).padStart(2,'0')}`,
    lat: baseLat + (Math.random()-0.5)*0.02, lng: baseLng + (Math.random()-0.5)*0.02,
    currentRoute: LONG_ROUTES[idx % LONG_ROUTES.length],
    cargoType: CARGO_TYPES[rnd(0,CARGO_TYPES.length-1)],
    loadWeight: `${rnd(10,35)}.${rnd(0,9)} tonnes`,
    borderCrossings: genBorderCrossings(),
    tripLogs: genTripLogs(),
    idlingHours: rndF(0,8),
    harshBrakes: rnd(0,12),
    speedingEvents: rnd(0,8),
    nextServiceKm: rnd(2000,15000),
  };
});

export const liveReceipts: Receipt[] = [];
export const liveTrips: ActiveTrip[] = [];

export const VEHICLE_TYPE_LABELS = TYPE_LABELS;
export const ALL_STATIONS_LIST = ALL_STATIONS_T;

export const USERS: User[] = [
  {id:'1', name:'Admin User',            email:'admin@truckguard.rw',  password:'admin123',  role:'admin',      avatar:'AU'},
  {id:'2', name:'Fleet Supervisor',      email:'super@truckguard.rw',  password:'super123',  role:'supervisor', avatar:'FS'},
  {id:'3', name:'Viewer Only',           email:'viewer@truckguard.rw', password:'viewer123', role:'viewer',     avatar:'VO'},
  {id:'4', name:'Innocent Nkurunziza',   email:'driver@truckguard.rw', password:'driver123', role:'driver',     avatar:'IN', vehiclePlate: vehicles[0]?.plate},
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin:      ['dashboard','alerts','receipts','driver-portal','admin-settings'],
  supervisor: ['dashboard','alerts','receipts'],
  viewer:     ['dashboard'],
  driver:     ['driver-portal'],
};

export const TANK = 500; // max single tank reference
