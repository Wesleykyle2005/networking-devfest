import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Facebook,
} from "lucide-react";

import { ConnectButton } from "@/components/connections/connect-button";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { connectionsRequireApproval, getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const event = getEventConfig();
  const supabase = await createClient();
  const { slug } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, name, headline, company, job_title, bio, location, avatar_url, social_linkedin, social_twitter, social_instagram, social_facebook, phone, email_public, website, hide_phone_until_connected, hide_email_until_connected"
    )
    .eq("slug_uuid", slug)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const requiresApproval = connectionsRequireApproval();
  const loginHref = `/auth/login?next=/perfil/${slug}`;
  let connectionState: "idle" | "pending" | "connected" | "self" | "guest" = viewer ? "idle" : "guest";

  if (viewer) {
    if (viewer.id === profile.id) {
      connectionState = "self";
    } else {
      const sorted = [viewer.id, profile.id].sort();
      const { data: existingConnection } = await supabase
        .from("connections")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_a_id", sorted[0])
        .eq("user_b_id", sorted[1])
        .maybeSingle();

      if (existingConnection) {
        connectionState = "connected";
      } else {
        const { data: existingRequest } = await supabase
          .from("connection_requests")
          .select("status")
          .eq("event_id", event.id)
          .eq("requester_id", viewer.id)
          .eq("recipient_id", profile.id)
          .maybeSingle();

        if (existingRequest?.status === "approved") {
          connectionState = "connected";
        } else if (existingRequest?.status === "pending") {
          connectionState = "pending";
        } else {
          connectionState = "idle";
        }
      }
    }
  } else {
    connectionState = "guest";
  }

  const canSeePhone = connectionState === "self"
    || connectionState === "connected"
    || !profile.hide_phone_until_connected;
  const canSeeEmail = connectionState === "self"
    || connectionState === "connected"
    || !profile.hide_email_until_connected;
  const isOwner = connectionState === "self";

  const socials = [
    {
      label: "LinkedIn",
      value: profile.social_linkedin,
      icon: Linkedin,
    },
    {
      label: "X / Twitter",
      value: profile.social_twitter,
      icon: Twitter,
    },
    {
      label: "Instagram",
      value: profile.social_instagram,
      icon: Instagram,
    },
    {
      label: "Facebook",
      value: profile.social_facebook,
      icon: Facebook,
    },
    {
      label: "Sitio web",
      value: profile.website,
      icon: Globe,
    },
  ].filter((item) => item.value);

  const contactBlocks = [
    {
      label: "Correo",
      value: profile.email_public,
      icon: Mail,
      hidden: !canSeeEmail,
    },
    {
      label: "Teléfono",
      value: profile.phone,
      icon: Phone,
      hidden: !canSeePhone,
    },
  ];

  const headerProfile = viewer ? {
    name: profile?.name ?? viewer.user_metadata?.full_name ?? viewer.email,
    email: viewer.email,
    avatarUrl: profile?.avatar_url ?? null,
    slug: connectionState === "self" ? slug : null,
  } : null;

  return (
    <div className="relative min-h-svh bg-gradient-to-b from-background via-background to-muted">
      <div className="absolute inset-x-0 top-0 z-0 h-72 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <AppHeader profile={headerProfile} />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">

        <Card className="border-none shadow-xl">
          <CardContent className="flex flex-col gap-6 px-6 py-10 sm:px-10">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
              <div className="h-36 w-36 overflow-hidden rounded-2xl border bg-muted shadow-inner">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={`Avatar de ${profile.name}`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                    {profile.name?.[0] ?? "?"}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {profile.name}
                  </h1>
                  <p className="mt-2 text-lg text-muted-foreground">
                    {profile.headline}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.job_title && `${profile.job_title} • `}
                    {profile.company}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
                {profile.bio && (
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-4">
                  <ConnectButton
                    profileSlug={slug}
                    profileId={profile.id}
                    initialState={connectionState}
                    requiresApproval={requiresApproval}
                    loginHref={loginHref}
                  />
                  {isOwner && (
                    <Button variant="outline" asChild>
                      <Link href="/perfil/editar">Editar perfil</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <section className="grid gap-6 rounded-2xl bg-muted/40 p-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Redes sociales
                </h2>
                {socials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este asistente aún no agregó sus redes.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {socials.map(({ label, value, icon: Icon }) => (
                      <li key={label}>
                        <Link
                          href={value!}
                          className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Contacto directo
                </h2>
                <ul className="space-y-3 text-sm">
                  {contactBlocks.map(({ label, value, icon: Icon, hidden }) => (
                    <li key={label} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{label}</p>
                        {value && hidden ? (
                          <p className="text-muted-foreground">
                            Disponible una vez que estén conectados.
                          </p>
                        ) : value ? (
                          <p className="text-muted-foreground">{value}</p>
                        ) : (
                          <p className="text-muted-foreground">No proporcionado</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-border/60 py-8 text-center text-xs text-muted-foreground sm:flex-row">
          <p>DevFest Managua 2025 • Conectando a la comunidad</p>
          <p className="text-[11px] uppercase tracking-[0.3em]">
            Compartido por DevFest
          </p>
        </footer>
      </div>
    </div>
  );
}
