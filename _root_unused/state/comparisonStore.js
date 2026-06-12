const STORAGE_KEY = "bbq-comparison-store";
const MAX_ITEMS = 4;

function normalizeId(value) {
  if (!value) return "";
  return String(value).trim();
}

function extractId(itemOrId) {
  if (typeof itemOrId === "string") return normalizeId(itemOrId);
  if (!itemOrId || typeof itemOrId !== "object") return "";

  return normalizeId(
    itemOrId.id ||
      itemOrId.variantId ||
      itemOrId.productId ||
      itemOrId.slug ||
      itemOrId.handle ||
      itemOrId.entityId
  );
}

function loadInitialItems() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(extractId).filter(Boolean).slice(0, MAX_ITEMS);
  } catch (error) {
    console.error("Failed to load comparison store from localStorage.", error);
    return [];
  }
}

let state = {
  items: loadInitialItems(),
};

const listeners = new Set();

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error("Failed to persist comparison store.", error);
    }
  }

  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error("Comparison store listener failed.", error);
    }
  });
}

export function getState() {
  return {
    ...state,
    items: [...state.items],
  };
}

export function subscribe(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSelected(itemOrId) {
  const id = extractId(itemOrId);
  return Boolean(id) && state.items.includes(id);
}

export function addItem(itemOrId) {
  const id = extractId(itemOrId);

  if (!id) {
    return {
      ok: false,
      reason: "invalid",
      items: [...state.items],
    };
  }

  if (state.items.includes(id)) {
    return {
      ok: false,
      reason: "duplicate",
      items: [...state.items],
    };
  }

  if (state.items.length >= MAX_ITEMS) {
    return {
      ok: false,
      reason: "max",
      items: [...state.items],
    };
  }

  state = {
    ...state,
    items: [...state.items, id],
  };

  emit();

  return {
    ok: true,
    reason: "added",
    items: [...state.items],
  };
}

export function removeItem(itemOrId) {
  const id = extractId(itemOrId);

  if (!id) {
    return {
      ok: false,
      items: [...state.items],
    };
  }

  state = {
    ...state,
    items: state.items.filter((item) => item !== id),
  };

  emit();

  return {
    ok: true,
    items: [...state.items],
  };
}

export function clearAll() {
  state = {
    ...state,
    items: [],
  };

  emit();

  return {
    ok: true,
    items: [],
  };
}

export function getMaxItems() {
  return MAX_ITEMS;
}