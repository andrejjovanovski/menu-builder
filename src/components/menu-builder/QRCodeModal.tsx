"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { Download, X, CloudUpload, CheckCircle2 } from "lucide-react";
import { uploadAsset } from "@/src/utils/uploads";

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantSlug: string;
    restaurantName: string;
}

export function QRCodeModal({ isOpen, onClose, restaurantSlug, restaurantName }: QRCodeModalProps) {
    const qrRef = useRef<SVGSVGElement>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    if (!isOpen) return null;

    // The final production URL for guests
    const menuUrl = `https://menucup.com/${restaurantSlug}`;

    // Helper to convert SVG to a High-Res Blob
    const getQRCodeBlob = async (): Promise<Blob> => {
        const svg = qrRef.current;
        if (!svg) throw new Error("SVG not found");

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        return new Promise((resolve, reject) => {
            img.onload = () => {
                canvas.width = 1200; // Extra high res for printing
                canvas.height = 1200;
                if (ctx) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    // Draw image with padding
                    ctx.drawImage(img, 100, 100, 1000, 1000);
                    canvas.toBlob((b) => b ? resolve(b) : reject("Blob error"), "image/png");
                }
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        });
    };

    // Function to download the file to the user's computer
    const handleDownload = async () => {
        try {
            const blob = await getQRCodeBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `MenuCup-QR-${restaurantSlug}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
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
            setTimeout(() => setIsSynced(false), 3000);
        } catch (error) {
            console.error("Sync error:", error);
            alert("Failed to save QR code to cloud.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>

                <h3 className="text-2xl font-black text-slate-900 mb-2">{restaurantName}</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Scan to view the digital menu</p>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 inline-block mb-8 shadow-inner">
                    <QRCodeSVG
                        ref={qrRef}
                        value={menuUrl}
                        size={220}
                        level={"H"}
                        includeMargin={false}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Download size={20} /> Download PNG
                    </button>

                    <button
                        onClick={syncQRCodeToProfile}
                        disabled={isSyncing}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all border-2 ${
                            isSynced
                                ? "bg-green-50 border-green-200 text-green-600"
                                : "bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                        }`}
                    >
                        {isSyncing ? (
                            <span className="animate-pulse">Syncing...</span>
                        ) : isSynced ? (
                            <> <CheckCircle2 size={20} /> Saved to Cloud</>
                        ) : (
                            <> <CloudUpload size={20} /> Save to Profile</>
                        )}
                    </button>
                </div>

                <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Powered by MenuCup
                </p>
            </div>
        </div>
    );
}
