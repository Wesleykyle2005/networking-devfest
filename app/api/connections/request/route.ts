import { NextResponse } from "next/server";

import { connectionsRequireApproval, getEventConfig } from "@/lib/env-config";
import { sendConnectionRequestEmail } from "@/lib/emails";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface ConnectionPayload {
  profileId?: string;
  slug?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: ConnectionPayload;
  try {
    payload = (await request.json()) as ConnectionPayload;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const identifier = payload.slug ?? payload.profileId;
  if (!identifier) {
    return NextResponse.json({ error: "Debes indicar a quién quieres conectar" }, { status: 400 });
  }

  const event = getEventConfig();
  if (!event.id) {
    return NextResponse.json({ error: "Evento no configurado" }, { status: 500 });
  }

  let profileQuery = supabase
    .from("profiles")
    .select("id, event_id, name, headline, company, slug_uuid")
    .limit(1);

  if (payload.slug) {
    profileQuery = profileQuery.eq("slug_uuid", payload.slug);
  } else if (payload.profileId) {
    profileQuery = profileQuery.eq("id", payload.profileId);
  }

  const { data: target, error: targetError } = await profileQuery.maybeSingle();
  if (targetError || !target) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  if (target.id === user.id) {
    return NextResponse.json({ error: "No puedes conectarte contigo mismo" }, { status: 400 });
  }

  if (target.event_id !== event.id) {
    return NextResponse.json({ error: "Este perfil no pertenece al evento" }, { status: 400 });
  }

  const sorted = [user.id, target.id].sort();

  const { data: existingConnection } = await supabase
    .from("connections")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_a_id", sorted[0])
    .eq("user_b_id", sorted[1])
    .maybeSingle();

  if (existingConnection) {
    return NextResponse.json({ status: "connected" });
  }

  const requireApproval = connectionsRequireApproval();

  const { data: existingRequest } = await supabase
    .from("connection_requests")
    .select("id, status")
    .eq("event_id", event.id)
    .eq("requester_id", user.id)
    .eq("recipient_id", target.id)
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.status === "approved") {
      return NextResponse.json({ status: "connected" });
    }
    return NextResponse.json({ status: "pending" });
  }

  const { data: insertedRequest, error: insertError } = await supabase
    .from("connection_requests")
    .insert({
      event_id: event.id,
      requester_id: user.id,
      recipient_id: target.id,
      status: requireApproval ? "pending" : "approved",
    })
    .select("id")
    .single();

  if (insertError) {
    if ((insertError as { code?: string }).code === "23505") {
      return NextResponse.json({ status: requireApproval ? "pending" : "connected" });
    }

    return NextResponse.json(
      { error: "No pudimos registrar la solicitud" },
      { status: 500 },
    );
  }

  // Get requester profile for notifications/emails
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("name, headline, company, slug_uuid")
    .eq("id", user.id)
    .single();

  if (requireApproval) {
    // Create in-app notification and send email
    let serviceClient;
    try {
      serviceClient = createServiceRoleClient();
      
      // Create notification
      await serviceClient.from("notifications").insert({
        user_id: target.id,
        type: "connection_request",
        actor_id: user.id,
        reference_id: insertedRequest.id,
      });

      // Get recipient email using service client
      const { data: recipientUser } = await serviceClient.auth.admin.getUserById(target.id);

      // Send email notification
      if (recipientUser?.user?.email && requesterProfile) {
        console.log("[connections/request] Sending email to:", recipientUser.user.email);
        sendConnectionRequestEmail({
          recipientEmail: recipientUser.user.email,
          requesterName: requesterProfile.name || "Alguien",
          requesterHeadline: requesterProfile.headline,
          requesterCompany: requesterProfile.company,
          requesterSlug: requesterProfile.slug_uuid,
        }).catch((error) => {
          console.error("[connections/request] Error sending email:", error);
        });
      } else {
        console.log("[connections/request] Skipping email - no recipient email or requester profile");
      }
    } catch (error) {
      console.error("[connections/request] Error in notification/email flow:", error);
    }

    return NextResponse.json({ status: "pending" });
  }

  let serviceClient;
  try {
    serviceClient = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 500 });
  }

  const { error: connectionError } = await serviceClient.from("connections").upsert({
    event_id: event.id,
    user_a_id: sorted[0],
    user_b_id: sorted[1],
  });

  if (connectionError) {
    return NextResponse.json(
      { error: "No pudimos crear la conexión" },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "connected" });
}
