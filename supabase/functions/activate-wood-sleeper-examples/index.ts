import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const exampleBatch = "all_material_examples_v2";
const examplesPerArea = 35;
const areaPrefixes: Record<string, string> = {
  amv: "AMV",
  wood_sleeper: "DM",
  concrete_sleeper: "DC",
  ballast: "LAST",
  subcomponents: "SUB",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isoWeek(date: Date) {
  const reference = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = reference.getUTCDay() || 7;
  reference.setUTCDate(reference.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(reference.getUTCFullYear(), 0, 1));
  return Math.ceil((((reference.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration is incomplete" }, 500);
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(authorization.slice("Bearer ".length));
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

  const { data: caller } = await admin
    .from("profiles")
    .select("user_kind, team_role, is_active")
    .eq("id", userData.user.id)
    .single();
  if (!caller?.is_active || caller.user_kind !== "team" || !["editor", "coordinator"].includes(caller.team_role)) {
    return json({ error: "Somente Editor e Coordenador podem ativar exemplos." }, 403);
  }

  const { data: areas, error: areasError } = await admin
    .from("material_areas")
    .select("id, code, name")
    .eq("is_active", true)
    .neq("code", "concrete_sleeper")
    .neq("code", "subcomponents")
    .order("sort_order");
  if (areasError) return json({ error: areasError.message }, 400);
  if (!areas?.length) return json({ error: "Nenhuma área de materiais foi encontrada." }, 400);

  const { data: allSuppliers, error: suppliersError } = await admin
    .from("suppliers")
    .select("id, area_id, trade_name")
    .eq("status", "active")
    .order("trade_name");
  if (suppliersError) return json({ error: suppliersError.message }, 400);

  const today = new Date();
  const records = [];
  let activeExampleCount = 0;
  let supplierCount = 0;

  for (const [areaIndex, area] of areas.entries()) {
    const areaSuppliers = (allSuppliers ?? []).filter((supplier) => supplier.area_id === area.id);
    if (!areaSuppliers.length) return json({ error: `Nenhum fornecedor ativo foi encontrado para ${area.name}.` }, 400);
    supplierCount += areaSuppliers.length;

    const { count: existingCount, error: countError } = await admin
      .from("quality_records")
      .select("id", { count: "exact", head: true })
      .eq("area_id", area.id)
      .contains("payload", { example_record: true });
    if (countError) return json({ error: countError.message }, 400);

    if ((existingCount ?? 0) >= examplesPerArea) {
      activeExampleCount += existingCount ?? 0;
      continue;
    }

    if ((existingCount ?? 0) > 0) {
      const { error: deleteError } = await admin
        .from("quality_records")
        .delete()
        .eq("area_id", area.id)
        .contains("payload", { example_record: true });
      if (deleteError) return json({ error: deleteError.message }, 400);
    }

    const prefix = areaPrefixes[area.code] ?? area.code.toUpperCase().slice(0, 4);
    for (let recordIndex = 0; recordIndex < examplesPerArea; recordIndex += 1) {
      const supplier = areaSuppliers[recordIndex % areaSuppliers.length];
      const referenceDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      referenceDate.setUTCDate(referenceDate.getUTCDate() - (recordIndex * 5 + areaIndex * 2 + 3));
      const totalOrder = 720 + areaIndex * 85 + (recordIndex % 9) * 68;
      const inspectionRate = 0.7 + ((areaIndex + recordIndex) % 6) * 0.048;
      const inspected = Math.round(totalOrder * Math.min(0.96, inspectionRate));
      const rejectionRate = 0.012 + ((areaIndex * 3 + recordIndex) % 7) * 0.009;
      const rejected = Math.max(1, Math.round(inspected * rejectionRate));
      const released = Math.max(0, inspected - rejected - ((areaIndex + recordIndex) % 5) * 5);
      const status = recordIndex % 5 === 0 ? "under_review" : recordIndex % 4 === 0 ? "submitted" : "approved";

      records.push({
        supplier_id: supplier.id,
        area_id: area.id,
        reference_date: referenceDate.toISOString().slice(0, 10),
        reference_week: isoWeek(referenceDate),
        status,
        payload: {
          order_number: `EX-${prefix}-${String(recordIndex + 1).padStart(4, "0")}`,
          total_order_volume: totalOrder,
          inspected_volume: inspected,
          rejected_volume: rejected,
          released_stock_volume: released,
          example_record: true,
          example_batch: exampleBatch,
        },
        created_by: userData.user.id,
        submitted_at: referenceDate.toISOString(),
        reviewed_by: status === "approved" ? userData.user.id : null,
        reviewed_at: status === "approved" ? referenceDate.toISOString() : null,
      });
    }
  }

  if (records.length) {
    const { error: insertError } = await admin.from("quality_records").insert(records);
    if (insertError) return json({ error: insertError.message }, 400);
  }

  const total = activeExampleCount + records.length;
  return json({
    created: records.length,
    total,
    areas: areas.length,
    suppliers: supplierCount,
    already_active: records.length === 0,
  });
});
