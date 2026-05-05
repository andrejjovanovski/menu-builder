"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, Clock, Receipt, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Restaurant, TableRequest } from "@/src/types";

const POLL_INTERVAL_MS = 15_000;

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function RequestsContent({ selectedRestaurant }: { selectedRestaurant: Restaurant }) {
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/table-requests`
      );
      if (!res.ok) return;
      const data: TableRequest[] = await res.json();
      setRequests(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant.slug]);

  useEffect(() => {
    void fetchRequests();
    intervalRef.current = setInterval(() => void fetchRequests(), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRequests]);

  const handleDismiss = async (id: string) => {
    setDismissing((prev) => new Set(prev).add(id));
    try {
      await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/table-requests/${id}`,
        { method: "PATCH" }
      );
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    } finally {
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (!selectedRestaurant.call_waiter_enabled) {
    return (
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardContent className="p-12 text-center">
          <BellRing className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="text-lg font-semibold">Call Waiter is disabled</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Enable it in Settings to let customers signal staff from the public menu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="h-5 w-5 text-primary" />
              Live Table Requests
            </CardTitle>
            <CardDescription className="mt-1">
              Refreshes every 15 seconds. Only pending requests are shown.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{requests.length} pending</Badge>
            <Button variant="outline" size="sm" onClick={() => void fetchRequests()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500/60" />
              <p className="text-sm font-semibold text-muted-foreground">
                All clear — no pending requests
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {req.request_type === "call_waiter" ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                          <BellRing className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                          <Receipt className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold">
                          {req.request_type === "call_waiter" ? "Call Waiter" : "Ask for Bill"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {req.table_identifier ? `Table ${req.table_identifier}` : "No table info"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeAgo(req.created_at)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDismiss(req.id)}
                      disabled={dismissing.has(req.id)}
                      className="h-7 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <DashboardShell section="requests">
      {({ selectedRestaurant }) => (
        <RequestsContent selectedRestaurant={selectedRestaurant!} />
      )}
    </DashboardShell>
  );
}
