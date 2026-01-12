"use client";

import {motion} from "framer-motion";
import Image from "next/image";

interface MenuHeroProps {
    title?: string,
    subtitle?: string,
    slogan?: string
    estYear?: string,
    logoImage?: string
}

const MenuHero = ({ title, subtitle, slogan, estYear, logoImage }: MenuHeroProps) => {
    return (
        <div className="relative overflow-hidden py-16 text-center md:py-24">
            {logoImage ? (
                /* --- Case 1: Display Logo Image --- */
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    <div className="relative mb-6 h-32 w-32 md:h-48 md:w-48">
                        <Image
                            alt="priew"
                            src={logoImage}
                            fill
                            className="object-contain rounded-full w-full"
                            priority
                        />
                    </div>
                    <p className="mx-auto max-w-md text-lg italic text-accent">
                        {slogan}
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* --- Case 2: Display Custom Text Logo --- */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10"
                    >
                        <div className="mb-4">
                            <span className="text-sm uppercase tracking-[0.3em] text-accent">
                              Est. {estYear}
                            </span>
                        </div>
                        <h1 className="font-display mb-4 text-5xl text-foreground md:text-7xl lg:text-8xl">
                            {title}
                        </h1>
                        <div className="mb-6 flex items-center justify-center gap-4">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent" />
                            <span className="text-lg uppercase tracking-widest text-accent">
                          {subtitle}
                        </span>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent" />
                        </div>
                        <p className="mx-auto max-w-md text-lg text-muted-foreground">
                            {slogan}
                        </p>
                    </motion.div>

                    {/* Decorative Background Pulse (Always Visible) */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-64 w-64 animate-pulse rounded-full border border-accent/10 md:h-96 md:w-96" />
                    </div>
                </>
            )}
        </div>
    );
};

export default MenuHero;
