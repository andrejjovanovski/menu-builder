"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Payment, PaymentStatus, Restaurant, SubscriptionTier } from "@/src/types";
import {
  getPaymentDisplayStatus,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/src/utils/paymentStatus";

interface PaymentsManagerProps {
  restaurants: Restaurant[];
  onPaymentsChange?: () => void;
}

export function PaymentsManager({
  restaurants,
  onPaymentsChange,
}: PaymentsManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newRestaurantId, setNewRestaurantId] = useState("");
  const [newExpiration, setNewExpiration] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newStatus, setNewStatus] = useState<PaymentStatus>("active");
  const [newTier, setNewTier] = useState<SubscriptionTier>("pro");

  const [editExpiration, setEditExpiration] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<PaymentStatus>("active");
  const [editTier, setEditTier] = useState<SubscriptionTier>("pro");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) {
        throw new Error("Failed to load payments");
      }

      const data = (await response.json()) as Payment[];
      setPayments(data);
    } catch (error) {
      console.error("Failed to load payments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayments();
  }, []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRestaurantId || !newExpiration) {
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: newRestaurantId,
          expiration_date: newExpiration,
          notes: newNotes || null,
          status: newStatus,
          tier: newTier,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment");
      }

      const created = (await response.json()) as Payment;
      setPayments((current) => [created, ...current]);
      setNewRestaurantId("");
      setNewExpiration("");
      setNewNotes("");
      setNewStatus("active");
      setNewTier("pro");
      onPaymentsChange?.();
    } catch (error) {
      console.error("Failed to add payment", error);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiration_date: editExpiration,
          notes: editNotes,
          status: editStatus,
          tier: editTier,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment");
      }

      const updated = (await response.json()) as Payment;
      setPayments((current) => current.map((payment) => (payment.id === id ? updated : payment)));
      setEditingId(null);
      onPaymentsChange?.();
    } catch (error) {
      console.error("Failed to update payment", error);
    }
  };

  const startEdit = (payment: Payment) => {
    setEditingId(payment.id);
    setEditExpiration(payment.expiration_date.slice(0, 10));
    setEditNotes(payment.notes || "");
    setEditStatus(payment.status);
    const restaurant = restaurants.find((r) => r.id === payment.restaurant_id);
    setEditTier(restaurant?.subscription_tier ?? "pro");
  };

  const restaurantName = (id: string) =>
    restaurants.find((restaurant) => restaurant.id === id)?.name ?? id;

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
          <Plus className="h-4 w-4 text-indigo-600" />
          Add Payment
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Restaurant
            </label>
            <select
              value={newRestaurantId}
              onChange={(event) => setNewRestaurantId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              required
            >
              <option value="">Select restaurant</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Expiration date
            </label>
            <input
              type="date"
              value={newExpiration}
              onChange={(event) => setNewExpiration(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              required
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Notes
            </label>
            <textarea
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Optional notes"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Status
            </label>
            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as PaymentStatus)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="canceled">Canceled</option>
            </select>
            <label className="mt-4 mb-1 block text-xs font-semibold text-slate-500">
              Tier
            </label>
            <select
              value={newTier}
              onChange={(event) => setNewTier(event.target.value as SubscriptionTier)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
            <button
              type="submit"
              disabled={adding}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save payment
            </button>
          </div>
        </div>
      </form>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Payment History</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : payments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No payments yet.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {payments.map((payment) => {
              const displayStatus = getPaymentDisplayStatus(payment);
              const isEditing = editingId === payment.id;

              return (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`h-3 w-3 rounded-full ${PAYMENT_STATUS_COLORS[displayStatus]}`}
                      title={PAYMENT_STATUS_LABELS[displayStatus]}
                    />
                    <p className="font-semibold text-slate-900">
                      {restaurantName(payment.restaurant_id)}
                    </p>
                    <span className="text-sm text-slate-500">
                      Exp: {payment.expiration_date.slice(0, 10)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                      {PAYMENT_STATUS_LABELS[displayStatus]}
                    </span>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(payment)}
                        className="ml-auto rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-indigo-600"
                        aria-label="Edit payment"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {payment.notes && !isEditing && (
                    <p className="mt-2 text-sm text-slate-500">{payment.notes}</p>
                  )}

                  {isEditing && (
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 md:grid-cols-[auto_1fr_auto_auto_auto]">
                      <input
                        type="date"
                        value={editExpiration}
                        onChange={(event) => setEditExpiration(event.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Notes"
                      />
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value as PaymentStatus)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="canceled">Canceled</option>
                      </select>
                      <select
                        value={editTier}
                        onChange={(event) => setEditTier(event.target.value as SubscriptionTier)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleUpdate(payment.id)}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
