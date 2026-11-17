import React, { useState, useEffect } from 'react';
import { Truck, Fuel, MapPin, Phone, X, AlertTriangle, CheckCircle, WifiOff, ChevronRight, Clock, Navigation, Package, TrendingUp } from 'lucide-react';
import { vehicles as initVehicles, Vehicle, VEHICLE_TYPE_LABELS, VehicleType } from './data';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LiveMap from './LiveMap';

const FC = (p:number) => p < 20 ? '#ef4444' : p < 40 ? '#f59e0b' : '#0f8c61';
const TYPE_ICON: Record<VehicleType, string> = {truck:'🚛',tanker:'⛽',refrigerated:'🧊',flatbed:'🚚',tipper:'🏗',container:'📦'};
const TYPE_COLOR: Record<VehicleType, string> = {truck:'#3b82f6',tanker:'#ef4444',refrigerated:'#06b6d4',flatbed:'#8b5cf6',tipper:'#f59e0b',container:'#E8640A'};

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initVehicles);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all'|VehicleType>('all');
  const [sort, setSort] = useState('plate');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [tab, setTab] = useState<'details'|'tanks'|'history'|'chart'|'trips'|'borders'|'receipts'|'map'>('details');

  useEffect(() => {
    const id = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.offline) return v;
        const newAL = Math.max(5, v.tankAL + (Math.random() < 0.35 ? -2 : 0));
        const newBL = v.tankBCapacity > 0 ? Math.max(5, v.tankBL + (Math.random() < 0.3 ? -1 : 0)) : 0;
        const totalL = newAL + newBL;
        const totalCap = v.tankACapacity + v.tankBCapacity;
        return { ...v, tankAL:newAL, tankAPct:Math.round(newAL/v.tankACapacity*100), tankBL:newBL, tankBPct:v.tankBCapacity>0?Math.round(newBL/v.tankBCapacity*100):0, totalFuelL:totalL, totalFuelPct:Math.round(totalL/totalCap*100), speed:Math.floor(Math.random()*111) };
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const online=vehicles.filter(v=>!v.offline).length;
  const alerts=vehicles.filter(v=>v.isAlert).length;
  const warns=vehicles.filter(v=>v.isWarn).length;
  const lsA=vehicles.filter(v=>v.lastSeenMinutes>30).length;
  const typeCounts=vehicles.reduce((acc,v)=>{acc[v.type]=(acc[v.type]||0)+1;return acc;},{} as Record<string,number>);

  let list=vehicles.filter(v=>{
    const q=search.toLowerCase();
    const m=v.plate.toLowerCase().includes(q)||v.driver.toLowerCase().includes(q)||v.type.includes(q);
    if(!m)return false;
    if(filter==='online')return !v.offline;
    if(filter==='offline')return v.offline;
    if(filter==='alert')return v.isAlert;
    if(filter==='warn')return v.isWarn;
    if(filter==='lastseen')return v.lastSeenMinutes>30;
    if(filter==='deviation')return v.routeDeviation>0;
    if(typeFilter!=='all'&&v.type!==typeFilter)return false;
    return true;
  });
  if(sort==='fuel')list=[...list].sort((a,b)=>a.totalFuelPct-b.totalFuelPct);
  else if(sort==='diff')list=[...list].sort((a,b)=>b.diff-a.diff);
  else if(sort==='km')list=[...list].sort((a,b)=>b.todayKm-a.todayKm);
  else list=[...list].sort((a,b)=>a.plate.localeCompare(b.plate));

  const chartData=selected?.history.flatMap(m=>m.entries.map(e=>({name:`${m.month.slice(0,3)} W${e.week.slice(-1)}`,expected:e.expected,claimed:e.claimed})))??[];

  return (
    <div style={s.page} className="page-enter">
      <div style={s.statsRow}>
        {[{label:'Fleet size',val:vehicles.length,color:'#162330'},{label:'Online',val:online,color:'#0f8c61'},{label:'Offline',val:vehicles.length-online,color:'#5e6e7d'},{label:'Possible Theft',val:alerts,color:'#ef4444'},{label:'Warnings',val:warns,color:'#f59e0b'},{label:'Offline >30m',val:lsA,color:'#b45309'},{label:'Avg fuel',val:`${Math.round(vehicles.reduce((s,v)=>s+v.totalFuelPct,0)/vehicles.length)}%`,color:'#E8640A'}].map(item=>(
          <div key={item.label} style={s.stat}><div style={s.statL}>{item.label}</div><div style={{...s.statV,color:item.color}}>{item.val}</div></div>
        ))}
      </div>
      <div style={s.typePills}>
        <button style={{...s.typePill,...(typeFilter==='all'?s.typePillActive:{})}} onClick={()=>setTypeFilter('all')}>All ({vehicles.length})</button>
        {(Object.keys(typeCounts) as VehicleType[]).map(t=>(
          <button key={t} style={{...s.typePill,...(typeFilter===t?{background:TYPE_COLOR[t],color:'#fff',borderColor:TYPE_COLOR[t]}:{})}} onClick={()=>setTypeFilter(t)}>
            {TYPE_ICON[t]} {VEHICLE_TYPE_LABELS[t]} ({typeCounts[t]})
          </button>
        ))}
      </div>
      <div style={s.controls}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plate, driver, type…" style={s.searchInput}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={s.select}>
          <option value="all">All vehicles</option><option value="online">Online</option><option value="offline">Offline</option>
          <option value="alert">Theft alerts</option><option value="warn">Warnings</option>
          <option value="lastseen">Offline &gt;30 min</option><option value="deviation">Route deviation</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={s.select}>
          <option value="plate">Sort: Plate</option><option value="fuel">Sort: Fuel</option>
          <option value="diff">Sort: Discrepancy</option><option value="km">Sort: KM today</option>
        </select>
        <span style={s.countL}>{list.length} of {vehicles.length}</span>
      </div>
      <div style={s.grid}>
        {list.map(v=>{
          const tc=FC(v.totalFuelPct);
          return(
            <div key={v.plate} onClick={()=>{setSelected(v);setTab('details');}} style={{...s.card,borderLeft:v.isAlert?'3px solid #ef4444':v.isWarn?'3px solid #f59e0b':v.routeDeviation>0?'3px solid #3b82f6':v.lastSeenMinutes>30?'3px solid #b45309':'1px solid #dde3ea'}}>
              <div style={s.cardTop}>
                <div style={s.plateLine}>
                  <span style={{background:TYPE_COLOR[v.type],fontSize:14,width:26,height:26,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}>{TYPE_ICON[v.type]}</span>
                  <span style={s.plateText}>{v.plate}</span>
                  <span style={{width:7,height:7,borderRadius:'50%',background:v.offline?'#8a97a6':v.isAlert?'#ef4444':'#0f8c61',display:'inline-block'}}/>
                </div>
                {v.offline?<span style={s.offTag}><WifiOff size={10} style={{marginRight:3}}/>Offline</span>:v.isAlert?<span style={s.alTag}><AlertTriangle size={10} style={{marginRight:3}}/>Possible Theft</span>:v.isWarn?<span style={s.wnTag}><AlertTriangle size={10} style={{marginRight:3}}/>Warning</span>:<span style={s.okTag}><CheckCircle size={10} style={{marginRight:3}}/>Normal</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:600,background:TYPE_COLOR[v.type]+'18',color:TYPE_COLOR[v.type]}}>{VEHICLE_TYPE_LABELS[v.type]}</span>
                <span style={{fontSize:12,color:'#5e6e7d'}}>{v.driver}</span>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#5e6e7d',marginBottom:3}}><span>Tank A</span><span style={{color:FC(v.tankAPct),fontWeight:500}}>{v.tankAL}L/{v.tankACapacity}L</span></div>
                <div style={s.fuelTrack}><div style={{...s.fuelFill,width:`${v.tankAPct}%`,background:FC(v.tankAPct)}}/></div>
                {v.tankBCapacity>0&&<><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#5e6e7d',marginBottom:3,marginTop:4}}><span>Tank B</span><span style={{color:FC(v.tankBPct),fontWeight:500}}>{v.tankBL}L/{v.tankBCapacity}L</span></div><div style={s.fuelTrack}><div style={{...s.fuelFill,width:`${v.tankBPct}%`,background:FC(v.tankBPct)}}/></div></>}
                <div style={{fontSize:11,color:'#5e6e7d',marginTop:5,textAlign:'right'}}>Total: <strong style={{color:tc}}>{v.totalFuelL}L ({v.totalFuelPct}%)</strong></div>
              </div>
              <div style={s.metrics}>
                <div style={s.metric}><div style={s.mL}>Speed</div><div style={s.mV}>{v.offline?'—':`${v.speed}km/h`}</div></div>
                <div style={s.metric}><div style={s.mL}>Today</div><div style={s.mV}>{v.todayKm}km</div></div>
                {(() => {
                const extra = v.diff;
                const cost = Math.round(Math.abs(extra) * 3000);
                const status = extra > 20 ? 'stolen' : extra > 10 ? 'suspicious' : 'normal';
                return (
                  <div style={{...s.metric, background: status==='stolen'?'#fff1f1': status==='suspicious'?'#fff8e6':'#f8fafb'}}>
                    <div style={{...s.mL, color: status==='stolen'?'#b91c1c':status==='suspicious'?'#b45309':'#8a97a6'}}>
                      {status==='stolen'?'⛽ Fuel stolen?': status==='suspicious'?'⛽ Check fuel':'⛽ Fuel OK'}
                    </div>
                    <div style={{...s.mV, color: status==='stolen'?'#ef4444':status==='suspicious'?'#f59e0b':'#0f8c61', fontSize:11}}>
                      {status==='normal' ? 'On track' : `+${extra}L extra (${cost.toLocaleString()} RWF)`}
                    </div>
                  </div>
                );
              })()}
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6,minHeight:16}}>
                {v.lastSeenMinutes>30&&<span style={s.lsTag}><Clock size={9} style={{marginRight:2}}/>{v.lastSeenMinutes}m offline</span>}
                {v.routeDeviation>0&&<span style={s.devTag}><Navigation size={9} style={{marginRight:2}}/>+{v.routeDeviation}km</span>}
                {!v.lastStationApproved&&<span style={s.unTag}><Fuel size={9} style={{marginRight:2}}/>Unauth. station</span>}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11,color:'#5e6e7d'}}><Package size={10} style={{marginRight:3,verticalAlign:'middle'}}/>{v.cargoType}</span>
                <span style={{fontSize:11,color:'#E8640A',fontWeight:500}}>{v.loadWeight}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,color:'#8a97a6'}}><MapPin size={10} style={{marginRight:3,verticalAlign:'middle'}}/>{v.location}</span>
                <ChevronRight size={14} color="#bcc6d0"/>
              </div>
            </div>
          );
        })}
      </div>

      {selected&&(
        <div style={s.modalBg} onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <div>
                <div style={s.modalTitle}>{TYPE_ICON[selected.type]} {selected.plate} <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,background:TYPE_COLOR[selected.type]+'18',color:TYPE_COLOR[selected.type]}}>{VEHICLE_TYPE_LABELS[selected.type]}</span></div>
                <div style={{fontSize:13,color:'#5e6e7d',marginTop:3}}>{selected.driver} · {selected.route}</div>
                <div style={{fontSize:12,color:'#E8640A',marginTop:3}}><Phone size={11} style={{verticalAlign:'middle',marginRight:4}}/>{selected.driverPhone} | Alt: {selected.driverAlt}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#8a97a6',padding:4}}><X size={18}/></button>
            </div>
            <div style={s.tabs}>
              {(['details','tanks','history','chart','trips','borders','receipts','map'] as const).map(t=>(
                <button key={t} style={{...s.tab,...(tab===t?s.tabActive:{})}} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
              ))}
            </div>
            {tab==='map'&&<div><div style={{fontSize:13,color:'#5e6e7d',marginBottom:10}}>📍 Live GPS — {selected.plate} · {selected.driver}</div><LiveMap vehicle={selected}/></div>}
            {tab==='details'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[['Plate',selected.plate],['Type',VEHICLE_TYPE_LABELS[selected.type]],['Make / Model',`${selected.make} ${selected.model}`],['Year',selected.vehicleYear],['Engine',selected.engine],['Payload',selected.capacity],['Cargo',selected.cargoType],['Load weight',selected.loadWeight],['Odometer',`${selected.km.toLocaleString()} km`],['Today',`${selected.todayKm} km`],['Route',selected.route],['Location',selected.location],['Last refuel',selected.lastRefuel],['Last service',selected.lastService],['Next service in',`${selected.nextServiceKm.toLocaleString()} km`],['Idling today',`${selected.idlingHours}h`],['Harsh brakes',selected.harshBrakes],['Speeding events',selected.speedingEvents],['Station approved',selected.lastStationApproved?'✅ Yes':'❌ No'],['Insurance exp.',selected.insuranceExpiry]].map(([l,v])=>(
                  <div key={String(l)} style={{background:'#f8fafb',borderRadius:9,padding:'9px 12px'}}><div style={{fontSize:11,color:'#8a97a6',marginBottom:3}}>{l}</div><div style={{fontSize:13,fontWeight:500,color:l==='Station approved'&&v==='❌ No'?'#ef4444':'#162330'}}>{v}</div></div>
                ))}
              </div>
            )}
            {tab==='tanks'&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>
                {[{label:'🛢 Tank A — Primary',l:selected.tankAL,cap:selected.tankACapacity,pct:selected.tankAPct},{...(selected.tankBCapacity>0?{label:'🛢 Tank B — Secondary',l:selected.tankBL,cap:selected.tankBCapacity,pct:selected.tankBPct}:null)}].filter(Boolean).map((t:any)=>(
                  <div key={t.label} style={{background:'#f8fafb',borderRadius:12,padding:'14px 16px',border:'1px solid #eef1f4'}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#253341',marginBottom:8}}>{t.label}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,color:FC(t.pct)}}>{t.l}L</div>
                    <div style={{fontSize:11,color:'#8a97a6',marginTop:2}}>of {t.cap}L ({t.pct}%)</div>
                    <div style={{height:12,background:'#eef1f4',borderRadius:4,overflow:'hidden',marginTop:8}}><div style={{height:'100%',width:`${t.pct}%`,background:FC(t.pct),borderRadius:4}}/></div>
                  </div>
                ))}
                <div style={{background:'#e8f7f2',borderRadius:12,padding:'14px 16px',border:'1px solid #c3eadc'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#0a6b4a',marginBottom:8}}>⛽ Combined Total</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,color:'#0f8c61'}}>{selected.totalFuelL}L</div>
                  <div style={{fontSize:11,color:'#0a6b4a',marginTop:2}}>of {selected.tankACapacity+selected.tankBCapacity}L ({selected.totalFuelPct}%)</div>
                  <div style={{height:12,background:'#c3eadc',borderRadius:4,overflow:'hidden',marginTop:8}}><div style={{height:'100%',width:`${selected.totalFuelPct}%`,background:'#0f8c61',borderRadius:4}}/></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,gridColumn:'1/-1'}}>
                  {[['Fuel this month',`${selected.totalFuelMonth}L`],['Claimed today',`${selected.claimed}L`],['Expected today',`${selected.expected}L`],['Extra fuel claimed',selected.diff>20?`+${selected.diff}L ⚠ (${Math.round(selected.diff*3000).toLocaleString()} RWF possible theft)`:selected.diff>10?`+${selected.diff}L (needs check)`:selected.diff<0?`${selected.diff}L (driver saved fuel ✓)`:'On track ✓']].map(([l,v])=>(
                    <div key={String(l)} style={{background:'#f8fafb',borderRadius:9,padding:'9px 12px'}}><div style={{fontSize:11,color:'#8a97a6'}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:l==='Discrepancy'?(selected.diff>20?'#ef4444':selected.diff>10?'#f59e0b':'#0f8c61'):'#162330'}}>{v}</div></div>
                  ))}
                </div>
              </div>
            )}
            {tab==='history'&&selected.history.map(m=>{
              const flags=m.entries.filter(e=>e.flag).length;
              return(<div key={m.month}><div style={{fontSize:13,fontWeight:600,color:'#253341',margin:'12px 0 6px',display:'flex',alignItems:'center',gap:8}}>{m.month}{flags>0&&<span style={{fontSize:11,background:'#fff1f1',color:'#b91c1c',padding:'1px 7px',borderRadius:20}}>{flags} flag{flags>1?'s':''}</span>}</div>
              <div style={{display:'grid',gridTemplateColumns:'70px 80px 80px 90px 70px 70px',gap:4,fontSize:11,fontWeight:600,color:'#8a97a6',padding:'5px 0',borderBottom:'1px solid #eef1f4'}}><span>Period</span><span>KM</span><span>Expected</span><span>Claimed</span><span>Diff</span><span>Status</span></div>
              {m.entries.map(e=>(<div key={e.week} style={{display:'grid',gridTemplateColumns:'70px 80px 80px 90px 70px 70px',gap:4,fontSize:12,padding:'5px 0',borderBottom:'1px solid #f8fafb',alignItems:'center'}}><span>{e.week}</span><span>{e.km}</span><span>{e.expected}L</span><span>{e.claimed}L</span><span style={{color:e.diff>20?'#ef4444':e.diff>10?'#f59e0b':'#0f8c61'}}>{e.diff>20?'⚠ +':e.diff>10?'? +':e.diff>0?'+':''}{Math.abs(e.diff)}L {e.diff>20?'stolen?':e.diff>10?'suspicious':e.diff<0?'saved':''}</span><span style={{color:e.flag?'#ef4444':'#0f8c61',fontWeight:500}}>{e.flag?'⚠ Flag':'✓ OK'}</span></div>))}</div>);
            })}
            {tab==='chart'&&(<div><div style={{display:'flex',gap:16,fontSize:12,color:'#5e6e7d',marginBottom:8}}><span><span style={{width:10,height:3,background:'#0f8c61',display:'inline-block',borderRadius:2,marginRight:4,verticalAlign:'middle'}}/>Expected</span><span><span style={{width:10,height:3,background:'#ef4444',display:'inline-block',borderRadius:2,marginRight:4,verticalAlign:'middle'}}/>Claimed</span></div><ResponsiveContainer width="100%" height={220}><LineChart data={chartData} margin={{top:5,right:10,left:-10,bottom:5}}><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip formatter={(v:any)=>`${v}L`}/><Line type="monotone" dataKey="expected" stroke="#0f8c61" strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="claimed" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" dot={{r:3}}/></LineChart></ResponsiveContainer></div>)}
            {tab==='trips'&&(<div>{selected.tripLogs.length===0&&<div style={{padding:'2rem',textAlign:'center',color:'#8a97a6',fontSize:13}}>No trip logs.</div>}{selected.tripLogs.map(t=>(<div key={t.id} style={{background:'#f8fafb',borderRadius:10,padding:'12px 14px',marginBottom:8,borderLeft:`3px solid ${t.status==='ongoing'?'#E8640A':t.status==='planned'?'#3b82f6':'#0f8c61'}`}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><span style={{fontSize:14,fontWeight:600,color:'#162330',fontFamily:"'Syne',sans-serif"}}>{t.origin} → {t.destination}</span><span style={{fontSize:11,padding:'2px 8px',borderRadius:20,fontWeight:600,background:t.status==='ongoing'?'#FEF0E6':t.status==='planned'?'#eff6ff':'#e8f7f2',color:t.status==='ongoing'?'#E8640A':t.status==='planned'?'#3b82f6':'#0f8c61'}}>{t.status}</span></div><div style={{display:'flex',gap:14,fontSize:12,color:'#5e6e7d',flexWrap:'wrap',marginBottom:4}}><span>📦 {t.cargo}</span><span>🛣 {t.distanceKm.toLocaleString()} km</span><span style={{color:t.fuelUsedL>t.expectedFuelL*1.1?'#ef4444':'#0f8c61'}}>⛽ {t.fuelUsedL}L / {t.expectedFuelL}L expected</span></div><div style={{fontSize:11,color:'#8a97a6'}}>{t.startDate} → {t.endDate}</div></div>))}</div>)}
            {tab==='borders'&&(<div>{selected.borderCrossings.length===0&&<div style={{padding:'2rem',textAlign:'center',color:'#8a97a6',fontSize:13}}>No border crossings recorded.</div>}{selected.borderCrossings.map((b,i)=>(<div key={i} style={{background:'#f8fafb',borderRadius:10,padding:'12px 14px',marginBottom:8,border:'1px solid #eef1f4'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:14,fontWeight:600,color:'#162330'}}>🛂 {b.border}</span><span style={{fontSize:12,background:'#eff6ff',color:'#1d4ed8',padding:'2px 8px',borderRadius:20,fontWeight:500}}>{b.country}</span></div><div style={{display:'flex',gap:14,fontSize:12,color:'#5e6e7d',flexWrap:'wrap'}}><span>Arrived: {b.arrivalTime}</span><span>Cleared: {b.clearanceTime}</span><span>{b.date}</span></div></div>))}</div>)}
            {tab==='receipts'&&(<div><div style={{display:'grid',gridTemplateColumns:'75px 130px 70px 110px 70px',gap:4,fontSize:11,fontWeight:600,color:'#8a97a6',padding:'6px 0',borderBottom:'1px solid #eef1f4'}}><span>Date</span><span>Station</span><span>Litres</span><span>Amount</span><span>Status</span></div>{selected.receipts.map(r=>(<div key={r.id} style={{display:'grid',gridTemplateColumns:'75px 130px 70px 110px 70px',gap:4,fontSize:12,padding:'6px 0',borderBottom:'1px solid #f8fafb',alignItems:'center'}}><span>{r.date}</span><span style={{fontSize:11}}>{r.station}</span><span style={{fontWeight:600}}>{r.liters}L</span><span>{r.amount.toLocaleString()}</span><span style={{color:r.approved?'#0f8c61':'#ef4444',fontWeight:500}}>{r.approved?'✓ OK':'⚠ Flag'}</span></div>))}<div style={{marginTop:10,fontSize:12,color:'#5e6e7d'}}><TrendingUp size={13} style={{verticalAlign:'middle',marginRight:4}}/>Total: {selected.receipts.reduce((s,r)=>s+r.liters,0)}L · {selected.receipts.reduce((s,r)=>s+r.amount,0).toLocaleString()} RWF</div></div>)}
            <div style={{marginTop:'1.25rem',background:'#f8fafb',borderRadius:10,padding:'12px 14px',border:'1px solid #eef1f4'}}><div style={{fontSize:12,fontWeight:600,color:'#253341',marginBottom:8,display:'flex',alignItems:'center',gap:5}}><Fuel size={12}/> Approved stations</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{selected.approvedStations.map(st=>(<span key={st} style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:500,background:selected.lastStation===st?'#e8f7f2':'#eef1f4',color:selected.lastStation===st?'#0a6b4a':'#5e6e7d'}}>{st}</span>))}{!selected.lastStationApproved&&<span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'#fff1f1',color:'#b91c1c',fontWeight:500}}>Last: {selected.lastStation} — NOT approved</span>}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:{padding:'1.5rem',overflowY:'auto',flex:1},
  statsRow:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(105px,1fr))',gap:10,marginBottom:'1rem'},
  stat:{background:'#fff',borderRadius:10,padding:'11px 13px',border:'1px solid #eef1f4'},
  statL:{fontSize:11,color:'#5e6e7d',marginBottom:4},
  statV:{fontSize:21,fontWeight:600,fontFamily:"'Syne',sans-serif"},
  typePills:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:'1rem'},
  typePill:{padding:'5px 12px',borderRadius:20,border:'1.5px solid #dde3ea',background:'#fff',fontSize:12,fontWeight:500,color:'#5e6e7d',cursor:'pointer'},
  typePillActive:{background:'#0b161f',color:'#fff',borderColor:'#0b161f'},
  controls:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'},
  searchInput:{padding:'8px 12px',border:'1.5px solid #dde3ea',borderRadius:9,fontSize:13,color:'#162330',width:200,outline:'none'},
  select:{padding:'8px 10px',border:'1.5px solid #dde3ea',borderRadius:9,fontSize:12,color:'#162330',background:'#fff',outline:'none'},
  countL:{fontSize:12,color:'#8a97a6',marginLeft:'auto'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(285px,1fr))',gap:12},
  card:{background:'#fff',borderRadius:14,padding:14,cursor:'pointer',border:'1px solid #dde3ea'},
  cardTop:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6},
  plateLine:{display:'flex',alignItems:'center',gap:6},
  plateText:{fontSize:13,fontWeight:600,color:'#162330',fontFamily:"'Syne',sans-serif"},
  offTag:{fontSize:10,background:'#eef1f4',color:'#5e6e7d',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center',whiteSpace:'nowrap'},
  alTag:{fontSize:10,background:'#fff1f1',color:'#b91c1c',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center',whiteSpace:'nowrap'},
  wnTag:{fontSize:10,background:'#fff8e6',color:'#b45309',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center',whiteSpace:'nowrap'},
  okTag:{fontSize:10,background:'#e8f7f2',color:'#0a6b4a',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center',whiteSpace:'nowrap'},
  fuelTrack:{height:7,background:'#eef1f4',borderRadius:4,overflow:'hidden'},
  fuelFill:{height:'100%',borderRadius:4,transition:'width 0.5s'},
  metrics:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:8},
  metric:{background:'#f8fafb',borderRadius:8,padding:'6px 8px'},
  mL:{fontSize:10,color:'#8a97a6'},
  mV:{fontSize:13,fontWeight:500,color:'#162330'},
  lsTag:{fontSize:10,background:'#fff8e6',color:'#b45309',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center'},
  devTag:{fontSize:10,background:'#eff6ff',color:'#1d4ed8',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center'},
  unTag:{fontSize:10,background:'#fff1f1',color:'#b91c1c',padding:'2px 6px',borderRadius:4,display:'flex',alignItems:'center'},
  modalBg:{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'},
  modal:{background:'#fff',borderRadius:18,padding:'1.5rem',width:640,maxWidth:'98vw',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.25)'},
  modalHead:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'},
  modalTitle:{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:'#0b161f',display:'flex',alignItems:'center',flexWrap:'wrap',gap:6},
  tabs:{display:'flex',gap:5,marginBottom:'1rem',flexWrap:'wrap'},
  tab:{padding:'5px 12px',borderRadius:8,border:'1.5px solid #dde3ea',background:'transparent',fontSize:11,fontWeight:500,cursor:'pointer',color:'#5e6e7d'},
  tabActive:{background:'#E8640A',color:'#fff',borderColor:'#E8640A'},
};
