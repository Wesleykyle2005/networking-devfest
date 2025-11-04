import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export async function POST() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("[notifications] Error marking all as read:", error);
    return NextResponse.json(
      { error: "Error al marcar todas como leídas" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
