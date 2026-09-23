import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel." }, { status: 500 });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const body = await request.json();
  const { legal_name, trade_name, tax_id, email, password } = body;
  if (!legal_name || !email || !password) return NextResponse.json({ error: "Razão social, e-mail e senha são obrigatórios." }, { status: 400 });

  const { data: profile } = await admin.from("profiles").select("organization_id,role").eq("id", user.id).single();
  if (!profile?.organization_id || !["ADMIN", "GESTOR"].includes(profile.role)) return NextResponse.json({ error: "Sem permissão administrativa." }, { status: 403 });

  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (userError || !createdUser.user) return NextResponse.json({ error: userError?.message || "Não foi possível criar o usuário." }, { status: 400 });

  const { data: client, error: clientError } = await admin.from("clients").insert({ organization_id: profile.organization_id, legal_name, trade_name: trade_name || null, tax_id: tax_id || null, email, status: "ATIVO" }).select("id").single();
  if (clientError || !client) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: clientError?.message || "Não foi possível criar o cliente." }, { status: 400 });
  }

  const { error: linkError } = await admin.from("client_users").insert({ client_id: client.id, user_id: createdUser.user.id, role: "CLIENTE_ADMIN" });
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });
  await admin.from("profiles").insert({ id: createdUser.user.id, organization_id: profile.organization_id, full_name: trade_name || legal_name, role: "CLIENTE_ADMIN", first_login: true });
  return NextResponse.json({ ok: true, client_id: client.id });
}
