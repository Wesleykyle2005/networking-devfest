import { NextResponse } from "next/server";

import { getEventConfig } from "@/lib/env-config";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Buffer } from "node:buffer";

function normalizeCode(code?: string | null) {
  return (code ?? "").trim().toUpperCase();
}

export const runtime = "nodejs";


async function syncOAuthAvatar({
  user,
  currentAvatar,
}: {
  user: { id: string; user_metadata?: Record<string, unknown> | null };
  currentAvatar?: string | null;
}) {
  if (currentAvatar) return;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  let remoteUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url.length > 0 && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture.length > 0 && metadata.picture) ||
    null;

  if (!remoteUrl) return;

  // Request higher resolution from Google (500x500 instead of default 96x96)
  if (remoteUrl.includes('googleusercontent.com')) {
    remoteUrl = remoteUrl.replace(/=s\d+-c/, '=s500-c');
    // If no size parameter exists, add it
    if (!remoteUrl.includes('=s')) {
      remoteUrl = `${remoteUrl}=s500-c`;
    }
  }

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      return;
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : "jpg";

    const storagePath = `avatars/${user.id}/oauth-avatar.${extension}`;
    const serviceClient = createServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from("avatars")
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error("[join] upload avatar error", uploadError);
      return;
    }

    const { data: publicData } = serviceClient.storage
      .from("avatars")
      .getPublicUrl(storagePath);

    if (!publicData?.publicUrl) {
      console.error("[join] getPublicUrl failed");
      return;
    }

    await serviceClient
      .from("profiles")
      .update({ avatar_url: publicData.publicUrl })
      .eq("id", user.id);
  } catch (error) {
    console.error("[join] sync avatar error", error);
  }
}
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

  return NextResponse.json({ success: true });
}
