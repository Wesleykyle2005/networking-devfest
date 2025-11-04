"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Edit } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface AppHeaderProps {
  profile?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    slug?: string | null;
  } | null;
}

export function AppHeader({ profile }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const initials = profile?.name?.[0] ?? profile?.email?.[0] ?? "?";
  const googleAvatar = profile?.avatarUrl;

  const navLinks = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/directorio", label: "Directorio" },
    { href: "/conexiones", label: "Conexiones" },
    { href: "/qr", label: "Mi QR" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 lg:px-8">
        <Link href="/dashboard">
          <Image
            src="/assets/devfest-logo.svg"
            alt="DevFest Managua"
            width={180}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </Link>

        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Networking official
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full border px-3 py-1.5 transition ${
                isActive(link.href)
                  ? "border-primary/50 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border border-border/60 px-3 py-1.5 text-muted-foreground transition hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5">
                <User className="h-3 w-3" />
                <span>{profile?.name?.split(' ')[0] ?? 'Cuenta'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  {(googleAvatar || profile?.avatarUrl) ? (
                    <Image
                      src={(googleAvatar || profile?.avatarUrl)!}
                      alt={profile?.name ?? profile?.email ?? "Avatar de usuario"}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {initials?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.name ?? "Invitado"}
                    </p>
                    {profile?.email && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile.email}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profile?.slug && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/perfil/${profile.slug}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Ver mi perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil/editar" className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
