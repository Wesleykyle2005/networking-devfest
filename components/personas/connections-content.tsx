import Link from "next/link";
import { redirect } from "next/navigation";
import { User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { getEventConfig } from "@/lib/env-config";

export async function ConnectionsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const event = getEventConfig();
  
  const { data: connectionRows } = await supabase
    .from("connections")
    .select("id, user_a_id, user_b_id, created_at")
    .eq("event_id", event.id)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const peerIds = connectionRows?.map((row) => 
    row.user_a_id === user.id ? row.user_b_id : row.user_a_id
  ) ?? [];

  let connections: Array<{
    id: string;
    slug: string;
    name: string;
    headline?: string | null;
    company?: string | null;
    avatarUrl?: string | null;
  }> = [];

  if (peerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slug_uuid, name, headline, company, avatar_url")
      .in("id", peerIds);

    connections = profiles?.map((p) => ({
      id: p.id,
      slug: p.slug_uuid,
      name: p.name,
      headline: p.headline,
      company: p.company,
      avatarUrl: p.avatar_url,
    })) ?? [];
  }

  if (connections.length === 0) {
    return (
      <Card className="border border-dashed border-primary/20">
        <CardContent className="p-8 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Aún no tienes conexiones</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explora el directorio y envía solicitudes de conexión
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {connections.map((connection) => (
        <Link
          key={connection.id}
          href={`/perfil/${connection.slug}`}
          className="block"
        >
          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={connection.avatarUrl || undefined} />
                  <AvatarFallback>{connection.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{connection.name}</h3>
                  {connection.headline && (
                    <p className="text-sm text-muted-foreground truncate">
                      {connection.headline}
                    </p>
                  )}
                  {connection.company && (
                    <p className="text-xs text-muted-foreground truncate">
                      {connection.company}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
