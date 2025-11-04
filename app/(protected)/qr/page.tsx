import QRCode from "qrcode";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { QrBadge } from "@/components/qr/qr-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug_uuid, name, headline, company")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.slug_uuid) {
    redirect("/perfil/editar");
  }

  const event = getEventConfig();
  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const profileUrl = `${baseUrl}/perfil/${profile.slug_uuid}`;

  let qrDataUrl: string;
  try {
    qrDataUrl = await QRCode.toDataURL(profileUrl, {
      margin: 1,
      width: 600,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("[qr] Failed generating QR", error);
    redirect(
      `/auth/error?error=${encodeURIComponent(
        "No pudimos generar tu código QR. Intenta nuevamente.",
      )}`,
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tu código QR</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Guarda esta pantalla en tu teléfono o toma una captura para usarla como tarjeta de presentación.
          Si alguien escanea el código accederá a tu perfil público de {event.name}.
        </p>
      </header>

      <QrBadge
        qrDataUrl={qrDataUrl}
        profileUrl={profileUrl}
        slug={profile.slug_uuid}
        attendeeName={profile.name}
        attendeeHeadline={profile.headline}
        attendeeCompany={profile.company}
        eventName={event.name}
      />

      <Card className="mx-auto max-w-2xl border border-dashed border-primary/20 bg-primary/5">
        <CardContent className="space-y-2 p-6 text-sm text-primary">
          <p className="font-semibold uppercase tracking-wide">Tips rápidos</p>
          <ul className="list-disc space-y-1 pl-5 text-primary/90">
            <li>Fija este enlace en tu pantalla de inicio para abrirlo rápido.</li>
            <li>Activa el brillo máximo antes de mostrar el código.</li>
            <li>Después del evento podrás descargar una versión para tu fondo de pantalla.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
