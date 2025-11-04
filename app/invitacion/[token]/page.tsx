import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventConfig } from "@/lib/env-config";
import Image from "next/image";

interface InvitationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify invitation token
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (invitationError || !invitation) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-3xl">❌</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Invitación no válida
            </h1>
            <p className="text-muted-foreground">
              Esta invitación no existe o ha expirado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation is expired
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  
  if (invitation.status === "expired" || now > expiresAt) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <span className="text-3xl">⏰</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Invitación expirada
            </h1>
            <p className="text-muted-foreground">
              Esta invitación ha expirado. Solicita una nueva invitación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation already accepted
  if (invitation.status === "accepted") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <span className="text-3xl">✅</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold sm:text-4xl">
              Invitación ya aceptada
            </h1>
            <p className="text-muted-foreground">
              Esta invitación ya fue utilizada.
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Iniciar sesión
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, accept invitation and redirect
  if (user) {
    // Mark invitation as accepted
    await supabase
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("token", token);

    // Check if user already has a profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, joined_event_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      // Create profile for user
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
    } else if (!profile.joined_event_at) {
      // Update existing profile
      await supabase
        .from("profiles")
        .update({
          event_id: invitation.event_id,
          joined_event_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    redirect("/perfil/editar");
  }

  // User not authenticated - show invitation page with sign up option
  const eventConfig = getEventConfig();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <div className="flex justify-center mb-2">
          <Image
            src="/assets/devfest-logo.svg"
            alt="DevFest"
            width={200}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>
        
        <div className="space-y-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl">🎉</span>
          </div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Invitación exclusiva
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            ¡Has sido invitado!
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Únete a la App de Networking del {eventConfig.name}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Invitación para: <strong className="text-foreground">{invitation.email}</strong>
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <a
            href={`/login?redirect=/invitacion/${token}`}
            className="block w-full rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Aceptar invitación y crear cuenta
          </a>

          <p className="text-center text-xs text-muted-foreground">
            Al aceptar, crearás una cuenta con el email invitado
          </p>
        </div>

        <div className="border-t pt-4 w-full max-w-sm">
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <a
              href={`/login?redirect=/invitacion/${token}`}
              className="font-semibold text-primary hover:underline"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
