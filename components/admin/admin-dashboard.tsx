"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, Link2, Clock, ScanLine, UserCheck, UserPlus, Activity, BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api-client";
import { AttendeesTable } from "./attendees-table";
import { ConnectionsTable } from "./connections-table";

interface AdminDashboardProps {
  eventId: string;
  eventName?: string;
}

interface Metrics {
  totalAttendees: number;
  avgProfileCompletion: number;
  totalConnections: number;
  pendingRequests: number;
  totalScans: number;
  scanSourceBreakdown: Record<string, number>;
}

export function AdminDashboard({ eventId }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await apiFetch("/api/admin/metrics");
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
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  const connectionRate = metrics.totalAttendees > 0 
    ? Math.round((metrics.totalConnections / metrics.totalAttendees) * 100)
    : 0;

  const kpis = [
    {
      title: "Total Asistentes",
      value: metrics.totalAttendees,
      icon: Users,
      description: "Perfiles registrados",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completitud Promedio",
      value: `${metrics.avgProfileCompletion}%`,
      icon: TrendingUp,
      description: "Campos completados",
      color: "text-green-600",
      bgColor: "bg-green-50",
      showProgress: true,
      progressValue: metrics.avgProfileCompletion,
    },
    {
      title: "Conexiones Activas",
      value: metrics.totalConnections,
      icon: Link2,
      description: "Conexiones establecidas",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Solicitudes Pendientes",
      value: metrics.pendingRequests,
      icon: Clock,
      description: "Esperando respuesta",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Escaneos QR",
      value: metrics.totalScans,
      icon: ScanLine,
      description: "Códigos escaneados",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Resumen General</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                  {kpi.showProgress && (
                    <Progress value={kpi.progressValue} className="h-1.5" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              Tasa de Conexión
            </CardTitle>
            <CardDescription>Conexiones por asistente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{connectionRate}%</div>
            <Progress value={connectionRate} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              Promedio Conexiones
            </CardTitle>
            <CardDescription>Por asistente activo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {metrics.totalAttendees > 0 
                ? (metrics.totalConnections / metrics.totalAttendees).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.totalConnections} conexiones totales
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-rose-600" />
              Tasa de Respuesta
            </CardTitle>
            <CardDescription>Solicitudes vs conexiones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">
              {metrics.pendingRequests > 0
                ? Math.round((metrics.totalConnections / (metrics.totalConnections + metrics.pendingRequests)) * 100)
                : 100
              }%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.pendingRequests} pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scan Source Breakdown */}
      {Object.keys(metrics.scanSourceBreakdown).length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis de Escaneos QR
            </CardTitle>
            <CardDescription>Distribución por fuente de escaneo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.scanSourceBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => {
                  const percentage = Math.round((count / metrics.totalScans) * 100);
                  return (
                    <div key={source} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{source}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tables */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Gestión de Asistentes</h2>
          <AttendeesTable eventId={eventId} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Conexiones Recientes</h2>
          <ConnectionsTable eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
