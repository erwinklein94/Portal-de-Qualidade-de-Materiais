import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AccountRequest = {
  email: string;
  full_name: string;
  user_kind: "team" | "supplier";
  team_role?: "editor" | "analyst" | "coordinator" | "viewer" | null;
  area_id?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  password: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server configuration is incomplete" }, 500);
  }
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

  const { data: caller } = await admin
    .from("profiles")
    .select("user_kind, team_role, is_active")
    .eq("id", userData.user.id)
    .single();

  if (
    !caller?.is_active ||
    caller.user_kind !== "team" ||
    !["editor", "coordinator"].includes(caller.team_role)
  ) {
    return json({ error: "Forbidden" }, 403);
  }

  const payload = (await request.json()) as AccountRequest;
  const email = payload.email?.trim().toLowerCase();
  const fullName = payload.full_name?.trim();
  const password = payload.password ?? "";
  if (!email || !fullName || !["team", "supplier"].includes(payload.user_kind)) {
    return json({ error: "Invalid account data" }, 400);
  }
  if (payload.user_kind === "team" && !payload.team_role) {
    return json({ error: "Team role is required" }, 400);
  }
  if (payload.user_kind === "supplier" && !payload.area_id) {
    return json({ error: "Material area is required" }, 400);
  }
  if (password.length < 8 || password.length > 72) {
    return json({ error: "A senha deve ter entre 8 e 72 caracteres" }, 400);
  }

  let supplierId = payload.supplier_id ?? null;
  let createdSupplierId: string | null = null;
  if (payload.user_kind === "supplier" && !supplierId) {
    const supplierName = payload.supplier_name?.trim();
    if (!supplierName) return json({ error: "Supplier name is required" }, 400);
    const { data: supplier, error: supplierError } = await admin
      .from("suppliers")
      .insert({
        legal_name: supplierName,
        trade_name: supplierName,
        area_id: payload.area_id,
        status: "active",
      })
      .select("id")
      .single();
    if (supplierError) return json({ error: supplierError.message }, 400);
    supplierId = supplier.id;
    createdSupplierId = supplier.id;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      user_kind: payload.user_kind,
      team_role: payload.user_kind === "team" ? payload.team_role : null,
    },
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    if (createdSupplierId) await admin.from("suppliers").delete().eq("id", createdSupplierId);
    return json({ error: createError?.message ?? "Não foi possível criar o usuário" }, 400);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: fullName,
    email,
    user_kind: payload.user_kind,
    team_role: payload.user_kind === "team" ? payload.team_role : null,
    supplier_id: payload.user_kind === "supplier" ? supplierId : null,
    area_id: payload.user_kind === "supplier" ? payload.area_id : null,
    must_change_password: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (createdSupplierId) await admin.from("suppliers").delete().eq("id", createdSupplierId);
    return json({ error: profileError.message }, 400);
  }

  return json({ id: created.user.id, email });
});
