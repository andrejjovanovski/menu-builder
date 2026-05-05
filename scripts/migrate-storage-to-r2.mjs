// Copy storage objects from Supabase Storage (public buckets) to Cloudflare R2,
// then rewrite image_url columns on Neon to point at R2.
//
// Usage:
//   node scripts/migrate-storage-to-r2.mjs --dry-run
//   node scripts/migrate-storage-to-r2.mjs

import dotenv from "dotenv";
import { Pool } from "pg";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

dotenv.config({ path: ".env.migration" });

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const NEON_DB_URL = process.env.NEON_DB_URL;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL_BASE;
const DRY_RUN = process.argv.includes("--dry-run");

const required = {
  SUPABASE_DB_URL,
  NEON_DB_URL,
  R2_ENDPOINT,
  R2_BUCKET,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_URL_BASE,
};
for (const [k, v] of Object.entries(required)) {
  if (!v) {
    console.error(`Missing required env: ${k}`);
    process.exit(1);
  }
}

const SOURCE_BUCKETS = ["menu-items", "restaurant-assets"];
const SUPABASE_PUBLIC_PREFIX =
  "https://syzyajetjjkbmhluzjxk.supabase.co/storage/v1/object/public";
const CONCURRENCY = 5;

const sourcePool = new Pool({
  connectionString: SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const targetPool = new Pool({
  connectionString: NEON_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function listObjects() {
  const { rows } = await sourcePool.query(
    `SELECT bucket_id, name, metadata
     FROM storage.objects
     WHERE bucket_id = ANY($1::text[])
     ORDER BY bucket_id, name`,
    [SOURCE_BUCKETS]
  );
  return rows;
}

async function existsOnR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound") {
      return false;
    }
    throw err;
  }
}

async function copyOne(obj) {
  const key = `${obj.bucket_id}/${obj.name}`;
  const sourceUrl = `${SUPABASE_PUBLIC_PREFIX}/${obj.bucket_id}/${encodeURI(obj.name)}`;

  if (await existsOnR2(key)) {
    return { key, status: "skipped-exists" };
  }

  const res = await fetch(sourceUrl);
  if (!res.ok) {
    return {
      key,
      status: "failed",
      reason: `download ${res.status}: ${sourceUrl}`,
    };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType =
    obj.metadata?.mimetype ||
    res.headers.get("content-type") ||
    "application/octet-stream";

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: contentType,
    })
  );
  return { key, status: "uploaded", bytes: buf.length };
}

async function runWithConcurrency(items, fn, n) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        const r = await fn(items[idx], idx);
        results[idx] = r;
      } catch (err) {
        results[idx] = {
          key: `${items[idx].bucket_id}/${items[idx].name}`,
          status: "failed",
          reason: err.message,
        };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function rewriteUrls(client) {
  const newPrefix = R2_PUBLIC_URL_BASE.replace(/\/+$/, "");
  const oldPrefix = SUPABASE_PUBLIC_PREFIX;

  console.log(`\nRewriting URLs: ${oldPrefix}/<bucket>/<key>`);
  console.log(`            -> ${newPrefix}/<bucket>/<key>`);

  const updates = [
    { table: "restaurants", col: "logo_url" },
    { table: "restaurants", col: "background_image_url" },
    { table: "restaurants", col: "qr_code_url" },
    { table: "menu_items", col: "image_url" },
  ];

  for (const { table, col } of updates) {
    const { rowCount } = await client.query(
      `UPDATE ${table}
       SET ${col} = REPLACE(${col}, $1, $2)
       WHERE ${col} LIKE $3`,
      [oldPrefix, newPrefix, `${oldPrefix}%`]
    );
    console.log(`  ${table}.${col}: ${rowCount} rows updated`);
  }
}

async function listR2Count() {
  let count = 0;
  let token;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: token,
      })
    );
    count += res.KeyCount || 0;
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return count;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "WRITE"}`);
  console.log(`R2 bucket: ${R2_BUCKET}`);
  console.log(`R2 endpoint: ${R2_ENDPOINT}`);
  console.log(`R2 public URL base: ${R2_PUBLIC_URL_BASE}`);

  const objects = await listObjects();
  const byBucket = objects.reduce((acc, o) => {
    acc[o.bucket_id] = (acc[o.bucket_id] || 0) + 1;
    return acc;
  }, {});
  console.log(`\nSource objects: ${objects.length}`);
  for (const [b, n] of Object.entries(byBucket)) {
    console.log(`  ${b}: ${n}`);
  }

  if (DRY_RUN) {
    console.log(`\nDry run — no uploads, no DB writes.`);
    return;
  }

  console.log(`\nCopying ${objects.length} objects to R2 (concurrency=${CONCURRENCY})...`);
  const start = Date.now();
  const results = await runWithConcurrency(objects, copyOne, CONCURRENCY);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const summary = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`\nUpload summary (${elapsed}s):`);
  for (const [s, n] of Object.entries(summary)) {
    console.log(`  ${s}: ${n}`);
  }
  const failed = results.filter((r) => r.status === "failed");
  if (failed.length) {
    console.log(`\nFailures:`);
    for (const f of failed) console.log(`  ${f.key} -> ${f.reason}`);
    throw new Error(`${failed.length} object(s) failed to copy — aborting before URL rewrite.`);
  }

  const r2Count = await listR2Count();
  console.log(`\nR2 object count: ${r2Count}`);

  const client = await targetPool.connect();
  try {
    await client.query("BEGIN");
    await rewriteUrls(client);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  console.log(`\nStorage migration complete.`);
}

main()
  .catch((err) => {
    console.error("Storage migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sourcePool.end();
    await targetPool.end();
  });
