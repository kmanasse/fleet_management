import React,{createContext,useContext,useState,ReactNode} from 'react';
import {User,USERS,ROLE_PERMISSIONS} from './data';
interface AuthCtx{user:User|null;login:(e:string,p:string)=>boolean;logout:()=>void;can:(page:string)=>boolean;}
const AuthContext=createContext<AuthCtx>({} as AuthCtx);
export function AuthProvider({children}:{children:ReactNode}){
  const[user,setUser]=useState<User|null>(null);
  const login=(email:string,password:string)=>{const f=USERS.find(u=>u.email===email&&u.password===password);if(f){setUser(f);return true;}return false;};
  const logout=()=>setUser(null);
  const can=(page:string)=>{if(!user)return false;return ROLE_PERMISSIONS[user.role].includes(page);};
  return<AuthContext.Provider value={{user,login,logout,can}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
