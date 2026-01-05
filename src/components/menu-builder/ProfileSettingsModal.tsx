"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Mail, Lock, Eye, EyeOff, Save } from "lucide-react";

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "restaurant@menucup.com",
    password: "",
    confirmPassword: "",
  });

  const handleUpdate = () => {
    // Implement your Auth update logic here (e.g., Supabase auth.updateUser)
    console.log("Updating credentials:", formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      description="Update the login email and password for this venue."
    >
      <div className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Mail size={12} /> Login Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="email@restaurant.com"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Lock size={12} /> New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        {/* Warning Box */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
            <strong>Security Note:</strong> Changing the email or password will
            log out all current sessions for this restaurant. Make sure to
            update your saved login details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition"
          >
            Go Back
          </button>
          <button
            onClick={handleUpdate}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> Update Account
          </button>
        </div>
      </div>
    </Modal>
  );
}
