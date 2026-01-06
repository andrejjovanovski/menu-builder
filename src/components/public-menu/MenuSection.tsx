"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface MenuItem {
    name: string;
    description: string;
    price: string;
    image?: string;
}

interface MenuSectionProps {
    title: string;
    items: MenuItem[];
    delay?: number;
    defaultOpen?: boolean;
}

const MenuSection = ({ title, items, delay = 0, defaultOpen = true }: MenuSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className="mb-8"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 group"
            >
                <h2 className="font-display text-2xl md:text-3xl text-accent tracking-wide group-hover:text-accent/80 transition-colors">
                    {title}
                </h2>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-6 h-6 text-accent/60" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pt-4">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-accent/50 transition-all duration-300"
                                >
                                    {item.image ? (
                                        <div className="aspect-square overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-muted/30 flex items-center justify-center">
                                            <span className="text-muted-foreground/40 text-4xl font-display">
                                                {item.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-3 md:p-4">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h3 className="font-display text-sm md:text-base text-foreground group-hover:text-accent transition-colors duration-300 leading-tight">
                                                {item.name}
                                            </h3>
                                            <span className="font-sans text-accent font-semibold text-sm shrink-0">
                                                {item.price}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.div>
                            )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MenuSection;