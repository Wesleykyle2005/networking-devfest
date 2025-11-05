import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/emails";
import { getAppDomain, getEventConfig } from "@/lib/env-config";
import crypto from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Get inviter profile
  const { data: inviterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, event_id")
    .eq("id", user.id)
    .single();

  if (profileError || !inviterProfile) {
    return NextResponse.json(
      { error: "Perfil no encontrado" },
      { status: 404 }
    );
  }

  // Parse request body
  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string;
  };

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Email inválido" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const userExists = existingUser?.users?.some(
    (u) => u.email?.toLowerCase() === normalizedEmail
  );

  if (userExists) {
    return NextResponse.json(
      { error: "Este usuario ya tiene una cuenta" },
      { status: 400 }
    );
  }

  // Check if invitation already exists
  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("email", normalizedEmail)
    .eq("event_id", inviterProfile.event_id)
    .maybeSingle();

  if (existingInvitation && existingInvitation.status === "pending") {
    return NextResponse.json(
      { error: "Ya existe una invitación pendiente para este email" },
      { status: 400 }
    );
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Get event config
  const eventConfig = getEventConfig();
  const appDomain = getAppDomain();
  const invitationUrl = `https://${appDomain}/invitacion/${token}`;

  // Send email FIRST - only create invitation if email succeeds
  const emailResult = await sendInvitationEmail({
    recipientEmail: normalizedEmail,
    inviterName: inviterProfile.name,
    invitationUrl,
    eventName: eventConfig.name,
  });

  if (!emailResult.success) {
    console.error("[invitations] Failed to send email:", emailResult.error);
    return NextResponse.json(
      { error: "No se pudo enviar el email de invitación" },
      { status: 500 }
    );
  }

  // Email sent successfully - NOW create the invitation in database
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .insert({
      event_id: inviterProfile.event_id,
      email: normalizedEmail,
      invited_by: inviterProfile.id,
      token,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (invitationError) {
    console.error("[invitations] Email sent but DB insert failed:", invitationError);
    return NextResponse.json(
      { error: "Email enviado pero error al guardar invitación" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expires_at,
    },
  });
}
