import React,{useState} from 'react';
import {LayoutDashboard,AlertTriangle,Receipt,LogOut,Truck,Settings,Menu,X,Map} from 'lucide-react';
import {useAuth} from './AuthContext';
type Page='dashboard'|'alerts'|'receipts'|'driver-portal'|'admin-settings'|'trips';
interface Props{current:Page;onChange:(p:Page)=>void;}
const NAV=[
  {id:'dashboard' as Page,label:'Dashboard',icon:LayoutDashboard,perm:'dashboard'},
  {id:'trips' as Page,label:'Trip Tracker',icon:Map,perm:'alerts'},
  {id:'alerts' as Page,label:'Alerts & Safety',icon:AlertTriangle,perm:'alerts'},
  {id:'receipts' as Page,label:'Receipt Log',icon:Receipt,perm:'receipts'},
  {id:'driver-portal' as Page,label:'Driver Portal',icon:Truck,perm:'driver-portal'},
  {id:'admin-settings' as Page,label:'Admin Settings',icon:Settings,perm:'admin-settings'},
];
const RC:Record<string,string>={admin:'#E8640A',supervisor:'#3b82f6',viewer:'#8a97a6',driver:'#f59e0b'};
export default function Navbar({current,onChange}:Props){
  const{user,logout,can}=useAuth();
  const[open,setOpen]=useState(false);
  const nav=NAV.filter(n=>can(n.perm));
  const go=(id:Page)=>{onChange(id);setOpen(false);};
  return(
    <>
      <header style={s.navbar}>
        <div style={s.logo}>
          <div style={s.logoIcon}><Truck size={16} color="#fff"/></div>
          <span style={s.logoText}>TruckGuard</span>
          <span style={s.logoBadge}>RW</span>
        </div>
        <nav style={s.navLinks}>
          {nav.map(n=>{const Icon=n.icon;const active=current===n.id;return(
            <button key={n.id} onClick={()=>go(n.id)} style={{...s.navLink,...(active?s.navActive:{})}}>
              <Icon size={13}/>{n.label}{active&&<span style={s.pip}/>}
            </button>
          );})}
        </nav>
        <div style={s.right}>
          {user&&<>
            <div style={s.userPill}>
              <div style={{...s.avatar,background:RC[user.role]}}>{user.avatar}</div>
              <div><div style={s.uname}>{user.name}</div><div style={{...s.urole,color:RC[user.role]}}>{user.role}</div></div>
            </div>
            <button style={s.logoutBtn} onClick={logout}><LogOut size={14}/><span>Sign out</span></button>
          </>}
          <button style={s.ham} onClick={()=>setOpen(o=>!o)}>{open?<X size={20}/>:<Menu size={20}/>}</button>
        </div>
      </header>
      {open&&<div style={s.mob}>
        {nav.map(n=>{const Icon=n.icon;const active=current===n.id;return(
          <button key={n.id} onClick={()=>go(n.id)} style={{...s.mobLink,...(active?s.mobActive:{})}}><Icon size={15}/>{n.label}</button>
        );})}
        <div style={s.mobDiv}/><button style={s.mobOut} onClick={logout}><LogOut size={14}/>Sign out</button>
      </div>}
    </>
  );
}
const s:Record<string,React.CSSProperties>={
  navbar:{position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'space-between',background:'#0b161f',borderBottom:'1px solid #162330',padding:'0 1.5rem',height:56,flexShrink:0,gap:20},
  logo:{display:'flex',alignItems:'center',gap:8,flexShrink:0},
  logoIcon:{width:30,height:30,background:'#E8640A',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'},
  logoText:{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:'#fff'},
  logoBadge:{background:'#E8640A',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:20},
  navLinks:{display:'flex',alignItems:'center',gap:2,flex:1,justifyContent:'center'},
  navLink:{display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:7,border:'none',background:'transparent',color:'#8a97a6',fontSize:12,fontWeight:500,cursor:'pointer',position:'relative',fontFamily:"'DM Sans',sans-serif"},
  navActive:{color:'#fff',background:'rgba(255,255,255,0.07)'},
  pip:{position:'absolute',bottom:-1,left:'50%',transform:'translateX(-50%)',width:18,height:3,background:'#E8640A',borderRadius:2},
  right:{display:'flex',alignItems:'center',gap:8,flexShrink:0},
  userPill:{display:'flex',alignItems:'center',gap:7},
  avatar:{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff'},
  uname:{fontSize:12,fontWeight:500,color:'#eef1f4',whiteSpace:'nowrap'},
  urole:{fontSize:10,fontWeight:600,textTransform:'capitalize'},
  logoutBtn:{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:7,padding:'5px 9px',color:'#8a97a6',fontSize:12,cursor:'pointer'},
  ham:{display:'none',background:'none',border:'none',color:'#fff',cursor:'pointer',padding:4},
  mob:{display:'flex',flexDirection:'column',background:'#0b161f',borderBottom:'1px solid #162330',padding:'8px 12px',zIndex:49},
  mobLink:{display:'flex',alignItems:'center',gap:9,padding:'9px 12px',border:'none',background:'transparent',color:'#8a97a6',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:7,fontFamily:"'DM Sans',sans-serif"},
  mobActive:{background:'#E8640A',color:'#fff'},
  mobDiv:{height:1,background:'#162330',margin:'5px 0'},
  mobOut:{display:'flex',alignItems:'center',gap:7,padding:'9px 12px',border:'none',background:'transparent',color:'#8a97a6',fontSize:13,cursor:'pointer',borderRadius:7,fontFamily:"'DM Sans',sans-serif"},
};
