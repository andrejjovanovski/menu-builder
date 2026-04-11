"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Payment, Restaurant, PaymentStatus } from "@/src/types";
import { getPaymentDisplayStatus, PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from "@/src/utils/paymentStatus";

interface PaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  onPaymentsChange?: () => void;
}

export function PaymentsModal({ isOpen, onClose, restaurants, onPaymentsChange }: PaymentsModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newRestaurantId, setNewRestaurantId] = useState("");
  const [newExpiration, setNewExpiration] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newStatus, setNewStatus] = useState<PaymentStatus>("active");

  const [editExpiration, setEditExpiration] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<PaymentStatus>("active");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantId || !newExpiration) return;
    setAdding(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: newRestaurantId,
          expiration_date: newExpiration,
          notes: newNotes || null,
          status: newStatus,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setPayments((prev) => [created, ...prev]);
        setNewRestaurantId("");
        setNewExpiration("");
        setNewNotes("");
        setNewStatus("active");
        onPaymentsChange?.();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiration_date: editExpiration,
          notes: editNotes,
          status: editStatus,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
        setEditingId(null);
        onPaymentsChange?.();
      }
    } catch {}
  };

  const startEdit = (p: Payment) => {
    setEditingId(p.id);
    setEditExpiration(p.expiration_date.slice(0, 10));
    setEditNotes(p.notes || "");
    setEditStatus(p.status);
  };

  const restaurantName = (id: string) => restaurants.find((r) => r.id === id)?.name ?? id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage payments" description="Add and edit payments for restaurants (admin only).">
      <div className="space-y-6">
        {/* Add payment form */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add payment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Restaurant</label>
              <select
                value={newRestaurantId}
                onChange={(e) => setNewRestaurantId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                required
              >
                <option value="">Select...</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Expiration date</label>
              <input
                type="date"
                value={newExpiration}
                onChange={(e) => setNewExpiration(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="mt-5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add payment
            </button>
          </div>
        </form>

        {/* List */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-3">Payments</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No payments yet. Add one above.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {payments.map((p) => {
                const displayStatus = getPaymentDisplayStatus(p);
                const isEditing = editingId === p.id;
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${PAYMENT_STATUS_COLORS[displayStatus]}`}
                      title={PAYMENT_STATUS_LABELS[displayStatus]}
                    />
                    <span className="font-medium text-slate-900 truncate min-w-0">
                      {restaurantName(p.restaurant_id)}
                    </span>
                    <span className="text-slate-500 text-sm">
                      Exp: {p.expiration_date.slice(0, 10)}
                    </span>
                    {p.notes && (
                      <span className="text-slate-500 text-sm truncate max-w-[120px]" title={p.notes}>
                        {p.notes}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          displayStatus === "active"
                            ? "rgb(236 253 245)"
                            : displayStatus === "expires_soon"
                              ? "rgb(255 247 237)"
                              : displayStatus === "expired"
                                ? "rgb(254 226 226)"
                                : "rgb(241 245 249)",
                        color:
                          displayStatus === "active"
                            ? "rgb(6 95 70)"
                            : displayStatus === "expires_soon"
                              ? "rgb(154 52 18)"
                              : displayStatus === "expired"
                                ? "rgb(185 28 28)"
                                : "rgb(30 41 59)",
                      }}
                    >
                      {PAYMENT_STATUS_LABELS[displayStatus]}
                    </span>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="ml-auto p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                        aria-label="Edit payment"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-full flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        <input
                          type="date"
                          value={editExpiration}
                          onChange={(e) => setEditExpiration(e.target.value)}
                          className="px-2 py-1.5 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes"
                          className="px-2 py-1.5 border rounded-lg text-sm flex-1 min-w-0"
                        />
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as PaymentStatus)}
                          className="px-2 py-1.5 border rounded-lg text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="canceled">Canceled</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleUpdate(p.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-slate-600 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
