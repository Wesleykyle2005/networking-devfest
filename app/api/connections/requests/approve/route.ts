import { NextResponse } from "next/server";

import { getEventConfig } from "@/lib/env-config";
import { sendConnectionAcceptedEmail } from "@/lib/emails";
import { createServiceRoleClient } from "@/lib/supabase/admin";
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
    .select("id, requester_id, recipient_id, event_id")
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

  // Get accepter (current user) profile
  const { data: accepterProfile } = await supabase
    .from("profiles")
    .select("name, headline, company, slug_uuid")
    .eq("id", user.id)
    .single();

  // Create in-app notification and send email
  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
    
    // Create notification
    await serviceClient.from("notifications").insert({
      user_id: requestRow.requester_id,
      type: "connection_accepted",
      actor_id: user.id,
      reference_id: payload.requestId,
    });

    // Get requester email and profile using service client
    const { data: requesterUser } = await serviceClient.auth.admin.getUserById(requestRow.requester_id);
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", requestRow.requester_id)
      .single();

    // Send email notification to requester
    if (requesterUser?.user?.email && accepterProfile) {
      console.log("[connections/approve] Sending email to:", requesterUser.user.email);
      sendConnectionAcceptedEmail({
        recipientEmail: requesterUser.user.email,
        recipientName: requesterProfile?.name || "Usuario",
        accepterName: accepterProfile.name || "Alguien",
        accepterHeadline: accepterProfile.headline,
        accepterCompany: accepterProfile.company,
        accepterSlug: accepterProfile.slug_uuid,
      }).catch((error) => {
        console.error("[connections/approve] Error sending email:", error);
      });
    } else {
      console.log("[connections/approve] Skipping email - no requester email or accepter profile");
    }
  } catch (error) {
    console.error("[connections/approve] Error in notification/email flow:", error);
  }

  return NextResponse.json({ success: true });
}
