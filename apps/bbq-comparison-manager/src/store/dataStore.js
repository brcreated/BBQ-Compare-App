import { create } from "zustand";
import * as api from "../services/api";

const DATASETS = ["brands", "families", "variants", "specs", "assets", "colors", "variantColors"];

function markDirty(state, dataset) {
  return { dirtyDatasets: new Set([...state.dirtyDatasets, dataset]) };
}

export const useDataStore = create((set, get) => ({
  brands: [],
  families: [],
  variants: [],
  specs: [],
  assets: [],
  colors: [],
  variantColors: [],
  assetBaseUrl: "https://bbqcompareassets.brcreated.app/assets",
  loading: false,
  error: null,
  dirtyDatasets: new Set(),
  lastPublishedAt: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [config, data] = await Promise.all([
        api.fetchConfig(),
        api.fetchAllData(),
      ]);
      set({
        ...data,
        assetBaseUrl: config.assetBaseUrl,
        loading: false,
        dirtyDatasets: new Set(),
      });
    } catch (e) {
      set({ loading: false, error: e.message });
    }
  },

  // ── Brands ──────────────────────────────────────────────
  addBrand: (brand) =>
    set((s) => ({ brands: [...s.brands, brand], ...markDirty(s, "brands") })),
  updateBrand: (id, changes) =>
    set((s) => ({
      brands: s.brands.map((b) => (b.id === id ? { ...b, ...changes } : b)),
      ...markDirty(s, "brands"),
    })),
  removeBrand: (id) =>
    set((s) => ({
      brands: s.brands.filter((b) => b.id !== id),
      ...markDirty(s, "brands"),
    })),

  // ── Families ─────────────────────────────────────────────
  addFamily: (family) =>
    set((s) => ({
      families: [...s.families, family],
      ...markDirty(s, "families"),
    })),
  updateFamily: (id, changes) =>
    set((s) => ({
      families: s.families.map((f) =>
        f.id === id ? { ...f, ...changes } : f
      ),
      ...markDirty(s, "families"),
    })),
  removeFamily: (id) =>
    set((s) => ({
      families: s.families.filter((f) => f.id !== id),
      ...markDirty(s, "families"),
    })),

  // ── Variants ─────────────────────────────────────────────
  addVariant: (variant) =>
    set((s) => ({
      variants: [...s.variants, variant],
      ...markDirty(s, "variants"),
    })),
  updateVariant: (id, changes) =>
    set((s) => ({
      variants: s.variants.map((v) =>
        v.id === id ? { ...v, ...changes } : v
      ),
      ...markDirty(s, "variants"),
    })),
  removeVariant: (id) =>
    set((s) => ({
      variants: s.variants.filter((v) => v.id !== id),
      ...markDirty(s, "variants"),
    })),

  // ── Specs ────────────────────────────────────────────────
  addSpec: (spec) =>
    set((s) => ({ specs: [...s.specs, spec], ...markDirty(s, "specs") })),
  updateSpec: (id, changes) =>
    set((s) => ({
      specs: s.specs.map((sp) => (sp.id === id ? { ...sp, ...changes } : sp)),
      ...markDirty(s, "specs"),
    })),
  removeSpec: (id) =>
    set((s) => ({
      specs: s.specs.filter((sp) => sp.id !== id),
      ...markDirty(s, "specs"),
    })),

  // ── Assets ───────────────────────────────────────────────
  addAsset: (asset) =>
    set((s) => ({ assets: [...s.assets, asset], ...markDirty(s, "assets") })),
  updateAsset: (id, changes) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, ...changes } : a)),
      ...markDirty(s, "assets"),
    })),
  removeAsset: (id) =>
    set((s) => ({
      assets: s.assets.filter((a) => a.id !== id),
      ...markDirty(s, "assets"),
    })),

  // ── Persist ──────────────────────────────────────────────
  saveDataset: async (dataset) => {
    const state = get();
    await api.saveDataset(dataset, state[dataset]);
    set((s) => {
      const next = new Set(s.dirtyDatasets);
      next.delete(dataset);
      return { dirtyDatasets: next };
    });
  },

  saveAll: async () => {
    const state = get();
    const dirty = [...state.dirtyDatasets];
    for (const dataset of dirty) {
      await api.saveDataset(dataset, state[dataset]);
    }
    set({ dirtyDatasets: new Set() });
  },

  publish: async () => {
    const state = get();
    if (state.dirtyDatasets.size > 0) {
      await get().saveAll();
    }
    set({ lastPublishedAt: new Date().toISOString() });
    return { published: [...DATASETS] };
  },
}));

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
