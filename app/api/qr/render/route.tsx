import QRCode from "qrcode";
import { ImageResponse } from "@vercel/og";

import { getEventConfig, getAppDomain } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RenderPayload {
  profileId?: string;
  slug?: string;
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

  let payload: RenderPayload;
  try {
    payload = (await request.json()) as RenderPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Solicitud inválida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const identifier = payload.slug ?? payload.profileId;
  if (!identifier) {
    return new Response(JSON.stringify({ error: "Falta el identificador del perfil" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let query = supabase
    .from("profiles")
    .select("id, slug_uuid, name, headline, company, avatar_url")
    .limit(1);

  if (payload.slug) {
    query = query.eq("slug_uuid", payload.slug);
  } else if (payload.profileId) {
    query = query.eq("id", payload.profileId);
  }

  const { data: profile, error: profileError } = await query.maybeSingle();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (profile.id !== user.id) {
    return new Response(JSON.stringify({ error: "Solo puedes descargar tu propio QR" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const event = getEventConfig();
  const appDomain = getAppDomain();
  const profileUrl = `https://${appDomain}/perfil/${profile.slug_uuid}`;

  let qrDataUrl: string;
  try {
    qrDataUrl = await QRCode.toDataURL(profileUrl, {
      margin: 1,
      width: 600,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("[qr/render] Failed generating QR", error);
    return new Response(JSON.stringify({ error: "Error generando QR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const width = 1080;
  const height = 1920;

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "96px",
          background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
          color: "#f8fafc",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 28, letterSpacing: 12, textTransform: "uppercase", color: "#38bdf8" }}>
                {event.name}
              </span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ fontSize: 44, fontWeight: 700 }}>{profile.name}</span>
            </div>
            {profile.headline && (
              <div style={{ display: "flex" }}>
                <span style={{ fontSize: 28, color: "#cbd5f5" }}>{profile.headline}</span>
              </div>
            )}
            {profile.company && (
              <div style={{ display: "flex" }}>
                <span style={{ fontSize: 24, color: "#94a3b8" }}>{profile.company}</span>
              </div>
            )}
          </div>
          {profile.avatar_url && (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "28px",
                overflow: "hidden",
                border: "4px solid #38bdf8",
                display: "flex",
              }}
            >
              <img
                src={profile.avatar_url}
                alt={profile.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "48px",
            padding: "48px",
            borderRadius: "36px",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: 720,
              height: 720,
              backgroundColor: "#ffffff",
              padding: "48px",
              borderRadius: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={qrDataUrl}
              alt="Código QR"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div style={{ display: "flex" }}>
            <span style={{ fontSize: 28, color: "#cbd5f5", textAlign: "center" }}>
              Escanea para guardar el contacto de {profile.name}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex" }}>
            <span style={{ fontSize: 24, letterSpacing: 8, textTransform: "uppercase", color: "#38bdf8" }}>
              Compartido por DevFest Managua
            </span>
          </div>
          <div style={{ display: "flex" }}>
            <span style={{ fontSize: 24, color: "#94a3b8" }}>devfest.gdgmanagua.com</span>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    },
  );
}
