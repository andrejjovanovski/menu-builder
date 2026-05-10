"use client";

import { CreditCard } from "lucide-react";
import { useDashboard } from "@/src/components/dashboard/DashboardProvider";
import { PaymentsManager } from "@/src/components/dashboard/PaymentsManager";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardDescription, CardHeader } from "@/src/components/ui/card";

export default function PaymentsPage() {
  const { restaurants, userRole, fetchPayments } = useDashboard();

  if (userRole !== "admin") {
    return (
      <div className="space-y-6">
        <Card className="max-w-3xl border-border/70 bg-card/80 backdrop-blur">
          <CardHeader>
            <Badge variant="secondary" className="uppercase tracking-widest">
              Payments
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Access restricted
            </h1>
            <CardDescription className="mt-3">
              Payments are available only to administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader>
          <Badge variant="secondary" className="uppercase tracking-widest">
            Payments
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Billing control
          </h1>
          <CardDescription className="mt-2 max-w-2xl">
            Manage expiration dates and payment status across all restaurants from one
            dedicated workspace.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex items-center gap-2 px-1">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">Billing Workspace</h2>
      </div>

      <PaymentsManager restaurants={restaurants} onPaymentsChange={fetchPayments} />
    </div>
  );
}
