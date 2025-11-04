import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

import { PendingRequestCard } from "@/components/connections/pending-request-card";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getEventConfig } from "@/lib/env-config";

export async function PendingContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const event = getEventConfig();

  const { data: inboundRequests } = await supabase
    .from("connection_requests")
    .select("id, requester_id, created_at")
    .eq("event_id", event.id)
    .eq("recipient_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requesterIds = inboundRequests?.map((r) => r.requester_id) ?? [];
  const requesters: Map<string, {
    id: string;
    slug_uuid: string;
    name: string;
    headline?: string | null;
    company?: string | null;
    avatar_url?: string | null;
  }> = new Map();

  if (requesterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, slug_uuid, name, headline, company, avatar_url")
      .in("id", requesterIds);

    profiles?.forEach((p) => requesters.set(p.id, p));
  }

  const requests = inboundRequests?.map((req) => {
    const profile = requesters.get(req.requester_id);
    return {
      requestId: req.id,
      requester: {
        id: req.requester_id,
        slug: profile?.slug_uuid ?? "",
        name: profile?.name ?? "Usuario",
        headline: profile?.headline,
        company: profile?.company,
      },
    };
  }) ?? [];

  if (requests.length === 0) {
    return (
      <Card className="border border-dashed border-primary/20">
        <CardContent className="p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">No tienes solicitudes pendientes</h3>
          <p className="text-sm text-muted-foreground">
            Las solicitudes de conexión que recibas aparecerán aquí
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {requests.length} {requests.length === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
      </p>
      <div className="grid gap-3 sm:gap-4">
        {requests.map((request) => (
          <PendingRequestCard
            key={request.requestId}
            requestId={request.requestId}
            requester={request.requester}
          />
        ))}
      </div>
    </div>
  );
}
