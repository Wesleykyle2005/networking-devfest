"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, Link2, Clock, ScanLine } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendeesTable } from "./attendees-table";
import { ConnectionsTable } from "./connections-table";

interface AdminDashboardProps {
  eventId: string;
  eventName: string;
}

interface Metrics {
  totalAttendees: number;
  avgProfileCompletion: number;
  totalConnections: number;
  pendingRequests: number;
  totalScans: number;
  scanSourceBreakdown: Record<string, number>;
}

export function AdminDashboard({ eventId, eventName }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch("/api/admin/metrics");
        if (!response.ok) {
          throw new Error("Error al cargar métricas");
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Cargando métricas...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">{error || "No se pudieron cargar las métricas"}</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total de asistentes",
      value: metrics.totalAttendees,
      icon: Users,
      description: "Perfiles registrados",
    },
    {
      title: "Completitud de perfiles",
      value: `${metrics.avgProfileCompletion}%`,
      icon: TrendingUp,
      description: "Promedio de campos completados",
    },
    {
      title: "Conexiones totales",
      value: metrics.totalConnections,
      icon: Link2,
      description: "Conexiones mutuas establecidas",
    },
    {
      title: "Solicitudes pendientes",
      value: metrics.pendingRequests,
      icon: Clock,
      description: "Esperando aprobación",
    },
    {
      title: "Escaneos de QR",
      value: metrics.totalScans,
      icon: ScanLine,
      description: "Total de códigos escaneados",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scan Source Breakdown */}
      {Object.keys(metrics.scanSourceBreakdown).length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Escaneos por fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(metrics.scanSourceBreakdown).map(([source, count]) => (
                <div key={source} className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{source}:</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendees Table */}
      <AttendeesTable eventId={eventId} />

      {/* Connections Table */}
      <ConnectionsTable eventId={eventId} />
    </div>
  );
}
