import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UpdateAccountRequest = {
  id: string;
  email: string;
  full_name: string;
  user_kind: "team" | "supplier";
  team_role?: "editor" | "analyst" | "coordinator" | "viewer" | null;
  area_id?: string | null;
  supplier_id?: string | null;
  is_active: boolean;
  password?: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Configuração do servidor incompleta" }, 500);
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Não autorizado" }, 401);

  const { data: caller } = await admin
    .from("profiles")
    .select("user_kind, team_role, is_active")
    .eq("id", userData.user.id)
    .single();
  if (
    !caller?.is_active ||
    caller.user_kind !== "team" ||
    !["editor", "analyst", "coordinator"].includes(caller.team_role)
  ) return json({ error: "Seu perfil não pode alterar contas" }, 403);

  const payload = (await request.json()) as UpdateAccountRequest;
  const email = payload.email?.trim().toLowerCase();
  const fullName = payload.full_name?.trim();
  if (!payload.id || !email || !fullName || !["team", "supplier"].includes(payload.user_kind)) {
    return json({ error: "Dados da conta inválidos" }, 400);
  }
  if (payload.password && (payload.password.length < 8 || payload.password.length > 72)) {
    return json({ error: "A nova senha deve ter entre 8 e 72 caracteres" }, 400);
  }
  if (payload.id === userData.user.id && payload.is_active === false) {
    return json({ error: "Você não pode desativar a própria conta" }, 400);
  }
  if (payload.user_kind === "team" && !payload.team_role) {
    return json({ error: "Selecione o perfil da equipe Rumo" }, 400);
  }
  if (payload.user_kind === "supplier") {
    if (!payload.area_id || !payload.supplier_id) return json({ error: "Selecione a área e a empresa" }, 400);
    const { data: supplier } = await admin
      .from("suppliers")
      .select("id")
      .eq("id", payload.supplier_id)
      .eq("area_id", payload.area_id)
      .maybeSingle();
    if (!supplier) return json({ error: "A empresa não pertence à área selecionada" }, 400);
  }

  const authAttributes: Record<string, unknown> = {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: {
      user_kind: payload.user_kind,
      team_role: payload.user_kind === "team" ? payload.team_role : null,
    },
  };
  if (payload.password) authAttributes.password = payload.password;

  const { error: authError } = await admin.auth.admin.updateUserById(payload.id, authAttributes);
  if (authError) return json({ error: authError.message }, 400);

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      user_kind: payload.user_kind,
      team_role: payload.user_kind === "team" ? payload.team_role : null,
      supplier_id: payload.user_kind === "supplier" ? payload.supplier_id : null,
      area_id: payload.user_kind === "supplier" ? payload.area_id : null,
      is_active: payload.is_active,
      must_change_password: payload.password ? true : undefined,
    })
    .eq("id", payload.id);
  if (profileError) return json({ error: profileError.message }, 400);

  return json({ id: payload.id, email });
});
