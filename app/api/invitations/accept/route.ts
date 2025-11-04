import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppDomain } from "@/lib/env-config";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get("token") as string;

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  // Verify invitation
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (invitationError || !invitation) {
    return NextResponse.redirect(
      new URL("/invitacion/invalida", request.url)
    );
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);

  if (invitation.status === "expired" || now > expiresAt) {
    return NextResponse.redirect(
      new URL("/invitacion/expirada", request.url)
    );
  }

  // Check if already accepted
  if (invitation.status === "accepted") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is logged in, just accept the invitation
    await supabase
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("token", token);

    // Ensure user has profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const fallbackName =
        (typeof user.user_metadata?.full_name === "string" &&
          user.user_metadata.full_name.trim()) ||
        (typeof user.user_metadata?.name === "string" &&
          user.user_metadata.name.trim()) ||
        (user.email ? user.email.split("@")[0] : "Asistente");

      await supabase.from("profiles").insert({
        id: user.id,
        event_id: invitation.event_id,
        name: fallbackName,
        joined_event_at: new Date().toISOString(),
      });
    }

    return NextResponse.redirect(new URL("/perfil/editar", request.url));
  }

  // Create new user account with magic link
  const appDomain = getAppDomain();
  const redirectUrl = `https://${appDomain}/auth/callback?invitation=${token}`;

  const { error: signInError } = await adminClient.auth.admin.inviteUserByEmail(
    invitation.email,
    {
      redirectTo: redirectUrl,
      data: {
        invitation_token: token,
        event_id: invitation.event_id,
      },
    }
  );

  if (signInError) {
    console.error("[invitations] Error sending magic link:", signInError);
    return NextResponse.json(
      { error: "No se pudo enviar el enlace de acceso" },
      { status: 500 }
    );
  }

  // Redirect to confirmation page
  return NextResponse.redirect(
    new URL(`/invitacion/enviado?email=${encodeURIComponent(invitation.email)}`, request.url)
  );
}
