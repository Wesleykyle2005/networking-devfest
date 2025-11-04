"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinFormProps {
  eventName: string;
}

export function JoinForm({ eventName }: JoinFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Ingresa el código del evento");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: trimmedCode }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Código inválido. Vuelve a intentarlo.");
        }

        setSuccess("¡Bienvenido/a a DevFest Managua 2025 - Unleashing Innovation!");
        router.replace("/perfil/editar");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No pudimos validar el código. Intenta nuevamente.";
        setError(message);
      }
    });
  };

  return (
    <Card className="max-w-md">
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-2xl">Unirse a {eventName}</CardTitle>
        <CardDescription>
          Usa el código compartido por el equipo organizador para desbloquear tu perfil y comenzar a conectar con otras personas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-code">Código del evento</Label>
            <Input
              id="event-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="DEVFEST2025"
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Verificando..." : "Confirmar acceso"}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
