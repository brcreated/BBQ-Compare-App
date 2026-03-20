import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
const bucket = (process.env.R2_BUCKET || "").trim();
const prefix = (process.env.R2_DATA_PREFIX || "data").trim();

if (!accountId) {
  throw new Error("Missing CLOUDFLARE_ACCOUNT_ID in .env");
}

if (!accessKeyId) {
  throw new Error("Missing R2_ACCESS_KEY_ID in .env");
}

if (!secretAccessKey) {
  throw new Error("Missing R2_SECRET_ACCESS_KEY in .env");
}

if (!bucket) {
  throw new Error("Missing R2_BUCKET in .env");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadJsonToR2(filename, data) {
  const key = `${prefix}/${filename}`;
  const body =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store",
    })
  );

  console.log(`Uploaded → ${key}`);
}