import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const event = getEventConfig();
  if (!event.id) {
    return NextResponse.json({ error: "Evento no configurado" }, { status: 500 });
  }

  try {
    // Total attendees
    const { count: totalAttendees } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    // Profile completion stats
    const { data: profiles } = await supabase
      .from("profiles")
      .select("completion_score")
      .eq("event_id", event.id);

    const avgCompletion = profiles?.length
      ? Math.round(
          profiles.reduce((sum, p) => sum + (p.completion_score || 0), 0) / profiles.length,
        )
      : 0;

    // Total connections
    const { count: totalConnections } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    // Pending connection requests
    const { count: pendingRequests } = await supabase
      .from("connection_requests")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "pending");

    // Total scans
    const { count: totalScans } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    // Scans by source
    const { data: scansBySource } = await supabase
      .from("scans")
      .select("source")
      .eq("event_id", event.id);

    const scanSourceBreakdown = scansBySource?.reduce(
      (acc, scan) => {
        acc[scan.source] = (acc[scan.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      totalAttendees: totalAttendees || 0,
      avgProfileCompletion: avgCompletion,
      totalConnections: totalConnections || 0,
      pendingRequests: pendingRequests || 0,
      totalScans: totalScans || 0,
      scanSourceBreakdown: scanSourceBreakdown || {},
    });
  } catch (error) {
    console.error("[admin/metrics] Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Error al obtener métricas" },
      { status: 500 },
    );
  }
}
