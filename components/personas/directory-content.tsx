import { notFound, redirect } from "next/navigation";

import { DirectoryControls } from "@/components/directory/directory-controls";
import { DirectoryCard } from "@/components/directory/directory-card";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getEventConfig } from "@/lib/env-config";

const PAGE_SIZE = 24;

export async function DirectoryContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const event = getEventConfig();
  if (!event.id) {
    notFound();
  }

  const { data: rows, count, error } = await supabase
    .from("profiles")
    .select(
      "id, slug_uuid, name, headline, company, job_title, location, avatar_url",
      { count: "exact" },
    )
    .eq("event_id", event.id)
    .order("name", { ascending: true })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    console.error("[directory]", error);
    return (
      <Card className="border border-dashed border-destructive/20">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Hubo un problema al cargar el directorio. Intenta nuevamente en unos segundos.
        </CardContent>
      </Card>
    );
  }

  const totalResults = count ?? 0;
  const profiles = (rows ?? []).map((profile) => ({
    id: profile.id,
    slug: profile.slug_uuid,
    name: profile.name,
    headline: profile.headline,
    company: profile.company,
    jobTitle: profile.job_title,
    location: profile.location,
    avatarUrl: profile.avatar_url,
  }));

  return (
    <div className="space-y-6">
      <DirectoryControls totalResults={totalResults} pageSize={PAGE_SIZE} />

      {profiles.length === 0 ? (
        <Card className="border border-dashed border-primary/20">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No hay asistentes registrados aún.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <DirectoryCard key={profile.id} profile={profile} />
          ))}
        </section>
      )}
    </div>
  );
}
