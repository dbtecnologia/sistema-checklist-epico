"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else window.location.href = "/";
    setLoading(false);
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f6f8fb",padding:24}}>
      <form onSubmit={signIn} style={{width:"100%",maxWidth:420,background:"#fff",border:"1px solid #e7ebf0",borderRadius:16,padding:32,boxShadow:"0 12px 40px #18223012"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:22,fontWeight:750,marginBottom:28}}><span style={{display:"grid",placeItems:"center",width:34,height:34,borderRadius:10,background:"#5667ed",color:"#fff"}}>E</span>Épico<span style={{color:"#8190a4",fontWeight:500}}>.check</span></div>
        <h1 style={{fontSize:26,margin:"0 0 8px"}}>Entrar na plataforma</h1>
        <p style={{color:"#8995a5",fontSize:13,margin:"0 0 24px"}}>Use seu e-mail e senha para acessar.</p>
        <label style={{display:"grid",gap:7,fontSize:12,fontWeight:650,marginBottom:16}}>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:12,border:"1px solid #dfe5ec",borderRadius:8,fontSize:14}} /></label>
        <label style={{display:"grid",gap:7,fontSize:12,fontWeight:650,marginBottom:20}}>Senha<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:12,border:"1px solid #dfe5ec",borderRadius:8,fontSize:14}} /></label>
        {message && <p role="alert" style={{color:"#c54848",fontSize:12}}>{message}</p>}
        <button disabled={loading} style={{width:"100%",padding:12,border:0,borderRadius:8,background:"#5667ed",color:"#fff",fontWeight:700,cursor:"pointer"}}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  );
}
