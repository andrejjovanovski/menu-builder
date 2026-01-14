"use client";

import { useState } from "react";
import { UtensilsCrossed, LogOut, Menu, X } from "lucide-react";
import { Restaurant } from "@/src/types";
import { CreateRestaurantForm } from "../forms/CreateRestaurantForm";
import { UserRole } from "@/src/types";

interface Props {
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (r: Restaurant) => void;
  onRefresh: () => void;
  onLogout: () => void;
  userRole: UserRole;
}

export function MenuSidebar({
  restaurants,
  selectedId,
  onSelect,
  onRefresh,
  onLogout,
  userRole,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {!isOpen && (
          <Menu className="w-6 h-6 text-slate-600" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-white border-r border-slate-200 flex flex-col fixed md:relative top-0 h-screen overflow-hidden transition-transform duration-300 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Menu Studio
              </h2>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {userRole === "admin" && (
            <CreateRestaurantForm onCreate={onRefresh} className="mt-6" />
          )}
        </div>

        {/* Middle Section: Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {userRole === "admin" ? "All" : "My"} Restaurants
          </p>
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSelect(r);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                selectedId === r.id
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{r.name}</span>
              {selectedId === r.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Section: Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 transition-colors group-hover:text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
