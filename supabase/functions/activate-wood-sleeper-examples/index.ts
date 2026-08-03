import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const exampleBatch = "wood_sleeper_examples_v1";

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

  const { data: area, error: areaError } = await admin
    .from("material_areas")
    .select("id")
    .eq("code", "wood_sleeper")
    .single();
  if (areaError || !area) return json({ error: "Área de Dormente de Madeira não encontrada." }, 404);

  const { data: suppliers, error: suppliersError } = await admin
    .from("suppliers")
    .select("id, trade_name")
    .eq("area_id", area.id)
    .eq("status", "active")
    .order("trade_name");
  if (suppliersError) return json({ error: suppliersError.message }, 400);
  if (!suppliers?.length) return json({ error: "Nenhum fornecedor ativo de Dormente de Madeira foi encontrado." }, 400);

  const recordsPerSupplier = Math.max(5, Math.ceil(30 / suppliers.length));
  const targetCount = recordsPerSupplier * suppliers.length;
  const { count: existingCount, error: countError } = await admin
    .from("quality_records")
    .select("id", { count: "exact", head: true })
    .eq("area_id", area.id)
    .contains("payload", { example_batch: exampleBatch });
  if (countError) return json({ error: countError.message }, 400);
  if ((existingCount ?? 0) >= targetCount) {
    return json({ created: 0, total: existingCount, suppliers: suppliers.length, already_active: true });
  }

  if ((existingCount ?? 0) > 0) {
    const { error: deleteError } = await admin
      .from("quality_records")
      .delete()
      .eq("area_id", area.id)
      .contains("payload", { example_batch: exampleBatch });
    if (deleteError) return json({ error: deleteError.message }, 400);
  }

  const today = new Date();
  const records = suppliers.flatMap((supplier, supplierIndex) =>
    Array.from({ length: recordsPerSupplier }, (_, recordIndex) => {
      const sequence = supplierIndex * recordsPerSupplier + recordIndex + 1;
      const referenceDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      referenceDate.setUTCDate(referenceDate.getUTCDate() - (recordIndex * 17 + supplierIndex * 4 + 3));
      const totalOrder = 760 + supplierIndex * 95 + recordIndex * 70;
      const inspectionRate = 0.72 + ((supplierIndex + recordIndex) % 5) * 0.055;
      const inspected = Math.round(totalOrder * Math.min(0.96, inspectionRate));
      const rejectionRate = 0.012 + ((supplierIndex * 2 + recordIndex) % 6) * 0.011;
      const rejected = Math.max(1, Math.round(inspected * rejectionRate));
      const released = Math.max(0, inspected - rejected - ((supplierIndex + recordIndex) % 4) * 6);
      const status = sequence % 4 === 0 ? "under_review" : sequence % 3 === 0 ? "submitted" : "approved";

      return {
        supplier_id: supplier.id,
        area_id: area.id,
        reference_date: referenceDate.toISOString().slice(0, 10),
        reference_week: isoWeek(referenceDate),
        status,
        payload: {
          order_number: `EX-DM-${String(sequence).padStart(4, "0")}`,
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
      };
    })
  );

  const { error: insertError } = await admin.from("quality_records").insert(records);
  if (insertError) return json({ error: insertError.message }, 400);

  return json({ created: records.length, total: records.length, suppliers: suppliers.length, already_active: false });
});
