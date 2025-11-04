import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface ScanPayload {
  profileId?: string;
  slug?: string;
  source: "qr" | "directory" | "link";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: ScanPayload | null = null;
  try {
    payload = (await request.json()) as ScanPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Solicitud inválida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!payload?.source) {
    return new Response(JSON.stringify({ error: "Falta el origen del escaneo" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const event = getEventConfig();
  if (!event.id) {
    return new Response(JSON.stringify({ error: "Evento no configurado" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let profileId = payload.profileId;

  if (!profileId && payload.slug) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug_uuid", payload.slug)
      .maybeSingle();

    profileId = data?.id ?? undefined;
  }

  if (!profileId) {
    return new Response(JSON.stringify({ error: "Perfil objetivo no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: insertError } = await supabase.from("scans").insert({
    event_id: event.id,
    profile_id: profileId,
    by_user_id: user.id,
    source: payload.source,
  });

  if (insertError) {
    return new Response(JSON.stringify({ error: "No pudimos registrar el escaneo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(null, { status: 204 });
}
