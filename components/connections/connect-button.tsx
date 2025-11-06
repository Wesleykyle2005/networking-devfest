"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type ConnectionState = "idle" | "pending" | "connected";

type InitialState = ConnectionState | "self" | "guest";

interface ConnectButtonProps {
  profileSlug: string;
  profileId: string;
  initialState: InitialState;
  requiresApproval: boolean;
  loginHref: string;
}

export function ConnectButton({
  profileSlug,
  profileId,
  initialState,
  requiresApproval,
  loginHref,
}: ConnectButtonProps) {
  const [state, setState] = useState<ConnectionState | "self" | "guest">(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (state === "self") {
    return null;
  }

  if (state === "guest") {
    return (
      <Button asChild>
        <Link href={loginHref}>Inicia sesión para conectar</Link>
      </Button>
    );
  }

  const labelMap: Record<ConnectionState, string> = {
    idle: "Solicitar conexión",
    pending: "Solicitud enviada",
    connected: "Ya están conectados",
  };

  const disabled = state === "pending" || state === "connected" || isLoading;

  const handleClick = async () => {
    if (disabled) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const response = await apiFetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: profileSlug, profileId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body.error ?? "No pudimos enviar la solicitud.";
        setFeedback(message);
        return;
      }

      const body = (await response.json()) as { status?: ConnectionState };
      const nextState = body.status ?? (requiresApproval ? "pending" : "connected");
      setState(nextState);
      if (nextState === "connected") {
        setFeedback("Ahora están conectados ✨");
      } else if (nextState === "pending") {
        setFeedback("Solicitud enviada. Espera la aprobación.");
      }
    } catch {
      setFeedback("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleClick} disabled={disabled}>
        {isLoading ? "Enviando..." : labelMap[state as ConnectionState]}
      </Button>
      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
    </div>
  );
}
