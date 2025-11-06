"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QrBadgeProps {
  qrDataUrl: string;
  profileUrl: string;
  slug: string;
  attendeeName: string;
  attendeeHeadline?: string | null;
  attendeeCompany?: string | null;
  eventName: string;
}

export function QrBadge({
  qrDataUrl,
  profileUrl,
  slug,
  attendeeName,
  attendeeHeadline,
  attendeeCompany,
  eventName,
}: QrBadgeProps) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const subtitle = useMemo(() => {
    if (attendeeHeadline && attendeeCompany) {
      return `${attendeeHeadline} · ${attendeeCompany}`;
    }
    if (attendeeHeadline) return attendeeHeadline;
    if (attendeeCompany) return attendeeCompany;
    return null;
  }, [attendeeHeadline, attendeeCompany]);

  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);

    try {
      const response = await apiFetch("/api/qr/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "No pudimos generar el archivo.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `devfest-qr-${date}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "No pudimos descargar el QR. Intenta nuevamente.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="mx-auto max-w-sm border border-border/60 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="w-full text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {eventName}
            </p>
            <h2 className="mt-2 text-lg sm:text-xl font-semibold text-foreground">
              {attendeeName}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex aspect-square w-full max-w-[220px] sm:max-w-[240px] items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white p-3 sm:p-4 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`Código QR de ${attendeeName}`}
              className="h-full w-full"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Pide que escaneen este código para ver tu perfil. Mantén tu pantalla brillante.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3">
        <Button onClick={handleDownload} disabled={isDownloading} className="w-full sm:w-auto">
          {isDownloading ? "Generando..." : "Descargar PNG"}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">Modo pantalla completa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg border-none bg-black/90 p-4 text-white">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-base font-medium text-white">
                Ilumina tu pantalla
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-200">
                Sube el brillo al máximo para que el QR se lea rápido.
              </DialogDescription>
            </DialogHeader>
            <div className="mx-auto mt-4 flex max-w-sm flex-col items-center gap-3">
              <div className="aspect-square w-full rounded-3xl bg-white p-4 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`Código QR de ${attendeeName}`}
                  className="h-full w-full"
                />
              </div>
              <p className="text-center text-sm font-semibold text-white/90">
                {attendeeName}
              </p>
              {subtitle && (
                <p className="text-center text-xs text-neutral-300">{subtitle}</p>
              )}
              <a
                href={profileUrl}
                className="text-xs text-primary underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir perfil en el navegador
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {downloadError && (
        <p className="text-center text-sm text-red-500">{downloadError}</p>
      )}
    </div>
  );
}
