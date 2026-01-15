"use client";

import { Pencil, Trash2 } from "lucide-react";
import { MenuItem } from "@/src/types";
import Image from "next/image";
import { motion } from "framer-motion";

interface Props {
    item: MenuItem;
    categoryName?: string;
    onDelete: (id: string) => void;
    onEdit: (item: MenuItem) => void;
    index: number;
}

export function ItemCard({ item, categoryName, onDelete, onEdit, index }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            className="group bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 sm:p-4 hover:bg-white hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
        >
            {/* Mobile Layout */}
            <div className="flex flex-col sm:hidden gap-3">
                <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        {item.image_url ? (
                            <Image
                                src={item.image_url}
                                alt={item.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">🍽️</div>
                        )}
                    </div>

                    {/* Title & Category Badge */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base text-slate-900 font-bold leading-tight truncate">
                            {item.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                          {categoryName || "Uncategorized"}
                        </span>
                    </div>

                    {/* Price */}
                    <span className="text-lg text-indigo-600 font-bold flex-shrink-0">
            {Number(item.price).toFixed(0)} ден.
          </span>
                </div>

                {/* Description & Action Buttons Row */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-50">
                    <p className="text-slate-500 text-xs flex-1 truncate">
                        {item.description}
                    </p>
                    <div className="flex gap-1 flex-shrink-0">
                        <button
                            onClick={() => onEdit(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            aria-label="Edit item"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            aria-label="Delete item"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-4">
                {/* Thumbnail with Hover Zoom */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 relative">
                    {item.image_url ? (
                        <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl">🍽️</div>
                    )}
                </div>

                {/* Item Information */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg text-slate-900 font-bold">{item.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {categoryName || "Uncategorized"}
            </span>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-1">{item.description}</p>
                </div>

                {/* Pricing & Hidden Actions (Revealed on Hover) */}
                <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-xl text-indigo-600 font-black">
            {Number(item.price).toFixed(0)} ден.
          </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={() => onEdit(item)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                            aria-label="Edit item"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            aria-label="Delete item"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}