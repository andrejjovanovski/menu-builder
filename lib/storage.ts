import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const requiredKeys = [
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

function getMissingStorageConfig() {
  return requiredKeys.filter((key) => !process.env[key]);
}

function getStorageClient() {
  const missing = getMissingStorageConfig();
  if (missing.length > 0) {
    throw new Error(`Missing S3 configuration: ${missing.join(", ")}`);
  }

  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

export function buildStorageKey(prefix: string, filename: string) {
  const ext = filename.includes(".") ? filename.split(".").pop() : "";
  const safeExt = ext ? `.${ext.toLowerCase()}` : "";
  return `${prefix}/${randomUUID()}${safeExt}`;
}

export function getPublicFileUrl(key: string) {
  const explicitBase = process.env.S3_PUBLIC_URL_BASE;
  if (explicitBase) {
    return `${explicitBase.replace(/\/$/, "")}/${key}`;
  }

  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;

  if (!endpoint || !bucket) {
    throw new Error("Missing S3_PUBLIC_URL_BASE or S3 endpoint configuration");
  }

  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}

export async function uploadBuffer(params: {
  body: Buffer;
  key: string;
  contentType: string;
}) {
  const client = getStorageClient();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  return {
    key: params.key,
    publicUrl: getPublicFileUrl(params.key),
  };
}
