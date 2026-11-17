import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Search, Upload, Clock } from 'lucide-react';
import { vehicles as buses, liveReceipts, Receipt } from './data';

export default function ReceiptsPage() {
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'approved'|'flagged'|'pending'>('all');
  const [selectedBus, setSelectedBus] = useState('all');
  const [uploadBus, setUploadBus]     = useState('');
  const [uploadMsg, setUploadMsg]     = useState('');
  const [, forceUpdate]               = useState(0);

  // Combine bus receipts + live driver submissions, dedup by id
  const seen = new Set<string>();
  const allReceipts: (Receipt & { vehiclePlate: string; driverName: string })[] = [];

  // Live submissions first (most recent)
  liveReceipts.forEach(r => {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      allReceipts.push({ ...r, vehiclePlate: r.vehiclePlate || r.vehiclePlate, driverName: r.submittedBy });
    }
  });

  buses.forEach(b => {
    b.receipts.forEach(r => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        allReceipts.push({ ...r, vehiclePlate: b.plate, driverName: b.driver });
      }
    });
  });

  allReceipts.sort((a,b) => b.date.localeCompare(a.date) || b.submittedAt.localeCompare(a.submittedAt));

  const filtered = allReceipts.filter(r => {
    const q = search.toLowerCase();
    const m = r.vehiclePlate || r.vehiclePlate.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q) || r.station.toLowerCase().includes(q);
    if (!m) return false;
    if (filterStatus === 'approved' && r.approved !== true)  return false;
    if (filterStatus === 'flagged'  && r.approved !== false) return false;
    if (filterStatus === 'pending'  && r.approved !== null)  return false;
    if (selectedBus !== 'all' && r.vehiclePlate || r.vehiclePlate !== selectedBus) return false;
    return true;
  });

  const totalL   = filtered.reduce((s,r) => s+r.liters, 0);
  const totalRWF = filtered.reduce((s,r) => s+r.amount, 0);
  const pending  = allReceipts.filter(r => r.approved === null).length;

  const approve = (id: string) => {
    const r = allReceipts.find(x => x.id === id);
    if (r) { (r as any).approved = true; forceUpdate(n => n+1); }
    const lr = liveReceipts.find(x => x.id === id);
    if (lr) { (lr as any).approved = true; }
    buses.forEach(b => { const br = b.receipts.find(x=>x.id===id); if(br) (br as any).approved=true; });
  };
  const flag = (id: string) => {
    const r = allReceipts.find(x => x.id === id);
    if (r) { (r as any).approved = false; forceUpdate(n => n+1); }
    const lr = liveReceipts.find(x => x.id === id);
    if (lr) { (lr as any).approved = false; }
    buses.forEach(b => { const br = b.receipts.find(x=>x.id===id); if(br) (br as any).approved=false; });
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMsg(`Receipt submitted for ${uploadBus || 'bus'}. Pending review.`);
    setTimeout(() => setUploadMsg(''), 4000);
  };

  return (
    <div style={s.page} className="page-enter">
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Receipt Log</h1>
          <p style={s.sub}>All fuel purchase receipts. Driver submissions appear here in real time.</p>
        </div>
        {pending > 0 && <div style={s.pendingBadge}><Clock size={13}/> {pending} pending review</div>}
      </div>

      <div style={s.statsRow}>
        {[
          { label:'Total receipts', val: allReceipts.length,                          color:'#162330' },
          { label:'Approved',       val: allReceipts.filter(r=>r.approved===true).length,  color:'#0f8c61' },
          { label:'Flagged',        val: allReceipts.filter(r=>r.approved===false).length, color:'#ef4444' },
          { label:'Pending review', val: pending,                                     color:'#b45309' },
          { label:'Total liters',   val: `${allReceipts.reduce((s,r)=>s+r.liters,0)}L`,   color:'#0a6b4a' },
          { label:'Total spend',    val: `${Math.round(allReceipts.reduce((s,r)=>s+r.amount,0)/1000)}K RWF`, color:'#253341' },
        ].map(item => (
          <div key={item.label} style={s.stat}>
            <div style={s.statLabel}>{item.label}</div>
            <div style={{ ...s.statVal, color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Admin upload panel */}
      <div style={s.uploadCard}>
        <div style={s.uploadTitle}><Upload size={14}/> Manual receipt entry (admin)</div>
        <form onSubmit={handleUpload} style={s.uploadForm}>
          <select value={uploadBus} onChange={e => setUploadBus(e.target.value)} style={s.select} required>
            <option value="">Select bus…</option>
            {buses.map(b => <option key={b.plate} value={b.plate}>{b.plate} — {b.driver}</option>)}
          </select>
          <input type="date" style={s.input} required/>
          <input type="text" placeholder="Station name" style={s.input} required/>
          <input type="number" placeholder="Litres" style={{...s.input, width:90}} required/>
          <input type="number" placeholder="Amount (RWF)" style={{...s.input, width:140}} required/>
          <label style={s.fileLabel}><input type="file" accept="image/*" style={{display:'none'}}/>📷 Photo</label>
          <button type="submit" style={s.submitBtn}>Submit</button>
        </form>
        {uploadMsg && <div style={s.uploadSuccess}><CheckCircle size={13}/> {uploadMsg}</div>}
      </div>

      <div style={s.controls}>
        <div style={s.searchWrap}>
          <Search size={13} color="#8a97a6" style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plate, driver, station…" style={s.searchInput}/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)} style={s.select}>
          <option value="all">All receipts</option>
          <option value="approved">Approved</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending review</option>
        </select>
        <select value={selectedBus} onChange={e=>setSelectedBus(e.target.value)} style={s.select}>
          <option value="all">All buses</option>
          {buses.map(b=><option key={b.plate} value={b.plate}>{b.plate}</option>)}
        </select>
        <span style={s.countLabel}>{filtered.length} receipts · {totalL}L · {totalRWF.toLocaleString()} RWF</span>
      </div>

      <div style={s.tableWrap}>
        <div style={s.tableHead}>
          <span>Bus / Driver</span><span>Date & Time</span><span>Station</span>
          <span>Litres</span><span>Amount (RWF)</span><span>Photo</span><span>Status</span><span>Actions</span>
        </div>
        {filtered.map(r => (
          <div key={r.id} style={{...s.tableRow, background: r.approved===null?'#fffdf0': r.approved===false?'#fff8f8':'#fff'}}>
            <div>
              <div style={s.plateLine}>
                <span style={s.plateBadge}>RW</span>
                <span style={s.plateText}>{r.vehiclePlate || r.vehiclePlate}</span>
              </div>
              <div style={s.driverName}>{r.driverName}</div>
            </div>
            <div>
              <div style={s.cell}>{r.date}</div>
              <div style={{fontSize:11,color:'#8a97a6'}}>{r.submittedAt}</div>
            </div>
            <span style={s.cell}>{r.station}</span>
            <span style={{...s.cell, fontWeight:600}}>{r.liters}L</span>
            <span style={s.cell}>{r.amount.toLocaleString()}</span>
            <span>
              {r.photoUrl
                ? <img src={r.photoUrl} alt="" style={{width:36,height:36,objectFit:'cover',borderRadius:6,display:'block'}}/>
                : <span style={{fontSize:11,color:'#bcc6d0'}}>No photo</span>}
            </span>
            <span>
              {r.approved===null  && <span style={s.pendBadge}><Clock size={9}/> Pending</span>}
              {r.approved===true  && <span style={s.appBadge}><CheckCircle size={9}/> Approved</span>}
              {r.approved===false && <span style={s.flagBadge}><AlertTriangle size={9}/> Flagged</span>}
            </span>
            <div style={{display:'flex',gap:4}}>
              {r.approved !== true  && <button style={s.approveBtn} onClick={() => approve(r.id)}>✓ Approve</button>}
              {r.approved !== false && <button style={s.flagBtn} onClick={() => flag(r.id)}>✗ Flag</button>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={s.empty}>No receipts match your filters.</div>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding:'1.5rem', overflowY:'auto', flex:1 },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 },
  title:       { fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:'#0b161f', marginBottom:4 },
  sub:         { fontSize:13, color:'#5e6e7d' },
  pendingBadge:{ display:'flex', alignItems:'center', gap:6, background:'#fffbeb', color:'#b45309', fontSize:13, fontWeight:600, padding:'8px 14px', borderRadius:10, border:'1px solid #fde68a' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap:10, marginBottom:'1.25rem' },
  stat:        { background:'#fff', borderRadius:10, padding:'12px 14px', border:'1px solid #eef1f4' },
  statLabel:   { fontSize:11, color:'#5e6e7d', marginBottom:4 },
  statVal:     { fontSize:20, fontWeight:600, fontFamily:"'Syne',sans-serif" },
  uploadCard:  { background:'#fff', borderRadius:14, padding:'14px 18px', border:'1px solid #eef1f4', marginBottom:'1.25rem' },
  uploadTitle: { fontSize:13, fontWeight:600, color:'#253341', marginBottom:10, display:'flex', alignItems:'center', gap:6 },
  uploadForm:  { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  select:      { padding:'8px 10px', border:'1.5px solid #dde3ea', borderRadius:9, fontSize:12, color:'#162330', background:'#fff', outline:'none' },
  input:       { padding:'8px 10px', border:'1.5px solid #dde3ea', borderRadius:9, fontSize:12, color:'#162330', outline:'none' },
  fileLabel:   { padding:'8px 12px', border:'1.5px dashed #bcc6d0', borderRadius:9, fontSize:12, color:'#5e6e7d', cursor:'pointer' },
  submitBtn:   { padding:'8px 16px', background:'#0f8c61', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer' },
  uploadSuccess:{ marginTop:8, display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#0a6b4a', background:'#e8f7f2', padding:'7px 12px', borderRadius:7 },
  controls:    { display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1.25rem', alignItems:'center' },
  searchWrap:  { position:'relative' },
  searchInput: { padding:'8px 12px 8px 32px', border:'1.5px solid #dde3ea', borderRadius:9, fontSize:13, color:'#162330', width:220, outline:'none' },
  countLabel:  { fontSize:12, color:'#8a97a6', marginLeft:'auto' },
  tableWrap:   { background:'#fff', borderRadius:14, border:'1px solid #eef1f4', overflow:'auto' },
  tableHead:   { display:'grid', gridTemplateColumns:'150px 100px 130px 65px 120px 60px 100px 130px', gap:8, padding:'10px 16px', background:'#f8fafb', fontSize:11, fontWeight:600, color:'#8a97a6', borderBottom:'1px solid #eef1f4', minWidth:900 },
  tableRow:    { display:'grid', gridTemplateColumns:'150px 100px 130px 65px 120px 60px 100px 130px', gap:8, padding:'10px 16px', borderBottom:'1px solid #f8fafb', alignItems:'center', minWidth:900 },
  plateLine:   { display:'flex', alignItems:'center', gap:5 },
  plateBadge:  { background:'#0a6b4a', color:'#fff', fontSize:9, padding:'1px 4px', borderRadius:3, fontWeight:600 },
  plateText:   { fontSize:13, fontWeight:600, fontFamily:"'Syne',sans-serif", color:'#162330' },
  driverName:  { fontSize:11, color:'#8a97a6', marginTop:1 },
  cell:        { fontSize:12, color:'#253341' },
  pendBadge:   { display:'inline-flex', alignItems:'center', gap:3, background:'#fffbeb', color:'#b45309', fontSize:11, padding:'3px 7px', borderRadius:20, fontWeight:600 },
  appBadge:    { display:'inline-flex', alignItems:'center', gap:3, background:'#e8f7f2', color:'#0a6b4a', fontSize:11, padding:'3px 7px', borderRadius:20, fontWeight:600 },
  flagBadge:   { display:'inline-flex', alignItems:'center', gap:3, background:'#fff1f1', color:'#b91c1c', fontSize:11, padding:'3px 7px', borderRadius:20, fontWeight:600 },
  approveBtn:  { fontSize:11, padding:'4px 8px', background:'#e8f7f2', color:'#0a6b4a', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 },
  flagBtn:     { fontSize:11, padding:'4px 8px', background:'#fff1f1', color:'#b91c1c', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 },
  empty:       { padding:'2rem', textAlign:'center', color:'#8a97a6', fontSize:13 },
};
