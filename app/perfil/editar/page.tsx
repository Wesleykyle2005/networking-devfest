import Link from "next/link";
import { redirect } from "next/navigation";

import { getEventConfig } from "@/lib/env-config";
import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "slug_uuid, name, headline, company, job_title, bio, location, social_linkedin, social_twitter, social_instagram, social_facebook, phone, email_public, website, hide_phone_until_connected, hide_email_until_connected, avatar_url"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/join");
  }

  const event = getEventConfig();

  const initialValues = {
    name: profile.name ?? "",
    headline: profile.headline ?? "",
    company: profile.company ?? "",
    job_title: profile.job_title ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    social_linkedin: profile.social_linkedin ?? "",
    social_twitter: profile.social_twitter ?? "",
    social_instagram: profile.social_instagram ?? "",
    social_facebook: profile.social_facebook ?? "",
    phone: profile.phone ?? "",
    email_public: profile.email_public ?? "",
    website: profile.website ?? "",
    hide_phone_until_connected:
      profile.hide_phone_until_connected ?? true,
    hide_email_until_connected:
      profile.hide_email_until_connected ?? true,
    avatar_url: profile.avatar_url ?? "",
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Editar perfil</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          La información que completes aparecerá en tu tarjeta pública y en el directorio de {event.name}.
          Procura mantener tu avatar en formato cuadrado para mejor presentación.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href={`/perfil/${profile.slug_uuid}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver perfil público →
          </Link>
        </div>
      </header>
      <ProfileForm initialValues={initialValues} slug={profile.slug_uuid} userId={user.id} />
    </div>
  );
}
