import { redirect } from "next/navigation";

import { JoinForm } from "./join-form";
import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/join");
  }

  const eventConfig = getEventConfig();

  const { data: profile } = await supabase
    .from("profiles")
    .select("joined_event_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.joined_event_at) {
    redirect("/perfil/editar");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4 py-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Acceso exclusivo para asistentes
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Bienvenido/a a {eventConfig.name}
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Ingresa el código del evento que recibiste por correo o en tu acreditación. Solo necesitas hacerlo una vez.
          </p>
        </div>
        <JoinForm eventName={eventConfig.name} />
        <p className="text-sm text-muted-foreground">
          ¿No tienes el código? Acércate al punto de información del evento o escribe a soporte para obtenerlo.
        </p>
      </div>
    </div>
  );
}
