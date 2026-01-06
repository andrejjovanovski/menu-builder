"use client";

import {motion} from "framer-motion";

interface MenuHeroProps {
    title?: string,
    subtitle?: string,
    description?: string
}

const MenuHero = ({title, subtitle, description}: MenuHeroProps) => {
    return (
        <div className="relative py-16 md:py-24 text-center">
            <motion.div
                initial={{opacity: 0, scale: 0.9}}
                animate={{opacity: 1, scale: 1}}
                transition={{duration: 0.8}}
                className="relative z-10"
            >
                <div className="mb-4">
                    <span className="text-accent text-sm tracking-[0.3em] uppercase">Est. 2024</span>
                </div>
                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground mb-4">
                    {title}
                </h1>
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-px w-16 bg-linear-to-r from-transparent to-accent"/>
                    <span className="text-accent text-lg tracking-widest">COCKTAIL BAR</span>
                    <div className="h-px w-16 bg-linear-to-l from-transparent to-accent"/>
                </div>
                <p className="text-muted-foreground max-w-md mx-auto text-lg">
                    Crafted cocktails & curated spirits in an intimate setting
                </p>
            </motion.div>

            {/* Decorative elements */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 md:w-96 md:h-96 rounded-full border border-accent/10 animate-pulse"/>
            </div>
        </div>
    );
};

export default MenuHero;
