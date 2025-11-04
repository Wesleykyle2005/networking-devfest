"use client";

import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BulkInviteResults {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  details: {
    success: string[];
    failed: { email: string; reason: string }[];
    skipped: { email: string; reason: string }[];
  };
}

export function BulkInviteForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkInviteResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Por favor selecciona un archivo CSV");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const parseCSV = async (file: File): Promise<string[]> => {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Remove header if it exists
    const emails: string[] = [];
    for (const line of lines) {
      // Handle CSV with commas or just plain list
      const parts = line.split(',').map(p => p.trim());
      for (const part of parts) {
        // Basic email validation
        if (part.includes('@') && !part.toLowerCase().includes('email')) {
          emails.push(part);
        }
      }
    }
    
    return [...new Set(emails)]; // Remove duplicates
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const emails = await parseCSV(file);
      
      if (emails.length === 0) {
        setError("No se encontraron emails válidos en el archivo");
        setIsProcessing(false);
        return;
      }

      if (emails.length > 500) {
        setError("Máximo 500 emails por archivo. Tu archivo tiene " + emails.length);
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/invitations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar invitaciones");
      }

      setResults(data.results);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Invitación masiva por CSV
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Sube un archivo CSV con emails (uno por línea o separados por comas). Máximo 500 emails.{" "}
          <a 
            href="/sample-invitations.csv" 
            download 
            className="text-primary hover:underline font-medium"
          >
            Descargar plantilla
          </a>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-3">
            <label
              htmlFor="csv-file"
              className="flex items-center justify-center w-full h-32 px-4 transition bg-muted border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/50 focus:outline-none"
            >
              <div className="flex flex-col items-center space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Haz clic para seleccionar archivo CSV"}
                </span>
              </div>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    const fileInput = document.getElementById('csv-file') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Procesando..." : "Enviar invitaciones"}
          </Button>
        </form>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Proceso completado</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-semibold">{results.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Enviadas:</span>
                <span className="ml-2 font-semibold text-green-600">{results.sent}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Omitidas:</span>
                <span className="ml-2 font-semibold text-yellow-600">{results.skipped}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fallidas:</span>
                <span className="ml-2 font-semibold text-red-600">{results.failed}</span>
              </div>
            </div>

            {results.details.failed.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-red-600">
                  Ver emails fallidos ({results.details.failed.length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {results.details.failed.map((item, i) => (
                    <li key={i} className="text-muted-foreground">
                      {item.email}: {item.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {results.details.skipped.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-yellow-600">
                  Ver emails omitidos ({results.details.skipped.length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {results.details.skipped.map((item, i) => (
                    <li key={i} className="text-muted-foreground">
                      {item.email}: {item.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-md">
          <p className="font-semibold">Formato del CSV:</p>
          <p>• Una dirección de email por línea</p>
          <p>• O separadas por comas: email1@example.com, email2@example.com</p>
          <p>• Las invitaciones expiran en 30 días</p>
        </div>
      </CardContent>
    </Card>
  );
}
