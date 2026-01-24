import React, {useMemo, useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

// --- Types ---

interface MenuItem {
    name: string;
    description: string;
    price: string;
    image?: string;
    is_available?: boolean;
}

interface MenuSectionProps {
    title: string;
    items: MenuItem[];
    delay?: number;
    defaultOpen?: boolean;
}

// --- Sub-components ---

const MenuItemCard = ({ item, index, delay }: { item: MenuItem; index: number; delay: number }) => {
    const isAvailable = item.is_available !== false;

    // Visual style for items WITH images
    if (item.image) {
        return (
            <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-accent/50"
            >
                <div className="relative">
                    <div className={`aspect-square overflow-hidden ${!isAvailable ? "grayscale blur-[2px]" : ""}`}>
                        <Image
                            width={400} // Increased for better quality
                            height={400}
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
              <span className="rounded-full bg-accent/90 px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-lg">
                Coming Soon
              </span>
                        </div>
                    )}
                </div>

                <div className="p-3 md:p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm leading-tight text-foreground transition-colors duration-300 group-hover:text-accent md:text-base">
                            {item.name}
                        </h3>
                        <span className="shrink-0 font-sans text-sm font-semibold text-accent">
                          {item.price}
                        </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                        {item.description}
                    </p>
                </div>
            </motion.div>
        );
    }

    // Visual style for items WITHOUT images (Text-only)
    return (
        <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: delay + index * 0.1 }}
            className="group col-span-2 md:col-span-3"
        >
            <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-lg text-foreground transition-colors duration-300 group-hover:text-accent md:text-xl">
                    {item.name}
                </h3>
                <div className="mb-1 flex-1 border-b border-dashed border-muted-foreground/30" />
                <span className="font-sans font-medium text-accent">{item.price}</span>
            </div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {item.description}
            </p>
        </motion.div>
    );
};

// --- Main Component ---

const MenuSection = ({ title, items, delay = 0, defaultOpen = true }: MenuSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Group items: Images first, then text-only
    const sortedItems = useMemo(() => {
        const withImages = items.filter((item) => !!item.image);
        const withoutImages = items.filter((item) => !item.image);
        return [...withImages, ...withoutImages];
    }, [items]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className="mb-8"
        >
            {/* Accordion Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex w-full items-center justify-between py-3"
            >
                <h2 className="font-display text-2xl tracking-wide text-accent transition-colors group-hover:text-accent/80 md:text-3xl">
                    {title}
                </h2>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="h-6 w-6 text-accent/60" />
                </motion.div>
            </button>

            {/* Accordion Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-3 md:gap-6">
                            {sortedItems.map((item, index) => (
                                <MenuItemCard
                                    key={item.name}
                                    item={item}
                                    index={index}
                                    delay={delay}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MenuSection;