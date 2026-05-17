import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

// --- Types ---

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: string;
    image?: string;
    is_available?: boolean;
    is_best_seller?: boolean;
    is_new?: boolean;
    is_trending?: boolean;
}

interface MenuSectionProps {
    title: string;
    items: MenuItem[];
    delay?: number;
    defaultOpen?: boolean;
    hideHeader?: boolean;
    onItemWithImageClick?: (item: MenuItem) => void;
}

// --- Helpers ---

function HighlightBadge({ item }: { item: MenuItem }) {
    if (item.is_trending) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-300 border border-orange-500/30">
                🔥 Trending
            </span>
        );
    }
    if (item.is_best_seller) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                ⭐ Best Seller
            </span>
        );
    }
    if (item.is_new) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                ✨ New
            </span>
        );
    }
    return null;
}

// --- Sub-components ---

const MenuItemCard = ({
    item,
    onItemWithImageClick,
}: {
    item: MenuItem;
    onItemWithImageClick?: (item: MenuItem) => void;
}) => {
    const isAvailable = item.is_available !== false;
    const isClickable = typeof onItemWithImageClick === "function";

    // Visual style for items WITH images (clickable → opens bottom sheet)
    if (item.image) {
        const content = (
            <>
                <div className="relative">
                    <div className={`aspect-square overflow-hidden ${!isAvailable ? "grayscale blur-[2px]" : ""}`}>
                        <Image
                            width={400}
                            height={400}
                            src={item.image}
                            alt={item.name}
                            sizes="(min-width: 768px) 33vw, 50vw"
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
                        <h3 className="menu-font-display text-sm leading-tight text-foreground transition-colors duration-300 group-hover:text-accent md:text-base">
                            {item.name}
                        </h3>
                        <span className="shrink-0 menu-font-body text-sm font-semibold text-accent">
                            {item.price}
                        </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                        {item.description}
                    </p>
                    <div className="mt-2">
                        <HighlightBadge item={item} />
                    </div>
                </div>
            </>
        );

        if (isClickable) {
            return (
                <button
                    type="button"
                    onClick={() => onItemWithImageClick(item)}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-card text-left transition-all duration-300 hover:border-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                    {content}
                </button>
            );
        }

        return (
            <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card">
                {content}
            </div>
        );
    }

    // Visual style for items WITHOUT images (Text-only)
    return (
        <div
            className={`group col-span-2 md:col-span-3 ${!isAvailable ? "opacity-60" : ""}`}
        >
            <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="menu-font-display text-lg text-foreground transition-colors duration-300 group-hover:text-accent md:text-xl">
                        {item.name}
                    </h3>
                    {!isAvailable && (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            Coming Soon
                        </span>
                    )}
                </div>
                <div className="mb-1 flex-1 border-b border-dashed border-muted-foreground/30" />
                <span className="menu-font-body font-medium text-accent">{item.price}</span>
            </div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {item.description}
            </p>
            <div className="mt-1.5">
                <HighlightBadge item={item} />
            </div>
        </div>
    );
};

// --- Main Component ---

const MenuSection = ({ title, items, delay = 0, defaultOpen = true, hideHeader = false, onItemWithImageClick }: MenuSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Group items: Images first, then text-only
    const sortedItems = useMemo(() => {
        const withImages = items.filter((item) => !!item.image);
        const withoutImages = items.filter((item) => !item.image);
        return [...withImages, ...withoutImages];
    }, [items]);

    if (hideHeader) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay }}
                className="mb-8"
            >
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                    {sortedItems.map((item) => (
                        <MenuItemCard
                            key={item.id}
                            item={item}
                            onItemWithImageClick={onItemWithImageClick}
                        />
                    ))}
                </div>
            </motion.div>
        );
    }

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
                <h2 className="menu-font-display text-2xl tracking-wide text-accent transition-colors group-hover:text-accent/80 md:text-3xl">
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
                            {sortedItems.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    onItemWithImageClick={onItemWithImageClick}
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
