import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const [, , emailArg, ...rest] = process.argv;
const email = emailArg ?? "andrejjovanovski001@gmail.com";
const restaurantNameArg = rest.join(" ").trim();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const CATEGORIES = [
  {
    name: "Starters",
    items: [
      {
        name: "Bruschetta Trio",
        description: "Toasted sourdough with tomato, olive tapenade, and goat cheese.",
        price: 240,
        dietary: ["vegetarian"],
        allergens: ["gluten", "dairy"],
        flags: { is_best_seller: true },
      },
      {
        name: "Crispy Calamari",
        description: "Lightly battered squid rings with lemon aioli.",
        price: 320,
        dietary: [],
        allergens: ["gluten", "eggs", "shellfish"],
        flags: { is_trending: true },
      },
      {
        name: "Stuffed Peppers",
        description: "Roasted red peppers with feta and herbs.",
        price: 220,
        dietary: ["vegetarian", "gluten_free"],
        allergens: ["dairy"],
        flags: {},
      },
      {
        name: "Beef Carpaccio",
        description: "Thin sliced raw beef, arugula, parmesan, truffle oil.",
        price: 380,
        dietary: ["gluten_free"],
        allergens: ["dairy"],
        flags: {},
      },
      {
        name: "Hummus Plate",
        description: "House-made hummus with warm pita and olives.",
        price: 200,
        dietary: ["vegan", "vegetarian"],
        allergens: ["gluten", "sesame"],
        flags: { is_new: true },
      },
      {
        name: "Spicy Shrimp Skewers",
        description: "Chili-glazed prawns with garlic butter.",
        price: 360,
        dietary: ["spicy", "gluten_free"],
        allergens: ["shellfish", "dairy"],
        flags: {},
      },
    ],
  },
  {
    name: "Pizzas",
    items: [
      {
        name: "Margherita",
        description: "San Marzano tomatoes, fresh mozzarella, basil.",
        price: 320,
        dietary: ["vegetarian"],
        allergens: ["gluten", "dairy"],
        flags: { is_best_seller: true },
      },
      {
        name: "Quattro Formaggi",
        description: "Mozzarella, gorgonzola, parmesan, smoked cheese.",
        price: 380,
        dietary: ["vegetarian"],
        allergens: ["gluten", "dairy"],
        flags: {},
      },
      {
        name: "Diavola",
        description: "Spicy salami, chili oil, mozzarella.",
        price: 360,
        dietary: ["spicy"],
        allergens: ["gluten", "dairy"],
        flags: { is_trending: true },
      },
      {
        name: "Prosciutto e Funghi",
        description: "Cured ham, mushrooms, mozzarella.",
        price: 370,
        dietary: [],
        allergens: ["gluten", "dairy"],
        flags: {},
      },
      {
        name: "Truffle & Mushroom",
        description: "Wild mushrooms, truffle cream, mozzarella, arugula.",
        price: 420,
        dietary: ["vegetarian"],
        allergens: ["gluten", "dairy"],
        flags: { is_new: true },
      },
      {
        name: "Vegan Garden",
        description: "Tomato base, grilled vegetables, vegan cheese.",
        price: 350,
        dietary: ["vegan", "vegetarian"],
        allergens: ["gluten", "soy"],
        flags: {},
      },
    ],
  },
  {
    name: "Burgers",
    items: [
      {
        name: "Classic Cheeseburger",
        description: "200g beef patty, cheddar, lettuce, tomato, house sauce.",
        price: 380,
        dietary: [],
        allergens: ["gluten", "dairy", "eggs"],
        flags: { is_best_seller: true },
      },
      {
        name: "Smoked BBQ Burger",
        description: "Beef, smoked bacon, caramelized onion, BBQ glaze.",
        price: 420,
        dietary: [],
        allergens: ["gluten", "dairy", "eggs"],
        flags: {},
      },
      {
        name: "Crispy Chicken Burger",
        description: "Buttermilk-fried chicken, slaw, pickles.",
        price: 360,
        dietary: [],
        allergens: ["gluten", "dairy", "eggs"],
        flags: { is_trending: true },
      },
      {
        name: "Spicy Jalapeño Burger",
        description: "Beef, pepper jack, jalapeños, chipotle aioli.",
        price: 410,
        dietary: ["spicy"],
        allergens: ["gluten", "dairy", "eggs"],
        flags: {},
      },
      {
        name: "Veggie Black Bean",
        description: "Black bean patty, avocado, lettuce, tahini.",
        price: 340,
        dietary: ["vegetarian", "vegan"],
        allergens: ["gluten", "sesame"],
        flags: {},
      },
      {
        name: "Truffle Mushroom Burger",
        description: "Beef, sautéed mushrooms, gruyere, truffle mayo.",
        price: 460,
        dietary: [],
        allergens: ["gluten", "dairy", "eggs"],
        flags: { is_new: true },
      },
    ],
  },
  {
    name: "Cocktails",
    items: [
      {
        name: "Aperol Spritz",
        description: "Aperol, prosecco, soda, orange.",
        price: 260,
        dietary: ["vegan", "gluten_free"],
        allergens: [],
        flags: { is_best_seller: true },
      },
      {
        name: "Espresso Martini",
        description: "Vodka, espresso, coffee liqueur.",
        price: 290,
        dietary: ["vegan", "gluten_free"],
        allergens: [],
        flags: { is_trending: true },
      },
      {
        name: "Mojito Classico",
        description: "White rum, lime, mint, sugar, soda.",
        price: 250,
        dietary: ["vegan", "gluten_free"],
        allergens: [],
        flags: {},
      },
      {
        name: "Old Fashioned",
        description: "Bourbon, bitters, sugar, orange peel.",
        price: 320,
        dietary: ["vegan", "gluten_free"],
        allergens: [],
        flags: {},
      },
      {
        name: "Spicy Margarita",
        description: "Tequila, lime, agave, jalapeño-infused triple sec.",
        price: 300,
        dietary: ["spicy", "vegan", "gluten_free"],
        allergens: [],
        flags: { is_new: true },
      },
      {
        name: "Lavender Gin Fizz",
        description: "Gin, lemon, lavender syrup, egg white, soda.",
        price: 310,
        dietary: ["vegetarian"],
        allergens: ["eggs"],
        flags: {},
      },
    ],
  },
  {
    name: "Desserts",
    items: [
      {
        name: "Tiramisu",
        description: "Mascarpone, espresso-soaked ladyfingers, cocoa.",
        price: 220,
        dietary: ["vegetarian"],
        allergens: ["gluten", "dairy", "eggs"],
        flags: { is_best_seller: true },
      },
      {
        name: "Molten Chocolate Cake",
        description: "Warm chocolate fondant with vanilla ice cream.",
        price: 240,
        dietary: ["vegetarian"],
        allergens: ["gluten", "dairy", "eggs", "soy"],
        flags: { is_trending: true },
      },
      {
        name: "Crème Brûlée",
        description: "Vanilla custard with caramelized sugar crust.",
        price: 230,
        dietary: ["vegetarian", "gluten_free"],
        allergens: ["dairy", "eggs"],
        flags: {},
      },
      {
        name: "Pistachio Panna Cotta",
        description: "Silky cream pudding with pistachio crumble.",
        price: 250,
        dietary: ["vegetarian"],
        allergens: ["dairy", "nuts"],
        flags: { is_new: true },
      },
      {
        name: "Vegan Berry Cheesecake",
        description: "Cashew-based cheesecake with mixed berry compote.",
        price: 240,
        dietary: ["vegan", "vegetarian", "gluten_free"],
        allergens: ["nuts"],
        flags: {},
      },
      {
        name: "Affogato",
        description: "Vanilla gelato drowned in fresh espresso.",
        price: 180,
        dietary: ["vegetarian", "gluten_free"],
        allergens: ["dairy"],
        flags: {},
      },
    ],
  },
];

