"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/src/types";

export interface CategoryGridCategory extends MenuCategory {
  items: MenuItem[];
}

interface Props {
  categories: CategoryGridCategory[];
  onSelect: (categoryId: string) => void;
}

export default function CategoryGrid({ categories, onSelect }: Props) {
  if (categories.length === 0) {
    return (
      <p className="mt-12 text-center text-muted-foreground">
        No categories available yet.
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-8 grid grid-cols-1 gap-4"
    >
      {categories.map((category, index) => {
        const itemCount = category.items.length;
        return (
          <motion.button
            key={category.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(category.id)}
            className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-[var(--card)]/70 text-left shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-accent/10">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, color-mix(in oklab, var(--accent) 25%, transparent), color-mix(in oklab, var(--accent) 5%, transparent))",
                  }}
                >
                  <span className="px-4 text-center text-lg font-semibold text-foreground/80">
                    {category.name}
                  </span>
                </div>
              )}
              {/* Bottom gradient for legibility */}
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold text-white drop-shadow-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs font-medium text-white/80">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-transform group-hover:translate-x-0.5">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
