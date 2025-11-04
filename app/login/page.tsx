import { redirect } from "next/navigation";

interface LoginRedirectProps {
  searchParams: Promise<{
    redirect?: string;
    next?: string;
  }>;
}

export default async function LoginRedirect({ searchParams }: LoginRedirectProps) {
  const params = await searchParams;
  const redirectParam = params.redirect || params.next;
  
  if (redirectParam) {
    redirect(`/auth/login?redirect=${encodeURIComponent(redirectParam)}`);
  }
  
  redirect("/auth/login");
}
