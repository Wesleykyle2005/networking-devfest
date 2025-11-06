"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

interface PendingRequestCardProps {
  requestId: string;
  requester: {
    id: string;
    slug: string;
    name: string;
    headline?: string | null;
    company?: string | null;
  };
}

export function PendingRequestCard({ requestId, requester }: PendingRequestCardProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (endpoint: "approve" | "decline") => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/connections/requests/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Algo salió mal");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-foreground">{requester.name}</p>
        {requester.headline && (
          <p className="text-xs text-muted-foreground">{requester.headline}</p>
        )}
        {requester.company && (
          <p className="text-xs text-muted-foreground">{requester.company}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href={`/perfil/${requester.slug}`} className="underline underline-offset-4">
          Ver perfil
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => handleAction("approve")}
          disabled={isProcessing}
        >
          Aprobar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAction("decline")}
          disabled={isProcessing}
        >
          Rechazar
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
