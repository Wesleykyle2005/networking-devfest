import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Syncs OAuth avatar from user metadata to Supabase storage
 * Requests higher resolution (500x500) from Google
 */
export async function syncOAuthAvatar({
  user,
  currentAvatar,
}: {
  user: { id: string; user_metadata?: Record<string, unknown> | null };
  currentAvatar?: string | null;
}) {
  if (currentAvatar) return;
  
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  let remoteUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url.length > 0 && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture.length > 0 && metadata.picture) ||
    null;

  if (!remoteUrl) return;

  // Request higher resolution from Google (500x500 instead of default 96x96)
  if (remoteUrl.includes('googleusercontent.com')) {
    remoteUrl = remoteUrl.replace(/=s\d+-c/, '=s500-c');
    // If no size parameter exists, add it
    if (!remoteUrl.includes('=s')) {
      remoteUrl = `${remoteUrl}=s500-c`;
    }
  }

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      return;
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : "jpg";

    const storagePath = `avatars/${user.id}/oauth-avatar.${extension}`;
    const serviceClient = createServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from("avatars")
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error("[syncOAuthAvatar] upload error", uploadError);
      return;
    }

    const { data: publicData } = serviceClient.storage
      .from("avatars")
      .getPublicUrl(storagePath);

    if (!publicData?.publicUrl) {
      console.error("[syncOAuthAvatar] getPublicUrl failed");
      return;
    }

    await serviceClient
      .from("profiles")
      .update({ avatar_url: publicData.publicUrl })
      .eq("id", user.id);
      
    console.log("[syncOAuthAvatar] Avatar synced successfully for user", user.id);
  } catch (error) {
    console.error("[syncOAuthAvatar] error", error);
  }
}
