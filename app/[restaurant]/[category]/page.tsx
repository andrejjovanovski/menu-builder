import { redirect } from "next/navigation";

// Legacy deep-link route. The public menu now lives entirely at /[restaurant]
// with in-page drill-in for categories, so we redirect to the menu root.
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ restaurant: string; category: string }>;
}) {
  const { restaurant } = await params;
  redirect(`/${restaurant}`);
}
