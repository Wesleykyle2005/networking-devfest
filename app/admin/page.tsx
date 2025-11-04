import { notFound, redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { InviteUserForm } from "@/components/admin/invite-user-form";
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
    notFound();
  }

  const event = getEventConfig();
  if (!event.id) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Métricas y gestión de asistentes para {event.name}
        </p>
      </header>

      <div className="mx-auto max-w-2xl">
        <InviteUserForm />
      </div>

      <AdminDashboard eventId={event.id} eventName={event.name} />
    </div>
  );
}
