import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[notifications] Error marking as read:", error);
    return NextResponse.json(
      { error: "Error al marcar como leída" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
