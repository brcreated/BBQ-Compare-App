const TOKEN_KEY = "bbq_admin_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
    throw new Error("Session expired — please log in again");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchConfig() {
  return request("/api/config");
}

export async function fetchAllData() {
  return request("/api/data");
}

export async function saveDataset(dataset, data) {
  return request(`/api/data/${dataset}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file, brandId, variantId) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  form.append("brandId", brandId);
  form.append("variantId", variantId);
  const res = await fetch("/api/images/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteImage(filePath) {
  return request("/api/images", { method: "DELETE", body: JSON.stringify({ filePath }) });
}

// Locks
export async function acquireLock(variantId) {
  return request(`/api/locks/acquire/${variantId}`, { method: "POST" });
}

export async function releaseLock(variantId) {
  return request(`/api/locks/release/${variantId}`, { method: "POST" });
}

export async function renewLock(variantId) {
  return request(`/api/locks/renew/${variantId}`, { method: "POST" });
}

export async function fetchLocks() {
  return request("/api/locks");
}

export async function reloadCache() {
  return request("/api/reload", { method: "POST" });
}
