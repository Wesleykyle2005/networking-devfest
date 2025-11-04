import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/emails";
import { getAppDomain, getEventConfig } from "@/lib/env-config";
import crypto from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      { error: "No se encontró el perfil del usuario" },
      { status: 404 }
    );
  }

  const { emails } = (await request.json().catch(() => ({}))) as {
    emails?: string[];
  };

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json(
      { error: "Se requiere un array de emails" },
      { status: 400 }
    );
  }

  if (emails.length > 500) {
    return NextResponse.json(
      { error: "Máximo 500 emails por lote" },
      { status: 400 }
    );
  }

  const eventConfig = getEventConfig();
  const appDomain = getAppDomain();
  
  const results = {
    success: [] as string[],
    failed: [] as { email: string; reason: string }[],
    skipped: [] as { email: string; reason: string }[],
  };

  // Helper function to add delay between emails (respect rate limits)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    
    // Add 600ms delay between emails to respect Resend's 2 emails/second limit
    if (i > 0) {
      await delay(600);
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    if (!normalizedEmail.includes("@")) {
      results.failed.push({ email, reason: "Formato de email inválido" });
      continue;
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (userExists) {
      results.skipped.push({ email, reason: "Usuario ya existe" });
      continue;
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("invitations")
      .select("id, status")
      .eq("email", normalizedEmail)
      .eq("event_id", inviterProfile.event_id)
      .maybeSingle();

    if (existingInvitation && existingInvitation.status === "pending") {
      results.skipped.push({ email, reason: "Invitación pendiente ya existe" });
      continue;
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration for bulk

    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .insert({
        email: normalizedEmail,
        event_id: inviterProfile.event_id,
        invited_by: inviterProfile.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (invitationError) {
      results.failed.push({ email, reason: invitationError.message });
      continue;
    }

    // Send email
    const invitationUrl = `https://${appDomain}/invitacion/${token}`;
    const emailResult = await sendInvitationEmail({
      recipientEmail: normalizedEmail,
      inviterName: inviterProfile.name,
      invitationUrl,
      eventName: eventConfig.name,
    });

    if (!emailResult.success) {
      const errorMessage = typeof emailResult.error === 'string' 
        ? emailResult.error 
        : "Error al enviar email";
      results.failed.push({ email, reason: errorMessage });
      
      // Delete invitation if email failed to maintain consistency
      const { error: deleteError } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitation.id);
      
      if (deleteError) {
        console.error(`[bulk-invitations] Failed to delete invitation for ${email}:`, deleteError);
      }
      
      continue;
    }

    results.success.push(email);
  }

  return NextResponse.json({
    success: true,
    results: {
      total: emails.length,
      sent: results.success.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      details: results,
    },
  });
}
