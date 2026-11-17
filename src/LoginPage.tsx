import React,{useState} from 'react';
import {useAuth} from './AuthContext';
import {Truck,Eye,EyeOff,Shield} from 'lucide-react';
export default function LoginPage(){
  const{login}=useAuth();
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[showPw,setShowPw]=useState(false);
  const[error,setError]=useState('');
  const[loading,setLoading]=useState(false);
  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();setLoading(true);setError('');
    setTimeout(()=>{const ok=login(email,password);if(!ok)setError('Invalid credentials.');setLoading(false);},600);
  };
  const fill=(e:string,p:string)=>{setEmail(e);setPassword(p);setError('');};
  return(
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logo}><div style={s.logoIcon}><Truck size={22} color="#fff"/></div><span style={s.logoText}>TruckGuard</span><span style={s.logoBadge}>RW</span></div>
        <h1 style={s.title}>Fleet Command Center</h1>
        <p style={s.sub}>Sign in to monitor your truck fleet across East Africa</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}><label style={s.label}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@truckguard.rw" style={s.input} required/>
          </div>
          <div style={s.field}><label style={s.label}>Password</label>
            <div style={{position:'relative'}}>
              <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{...s.input,paddingRight:44}} required/>
              <button type="button" onClick={()=>setShowPw(!showPw)} style={s.eyeBtn}>{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          {error&&<div style={s.errorBox}>{error}</div>}
          <button type="submit" style={s.submitBtn} disabled={loading}>{loading?'Signing in…':'Sign in'}</button>
        </form>
        <div style={s.divider}><span>Demo accounts</span></div>
        <div style={s.demoGrid}>
          {[{role:'Admin',e:'admin@truckguard.rw',p:'admin123',c:'#E8640A'},{role:'Supervisor',e:'super@truckguard.rw',p:'super123',c:'#3b82f6'},{role:'Viewer',e:'viewer@truckguard.rw',p:'viewer123',c:'#8a97a6'},{role:'Driver',e:'driver@truckguard.rw',p:'driver123',c:'#f59e0b'}].map(d=>(
            <button key={d.role} style={{...s.demoBtn,borderColor:d.c,color:d.c}} onClick={()=>fill(d.e,d.p)}>{d.role}</button>
          ))}
        </div>
        <div style={s.footer}><Shield size={12} style={{marginRight:5}}/>Role-based access · Encrypted sessions</div>
      </div>
    </div>
  );
}
const s:Record<string,React.CSSProperties>={
  bg:{minHeight:'100vh',background:'linear-gradient(135deg,#0b161f 0%,#1a2430 50%,#B84E07 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'},
  card:{background:'#fff',borderRadius:20,padding:'2.5rem',width:'100%',maxWidth:420,boxShadow:'0 24px 64px rgba(0,0,0,0.25)'},
  logo:{display:'flex',alignItems:'center',gap:10,marginBottom:'1.75rem'},
  logoIcon:{width:40,height:40,background:'#E8640A',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'},
  logoText:{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:'#162330'},
  logoBadge:{background:'#FEF0E6',color:'#E8640A',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20},
  title:{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:700,color:'#162330',marginBottom:6},
  sub:{fontSize:13,color:'#5e6e7d',marginBottom:'1.75rem'},
  form:{display:'flex',flexDirection:'column',gap:'1rem'},
  field:{display:'flex',flexDirection:'column',gap:6},
  label:{fontSize:13,fontWeight:500,color:'#253341'},
  input:{padding:'10px 14px',border:'1.5px solid #dde3ea',borderRadius:10,fontSize:14,color:'#162330',outline:'none',width:'100%'},
  eyeBtn:{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#8a97a6',padding:4,cursor:'pointer'},
  errorBox:{background:'#fff1f1',color:'#b91c1c',fontSize:13,padding:'10px 14px',borderRadius:8,border:'1px solid #fecaca'},
  submitBtn:{background:'#E8640A',color:'#fff',border:'none',borderRadius:10,padding:'12px',fontSize:15,fontWeight:600,cursor:'pointer',marginTop:4},
  divider:{display:'flex',alignItems:'center',gap:10,margin:'1.5rem 0 1rem',fontSize:12,color:'#8a97a6'},
  demoGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:'1.5rem'},
  demoBtn:{background:'transparent',border:'1.5px solid',borderRadius:8,padding:'7px 0',fontSize:12,fontWeight:600,cursor:'pointer'},
  footer:{display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#8a97a6'},
};
