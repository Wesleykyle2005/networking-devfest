import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const email = searchParams.get("email");
  const next = searchParams.get("next") ?? "/join";
  let type = searchParams.get("type") as EmailOtpType | null;

  if (!type && (tokenHash || token)) {
    type = "magiclink";
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error?.message ?? "No pudimos validar el código recibido.")}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error?.message ?? "El enlace ya expiró. Pide uno nuevo.")}`);
  }

  if (token && type && email) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token,
      email,
    });
    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error?.message ?? "El enlace ya expiró. Pide uno nuevo.")}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next);
  }

  redirect(`/auth/error?error=${encodeURIComponent("No pudimos validar tu sesión. Solicita otro enlace.")}`);
}
