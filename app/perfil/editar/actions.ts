'use server';

import { revalidatePath } from "next/cache";

import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validators/profile";

interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  slug?: string;
}

const SOCIAL_NORMALIZERS = {
  social_linkedin: {
    base: "https://www.linkedin.com/in/",
    prefixes: [
      "https://www.linkedin.com/in/",
      "https://linkedin.com/in/",
      "www.linkedin.com/in/",
      "linkedin.com/in/",
      "https://www.linkedin.com/",
      "https://linkedin.com/",
      "www.linkedin.com/",
      "linkedin.com/",
    ],
  },
  social_twitter: {
    base: "https://x.com/",
    prefixes: [
      "https://twitter.com/",
      "https://www.twitter.com/",
      "twitter.com/",
      "www.twitter.com/",
      "https://x.com/",
      "https://www.x.com/",
      "x.com/",
      "www.x.com/",
    ],
  },
  social_instagram: {
    base: "https://instagram.com/",
    prefixes: [
      "https://instagram.com/",
      "https://www.instagram.com/",
      "instagram.com/",
      "www.instagram.com/",
    ],
  },
  social_facebook: {
    base: "https://facebook.com/",
    prefixes: [
      "https://facebook.com/",
      "https://www.facebook.com/",
      "facebook.com/",
      "www.facebook.com/",
    ],
  },
} as const;

function buildSocialUrl(
  handle: string | null,
  { base, prefixes }: { base: string; prefixes: readonly string[] },
): string | null {
  if (!handle) return null;
  const trimmed = handle.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  let normalized = trimmed.replace(/^@/, "");
  const lower = normalized.toLowerCase();
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix.toLowerCase())) {
      normalized = normalized.slice(prefix.length);
      break;
    }
  }

  normalized = normalized.replace(/^\/+/, "");
  if (!normalized) return null;

  return `${base}${normalized}`;
}

export async function saveProfile(values: ProfileFormValues): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = profileFormSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { success: false, fieldErrors };
  }

  const eventConfig = getEventConfig();
  const eventId =
    eventConfig.id && eventConfig.id !== "00000000-0000-0000-0000-000000000000"
      ? eventConfig.id
      : null;

  if (!eventId) {
    return {
      success: false,
      error: "Falta configurar el evento en el entorno. Contacta al administrador.",
    };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, slug_uuid, event_id")
    .eq("id", user.id)
    .maybeSingle();

  const formData = parsed.data;

  const social_linkedin = buildSocialUrl(
    formData.social_linkedin || null,
    SOCIAL_NORMALIZERS.social_linkedin,
  );
  const social_twitter = buildSocialUrl(
    formData.social_twitter || null,
    SOCIAL_NORMALIZERS.social_twitter,
  );
  const social_instagram = buildSocialUrl(
    formData.social_instagram || null,
    SOCIAL_NORMALIZERS.social_instagram,
  );
  const social_facebook = buildSocialUrl(
    formData.social_facebook || null,
    SOCIAL_NORMALIZERS.social_facebook,
  );

  const sanitized = {
    ...formData,
    job_title: formData.job_title || null,
    social_linkedin,
    social_twitter,
    social_instagram,
    social_facebook,
    phone: formData.phone || null,
    email_public: formData.email_public || null,
    website: formData.website || null,
    avatar_url: formData.avatar_url || null,
  };

  const payload = {
    id: user.id,
    event_id: existingProfile?.event_id ?? eventId,
    ...sanitized,
  };

  const { data: savedProfile, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("slug_uuid")
    .maybeSingle();

  if (error || !savedProfile) {
    return {
      success: false,
      error:
        "No pudimos guardar tu perfil. Intenta nuevamente o contacta a soporte.",
    };
  }

  await Promise.all([
    revalidatePath("/perfil/editar"),
    revalidatePath(`/perfil/${savedProfile.slug_uuid}`),
    revalidatePath("/dashboard"),
  ]);

  return { success: true, slug: savedProfile.slug_uuid };
}
