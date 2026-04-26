"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { CheckCircle2, CloudUpload, Download, Table2 } from "lucide-react";
import { uploadAsset } from "@/src/utils/uploads";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";

interface RestaurantQRCodePanelProps {
  restaurantName: string;
  restaurantSlug: string;
  callWaiterEnabled?: boolean;
}

export function RestaurantQRCodePanel({
  restaurantName,
  restaurantSlug,
  callWaiterEnabled = false,
}: RestaurantQRCodePanelProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [tableNumber, setTableNumber] = useState("");

  const baseUrl = `https://menucup.com/${restaurantSlug}`;
  const menuUrl = tableNumber.trim()
    ? `${baseUrl}?table=${encodeURIComponent(tableNumber.trim())}`
    : baseUrl;

  const getQRCodeBlob = async (): Promise<Blob> => {
    const svg = qrRef.current;
    if (!svg) throw new Error("QR code not found");

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const image = new Image();

    return new Promise((resolve, reject) => {
      image.onload = () => {
        canvas.width = 1200;
        canvas.height = 1200;
        if (!context) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 100, 100, 1000, 1000);
        canvas.toBlob((blob) => {
          if (blob) { resolve(blob); return; }
          reject(new Error("Could not create QR code image"));
        }, "image/png");
      };
      image.src =
        "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  const handleDownload = async () => {
    try {
      const blob = await getQRCodeBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const suffix = tableNumber.trim() ? `-Table${tableNumber.trim()}` : "";
      link.download = `MenuCup-QR-${restaurantSlug}${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const syncQRCodeToProfile = async () => {
    setIsSyncing(true);
    try {
      const blob = await getQRCodeBlob();
      const file = new File([blob], "qr-code.png", { type: "image/png" });
      const publicUrl = await uploadAsset(file, `restaurant-assets/${restaurantSlug}`);

      const response = await fetch(`/api/restaurants/${restaurantSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code_url: publicUrl }),
      });

      if (!response.ok) throw new Error("Failed to save QR code");

      setIsSynced(true);
      window.setTimeout(() => setIsSynced(false), 3000);
    } catch (error) {
      console.error("Sync error", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardContent className="p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              QR Access
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {restaurantName}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Generate a printable QR code that opens the live public menu for this restaurant.
            </p>

            {callWaiterEnabled && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Per-table QR code</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a table number to generate a QR code that passes the table identifier to the "Call Waiter" feature.
                </p>
                <input
                  type="text"
                  placeholder="e.g. 4 or A3"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                {tableNumber.trim() && (
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {menuUrl}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
              {!tableNumber.trim() && (
                <Button
                  onClick={syncQRCodeToProfile}
                  disabled={isSyncing}
                  variant={isSynced ? "secondary" : "outline"}
                  className={`${
                    isSynced ? "text-emerald-600 dark:text-emerald-400" : ""
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {isSyncing ? (
                    <span className="animate-pulse">Syncing...</span>
                  ) : isSynced ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Saved to Profile
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-4 w-4" />
                      Save to Profile
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-border/60 bg-background p-6 shadow-inner">
            <QRCodeSVG
              ref={qrRef}
              value={menuUrl}
              size={240}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
