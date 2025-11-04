import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConnectionNoteForm } from "@/components/connections/connection-note-form";
import { PendingRequestCard } from "@/components/connections/pending-request-card";
import { SentRequestCard } from "@/components/connections/sent-request-card";
import { Card, CardContent } from "@/components/ui/card";
import { connectionsRequireApproval, getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

const TABS = [
  { key: "todos", label: "Mis conexiones" },
  { key: "pendientes", label: "Pendientes" },
  { key: "enviadas", label: "Enviadas" },
] as const;

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

export default async function ConnectionsPage({ searchParams }: PageProps) {
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

  const requiresApproval = connectionsRequireApproval();

  const params = await searchParams;
  const tabParam = typeof params?.tab === "string" ? params.tab : "todos";
  const activeTab = TABS.some((tab) => tab.key === tabParam) ? tabParam : "todos";

  const { data: connectionRows } = await supabase
    .from("connections")
    .select("id, user_a_id, user_b_id, created_at")
    .eq("event_id", event.id)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  const peerIds = new Set<string>();
  connectionRows?.forEach((row) => {
    const peerId = row.user_a_id === user.id ? row.user_b_id : row.user_a_id;
    if (peerId) {
      peerIds.add(peerId);
    }
  });

  const { data: noteRows } = await supabase
    .from("connection_notes")
    .select("peer_id, note, tags")
    .eq("author_id", user.id);

  const noteMap = new Map(noteRows?.map((row) => [row.peer_id, row]));

  const { data: inboundRequests } = await supabase
    .from("connection_requests")
    .select("id, requester_id, created_at")
    .eq("event_id", event.id)
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  inboundRequests?.forEach((row) => {
    if (row.requester_id) {
      peerIds.add(row.requester_id);
    }
  });

  const { data: sentRequests } = await supabase
    .from("connection_requests")
    .select("id, recipient_id, created_at, status")
    .eq("event_id", event.id)
    .eq("requester_id", user.id)
    .eq("status", "pending");

  sentRequests?.forEach((row) => {
    if (row.recipient_id) {
      peerIds.add(row.recipient_id);
    }
  });

  const profileIds = Array.from(peerIds);
  let profileMap = new Map<string, { id: string; slug_uuid: string; name: string; headline?: string | null; company?: string | null; job_title?: string | null; avatar_url?: string | null }>();

  if (profileIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, slug_uuid, name, headline, company, job_title, avatar_url")
      .in("id", profileIds);

    if (profileRows) {
      profileMap = new Map(profileRows.map((row) => [row.id, row]));
    }
  }

  const connections = (connectionRows ?? [])
    .map((row) => {
      const peerId = row.user_a_id === user.id ? row.user_b_id : row.user_a_id;
      const peerProfile = peerId ? profileMap.get(peerId) : undefined;
      if (!peerId || !peerProfile) {
        return null;
      }

      const note = noteMap.get(peerId);

      return {
        id: row.id,
        createdAt: row.created_at,
        peerId,
        peer: peerProfile,
        note: note?.note ?? "",
        tags: (note?.tags as string[] | null) ?? [],
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const pending = (inboundRequests ?? [])
    .map((row) => {
      const profile = row.requester_id ? profileMap.get(row.requester_id) : undefined;
      if (!profile) return null;
      return {
        id: row.id,
        requester: {
          id: profile.id,
          slug: profile.slug_uuid,
          name: profile.name,
          headline: profile.headline,
          company: profile.company,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const sent = (sentRequests ?? [])
    .map((row) => {
      const profile = row.recipient_id ? profileMap.get(row.recipient_id) : undefined;
      if (!profile) return null;
      return {
        id: row.id,
        recipient: {
          id: profile.id,
          slug: profile.slug_uuid,
          name: profile.name,
          headline: profile.headline,
          company: profile.company,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-3">
        <p className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Tu red</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mis conexiones</h1>
        <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
          Guarda notas privadas y gestiona tus solicitudes. Solo tú puedes ver esta información.
        </p>
        {!requiresApproval && (
          <p className="text-xs text-muted-foreground">
            Las conexiones se aprueban automáticamente para agilizar el contacto durante el evento.
          </p>
        )}
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const href = tab.key === "todos" ? "/conexiones" : `/conexiones?tab=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition active:scale-95 ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:border-primary/50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "todos" && (
        <section className="space-y-4">
          {connections.length === 0 ? (
            <Card className="border border-dashed border-primary/20">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Todavía no tienes conexiones. Escanea un código QR o envía una solicitud desde el directorio.
              </CardContent>
            </Card>
          ) : (
            connections.map((connection) => (
              <div
                key={connection.id}
                className="space-y-3 sm:space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {connection.peer.name}
                    </p>
                    {connection.peer.headline && (
                      <p className="text-sm text-muted-foreground">
                        {connection.peer.headline}
                      </p>
                    )}
                    {connection.peer.company && (
                      <p className="text-xs text-muted-foreground">
                        {connection.peer.company}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/perfil/${connection.peer.slug_uuid}`}
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    Ver perfil
                  </Link>
                </div>
                <ConnectionNoteForm
                  peerId={connection.peerId}
                  initialNote={connection.note}
                  initialTags={connection.tags}
                />
              </div>
            ))
          )}
        </section>
      )}

      {activeTab === "pendientes" && (
        <section className="space-y-4">
          {pending.length === 0 ? (
            <Card className="border border-dashed border-primary/20">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No tienes solicitudes pendientes por aprobar.
              </CardContent>
            </Card>
          ) : (
            pending.map((request) => (
              <PendingRequestCard
                key={request.id}
                requestId={request.id}
                requester={request.requester}
              />
            ))
          )}
        </section>
      )}

      {activeTab === "enviadas" && (
        <section className="space-y-4">
          {sent.length === 0 ? (
            <Card className="border border-dashed border-primary/20">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No tienes solicitudes enviadas en espera.
              </CardContent>
            </Card>
          ) : (
            sent.map((request) => (
              <SentRequestCard key={request.id} recipient={request.recipient} />
            ))
          )}
        </section>
      )}
    </div>
  );
}
