const MAX_ITEMS = 4;

let state = {
  items: [],
};

const listeners = new Set();

function emit() {
  const snapshot = getState();
  listeners.forEach((listener) => listener(snapshot));
}

export function getState() {
  return {
    items: [...state.items],
    count: state.items.length,
    isFull: state.items.length >= MAX_ITEMS,
  };
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addItem(variantId) {
  if (!variantId) {
    return { added: false, reason: "missing_id" };
  }

  if (state.items.includes(variantId)) {
    return { added: false, reason: "duplicate" };
  }

  if (state.items.length >= MAX_ITEMS) {
    return { added: false, reason: "full" };
  }

  state = {
    ...state,
    items: [...state.items, variantId],
  };

  emit();

  return {
    added: true,
    reason: null,
    count: state.items.length,
  };
}

export function removeItem(variantId) {
  state = {
    ...state,
    items: state.items.filter((id) => id !== variantId),
  };

  emit();
}

export function clearAll() {
  state = {
    ...state,
    items: [],
  };

  emit();
}

export function isSelected(variantId) {
  return state.items.includes(variantId);
}