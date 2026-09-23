"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Client = { id: string; legal_name: string; trade_name: string | null; tax_id: string | null; email: string | null; status: string };

export default function ClientsPage() {
  const supabase = createSupabaseBrowserClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [form, setForm] = useState({ legal_name: "", trade_name: "", tax_id: "", email: "" });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const profile = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (profile.error || !profile.data?.organization_id) { setMessage("Perfil administrativo sem organização vinculada."); setLoading(false); return; }
    setOrganizationId(profile.data.organization_id);
    const result = await supabase.from("clients").select("id,legal_name,trade_name,tax_id,email,status").eq("organization_id", profile.data.organization_id).order("created_at", { ascending: false });
    if (result.error) setMessage(result.error.message); else setClients((result.data ?? []) as Client[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createClient(event: FormEvent) {
    event.preventDefault();
    if (!organizationId) return;
    setMessage("");
    const { error } = await supabase.from("clients").insert({ ...form, organization_id: organizationId, status: "EM_IMPLANTACAO" });
    if (error) setMessage(error.message);
    else { setForm({ legal_name: "", trade_name: "", tax_id: "", email: "" }); setShowForm(false); await load(); }
  }

  return <main style={{minHeight:"100vh",background:"#f6f8fb",padding:"34px 46px",color:"#182230",fontFamily:"Inter,system-ui,sans-serif"}}>
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #e5eaf0",paddingBottom:24}}>
        <div><p style={{fontSize:12,color:"#8995a5"}}>Painel administrativo / Clientes</p><h1 style={{fontSize:28,margin:0}}>Clientes</h1></div>
        <button onClick={()=>setShowForm(true)} style={{background:"#5667ed",border:0,color:"#fff",padding:"11px 16px",borderRadius:8,fontWeight:700,cursor:"pointer"}}>＋ Novo cliente</button>
      </div>
      {showForm && <form onSubmit={createClient} style={{background:"#fff",border:"1px solid #e7ebf0",borderRadius:12,padding:24,marginTop:22,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {([["legal_name","Razão social"],["trade_name","Nome fantasia"],["tax_id","CNPJ"],["email","E-mail"] ] as const).map(([key,label])=><label key={key} style={{display:"grid",gap:6,fontSize:12,fontWeight:650}}>{label}<input required={key==="legal_name"} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} style={{padding:11,border:"1px solid #dfe5ec",borderRadius:8}} /></label>)}
        <div style={{gridColumn:"1/-1",display:"flex",gap:10}}><button type="submit" style={{background:"#5667ed",border:0,color:"#fff",padding:"10px 15px",borderRadius:8,fontWeight:700}}>Salvar cliente</button><button type="button" onClick={()=>setShowForm(false)} style={{background:"#eef1f5",border:0,padding:"10px 15px",borderRadius:8}}>Cancelar</button></div>
      </form>}
      {message && <p role="alert" style={{color:"#c54848",fontSize:13,marginTop:18}}>{message}</p>}
      <section style={{background:"#fff",border:"1px solid #e7ebf0",borderRadius:12,marginTop:22,overflow:"hidden"}}>
        {loading ? <p style={{padding:30,color:"#8995a5"}}>Carregando clientes...</p> : clients.length === 0 ? <div style={{padding:60,textAlign:"center",color:"#8995a5"}}><h2 style={{color:"#182230"}}>Nenhum cliente cadastrado</h2><p>Crie o primeiro cliente para começar.</p></div> : <div>{clients.map(client=><div key={client.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:18,borderBottom:"1px solid #edf0f4"}}><div><strong>{client.trade_name || client.legal_name}</strong><small style={{display:"block",color:"#8995a5",marginTop:5}}>{client.tax_id || "CNPJ não informado"} · {client.email || "sem e-mail"}</small></div><span style={{fontSize:11,color:"#9b6d13",background:"#fff3d9",padding:"6px 9px",borderRadius:20}}>{client.status}</span></div>)}</div>}
      </section>
    </div>
  </main>;
}
