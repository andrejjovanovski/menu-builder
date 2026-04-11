export const DIETARY_TAGS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten-Free" },
  { value: "dairy_free", label: "Dairy-Free" },
  { value: "halal", label: "Halal" },
  { value: "spicy", label: "Spicy" },
] as const;

export const ALLERGEN_TAGS = [
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "soy", label: "Soy" },
  { value: "nuts", label: "Tree Nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "shellfish", label: "Shellfish" },
  { value: "sesame", label: "Sesame" },
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number]["value"];
export type AllergenTag = (typeof ALLERGEN_TAGS)[number]["value"];

export function toTagLabel(
  value: string,
  type: "dietary" | "allergen"
) {
  const source = type === "dietary" ? DIETARY_TAGS : ALLERGEN_TAGS;
  return source.find((tag) => tag.value === value)?.label || value;
}
