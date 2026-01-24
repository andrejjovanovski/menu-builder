"use client";

import { motion } from 'framer-motion'
import MenuHero from '@/src/components/public-menu/MenuHero'
import MenuSection from '@/src/components/public-menu/MenuSection'
import { MenuItem, MenuCategory, Restaurant } from '@/src/types'

interface CategoryWithItems extends MenuCategory {
    items: MenuItem[]
}

interface RestaurantMenuClientProps {
    categoriesWithItems: CategoryWithItems[]
    restaurant: Restaurant
}

export default function RestaurantMenuClient({ categoriesWithItems, restaurant }: RestaurantMenuClientProps) {
    // Helper function to transform items for MenuSection
    const transformItems = (items: MenuItem[]) => items.map(item => ({
        name: item.name,
        description: item.description || '',
        price: `${item.price.toFixed(0)} ден.`,
        image: item.image_url,
        is_available: item.is_available,
    }))

    // Hardcoded section groupings (will come from menu-builder later)
    // For now, we'll display all categories with first one open, rest collapsed
    const firstCategory = categoriesWithItems[0]
    const otherCategories = categoriesWithItems.slice(1)

    const isVisualMode = restaurant.appearance === 'visual';

    return (
        <div
            className="min-h-screen text-foreground transition-colors duration-500"
            style={
                {
                    // Use CSS variables for colors
                    '--background': restaurant.background_color || '#161412',
                    '--accent': restaurant.accent_color || '#d4af37',
                    '--card': restaurant.card_bg_color || '#211f1c',
                    '--foreground': restaurant.text_color || '#211f1c',
                    '--muted-foreground': restaurant.muted_text_color || '#211f1c',

                    // Handle Background logic cleanly
                    backgroundColor: 'var(--background)',
                    ...(isVisualMode ? {
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${restaurant.background_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed',
                        backgroundRepeat: 'no-repeat'
                    } : {})
                } as React.CSSProperties
            }
        >
            {/* Subtle background texture */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none" />

            <div className="relative container max-w-4xl mx-auto px-6 py-8">
                <MenuHero title={restaurant.name} subtitle={restaurant.subtitle} slogan={restaurant.slogan} estYear={restaurant.est_year} logoImage={restaurant.logo_url}/>

                {/*<div className="border-t border-border my-8" />*/}

                {categoriesWithItems.length > 0 ? (
                    <>
                        {/* First category - default open */}
                        {/*{firstCategory && (*/}
                        {/*    <>*/}
                        {/*        <motion.div*/}
                        {/*            initial={{ opacity: 0 }}*/}
                        {/*            animate={{ opacity: 1 }}*/}
                        {/*            transition={{ delay: 0.3 }}*/}
                        {/*            className="text-center mb-12"*/}
                        {/*        >*/}
                        {/*            <span className="inline-block px-4 py-2 border border-accent/30 text-accent text-xs tracking-[0.2em] uppercase">*/}
                        {/*                Featured*/}
                        {/*            </span>*/}
                        {/*        </motion.div>*/}
                        {/*        <MenuSection*/}
                        {/*            title={firstCategory.name}*/}
                        {/*            items={transformItems(firstCategory.items)}*/}
                        {/*            delay={0.2}*/}
                        {/*            defaultOpen={true}*/}
                        {/*        />*/}
                        {/*    </>*/}
                        {/*)}*/}

                        {/* Other categories - default collapsed */}
                        {categoriesWithItems.length > 0 && (
                            <>
                                <div className="border-t border-border/50 my-8" />

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-center mb-8"
                                >
                                    <span className="inline-block px-4 py-2 border border-accent/30 text-accent text-xs tracking-[0.2em] uppercase">
                                        Menu
                                    </span>
                                </motion.div>

                                {categoriesWithItems.map((category, index) => (
                                    <MenuSection
                                        key={category.id}
                                        title={category.name}
                                        items={transformItems(category.items)}
                                        delay={0.03 + (index * 0.1)}
                                        defaultOpen={index === 0}
                                    />
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-muted-foreground mt-8"
                    >
                        No menu items available.
                    </motion.p>
                )}

                {/* Footer */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-16 pt-8 border-t border-border text-center"
                >
                    <p className="text-muted-foreground text-sm mb-2">
                        Open Tuesday – Sunday • 5pm – 2am
                    </p>
                    <p className="text-muted-foreground/60 text-xs">
                        Please drink responsibly • 21+ only
                    </p>
                </motion.footer>
            </div>
        </div>
    )
}
