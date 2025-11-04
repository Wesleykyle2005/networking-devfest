"use client";

import Link from "next/link";

interface SentRequestCardProps {
  recipient: {
    id: string;
    slug: string;
    name: string;
    headline?: string | null;
    company?: string | null;
  };
}

export function SentRequestCard({ recipient }: SentRequestCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-foreground">{recipient.name}</p>
        {recipient.headline && (
          <p className="text-xs text-muted-foreground">{recipient.headline}</p>
        )}
        {recipient.company && (
          <p className="text-xs text-muted-foreground">{recipient.company}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href={`/perfil/${recipient.slug}`} className="underline underline-offset-4">
          Ver perfil
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Esperando aprobación.
      </p>
    </div>
  );
}
