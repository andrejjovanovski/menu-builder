"use client";

import { QrCode } from "lucide-react";
import { DashboardShell } from "@/src/components/dashboard/DashboardShell";
import { RestaurantQRCodePanel } from "@/src/components/dashboard/RestaurantQRCodePanel";
import { Restaurant } from "@/src/types";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardDescription, CardHeader } from "@/src/components/ui/card";

function QRPageContent({ selectedRestaurant }: { selectedRestaurant: Restaurant }) {
  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader>
          <Badge variant="secondary" className="uppercase tracking-widest">
            QR Codes
          </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {selectedRestaurant.name}
        </h1>
        <CardDescription className="mt-2 max-w-2xl">
          Download or sync the official QR code that points guests directly to the
          live menu.
        </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex items-center gap-2 px-1">
        <QrCode className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">
          QR Workspace
        </h2>
      </div>

      <RestaurantQRCodePanel
        restaurantName={selectedRestaurant.name}
        restaurantSlug={selectedRestaurant.slug}
        callWaiterEnabled={selectedRestaurant.call_waiter_enabled ?? false}
      />
    </div>
  );
}

export default function QRPage() {
  return (
    <DashboardShell section="qr">
      {({ selectedRestaurant }) => <QRPageContent selectedRestaurant={selectedRestaurant!} />}
    </DashboardShell>
  );
}
