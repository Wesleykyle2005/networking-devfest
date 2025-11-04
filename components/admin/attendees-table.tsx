"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface AttendeesTableProps {
  eventId: string;
}

interface Attendee {
  id: string;
  name: string;
  email_public: string | null;
  company: string | null;
  job_title: string | null;
  completion_score: number;
  joined_event_at: string;
}

export function AttendeesTable({ eventId }: AttendeesTableProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchAttendees() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email_public, company, job_title, completion_score, joined_event_at")
        .eq("event_id", eventId)
        .order("joined_event_at", { ascending: false });

      if (!error && data) {
        setAttendees(data);
      }
      setIsLoading(false);
    }

    fetchAttendees();
  }, [eventId]);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["Nombre", "Email", "Empresa", "Cargo", "Completitud (%)", "Fecha de registro"];
      const rows = attendees.map((a) => [
        a.name,
        a.email_public || "",
        a.company || "",
        a.job_title || "",
        a.completion_score.toString(),
        new Date(a.joined_event_at).toLocaleDateString("es-NI"),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `asistentes-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Asistentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">
          Asistentes ({attendees.length})
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={isExporting || attendees.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="pb-3 text-left font-semibold">Nombre</th>
                <th className="pb-3 text-left font-semibold">Empresa</th>
                <th className="pb-3 text-left font-semibold">Cargo</th>
                <th className="pb-3 text-center font-semibold">Completitud</th>
                <th className="pb-3 text-left font-semibold">Registro</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee) => (
                <tr key={attendee.id} className="border-b border-border/40">
                  <td className="py-3">{attendee.name}</td>
                  <td className="py-3 text-muted-foreground">{attendee.company || "—"}</td>
                  <td className="py-3 text-muted-foreground">{attendee.job_title || "—"}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        attendee.completion_score >= 80
                          ? "bg-green-500/10 text-green-600"
                          : attendee.completion_score >= 50
                            ? "bg-yellow-500/10 text-yellow-600"
                            : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {attendee.completion_score}%
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(attendee.joined_event_at).toLocaleDateString("es-NI")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