async function main() {
  const userResult = await pool.query(
    'select id, email from "user" where email = $1 limit 1',
    [email]
  );

  const owner = userResult.rows[0];
  if (!owner) {
    console.error(`No user found with email ${email}. Create one first or pass a different email.`);
    process.exit(1);
  }

  const stamp = Date.now().toString(36);
  const baseName = restaurantNameArg || `Demo Bar & Kitchen ${stamp}`;
  const slug = `${slugify(baseName)}-${stamp}`;
  const restaurantId = randomUUID();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `insert into restaurants (
        id, name, slug, subtitle, description, owner_id,
        appearance, slogan, footer_quote, open_hours,
        recommendation_ai_enabled, menu_filters_enabled, feedback_enabled,
        smart_highlights_enabled, call_waiter_enabled
      ) values (
        $1, $2, $3, $4, $5, $6,
        'visual', $7, $8, $9,
        true, true, true,
        true, true
      )`,
      [
        restaurantId,
        baseName,
        slug,
        "Cafe • Bar • Kitchen",
        "A cozy spot for sharing plates, signature cocktails, and stone-baked pizzas.",
        owner.id,
        "Pour. Share. Repeat.",
        "Made with love, served with care.",
        "Mon–Sun · 10:00 – 00:00",
      ]
    );

    let categoryOrder = 0;
    let totalItems = 0;

    for (const category of CATEGORIES) {
      const categoryId = randomUUID();
      categoryOrder += 1;

      await client.query(
        `insert into menu_categories (id, restaurant_id, name, slug, "order")
         values ($1, $2, $3, $4, $5)`,
        [categoryId, restaurantId, category.name, slugify(category.name), categoryOrder]
      );

      let itemOrder = 0;
      for (const item of category.items) {
        itemOrder += 1;
        totalItems += 1;
        const flags = item.flags ?? {};

        await client.query(
          `insert into menu_items (
            id, category_id, restaurant_id, name, description, price,
            dietary_tags, allergen_tags, is_available,
            is_best_seller, is_new, is_trending, "order"
          ) values (
            $1, $2, $3, $4, $5, $6,
            $7::jsonb, $8::jsonb, true,
            $9, $10, $11, $12
          )`,
          [
            randomUUID(),
            categoryId,
            restaurantId,
            item.name,
            item.description,
            item.price,
            JSON.stringify(item.dietary ?? []),
            JSON.stringify(item.allergens ?? []),
            Boolean(flags.is_best_seller),
            Boolean(flags.is_new),
            Boolean(flags.is_trending),
            itemOrder,
          ]
        );
      }
    }

    await client.query(
      `insert into payments (id, restaurant_id, expiration_date, status, notes)
       values ($1, $2, current_date + interval '1 year', 'active', 'demo seed')`,
      [randomUUID(), restaurantId]
    );

    await client.query("COMMIT");

    console.log("Demo restaurant seeded:");
    console.log(`  Name:     ${baseName}`);
    console.log(`  Slug:     ${slug}`);
    console.log(`  Owner:    ${owner.email}`);
    console.log(`  Categories: ${CATEGORIES.length}`);
    console.log(`  Items:    ${totalItems}`);
    console.log(`  Public URL: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${slug}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await main();
} finally {
  await pool.end();
}
