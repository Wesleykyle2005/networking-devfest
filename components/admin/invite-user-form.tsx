"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus({
        type: "error",
        message: "Por favor ingresa un email válido",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await apiFetch("/api/invitations/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar invitación");
      }

      setStatus({
        type: "success",
        message: `Invitación enviada exitosamente a ${email}`,
      });
      setEmail("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Invitar usuario</h3>
        <p className="text-sm text-muted-foreground">
          Envía una invitación por email para unirse al evento
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar invitación"
            )}
          </Button>
        </div>

        {status.type && (
          <div
            className={`flex items-center gap-2 rounded-md p-3 text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-900"
                : "bg-red-50 text-red-900"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>{status.message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
