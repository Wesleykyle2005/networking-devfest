import { type ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, avatar_url, joined_event_at, slug_uuid")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // If we cannot read the profile we force the join flow
    redirect("/join");
  }

  if (!profile?.joined_event_at) {
    redirect("/join");
  }

  const headerProfile = {
    name: profile?.name ?? user.user_metadata?.full_name ?? user.email,
    email: user.email,
    avatarUrl: profile?.avatar_url ?? null,
    slug: profile?.slug_uuid ?? null,
  } as {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    slug?: string | null;
  };

  const event = getEventConfig();

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <AppHeader profile={headerProfile} />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-border/60 bg-white/90 py-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>{event.name}</span>
          <span>Red de asistentes • 2025</span>
        </div>
      </footer>
    </div>
  );
}
