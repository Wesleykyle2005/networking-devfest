import { NextResponse } from "next/server";

import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface Payload {
  requestId?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const event = getEventConfig();
  if (!event.id) {
    return NextResponse.json({ error: "Evento no configurado" }, { status: 500 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!payload.requestId) {
    return NextResponse.json({ error: "Falta el identificador" }, { status: 400 });
  }

  const { data: requestRow } = await supabase
    .from("connection_requests")
    .select("recipient_id, event_id")
    .eq("id", payload.requestId)
    .maybeSingle();

  if (!requestRow || requestRow.recipient_id !== user.id || requestRow.event_id !== event.id) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { error } = await supabase.rpc("rpc_approve_request", {
    request_id: payload.requestId,
  });

  if (error) {
    return NextResponse.json({ error: "No pudimos aprobar la solicitud" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
