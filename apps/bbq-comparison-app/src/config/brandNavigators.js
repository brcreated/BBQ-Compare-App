// Brand-specific navigation trees.
// getNextStep(params) returns the next step object, or null when navigation is complete.
//
// Step types:
//   "options"          — static list of choices (fuel, install type)
//   "dynamic_families" — choices are derived live from catalog data

function nid(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const INSTALL_STEP = {
  id: "installation",
  type: "options",
  question: "How will it be installed?",
  param: "installation",
  options: [
    { value: "freestanding", label: "Freestanding", icon: "🏠", description: "Outdoor grill on wheels or legs" },
    { value: "built_in",     label: "Built-In",     icon: "🧱", description: "Permanently installed in an outdoor kitchen" },
  ],
};

// A dynamic_families step scans catalog variants for the brand, filtered by the given
// fuel/install criteria, then surfaces the unique families as navigator options.
// Options are built in BrandNavigatorPage — nothing hardcoded here.
function familyStep({ id, question, fuelFilter, installFilter }) {
  return {
    id,
    type: "dynamic_families",
    question,
    param: "family",
    layout: "logos",
    // These tell BrandNavigatorPage how to filter variants when building the option list:
    fuelFilter,      // "gas" | "charcoal" | "pellet" | null (any)
    installFilter,   // "freestanding" | "built_in" | null (any)
  };
}

export const BRAND_NAVIGATORS = {
  artisan: {
    getNextStep(params) {
      if (!params.installation) return INSTALL_STEP;
      if (!params.family) return familyStep({
        id: "line",
        question: "Which collection?",
        installFilter: params.installation,
        fuelFilter: null,
      });
      return null;
    },
    breadcrumbLabel(key, value) {
      if (key === "installation") return value === "built_in" ? "Built-In" : "Freestanding";
      return value;
    },
  },

  delta_heat: {
    getNextStep(params) {
      if (!params.installation) return INSTALL_STEP;
      return null;
    },
    breadcrumbLabel(key, value) {
      if (key === "installation") return value === "built_in" ? "Built-In" : "Freestanding";
      return value;
    },
  },

  napoleon: {
    getNextStep(params) {
      if (!params.family) return {
        id: "collection",
        type: "sectioned_families",
        question: "Which collection?",
        param: "family",
        layout: "logos",
        sections: [
          { label: "Gas Grills", fuelFilter: "gas" },
          { label: "Charcoal", fuelFilter: "charcoal" },
        ],
      };
      return null;
    },
    breadcrumbLabel() { return ""; },
  },

  twin_eagles: {
    getNextStep(params) {
      if (!params.installation) return INSTALL_STEP;
      return null;
    },
    breadcrumbLabel(key, value) {
      if (key === "installation") return value === "built_in" ? "Built-In" : "Freestanding";
      return value;
    },
  },

  yoder: {
    getNextStep(params) {
      if (!params.fuel) return {
        id: "fuel",
        type: "options",
        question: "What type of smoker?",
        param: "fuel",
        options: [
          { value: "pellet",   label: "Pellet",   icon: "🪵", description: "Set-and-forget wood pellet smoking" },
          { value: "charcoal", label: "Charcoal", icon: "⚫", description: "Traditional charcoal & wood" },
        ],
      };
      if (!params.family) {
        const isPellet = nid(params.fuel) === "pellet";
        return familyStep({
          id: "line",
          question: isPellet ? "Which model series?" : "What are you looking for?",
          fuelFilter: nid(params.fuel),
          installFilter: null,
        });
      }
      return null;
    },
    breadcrumbLabel(key, value) {
      if (key === "fuel") return value === "pellet" ? "Pellet" : "Charcoal";
      return value;
    },
  },
};

export function getBrandNavigator(brandSlug) {
  return BRAND_NAVIGATORS[nid(brandSlug)] || null;
}

export function buildBreadcrumb(config, params) {
  const crumbs = [];
  for (const key of ["fuel", "installation"]) {
    if (params[key] && config.breadcrumbLabel) {
      crumbs.push(config.breadcrumbLabel(key, params[key]));
    }
  }
  return crumbs;
}
