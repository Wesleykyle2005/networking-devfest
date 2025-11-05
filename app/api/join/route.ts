import { NextResponse } from "next/server";

import { getEventConfig } from "@/lib/env-config";
import { syncOAuthAvatar } from "@/lib/sync-oauth-avatar";
import { createClient } from "@/lib/supabase/server";

function normalizeCode(code?: string | null) {
  return (code ?? "").trim().toUpperCase();
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = (await request.json().catch(() => ({}))) as {
    code?: string;
  };

  const submittedCode = normalizeCode(code);
  if (!submittedCode) {
    return NextResponse.json(
      { error: "Ingresa el código del evento" },
      { status: 400 }
    );
  }

  const eventConfig = getEventConfig();
  const envCode = normalizeCode(eventConfig.code);

  let isValid = envCode.length > 0 && submittedCode === envCode;

  if (!isValid && eventConfig.id) {
    const { data: eventSetting, error: eventError } = await supabase
      .from("event_settings")
      .select("event_code")
      .eq("event_id", eventConfig.id)
      .maybeSingle();

    if (!eventError && eventSetting?.event_code) {
      isValid = submittedCode === normalizeCode(eventSetting.event_code);
    }
  }

  if (!isValid) {
    return NextResponse.json(
      { error: "Código incorrecto. Verifica e inténtalo nuevamente." },
      { status: 400 }
    );
  }

  const eventId =
    eventConfig.id && eventConfig.id !== "00000000-0000-0000-0000-000000000000"
      ? eventConfig.id
      : null;

  if (!eventId) {
    return NextResponse.json(
      {
        error:
          "La configuración del evento no está completa. Contacta al administrador.",
      },
      { status: 500 }
    );
  }

  const now = new Date().toISOString();

  const { data: existingProfile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("id, name, joined_event_at, event_id, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileFetchError) {
    return NextResponse.json(
      {
        error:
          "No pudimos validar tu perfil en Supabase. Intenta nuevamente en unos segundos.",
      },
      { status: 500 }
    );
  }

  if (!existingProfile) {
    const fallbackName =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      (typeof user.user_metadata?.name === "string" &&
        user.user_metadata.name.trim()) ||
      (user.email ? user.email.split("@")[0] : "Asistente DevFest");

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      event_id: eventId,
      name: fallbackName || "Asistente DevFest",
      joined_event_at: now,
    });

    if (insertError) {
      return NextResponse.json(
        {
          error:
            "No pudimos registrar tu acceso. Vuelve a intentarlo o contacta a soporte.",
        },
        { status: 500 }
      );
    }

    await syncOAuthAvatar({ user, currentAvatar: null });
  } else {
    const updates: Record<string, string> = {};
    if (!existingProfile.joined_event_at) {
      updates.joined_event_at = now;
    }
    if (!existingProfile.event_id) {
      updates.event_id = eventId;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json(
          {
            error:
              "No pudimos actualizar tu estado de acceso. Intenta nuevamente en unos segundos.",
          },
          { status: 500 }
        );
      }
    }

    await syncOAuthAvatar({ user, currentAvatar: existingProfile.avatar_url ?? null });
  }

  // Check if user has a pending invitation and mark it as accepted
  if (user.email) {
    console.log('[join] Checking for pending invitation for email:', user.email);
    
    const { data: pendingInvitation, error: invitationFetchError } = await supabase
      .from('invitations')  
      .select('id, token, email, status')
      .eq('email', user.email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (invitationFetchError) {
      console.error('[join] Error fetching invitation:', invitationFetchError);
    }

    if (pendingInvitation) {
      console.log('[join] Found pending invitation:', pendingInvitation.id);
      
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: now,
        })
        .eq('id', pendingInvitation.id);
      
      if (updateError) {
        console.error('[join] Error updating invitation:', updateError);
      } else {
        console.log('[join] ✅ Successfully marked invitation as accepted for:', user.email);
      }
    } else {
      console.log('[join] No pending invitation found for:', user.email);
    }
  }

  return NextResponse.json({ success: true });
}
