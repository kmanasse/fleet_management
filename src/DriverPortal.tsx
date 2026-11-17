import React, { useState, useRef } from 'react';
import {
  Camera, CheckCircle, AlertTriangle, Clock,
  Fuel, MapPin, Navigation, Gauge, FileText, X, Eye, Play, Flag
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { vehicles as buses, liveReceipts, liveTrips, Receipt, currentFuelPrice, ALL_STATIONS_LIST, ActiveTrip } from './data';
import { PLACES, QUICK_ROUTES, findPlace } from './places';
import RouteMap, { RouteSummary } from './RouteMap';
import { stampPumpPhoto } from './stampPumpPhoto';

export default function DriverPortal() {
  const { user } = useAuth();

  // Find the driver's bus
  const myBus = buses.find((b:any) =>
    user?.vehiclePlate ? b.plate.startsWith(user.vehiclePlate || '') : b.driver === user?.name
  ) ?? buses[0];

  // Form state
  const [station, setStation]     = useState('');
  const [liters, setLiters]       = useState('');
  const [notes, setNotes]         = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoName, setPhotoName] = useState('');
  const [submitted, setSubmitted] = useState<Receipt | null>(null);
  const [step, setStep]           = useState<1|2|3>(1); // 1=fill, 2=preview, 3=done
  const [myReceipts, setMyReceipts] = useState<Receipt[]>(
    [...myBus.receipts, ...liveReceipts.filter(r => r.vehiclePlate === myBus.plate)]
  );
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [stampedPhoto, setStampedPhoto] = useState('');
  const [pickingRoute, setPickingRoute] = useState(false);
  const [originName, setOriginName] = useState('Kigali');
  const [destName, setDestName] = useState('Mombasa');
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(
    () => liveTrips.find(t => t.plate === myBus.plate && !t.endedAt) ?? null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const litersNum = parseFloat(liters);
  const proportionateAmount = Number.isFinite(litersNum) && litersNum > 0
    ? Math.round(litersNum * currentFuelPrice)
    : 0;
  const origin = findPlace(originName);
  const destination = findPlace(destName);
  const samePlace = origin.name === destination.name;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    setStampedPhoto('');
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !photoPreview || proportionateAmount <= 0) return;
    try {
      setStampedPhoto(await stampPumpPhoto(photoPreview, litersNum, proportionateAmount));
    } catch {
      setStampedPhoto(photoPreview);
    }
    setStep(2);
  };

  const startTrip = () => {
    if (samePlace || !routeSummary) return;
    const now = new Date();
    const id = `TRIP-LIVE-${Date.now()}`;
    const trip: ActiveTrip = {
      id,
      plate: myBus.plate,
      driver: user?.name ?? myBus.driver,
      origin: origin.name,
      destination: destination.name,
      startedAt: now.toISOString(),
      distanceKm: routeSummary.km,
      durationMin: routeSummary.minutes,
      distanceSource: routeSummary.source,
    };
    liveTrips.unshift(trip);
    myBus.tripLogs.unshift({
      id,
      origin: origin.name,
      destination: destination.name,
      startDate: now.toISOString().split('T')[0],
      endDate: '',
      distanceKm: routeSummary.km,
      fuelUsedL: 0,
      expectedFuelL: Math.round(routeSummary.km * 0.35),
      cargo: myBus.cargoType,
      status: 'ongoing',
    });
    myBus.route = `${origin.name} → ${destination.name}`;
    myBus.currentRoute = myBus.route;
    setActiveTrip(trip);
    setPickingRoute(false);
  };

  const endTrip = () => {
    if (!activeTrip) return;
    const endedAt = new Date().toISOString();
    activeTrip.endedAt = endedAt;
    const log = myBus.tripLogs.find(t => t.id === activeTrip.id);
    if (log) {
      log.status = 'completed';
      log.endDate = endedAt.split('T')[0];
    }
    setActiveTrip(null);
  };

  const handleSubmit = () => {
    const now = new Date();
    const receipt: Receipt = {
      id: `RCP-LIVE-${Date.now()}`,
      date: now.toISOString().split('T')[0],
      station,
      liters: litersNum,
      amount: proportionateAmount,
      approved: null, // pending
      photoUrl: stampedPhoto || photoPreview,
      submittedBy: user?.name ?? myBus.driver,
      submittedAt: now.toTimeString().slice(0,5),
      notes,
      gpsLocation: myBus.location,
      vehiclePlate: myBus.plate,
    };
    liveReceipts.unshift(receipt);
    myBus.receipts.unshift(receipt);
    setMyReceipts(prev => [receipt, ...prev]);
    setSubmitted(receipt);
    setStep(3);
  };

  const reset = () => {
    setStation(''); setLiters('');
    setNotes(''); setPhotoPreview(''); setPhotoName(''); setStampedPhoto('');
    setSubmitted(null); setStep(1);
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h <= 0) return `${m} min`;
    return m ? `${h} h ${m} min` : `${h} h`;
  };

  const fuelColor = myBus.totalFuelPct < 20 ? '#ef4444' : myBus.totalFuelPct < 40 ? '#f59e0b' : '#0f8c61';
  const pendingCount = myReceipts.filter(r => r.approved === null).length;
  const flaggedCount = myReceipts.filter(r => r.approved === false).length;

  return (
    <div style={s.page} className="page-enter">
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.avatar}>{user?.avatar ?? 'DR'}</div>
          <div>
            <div style={s.driverName}>{user?.name ?? myBus.driver}</div>
            <div style={s.driverSub}>
              <span style={s.platePill}>RW · {myBus.plate}</span>
              <span style={s.routeText}>{activeTrip ? `${activeTrip.origin} → ${activeTrip.destination}` : 'No trip started'}</span>
            </div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.liveTag}><span style={s.liveDot}/> {activeTrip ? 'On a trip' : 'On duty'}</div>
        </div>
      </div>

      {/* Bus status strip */}
      <div style={s.statusStrip}>
        <div style={s.statusItem}>
          <Fuel size={16} color={fuelColor}/>
          <div>
            <div style={s.statusLabel}>Fuel level</div>
            <div style={{...s.statusVal, color: fuelColor}}>{myBus.totalFuelL}L total ({myBus.totalFuelPct}%)</div>
          </div>
        </div>
        <div style={s.statusItem}>
          <Gauge size={16} color="#5e6e7d"/>
          <div>
            <div style={s.statusLabel}>Speed</div>
            <div style={s.statusVal}>{myBus.offline ? 'Offline' : `${myBus.speed} km/h`}</div>
          </div>
        </div>
        <div style={s.statusItem}>
          <Navigation size={16} color="#5e6e7d"/>
          <div>
            <div style={s.statusLabel}>Today's km</div>
            <div style={s.statusVal}>{myBus.todayKm} km</div>
          </div>
        </div>
        <div style={s.statusItem}>
          <MapPin size={16} color="#5e6e7d"/>
          <div>
            <div style={s.statusLabel}>Location</div>
            <div style={s.statusVal}>{myBus.location}</div>
          </div>
        </div>
      </div>

      {/* Fuel bar */}
      <div style={s.fuelBarWrap}>
        <div style={s.fuelTrack}>
          <div style={{...s.fuelFill, width: `${myBus.totalFuelPct}%`, background: fuelColor}}/>
        </div>
        {myBus.totalFuelPct < 25 && (
          <div style={s.lowFuelWarning}><AlertTriangle size={13}/> Fuel low — refuel soon</div>
        )}
      </div>

      <div style={{ ...s.formCard, marginBottom: 14 }}>
        <div style={s.cardTitle}><Navigation size={16} color="#E8640A"/> Trip</div>
        {activeTrip ? (
          <>
          <div style={s.tripLive}>
            <div>
              <div style={s.tripRoute}>{activeTrip.origin} → {activeTrip.destination}</div>
              <div style={s.tripMeta}>
                Started {new Date(activeTrip.startedAt).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                {' · '}{activeTrip.distanceKm.toLocaleString()} km
                {' · '}{formatDuration(activeTrip.durationMin)}
                {activeTrip.distanceSource === 'estimate' ? ' · distance estimated' : ''}
              </div>
            </div>
            <button type="button" style={s.endBtn} onClick={endTrip}><Flag size={14}/> End trip</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <RouteMap
              origin={findPlace(activeTrip.origin)}
              destination={findPlace(activeTrip.destination)}
              onSummary={() => undefined}
            />
          </div>
          </>
        ) : !pickingRoute ? (
          <div style={s.tripIdle}>
            <div>
              <div style={s.tripRoute}>You are not on a trip</div>
              <div style={s.tripMeta}>Choose the route before you leave. The map uses Mapbox.</div>
            </div>
            <button type="button" style={s.startBtn} onClick={() => setPickingRoute(true)}><Play size={14}/> Start trip</button>
          </div>
        ) : (
          <div style={s.tripPick}>
            <div style={s.quickRow}>
              {QUICK_ROUTES.map(r => {
                const on = originName === r.from && destName === r.to;
                return (
                  <button type="button" key={`${r.from}-${r.to}`} onClick={() => { setOriginName(r.from); setDestName(r.to); }}
                    style={{ ...s.quickChip, ...(on ? s.quickChipOn : {}) }}>
                    {r.from} → {r.to}
                  </button>
                );
              })}
            </div>
            <div style={s.twoFields}>
              <div style={s.field}>
                <label style={s.label}>From</label>
                <select value={originName} onChange={e => setOriginName(e.target.value)} style={s.input}>
                  {PLACES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>To</label>
                <select value={destName} onChange={e => setDestName(e.target.value)} style={s.input}>
                  {PLACES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <RouteMap origin={origin} destination={destination} onSummary={setRouteSummary} />
            {samePlace && <div style={s.warnNote}><AlertTriangle size={11}/> Pick two different places.</div>}
            {routeSummary && !samePlace && (
              <div style={s.tripMeta}>
                {routeSummary.km.toLocaleString()} km · {formatDuration(routeSummary.minutes)}
                {routeSummary.source === 'mapbox' ? ' · driving route from Mapbox' : ' · road estimate'}
              </div>
            )}
            <div style={s.previewBtns}>
              <button type="button" style={s.backBtn} onClick={() => setPickingRoute(false)}>Cancel</button>
              <button type="button" style={s.confirmBtn} disabled={samePlace || !routeSummary} onClick={startTrip}>
                <Play size={14}/> Start this route
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={s.twoCol}>
        {/* LEFT: Submit receipt */}
        <div style={s.formCard}>
          <div style={s.cardTitle}><Camera size={16} color="#0f8c61"/> Pump photo at the station</div>

          {step === 1 && (
            <form onSubmit={handlePreview} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Fuel station *</label>
                <select value={station} onChange={e => setStation(e.target.value)} style={s.input} required>
                  <option value="">Select station…</option>
                  {ALL_STATIONS_LIST.map(st => (
                    <option key={st} value={st}>{st}{myBus.approvedStations.includes(st) ? ' ✓ Approved' : ' ⚠ Not approved'}</option>
                  ))}
                </select>
                {station && !myBus.approvedStations.includes(station) && (
                  <div style={s.warnNote}><AlertTriangle size={11}/> This station is NOT on your approved list. Submission will be flagged.</div>
                )}
                {station && myBus.approvedStations.includes(station) && (
                  <div style={s.okNote}><CheckCircle size={11}/> Approved station</div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.label}>Photo of the pump display *</label>
                <div style={s.photoArea} onClick={() => fileRef.current?.click()}>
                  {photoPreview ? (
                    <div style={s.pumpFrame}>
                      <img src={photoPreview} alt="Pump display" style={s.pumpImg}/>
                      <div style={s.pumpStamp}>
                        <div>
                          <div style={s.stampLabel}>Litres</div>
                          <div style={s.stampLiters}>{proportionateAmount ? `${litersNum} L` : '— L'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={s.stampLabel}>Amount</div>
                          <div style={s.stampMoney}>{proportionateAmount ? `${proportionateAmount.toLocaleString()} RWF` : '— RWF'}</div>
                        </div>
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); setPhotoPreview(''); setPhotoName(''); setStampedPhoto(''); }} style={s.removePhotoFloat}><X size={14}/></button>
                    </div>
                  ) : (
                    <div style={s.photoPlaceholder}>
                      <Camera size={28} color="#bcc6d0"/>
                      <div style={s.photoText}>Take a photo of the pump</div>
                      <div style={s.photoSub}>The display should show the litres. The amount in RWF is calculated from them.</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  style={{display:'none'}} onChange={handlePhoto}/>
                {photoName && <div style={s.photoSub}>{photoName}</div>}
              </div>

              <div style={s.twoFields}>
                <div style={s.field}>
                  <label style={s.label}>Litres on the pump *</label>
                  <input type="number" step="0.1" min="1" max="2000"
                    value={liters} onChange={e => setLiters(e.target.value)}
                    placeholder="e.g. 180" style={s.input} required/>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Amount (RWF)</label>
                  <input readOnly value={proportionateAmount ? proportionateAmount.toLocaleString() : ''}
                    placeholder="Follows the litres"
                    style={{ ...s.input, background: '#f0fdf4' }}/>
                </div>
              </div>

              {proportionateAmount > 0 && (
                <div style={s.priceCheck}>
                  {litersNum} L × {currentFuelPrice.toLocaleString()} RWF = <strong style={{ color: '#0f8c61' }}>{proportionateAmount.toLocaleString()} RWF</strong>
                </div>
              )}

              <div style={s.field}>
                <label style={s.label}>Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional comments…" style={{...s.input, height: 72, resize:'vertical'}}/>
              </div>

              <button type="submit" style={{ ...s.submitBtn, opacity: photoPreview && proportionateAmount > 0 ? 1 : 0.55 }} disabled={!photoPreview || proportionateAmount <= 0}>
                <Eye size={15}/> Preview before submitting
              </button>
            </form>
          )}

          {step === 2 && (
            <div style={s.previewCard}>
              <div style={s.previewTitle}>Review your submission</div>
              <div style={s.previewGrid}>
                {[
                  ['Truck plate', myBus.plate],
                  ['Station', station],
                  ['Litres', `${litersNum} L`],
                  ['Amount', `${proportionateAmount.toLocaleString()} RWF`],
                  ['Price/L', `${currentFuelPrice.toLocaleString()} RWF`],
                  ['Location', myBus.location],
                  ['Date', new Date().toLocaleDateString('en-RW')],
                  ['Time', new Date().toTimeString().slice(0,5)],
                ].map(([l,v]) => (
                  <div key={l} style={s.previewRow}>
                    <span style={s.previewLabel}>{l}</span>
                    <span style={s.previewVal}>{v}</span>
                  </div>
                ))}
                {notes && <div style={{...s.previewRow, gridColumn:'1/-1'}}><span style={s.previewLabel}>Notes</span><span style={s.previewVal}>{notes}</span></div>}
              </div>
              {(stampedPhoto || photoPreview) && <img src={stampedPhoto || photoPreview} alt="Pump with litres and amount" style={s.previewImg}/>}
              {!myBus.approvedStations.includes(station) && (
                <div style={s.warnBox}><AlertTriangle size={14}/> This submission will be flagged for admin review — station not approved.</div>
              )}
              <div style={s.previewBtns}>
                <button style={s.backBtn} onClick={() => setStep(1)}>← Edit</button>
                <button style={s.confirmBtn} onClick={handleSubmit}><CheckCircle size={15}/> Confirm & Submit</button>
              </div>
            </div>
          )}

          {step === 3 && submitted && (
            <div style={s.successCard}>
              <CheckCircle size={44} color="#0f8c61"/>
              <div style={s.successTitle}>Receipt submitted!</div>
              <div style={s.successSub}>ID: {submitted.id}</div>
              <div style={s.successSub}>Pending admin review. You'll be notified once approved.</div>
              <div style={s.successDetails}>
                <span>{submitted.liters}L at {submitted.station}</span>
                <span>{submitted.amount.toLocaleString()} RWF</span>
              </div>
              <button style={s.submitBtn} onClick={reset}>Submit another receipt</button>
            </div>
          )}
        </div>

        {/* RIGHT: My recent submissions */}
        <div style={s.rightCol}>
          <div style={s.formCard}>
            <div style={s.cardTitle}><FileText size={16} color="#0f8c61"/> My Submissions</div>
            <div style={s.statsRow2}>
              <div style={s.miniStat}>
                <div style={s.miniVal}>{myReceipts.length}</div>
                <div style={s.miniLabel}>Total</div>
              </div>
              <div style={s.miniStat}>
                <div style={{...s.miniVal, color:'#0f8c61'}}>{myReceipts.filter(r=>r.approved===true).length}</div>
                <div style={s.miniLabel}>Approved</div>
              </div>
              <div style={s.miniStat}>
                <div style={{...s.miniVal, color:'#f59e0b'}}>{pendingCount}</div>
                <div style={s.miniLabel}>Pending</div>
              </div>
              <div style={s.miniStat}>
                <div style={{...s.miniVal, color:'#ef4444'}}>{flaggedCount}</div>
                <div style={s.miniLabel}>Flagged</div>
              </div>
            </div>

            <div style={s.receiptList}>
              {myReceipts.slice(0,12).map(r => (
                <div key={r.id} style={{...s.receiptItem, background: r.approved===null?'#fffbeb': r.approved===false?'#fff8f8':'#fff'}}>
                  <div style={s.receiptTop}>
                    <span style={s.receiptDate}>{r.date} · {r.submittedAt}</span>
                    {r.approved === null  && <span style={s.pendBadge}><Clock size={9}/> Pending</span>}
                    {r.approved === true  && <span style={s.appBadge}><CheckCircle size={9}/> Approved</span>}
                    {r.approved === false && <span style={s.flagBadge}><AlertTriangle size={9}/> Flagged</span>}
                  </div>
                  <div style={s.receiptBody}>
                    <span style={s.receiptStation}>{r.station}</span>
                    <span style={s.receiptLiters}>{r.liters}L</span>
                    <span style={s.receiptAmt}>{r.amount.toLocaleString()} RWF</span>
                    {r.photoUrl && (
                      <button style={s.viewPhotoBtn} onClick={() => setViewReceipt(r)}><Eye size={10}/> Photo</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approved stations */}
          <div style={{...s.formCard, marginTop: 12}}>
            <div style={s.cardTitle}><Fuel size={16} color="#0f8c61"/> Your Approved Stations</div>
            {myBus.approvedStations.map(st => (
              <div key={st} style={s.stationRow}>
                <CheckCircle size={13} color="#0f8c61"/>
                <span>{st}</span>
              </div>
            ))}
            <div style={s.stationNote}>Only fuel at these stations to avoid flagging.</div>
          </div>
        </div>
      </div>

      {/* Photo lightbox */}
      {viewReceipt && (
        <div style={s.lightbox} onClick={() => setViewReceipt(null)}>
          <div style={s.lightboxInner} onClick={e => e.stopPropagation()}>
            <div style={s.lightboxHead}>
              <span style={s.lightboxTitle}>{viewReceipt.station} · {viewReceipt.date}</span>
              <button style={s.closeBtn} onClick={() => setViewReceipt(null)}><X size={18}/></button>
            </div>
            <img src={viewReceipt.photoUrl} alt="Receipt" style={{width:'100%', borderRadius:10, display:'block'}}/>
            <div style={s.lightboxMeta}>
              {viewReceipt.liters}L · {viewReceipt.amount.toLocaleString()} RWF · {viewReceipt.gpsLocation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1.25rem', overflowY: 'auto', flex: 1, background: '#f8fafb' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', background:'#fff', borderRadius:14, padding:'14px 18px', border:'1px solid #eef1f4' },
  headerLeft: { display:'flex', gap:12, alignItems:'center' },
  avatar: { width:46, height:46, borderRadius:'50%', background:'#0f8c61', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, flexShrink:0 },
  driverName: { fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#0b161f' },
  driverSub: { display:'flex', gap:8, alignItems:'center', marginTop:3 },
  platePill: { background:'#0a6b4a', color:'#fff', fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600 },
  routeText: { fontSize:12, color:'#5e6e7d' },
  headerRight: {},
  liveTag: { display:'flex', alignItems:'center', gap:6, background:'#e8f7f2', color:'#0a6b4a', fontSize:12, fontWeight:600, padding:'5px 12px', borderRadius:20 },
  liveDot: { width:7, height:7, borderRadius:'50%', background:'#0f8c61', display:'inline-block' },
  statusStrip: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:10, marginBottom:'0.875rem' },
  statusItem: { background:'#fff', borderRadius:11, padding:'10px 14px', display:'flex', gap:10, alignItems:'center', border:'1px solid #eef1f4' },
  statusLabel: { fontSize:10, color:'#8a97a6' },
  statusVal: { fontSize:13, fontWeight:500, color:'#162330' },
  fuelBarWrap: { background:'#fff', borderRadius:11, padding:'10px 14px', marginBottom:'1rem', border:'1px solid #eef1f4' },
  fuelTrack: { height:10, background:'#eef1f4', borderRadius:5, overflow:'hidden' },
  fuelFill: { height:'100%', borderRadius:5, transition:'width 0.5s' },
  lowFuelWarning: { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#b91c1c', marginTop:7, fontWeight:500 },
  twoCol: { display:'grid', gridTemplateColumns:'1fr 380px', gap:14, alignItems:'start' },
  formCard: { background:'#fff', borderRadius:14, padding:'18px', border:'1px solid #eef1f4' },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'#162330', marginBottom:16, display:'flex', alignItems:'center', gap:8 },
  form: { display:'flex', flexDirection:'column', gap:14 },
  field: { display:'flex', flexDirection:'column', gap:5 },
  label: { fontSize:12, fontWeight:500, color:'#253341' },
  input: { padding:'9px 12px', border:'1.5px solid #dde3ea', borderRadius:9, fontSize:13, color:'#162330', outline:'none', width:'100%', fontFamily:"'DM Sans',sans-serif" },
  twoFields: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  warnNote: { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#b45309', background:'#fffbeb', padding:'5px 10px', borderRadius:6, marginTop:2 },
  okNote:   { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#0a6b4a', background:'#e8f7f2', padding:'5px 10px', borderRadius:6, marginTop:2 },
  priceCheck: { fontSize:12, color:'#5e6e7d', background:'#f8fafb', padding:'7px 12px', borderRadius:8 },
  photoArea: { border:'2px dashed #dde3ea', borderRadius:11, padding:'1rem', cursor:'pointer', minHeight:100, display:'flex', alignItems:'center', justifyContent:'center' },
  photoPreviewWrap: { display:'flex', alignItems:'center', gap:10, width:'100%' },
  photoThumb: { width:64, height:64, objectFit:'cover', borderRadius:8 },
  photoName: { fontSize:12, color:'#5e6e7d', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  removePhoto: { background:'#fff1f1', border:'none', borderRadius:6, padding:5, cursor:'pointer', color:'#ef4444', display:'flex' },
  photoPlaceholder: { display:'flex', flexDirection:'column', alignItems:'center', gap:6 },
  photoText: { fontSize:13, color:'#5e6e7d', fontWeight:500 },
  photoSub: { fontSize:11, color:'#bcc6d0' },
  submitBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'#0f8c61', color:'#fff', border:'none', borderRadius:10, padding:'11px', fontSize:14, fontWeight:600, cursor:'pointer' },
  previewCard: { background:'#f8fafb', borderRadius:12, padding:16 },
  previewTitle: { fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'#162330', marginBottom:12 },
  previewGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', marginBottom:12 },
  previewRow: { display:'flex', flexDirection:'column', gap:2 },
  previewLabel: { fontSize:10, color:'#8a97a6', textTransform:'uppercase' as const, letterSpacing:'0.05em' },
  previewVal: { fontSize:13, fontWeight:500, color:'#162330' },
  previewImg: { width:'100%', maxHeight:320, objectFit:'contain', borderRadius:9, marginBottom:12, background:'#0b161f' },
  warnBox: { display:'flex', alignItems:'center', gap:7, background:'#fff8e6', color:'#b45309', fontSize:12, padding:'10px 12px', borderRadius:8, marginBottom:12, fontWeight:500 },
  previewBtns: { display:'flex', gap:8 },
  backBtn: { flex:1, padding:'10px', border:'1.5px solid #dde3ea', borderRadius:9, background:'#fff', color:'#5e6e7d', fontSize:13, fontWeight:500, cursor:'pointer' },
  confirmBtn: { flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#0f8c61', color:'#fff', border:'none', borderRadius:9, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' },
  successCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'2rem 1rem', textAlign:'center' },
  successTitle: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:'#0b161f' },
  successSub: { fontSize:13, color:'#5e6e7d' },
  successDetails: { display:'flex', gap:20, fontSize:13, fontWeight:500, color:'#0f8c61', background:'#e8f7f2', padding:'8px 16px', borderRadius:8 },
  rightCol: { display:'flex', flexDirection:'column' },
  statsRow2: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 },
  miniStat: { background:'#f8fafb', borderRadius:9, padding:'8px 6px', textAlign:'center' },
  miniVal: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:'#162330' },
  miniLabel: { fontSize:10, color:'#8a97a6', marginTop:2 },
  receiptList: { display:'flex', flexDirection:'column', gap:6, maxHeight:420, overflowY:'auto' },
  receiptItem: { borderRadius:9, padding:'9px 11px', border:'1px solid #eef1f4' },
  receiptTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  receiptDate: { fontSize:11, color:'#8a97a6' },
  pendBadge: { display:'inline-flex', alignItems:'center', gap:3, fontSize:10, background:'#fffbeb', color:'#b45309', padding:'2px 6px', borderRadius:20, fontWeight:600 },
  appBadge:  { display:'inline-flex', alignItems:'center', gap:3, fontSize:10, background:'#e8f7f2', color:'#0a6b4a', padding:'2px 6px', borderRadius:20, fontWeight:600 },
  flagBadge: { display:'inline-flex', alignItems:'center', gap:3, fontSize:10, background:'#fff1f1', color:'#b91c1c', padding:'2px 6px', borderRadius:20, fontWeight:600 },
  receiptBody: { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  receiptStation: { fontSize:12, fontWeight:500, color:'#253341', flex:1 },
  receiptLiters: { fontSize:12, color:'#5e6e7d' },
  receiptAmt: { fontSize:12, fontWeight:600, color:'#0f8c61' },
  viewPhotoBtn: { display:'inline-flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 8px', border:'1px solid #dde3ea', borderRadius:6, background:'#fff', color:'#5e6e7d', cursor:'pointer' },
  stationRow: { display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid #f8fafb', fontSize:13, color:'#253341' },
  stationNote: { fontSize:11, color:'#8a97a6', marginTop:8 },
  lightbox: { position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
  lightboxInner: { background:'#fff', borderRadius:16, padding:16, width:420, maxWidth:'96vw' },
  lightboxHead: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  lightboxTitle: { fontSize:14, fontWeight:600, color:'#162330' },
  closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#8a97a6', padding:4 },
  lightboxMeta: { fontSize:12, color:'#5e6e7d', marginTop:10, textAlign:'center' },
  tripLive: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' },
  tripIdle: { display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' },
  tripPick: { display:'flex', flexDirection:'column', gap:12 },
  tripRoute: { fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#162330' },
  tripMeta: { fontSize:12, color:'#5e6e7d', marginTop:3 },
  startBtn: { display:'inline-flex', alignItems:'center', gap:6, background:'#E8640A', color:'#fff', border:'none', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  endBtn: { display:'inline-flex', alignItems:'center', gap:6, background:'#fff', color:'#b91c1c', border:'1.5px solid #fecaca', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  quickRow: { display:'flex', flexWrap:'wrap', gap:6 },
  quickChip: { border:'1px solid #dde3ea', background:'#fff', color:'#253341', borderRadius:20, padding:'5px 10px', fontSize:12, cursor:'pointer' },
  quickChipOn: { background:'#0b161f', color:'#fff', borderColor:'#0b161f' },
  pumpFrame: { position:'relative', width:'100%' },
  pumpImg: { width:'100%', maxHeight:280, objectFit:'cover', borderRadius:12, display:'block' },
  pumpStamp: { position:'absolute', left:8, right:8, bottom:8, background:'rgba(11,22,31,0.88)', color:'#fff', borderRadius:10, padding:'8px 12px', display:'flex', justifyContent:'space-between', gap:12 },
  stampLabel: { fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase', color:'#bcc6d0' },
  stampLiters: { fontSize:18, fontWeight:700 },
  stampMoney: { fontSize:18, fontWeight:700, color:'#6ee7b7' },
  removePhotoFloat: { position:'absolute', top:8, right:8, background:'#fff', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#ef4444', display:'flex' },
};
