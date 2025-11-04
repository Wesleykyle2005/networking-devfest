"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface ConnectionsTableProps {
  eventId: string;
}

interface Connection {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  user_a_name?: string;
  user_b_name?: string;
}

export function ConnectionsTable({ eventId }: ConnectionsTableProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchConnections() {
      const supabase = createClient();
      
      // Fetch connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("connections")
        .select("id, user_a_id, user_b_id, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (connectionsError || !connectionsData) {
        setIsLoading(false);
        return;
      }

      // Get all unique user IDs
      const userIds = new Set<string>();
      connectionsData.forEach((conn) => {
        userIds.add(conn.user_a_id);
        userIds.add(conn.user_b_id);
      });

      // Fetch user names
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profilesData?.map((p) => [p.id, p.name]) || []);

      // Merge data
      const enrichedConnections = connectionsData.map((conn) => ({
        ...conn,
        user_a_name: profileMap.get(conn.user_a_id),
        user_b_name: profileMap.get(conn.user_b_id),
      }));

      setConnections(enrichedConnections);
      setIsLoading(false);
    }

    fetchConnections();
  }, [eventId]);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["Usuario A", "Usuario B", "Fecha de conexión"];
      const rows = connections.map((c) => [
        c.user_a_name || c.user_a_id,
        c.user_b_name || c.user_b_id,
        new Date(c.created_at).toLocaleDateString("es-NI"),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `conexiones-${new Date().toISOString().split("T")[0]}.csv`;
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
          <CardTitle className="text-lg font-semibold">Conexiones recientes</CardTitle>
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
          Conexiones recientes ({connections.length})
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={isExporting || connections.length === 0}
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
                <th className="pb-3 text-left font-semibold">Usuario A</th>
                <th className="pb-3 text-left font-semibold">Usuario B</th>
                <th className="pb-3 text-left font-semibold">Fecha de conexión</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((connection) => (
                <tr key={connection.id} className="border-b border-border/40">
                  <td className="py-3">{connection.user_a_name || "Usuario desconocido"}</td>
                  <td className="py-3">{connection.user_b_name || "Usuario desconocido"}</td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(connection.created_at).toLocaleDateString("es-NI", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
