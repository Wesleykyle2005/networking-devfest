import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Fetch user's notifications (last 10, unread first)
 */
export async function GET() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Fetch notifications
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, type, actor_id, reference_id, read, created_at")
    .eq("user_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[notifications] Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }

  // Fetch actor profiles separately
  const actorIds = [...new Set(notifications?.map((n) => n.actor_id) || [])];
  const { data: actorProfiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, slug_uuid")
    .in("id", actorIds);

  // Map actors to notifications
  const actorMap = new Map(actorProfiles?.map((p) => [p.id, p]) || []);
  const notificationsWithActors = notifications?.map((n) => ({
    ...n,
    actor: actorMap.get(n.actor_id) ? [actorMap.get(n.actor_id)] : [],
  })) || [];

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return NextResponse.json({
    notifications: notificationsWithActors,
    unreadCount: unreadCount || 0,
  });
}
