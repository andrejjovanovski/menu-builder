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
        price: `$${item.price.toFixed(2)}`,
        image: item.image_url
    }))

    // Hardcoded section groupings (will come from menu-builder later)
    // For now, we'll display all categories with first one open, rest collapsed
    const firstCategory = categoriesWithItems[0]
    const otherCategories = categoriesWithItems.slice(1)

    return (
        <div className="min-h-screen bg-background">
            {/* Subtle background texture */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

            <div className="relative container max-w-4xl mx-auto px-6 py-8">
                <MenuHero title={restaurant.name} subtitle={restaurant.subtitle} description={restaurant.description} />

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
                        {otherCategories.length > 0 && (
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
                                        delay={0.5 + (index * 0.1)}
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
