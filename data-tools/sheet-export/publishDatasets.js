const DEFAULT_BASE_PATH = "data";

function assertPublishConfig(config) {
  if (!config?.accountId) {
    throw new Error("Missing R2 publish config: accountId");
  }

  if (!config?.bucketName) {
    throw new Error("Missing R2 publish config: bucketName");
  }

  if (!config?.apiToken) {
    throw new Error("Missing R2 publish config: apiToken");
  }
}

function buildR2ObjectKey(basePath, fileName) {
  const safeBasePath = String(basePath || "").replace(/^\/+|\/+$/g, "");
  return safeBasePath ? `${safeBasePath}/${fileName}` : fileName;
}

function normalizeJsonContents(contents) {
  if (typeof contents === "string") {
    return contents.endsWith("\n") ? contents : `${contents}\n`;
  }

  return `${JSON.stringify(contents, null, 2)}\n`;
}

async function uploadJsonFile({
  accountId,
  bucketName,
  apiToken,
  objectKey,
  data,
  fetchImpl = fetch,
}) {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}` +
    `/r2/buckets/${encodeURIComponent(bucketName)}/objects/${objectKey}`;

  const response = await fetchImpl(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: normalizeJsonContents(data),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Failed to upload "${objectKey}" to R2 (${response.status} ${response.statusText}). ${responseText}`
    );
  }

  return {
    objectKey,
    ok: true,
  };
}

export function preparePublishPayload({ datasetFiles = [], manifestFile } = {}) {
  if (!Array.isArray(datasetFiles)) {
    throw new Error("preparePublishPayload expects datasetFiles to be an array.");
  }

  if (!manifestFile || !manifestFile.path) {
    throw new Error("preparePublishPayload requires a manifestFile with a path.");
  }

  return {
    datasetFiles: datasetFiles.map((file) => ({
      path: file.path,
      contents: file.contents,
      contentType: file.contentType || "application/json",
    })),
    manifest: {
      path: manifestFile.path,
      contents: manifestFile.contents,
      contentType: manifestFile.contentType || "application/json",
    },
  };
}

export async function publishDatasets({
  files,
  publishConfig,
  basePath = DEFAULT_BASE_PATH,
  fetchImpl = fetch,
}) {
  if (!files || typeof files !== "object") {
    throw new Error("publishDatasets requires a files object.");
  }

  assertPublishConfig(publishConfig);

  const uploads = [];

  for (const [fileName, data] of Object.entries(files)) {
    const objectKey = buildR2ObjectKey(basePath, fileName);

    const result = await uploadJsonFile({
      accountId: publishConfig.accountId,
      bucketName: publishConfig.bucketName,
      apiToken: publishConfig.apiToken,
      objectKey,
      data,
      fetchImpl,
    });

    uploads.push({
      fileName,
      objectKey: result.objectKey,
      ok: true,
    });
  }

  return {
    ok: true,
    bucketName: publishConfig.bucketName,
    basePath,
    uploads,
  };
}