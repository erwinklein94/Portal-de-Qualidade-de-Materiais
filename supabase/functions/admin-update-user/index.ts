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
  supplier_name?: string | null;
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

  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("user_kind, supplier_id, area_id")
    .eq("id", payload.id)
    .single();
  if (existingProfileError || !existingProfile) {
    return json({ error: "A conta que seria alterada não foi encontrada" }, 404);
  }

  let supplierId = payload.supplier_id ?? null;
  if (payload.user_kind === "supplier") {
    const supplierName = payload.supplier_name?.trim();
    if (!payload.area_id || (!supplierId && !supplierName)) return json({ error: "Selecione a área e informe a empresa" }, 400);
    if (supplierId) {
      const { data: supplier } = await admin
        .from("suppliers")
        .select("id")
        .eq("id", supplierId)
        .eq("area_id", payload.area_id)
        .maybeSingle();
      if (!supplier) return json({ error: "A empresa não pertence à área selecionada" }, 400);
      if (supplierName) {
        const { error: supplierError } = await admin.from("suppliers").update({ legal_name: supplierName, trade_name: supplierName }).eq("id", supplierId);
        if (supplierError) return json({ error: supplierError.message }, 400);
      }
    } else {
      const { data: supplier, error: supplierError } = await admin
        .from("suppliers")
        .insert({ legal_name: supplierName, trade_name: supplierName, area_id: payload.area_id, status: "active" })
        .select("id")
        .single();
      if (supplierError || !supplier) return json({ error: supplierError?.message ?? "Não foi possível criar a empresa" }, 400);
      supplierId = supplier.id;
    }
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

  const profileUpdates: Record<string, unknown> = {
    full_name: fullName,
    email,
    user_kind: payload.user_kind,
    team_role: payload.user_kind === "team" ? payload.team_role : null,
    supplier_id: payload.user_kind === "supplier" ? supplierId : null,
    area_id: payload.user_kind === "supplier" ? payload.area_id : null,
    is_active: payload.is_active,
  };
  if (payload.password) profileUpdates.must_change_password = true;

  const { error: profileError } = await admin
    .from("profiles")
    .update(profileUpdates)
    .eq("id", payload.id);
  if (profileError) return json({ error: profileError.message }, 400);

  const previousSupplierId = existingProfile.user_kind === "supplier" ? existingProfile.supplier_id : null;
  const supplierChanged = previousSupplierId && previousSupplierId !== supplierId;
  let previousSupplierRemoved = false;

  if (supplierChanged) {
    const { count: remainingAccounts, error: accountsError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", previousSupplierId);
    if (accountsError) return json({ error: `Conta atualizada, mas não foi possível verificar o cadastro anterior: ${accountsError.message}` }, 500);

    if ((remainingAccounts ?? 0) === 0) {
      if (payload.user_kind === "supplier" && supplierId && payload.area_id) {
        const { error: recordsError } = await admin
          .from("quality_records")
          .update({ supplier_id: supplierId, area_id: payload.area_id })
          .eq("supplier_id", previousSupplierId);
        if (recordsError) return json({ error: `Conta atualizada, mas não foi possível transferir os registros anteriores: ${recordsError.message}` }, 500);

        const { error: deleteSupplierError } = await admin
          .from("suppliers")
          .delete()
          .eq("id", previousSupplierId);
        if (deleteSupplierError) return json({ error: `Conta atualizada, mas não foi possível remover o cadastro anterior: ${deleteSupplierError.message}` }, 500);
        previousSupplierRemoved = true;
      } else {
        const { count: existingRecords, error: recordsCountError } = await admin
          .from("quality_records")
          .select("id", { count: "exact", head: true })
          .eq("supplier_id", previousSupplierId);
        if (recordsCountError) return json({ error: `Conta atualizada, mas não foi possível verificar o histórico anterior: ${recordsCountError.message}` }, 500);

        const cleanupQuery = (existingRecords ?? 0) === 0
          ? admin.from("suppliers").delete().eq("id", previousSupplierId)
          : admin.from("suppliers").update({ status: "inactive" }).eq("id", previousSupplierId);
        const { error: cleanupError } = await cleanupQuery;
        if (cleanupError) return json({ error: `Conta atualizada, mas não foi possível finalizar o cadastro anterior: ${cleanupError.message}` }, 500);
        previousSupplierRemoved = (existingRecords ?? 0) === 0;
      }
    }
  }

  return json({ id: payload.id, email, previous_supplier_removed: previousSupplierRemoved });
});
