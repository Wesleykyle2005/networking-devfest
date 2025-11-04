import { notFound, redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { BulkInviteForm } from "@/components/admin/bulk-invite-form";
import { isAdmin } from "@/lib/admin";
import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!isAdmin(user)) {
    redirect("/personas");
  }

  const event = getEventConfig();
  if (!event.id) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <a
          href="/personas"
          className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:border-primary/50"
        >
          ← Volver a la app
        </a>
      </div>
      
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Métricas y gestión de asistentes para {event.name}
        </p>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        <InviteUserForm />
        <BulkInviteForm />
      </div>

      <AdminDashboard eventId={event.id} eventName={event.name} />
    </div>
  );
}
