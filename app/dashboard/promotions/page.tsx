"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useDashboard } from "@/src/components/dashboard/DashboardProvider";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/Modal";
import { Toast, type ToastType } from "@/src/components/ui/Toast";
import { uploadAsset } from "@/src/utils/uploads";
import type {
  Promotion,
  PromotionDisplayFrequency,
  PromotionStatus,
  Restaurant,
} from "@/src/types";

interface PromotionFormState {
  image_url: string;
  duration_seconds: number;
  valid_until: string; // datetime-local format
  status: PromotionStatus;
  display_frequency: PromotionDisplayFrequency;
}

const DEFAULT_FORM: PromotionFormState = {
  image_url: "",
  duration_seconds: 5,
  valid_until: "",
  status: "active",
  display_frequency: "once_per_session",
};

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function PromotionsContent({ selectedRestaurant }: { selectedRestaurant: Restaurant }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionFormState>(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${selectedRestaurant.slug}/promotions`);
      if (!res.ok) {
        showToast("Failed to load promotions", "error");
        return;
      }
      const data: Promotion[] = await res.json();
      setPromotions(data);
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant.slug, showToast]);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setForm({
      image_url: promo.image_url,
      duration_seconds: promo.duration_seconds,
      valid_until: isoToLocalInput(promo.valid_until),
      status: promo.status,
      display_frequency: promo.display_frequency,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!editingId && !imageFile && !form.image_url) {
      showToast("Please select an image", "error");
      return;
    }
    if (!form.duration_seconds || form.duration_seconds <= 0) {
      showToast("Duration must be greater than 0", "error");
      return;
    }
    const validUntilIso = localInputToIso(form.valid_until);
    if (!validUntilIso) {
      showToast("Pick a valid expiry date/time", "error");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        imageUrl = await uploadAsset(imageFile, `promotions/${selectedRestaurant.id}`);
      }

      const payload = {
        image_url: imageUrl,
        duration_seconds: Math.floor(form.duration_seconds),
        valid_until: validUntilIso,
        status: form.status,
        display_frequency: form.display_frequency,
      };

      const url = editingId
        ? `/api/restaurants/${selectedRestaurant.slug}/promotions/${editingId}`
        : `/api/restaurants/${selectedRestaurant.slug}/promotions`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }

      const saved: Promotion = await res.json();
      setPromotions((prev) => {
        if (editingId) {
          return prev.map((p) => (p.id === saved.id ? saved : p));
        }
        return [saved, ...prev];
      });
      showToast(editingId ? "Promotion updated" : "Promotion created", "success");
      setModalOpen(false);
      setImageFile(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!window.confirm("Delete this promotion?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/promotions/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        showToast("Delete failed", "error");
        return;
      }
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      showToast("Promotion deleted", "success");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    const next: PromotionStatus = promo.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(
        `/api/restaurants/${selectedRestaurant.slug}/promotions/${promo.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      if (!res.ok) {
        showToast("Update failed", "error");
        return;
      }
      const saved: Promotion = await res.json();
      setPromotions((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    } catch {
      showToast("Update failed", "error");
    }
  };

  const sortedPromotions = useMemo(
    () =>
      [...promotions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [promotions]
  );

  return (
    <>
      <Card className="border-border/70 bg-card/80 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-primary" />
              Promotions
            </CardTitle>
            <CardDescription className="mt-1">
              Pop-up promotions shown once per visitor session on the public menu.
            </CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" />
            New Promotion
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
              Loading promotions...
            </div>
          ) : sortedPromotions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">No promotions yet</p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                Create one to start showing pop-ups to your customers.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPromotions.map((promo) => {
                const expired = new Date(promo.valid_until).getTime() <= Date.now();
                return (
                  <div
                    key={promo.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promo.image_url}
                      alt="Promotion"
                      className="aspect-video w-full object-cover bg-muted"
                    />
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={promo.status === "active" ? "default" : "secondary"}>
                          {promo.status}
                        </Badge>
                        {expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {promo.duration_seconds}s
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Valid until {formatExpiry(promo.valid_until)}
                      </p>
                      <div className="mt-auto flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleToggleStatus(promo)}
                        >
                          {promo.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(promo)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === promo.id}
                          onClick={() => void handleDelete(promo.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Promotion" : "New Promotion"}
        description="Customers see this as a pop-up when they open the menu."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Image</label>
            {form.image_url && !imageFile && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt="Current promotion"
                className="aspect-video w-full rounded-lg object-cover bg-muted"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Display duration (seconds)</label>
              <Input
                type="number"
                min="1"
                value={form.duration_seconds}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    duration_seconds: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Dismiss button is locked for this many seconds.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Valid until</label>
              <Input
                type="datetime-local"
                value={form.valid_until}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, valid_until: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, status: "active" }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.status === "active"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, status: "inactive" }))}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.status === "inactive"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Display frequency</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, display_frequency: "once_per_session" }))
                }
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.display_frequency === "once_per_session"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                Once per session
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, display_frequency: "every_load" }))
                }
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.display_frequency === "every_load"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                Every page load
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {form.display_frequency === "once_per_session"
                ? "Each visitor sees this once per browsing session."
                : "Pops up every time the menu is opened or refreshed."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save changes" : "Create promotion"}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default function PromotionsPage() {
  const { selectedRestaurant } = useDashboard();
  if (!selectedRestaurant) return null;
  return <PromotionsContent selectedRestaurant={selectedRestaurant} />;
}
