import { rgbToHex, rgbToHsl } from "@/src/utils/color-utils";

/**
 * Extract dominant brand colors from an image (typically a logo).
 *
 * Algorithm:
 *   1. Load the image with CORS so we can read its pixels.
 *   2. Downscale to a max edge of 200px for speed.
 *   3. Bucket each pixel by quantized hue (12 buckets) and lightness band
 *      (dark / mid / light), filtering out near-white, near-black, and very
 *      desaturated pixels — those are usually the logo's background.
 *   4. Return the top buckets' average colors, sorted by frequency.
 *
 * Returns an empty array if the image fails to load or canvas can't be read
 * (e.g. CORS-blocked). The caller should treat this as "no suggestions" and
 * hide the UI row, not as an error.
 */
export async function extractLogoColors(
  imageUrl: string,
  options: { maxCount?: number } = {}
): Promise<string[]> {
  const maxCount = options.maxCount ?? 4;

  if (typeof window === "undefined") return [];
  if (!imageUrl) return [];

  let img: HTMLImageElement;
  try {
    img = await loadImage(imageUrl);
  } catch {
    return [];
  }

  const targetEdge = 200;
  const scale = Math.min(
    targetEdge / Math.max(img.width, img.height, 1),
    1
  );
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, width, height);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    // Tainted canvas (CORS blocked) — give up silently.
    return [];
  }

  const data = imageData.data;
  type Bucket = { count: number; r: number; g: number; b: number };
  const buckets = new Map<string, Bucket>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;

    const [h, s, l] = rgbToHsl(r, g, b);
    // Drop near-white, near-black, and desaturated pixels (likely background or shadow).
    if (l < 10 || l > 92) continue;
    if (s < 12) continue;

    const hueBucket = Math.floor(h / 30); // 12 hue buckets
    const lightnessBucket = l < 35 ? 0 : l < 65 ? 1 : 2;
    const key = `${hueBucket}-${lightnessBucket}`;

    const existing = buckets.get(key);
    if (existing) {
      // Running average so the bucket color stays representative even as the
      // count grows.
      existing.count += 1;
      existing.r += (r - existing.r) / existing.count;
      existing.g += (g - existing.g) / existing.count;
      existing.b += (b - existing.b) / existing.count;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  if (buckets.size === 0) return [];

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxCount)
    .map(({ r, g, b }) => rgbToHex(r, g, b));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
}
