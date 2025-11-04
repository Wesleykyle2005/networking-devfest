'use server';

import { revalidatePath } from "next/cache";

import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

export async function saveConnectionNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const peerId = formData.get("peerId");
  if (typeof peerId !== "string" || !peerId) {
    return { error: "Falta la persona" };
  }

  const note = (formData.get("note") as string | null)?.trim() ?? "";
  const tagsValue = (formData.get("tags") as string | null)?.trim() ?? "";
  const tags = tagsValue
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const event = getEventConfig();
  if (!event.id) {
    return { error: "Evento no configurado" };
  }

  if (!note && tags.length === 0) {
    const { error } = await supabase
      .from("connection_notes")
      .delete()
      .eq("author_id", user.id)
      .eq("peer_id", peerId);

    if (error) {
      return { error: "No pudimos eliminar la nota" };
    }

    revalidatePath("/conexiones");
    return { success: true };
  }

  // Check if note exists
  const { data: existing } = await supabase
    .from("connection_notes")
    .select("id")
    .eq("author_id", user.id)
    .eq("peer_id", peerId)
    .maybeSingle();

  let error;
  if (existing) {
    // Update existing note
    const result = await supabase
      .from("connection_notes")
      .update({
        note: note || null,
        tags: tags.length ? tags : null,
      })
      .eq("id", existing.id);
    error = result.error;
  } else {
    // Insert new note
    const result = await supabase.from("connection_notes").insert({
      event_id: event.id,
      author_id: user.id,
      peer_id: peerId,
      note: note || null,
      tags: tags.length ? tags : null,
    });
    error = result.error;
  }

  if (error) {
    console.error("Error saving connection note:", error);
    return { error: "No pudimos guardar la nota" };
  }

  revalidatePath("/conexiones");
  return { success: true };
}

export async function deleteConnectionNote(peerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("connection_notes")
    .delete()
    .eq("author_id", user.id)
    .eq("peer_id", peerId);

  if (error) {
    return { error: "No pudimos eliminar la nota" };
  }

  revalidatePath("/conexiones");
  return { success: true };
}
