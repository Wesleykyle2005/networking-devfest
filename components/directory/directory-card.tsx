"use client";

import Link from "next/link";
import { useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface DirectoryCardProps {
  profile: {
    id: string;
    slug: string;
    name: string;
    headline?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
  };
}

export function DirectoryCard({ profile }: DirectoryCardProps) {
  const handleClick = useCallback(() => {
    const body = JSON.stringify({ profileId: profile.id, source: "directory" as const });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/scans", blob);
        return;
      }
    } catch {
      // ignore and fallback
    }

    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* noop */
    });
  }, [profile.id]);

  return (
    <Link
      href={`/perfil/${profile.slug}`}
      prefetch={false}
      onClick={handleClick}
      className="block"
    >
      <Card className="h-full transition active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="flex gap-3 sm:gap-4 p-4 sm:p-5">
          <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                {profile.name.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-foreground truncate">{profile.name}</p>
            {profile.headline && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{profile.headline}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
              {profile.company && (
                <span className="rounded-full bg-muted px-2 py-1 uppercase tracking-wide">
                  {profile.company}
                </span>
              )}
              {profile.jobTitle && <span>{profile.jobTitle}</span>}
              {profile.location && (
                <span className="text-muted-foreground/70">{profile.location}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
