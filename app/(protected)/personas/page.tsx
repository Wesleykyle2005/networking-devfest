import { redirect } from "next/navigation";

import { PersonasTabs } from "@/components/personas/personas-tabs";
import { DirectoryContent } from "@/components/personas/directory-content";
import { ConnectionsContent } from "@/components/personas/connections-content";
import { PendingContent } from "@/components/personas/pending-content";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PersonasPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function PersonasPage({ searchParams }: PersonasPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/personas");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url, slug_uuid")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/join");
  }

  const params = await searchParams;
  const activeTab = params.tab || "descubrir";

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gradient-to-b from-background to-muted">
        <PersonasTabs activeTab={activeTab}>
          {activeTab === "descubrir" && <DirectoryContent />}
          {activeTab === "conexiones" && <ConnectionsContent />}
          {activeTab === "pendientes" && <PendingContent />}
        </PersonasTabs>
      </main>
    </div>
  );
}
