import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("joined_event_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.joined_event_at) {
    redirect("/join");
  }

  redirect("/dashboard");
}
