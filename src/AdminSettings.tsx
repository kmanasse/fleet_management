import React, { useState } from 'react';
import {
  Settings, Fuel, Bus as BusIcon, Phone, Plus, Trash2,
  Save, CheckCircle, AlertTriangle, Edit3, X
} from 'lucide-react';
import { vehicles as buses, currentFuelPrice, setFuelPrice, TANK, Vehicle as Bus, ROLE_PERMISSIONS } from './data';

type Tab = 'fuel' | 'buses' | 'drivers';

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('fuel');

  // ── Fuel price ──
  const [priceInput, setPriceInput] = useState(String(currentFuelPrice));
  const [priceSaved, setPriceSaved] = useState(false);

  const saveFuelPrice = () => {
    const v = parseInt(priceInput);
    if (!v || v < 500 || v > 10000) return;
    setFuelPrice(v);
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 3000);
  };

  // ── Bus management ──
  const [busListState, setBusListState] = useState<Bus[]>([...buses]);
  const [showAddBus, setShowAddBus] = useState(false);
  const [deletingPlate, setDeletingPlate] = useState('');
  const [busMsg, setBusMsg] = useState('');
  const [newBus, setNewBus] = useState({
    plate: '', driver: '', driverPhone: '', driverAlt: '',
    engine: '', vehicleYear: '', capacity: '', route: ''
  });

  const deleteBus = (plate: string) => {
    const idx = buses.findIndex(b => b.plate === plate);
    if (idx !== -1) buses.splice(idx, 1);
    setBusListState([...buses]);
    setDeletingPlate('');
    setBusMsg(`Bus ${plate} removed from fleet.`);
    setTimeout(() => setBusMsg(''), 3000);
  };

  const addBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBus.plate || !newBus.driver) return;
    const b: Bus = {
      plate: newBus.plate.toUpperCase(),
      
      driver: newBus.driver,
      driverPhone: newBus.driverPhone,
      driverAlt: newBus.driverAlt,
      engine: newBus.engine || 'Isuzu NPR',
      vehicleYear: parseInt(newBus.vehicleYear) || 2020,
      capacity: `${parseInt(newBus.capacity) || 20} tonnes`,
      route: newBus.route,
      location: 'Kigali',
      
      km: 0, todayKm: 0, expected: 0, claimed: 0, diff: 0,
      isAlert: false, isWarn: false, offline: false, speed: 0,
      lastRefuel: 'Today', lastService: 'Today',
      totalFuelMonth: 0, lastSeenMinutes: 0, routeDeviation: 0,
      approvedStations: ['Kobil Remera','Total Kimironko'],
      lastStation: '', lastStationApproved: true,
      history: [], receipts: [],
      type: 'truck' as any,
      make: 'Isuzu', model: '2020 series',
      tankAL: 300, tankAPct: 100, tankBL: 200, tankBPct: 100,
      tankACapacity: 300, tankBCapacity: 200,
      totalFuelL: 500, totalFuelPct: 100,
      currentRoute: newBus.route,
      cargoType: 'General Cargo',
      loadWeight: '20 tonnes',
      borderCrossings: [], tripLogs: [],
      idlingHours: 0, harshBrakes: 0, speedingEvents: 0, nextServiceKm: 10000,
      registrationDate: new Date().toISOString().split('T')[0],
      insuranceExpiry: '2027-01-01', inspectionExpiry: '2027-01-01',
      lat: -1.9441 + (Math.random()-0.5)*0.05,
      lng: 30.0619 + (Math.random()-0.5)*0.05,
    };
    buses.unshift(b);
    setBusListState([...buses]);
    setNewBus({ plate:'', driver:'', driverPhone:'', driverAlt:'', engine:'', vehicleYear:'', capacity:'', route:'' });
    setShowAddBus(false);
    setBusMsg(`Bus ${b.plate} added to fleet.`);
    setTimeout(() => setBusMsg(''), 3000);
  };

  // ── Driver contacts ──
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditPhone(busListState[idx].driverPhone);
    setEditAlt(busListState[idx].driverAlt);
  };

  const saveContact = (plate: string) => {
    const b = buses.find(x => x.plate === plate);
    if (b) { b.driverPhone = editPhone; b.driverAlt = editAlt; }
    setBusListState([...buses]);
    setEditingIdx(null);
    setContactMsg(`Contact updated for ${plate}.`);
    setTimeout(() => setContactMsg(''), 3000);
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'fuel',    label: 'Fuel Price',      icon: <Fuel size={15}/> },
    { id: 'buses',   label: 'Fleet Management', icon: <BusIcon size={15}/> },
    { id: 'drivers', label: 'Driver Contacts',  icon: <Phone size={15}/> },
  ];

  return (
    <div style={s.page} className="page-enter">
      <div style={s.header}>
        <div>
          <h1 style={s.title}><Settings size={20} style={{verticalAlign:'middle', marginRight:8}}/>Admin Settings</h1>
          <p style={s.sub}>Manage fuel prices, fleet, and driver contacts. Admin access only.</p>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── FUEL PRICE ── */}
      {tab === 'fuel' && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Market Fuel Price (RWF per litre)</div>
          <p style={s.sectionSub}>
            Changing this updates the expected cost calculations across all buses and
            is applied to all new receipt submissions from drivers.
          </p>
          <div style={s.priceCard}>
            <div style={s.currentPrice}>
              <div style={s.priceLabel}>Current price</div>
              <div style={s.priceVal}>{currentFuelPrice.toLocaleString()} RWF/L</div>
            </div>
            <div style={s.priceForm}>
              <label style={s.label}>Update fuel price (RWF per litre)</label>
              <div style={s.priceInputRow}>
                <input
                  type="number" min="500" max="10000" step="50"
                  value={priceInput} onChange={e => setPriceInput(e.target.value)}
                  style={s.input} placeholder="e.g. 3000"
                />
                <button onClick={saveFuelPrice} style={s.saveBtn}>
                  <Save size={14}/> Save price
                </button>
              </div>
              {priceSaved && (
                <div style={s.successMsg}><CheckCircle size={13}/> Fuel price updated to {parseInt(priceInput).toLocaleString()} RWF/L</div>
              )}
              {parseInt(priceInput) > 0 && parseInt(priceInput) !== currentFuelPrice && (
                <div style={s.previewBox}>
                  <div style={s.previewRow2}><span>Full tank (120L)</span><span style={{fontWeight:600}}>{(120 * parseInt(priceInput)).toLocaleString()} RWF</span></div>
                  <div style={s.previewRow2}><span>50L refuel</span><span style={{fontWeight:600}}>{(50 * parseInt(priceInput)).toLocaleString()} RWF</span></div>
                  <div style={s.previewRow2}><span>Monthly avg (300L)</span><span style={{fontWeight:600}}>{(300 * parseInt(priceInput)).toLocaleString()} RWF</span></div>
                </div>
              )}
            </div>
          </div>

          <div style={s.historyCard}>
            <div style={s.sectionTitle}>Price history</div>
            {[
              { date: '2025-05-01', price: 2800, by: 'Admin User' },
              { date: '2025-04-01', price: 2750, by: 'Admin User' },
              { date: '2025-03-01', price: 2700, by: 'Admin User' },
            ].map(h => (
              <div key={h.date} style={s.histRow}>
                <span style={s.histDate}>{h.date}</span>
                <span style={s.histPrice}>{h.price.toLocaleString()} RWF/L</span>
                <span style={s.histBy}>Set by {h.by}</span>
              </div>
            ))}
            <div style={s.histRow}>
              <span style={s.histDate}>Current</span>
              <span style={{...s.histPrice, color:'#0f8c61', fontWeight:700}}>{currentFuelPrice.toLocaleString()} RWF/L</span>
              <span style={s.histBy}>Active now</span>
            </div>
          </div>
        </div>
      )}

      {/* ── FLEET MANAGEMENT ── */}
      {tab === 'buses' && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <div>
              <div style={s.sectionTitle}>Fleet — {busListState.length} buses</div>
              <p style={s.sectionSub}>Add new buses or remove buses from the active fleet.</p>
            </div>
            <button style={s.addBtn} onClick={() => setShowAddBus(true)}>
              <Plus size={14}/> Add bus
            </button>
          </div>

          {busMsg && <div style={s.successMsg}><CheckCircle size={13}/> {busMsg}</div>}

          {showAddBus && (
            <div style={s.addCard}>
              <div style={s.addCardHead}>
                <span style={s.addCardTitle}>Register new bus</span>
                <button style={s.iconBtn} onClick={() => setShowAddBus(false)}><X size={16}/></button>
              </div>
              <form onSubmit={addBus} style={s.addForm}>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Plate number *</label>
                    <input value={newBus.plate} onChange={e=>setNewBus({...newBus,plate:e.target.value})} placeholder="e.g. RAK 221 B" style={s.input} required/>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Driver name *</label>
                    <input value={newBus.driver} onChange={e=>setNewBus({...newBus,driver:e.target.value})} placeholder="Full name" style={s.input} required/>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Phone (primary)</label>
                    <input value={newBus.driverPhone} onChange={e=>setNewBus({...newBus,driverPhone:e.target.value})} placeholder="+250 78X XXX XXX" style={s.input}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Phone (alt)</label>
                    <input value={newBus.driverAlt} onChange={e=>setNewBus({...newBus,driverAlt:e.target.value})} placeholder="+250 72X XXX XXX" style={s.input}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Engine / model</label>
                    <select value={newBus.engine} onChange={e=>setNewBus({...newBus,engine:e.target.value})} style={s.input}>
                      <option value="">Select…</option>
                      {['Isuzu NPR','Toyota Coaster','Yutong ZK6752','Mitsubishi Rosa','Higer KLQ6796'].map(e=><option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Year</label>
                    <input type="number" value={newBus.vehicleYear} onChange={e=>setNewBus({...newBus,vehicleYear:e.target.value})} placeholder="2020" min="2000" max="2025" style={s.input}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Payload capacity (tonnes)</label>
                    <input type="number" value={newBus.capacity} onChange={e=>setNewBus({...newBus,capacity:e.target.value})} placeholder="20" style={s.input}/>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Assigned route</label>
                    <input value={newBus.route} onChange={e=>setNewBus({...newBus,route:e.target.value})} placeholder="e.g. GS Remera → City Centre" style={s.input}/>
                  </div>
                </div>
                <div style={s.addFormBtns}>
                  <button type="button" style={s.cancelBtn} onClick={() => setShowAddBus(false)}>Cancel</button>
                  <button type="submit" style={s.saveBtn}><Plus size={14}/> Register bus</button>
                </div>
              </form>
            </div>
          )}

          <div style={s.busList}>
            <div style={s.busListHead}>
              <span>Plate</span><span>Driver</span><span>Engine</span><span>Year</span><span>Route</span><span>Actions</span>
            </div>
            {busListState.map((b, i) => (
              <div key={b.plate} style={s.busRow}>
                <div style={s.plateLine}>
                  <span style={s.plateBadge}>RW</span>
                  <span style={s.plateText}>{b.plate}</span>
                </div>
                <span style={s.cell}>{b.driver}</span>
                <span style={s.cell}>{b.engine}</span>
                <span style={s.cell}>{b.vehicleYear}</span>
                <span style={{...s.cell, fontSize:11}}>{b.route || '—'}</span>
                <div style={{display:'flex',gap:6}}>
                  {deletingPlate === b.plate ? (
                    <>
                      <span style={{fontSize:11,color:'#5e6e7d',alignSelf:'center'}}>Confirm?</span>
                      <button style={s.dangerBtn} onClick={() => deleteBus(b.plate)}>Yes, remove</button>
                      <button style={s.cancelSmallBtn} onClick={() => setDeletingPlate('')}>Cancel</button>
                    </>
                  ) : (
                    <button style={s.removeBtn} onClick={() => setDeletingPlate(b.plate)}>
                      <Trash2 size={12}/> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DRIVER CONTACTS ── */}
      {tab === 'drivers' && (
        <div style={s.section}>
          <div style={s.sectionTitle}>Driver Contact Numbers</div>
          <p style={s.sectionSub}>Update primary and alternate phone numbers for each driver.</p>

          {contactMsg && <div style={s.successMsg}><CheckCircle size={13}/> {contactMsg}</div>}

          <div style={s.driverList}>
            <div style={s.driverListHead}>
              <span>Bus</span><span>Driver</span><span>Primary phone</span><span>Alt phone</span><span>Edit</span>
            </div>
            {busListState.map((b, i) => (
              <div key={b.plate} style={s.driverRow}>
                <div style={s.plateLine}>
                  <span style={s.plateBadge}>RW</span>
                  <span style={s.plateText}>{b.plate}</span>
                </div>
                <span style={s.cell}>{b.driver}</span>
                {editingIdx === i ? (
                  <>
                    <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} style={{...s.inlineInput}} placeholder="+250 78X XXX XXX"/>
                    <input value={editAlt} onChange={e=>setEditAlt(e.target.value)} style={{...s.inlineInput}} placeholder="+250 72X XXX XXX"/>
                    <div style={{display:'flex',gap:5}}>
                      <button style={s.saveSmallBtn} onClick={() => saveContact(b.plate)}><Save size={11}/> Save</button>
                      <button style={s.cancelSmallBtn} onClick={() => setEditingIdx(null)}><X size={11}/></button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{...s.cell, color:'#0f8c61'}}>{b.driverPhone || '—'}</span>
                    <span style={{...s.cell, color:'#5e6e7d'}}>{b.driverAlt || '—'}</span>
                    <button style={s.editBtn} onClick={() => startEdit(i)}><Edit3 size={12}/> Edit</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding:'1.5rem', overflowY:'auto', flex:1 },
  header: { marginBottom:'1.25rem' },
  title: { fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:'#0b161f', marginBottom:4 },
  sub: { fontSize:13, color:'#5e6e7d' },
  tabs: { display:'flex', gap:6, marginBottom:'1.5rem', flexWrap:'wrap' },
  tab: { display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:10, border:'1.5px solid #dde3ea', background:'#fff', fontSize:13, fontWeight:500, color:'#5e6e7d', cursor:'pointer' },
  tabActive: { background:'#0b161f', color:'#fff', borderColor:'#0b161f' },
  section: { display:'flex', flexDirection:'column', gap:16 },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  sectionTitle: { fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#162330', marginBottom:4 },
  sectionSub: { fontSize:13, color:'#5e6e7d', maxWidth:500 },
  priceCard: { background:'#fff', borderRadius:14, padding:'20px', border:'1px solid #eef1f4', display:'grid', gridTemplateColumns:'200px 1fr', gap:24 },
  currentPrice: { background:'#e8f7f2', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center' },
  priceLabel: { fontSize:12, color:'#0a6b4a', fontWeight:500, marginBottom:6 },
  priceVal: { fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:700, color:'#0f8c61' },
  priceForm: { display:'flex', flexDirection:'column', gap:10 },
  priceInputRow: { display:'flex', gap:8 },
  label: { fontSize:12, fontWeight:500, color:'#253341', marginBottom:4, display:'block' },
  input: { padding:'9px 12px', border:'1.5px solid #dde3ea', borderRadius:9, fontSize:13, color:'#162330', outline:'none', width:'100%', fontFamily:"'DM Sans',sans-serif" },
  saveBtn: { display:'flex', alignItems:'center', gap:6, background:'#0f8c61', color:'#fff', border:'none', borderRadius:9, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  successMsg: { display:'flex', alignItems:'center', gap:6, background:'#e8f7f2', color:'#0a6b4a', fontSize:12, padding:'8px 14px', borderRadius:8, fontWeight:500 },
  previewBox: { background:'#f8fafb', borderRadius:9, padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 },
  previewRow2: { display:'flex', justifyContent:'space-between', fontSize:13, color:'#253341' },
  historyCard: { background:'#fff', borderRadius:14, padding:'18px', border:'1px solid #eef1f4' },
  histRow: { display:'grid', gridTemplateColumns:'130px 120px 1fr', gap:8, padding:'8px 0', borderBottom:'1px solid #f8fafb', alignItems:'center', fontSize:13 },
  histDate: { color:'#8a97a6' },
  histPrice: { fontWeight:500, color:'#162330' },
  histBy: { fontSize:12, color:'#8a97a6' },
  addBtn: { display:'flex', alignItems:'center', gap:6, background:'#0f8c61', color:'#fff', border:'none', borderRadius:9, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  addCard: { background:'#fff', borderRadius:14, padding:'18px', border:'2px solid #0f8c61' },
  addCardHead: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  addCardTitle: { fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'#162330' },
  iconBtn: { background:'none', border:'none', cursor:'pointer', color:'#8a97a6', padding:4 },
  addForm: { display:'flex', flexDirection:'column', gap:14 },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' },
  field: { display:'flex', flexDirection:'column' },
  addFormBtns: { display:'flex', gap:8, justifyContent:'flex-end' },
  cancelBtn: { padding:'9px 16px', border:'1.5px solid #dde3ea', borderRadius:9, background:'#fff', color:'#5e6e7d', fontSize:13, fontWeight:500, cursor:'pointer' },
  busList: { background:'#fff', borderRadius:14, border:'1px solid #eef1f4', overflow:'auto' },
  busListHead: { display:'grid', gridTemplateColumns:'150px 180px 120px 70px 1fr 160px', gap:8, padding:'10px 16px', background:'#f8fafb', fontSize:11, fontWeight:600, color:'#8a97a6', borderBottom:'1px solid #eef1f4', minWidth:800 },
  busRow: { display:'grid', gridTemplateColumns:'150px 180px 120px 70px 1fr 160px', gap:8, padding:'10px 16px', borderBottom:'1px solid #f8fafb', alignItems:'center', fontSize:13, color:'#253341', minWidth:800 },
  plateLine: { display:'flex', alignItems:'center', gap:5 },
  plateBadge: { background:'#0a6b4a', color:'#fff', fontSize:9, padding:'1px 4px', borderRadius:3, fontWeight:600 },
  plateText: { fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, color:'#162330' },
  cell: { fontSize:12, color:'#253341' },
  removeBtn: { display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'4px 10px', background:'#fff1f1', color:'#b91c1c', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500 },
  dangerBtn: { fontSize:11, padding:'4px 10px', background:'#ef4444', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 },
  cancelSmallBtn: { fontSize:11, padding:'4px 10px', border:'1px solid #dde3ea', borderRadius:6, background:'#fff', color:'#5e6e7d', cursor:'pointer' },
  driverList: { background:'#fff', borderRadius:14, border:'1px solid #eef1f4', overflow:'auto' },
  driverListHead: { display:'grid', gridTemplateColumns:'120px 180px 170px 170px 90px', gap:8, padding:'10px 16px', background:'#f8fafb', fontSize:11, fontWeight:600, color:'#8a97a6', borderBottom:'1px solid #eef1f4', minWidth:800 },
  driverRow: { display:'grid', gridTemplateColumns:'120px 180px 170px 170px 90px', gap:8, padding:'10px 14px', borderBottom:'1px solid #f8fafb', alignItems:'center', minWidth:800 },
  inlineInput: { padding:'6px 10px', border:'1.5px solid #0f8c61', borderRadius:7, fontSize:12, color:'#162330', outline:'none', fontFamily:"'DM Sans',sans-serif" },
  editBtn: { display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'5px 10px', background:'#eff6ff', color:'#1d4ed8', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500 },
  saveSmallBtn: { display:'flex', alignItems:'center', gap:3, fontSize:11, padding:'5px 10px', background:'#0f8c61', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 },
};
