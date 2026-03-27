# BBQ Comparison App — PWA Strategy

## Goal

The customer comparison app must function like a native showroom application on:

- iPad (landscape)
- Android touchscreen displays
- desktop browsers

The app must be installable and launch quickly.

---

## Customer App PWA Requirements

The customer app will include:

- web app manifest
- service worker
- installable home screen support
- offline shell
- aggressive caching for static assets
- controlled caching for JSON datasets

---

## Installable Experience

The PWA should allow installation on:

- iPad Safari
- Android Chrome
- desktop Chrome

When installed, the app should launch:

- fullscreen
- without browser chrome
- in landscape-friendly layout

---

## Offline Shell

The app shell should load even without a network connection.

The offline shell should include:

- layout
- navigation
- previously cached assets

If JSON data cannot be loaded, the UI should show a graceful message.

---

## Cache Strategy

Cache aggressively:

- JS bundles
- CSS
- fonts
- icons
- videos

Cache carefully:

- JSON datasets
- product assets

The app should support stale-while-revalidate behavior where possible.

---

## Version Updates

The service worker should detect new versions and prompt the user to refresh when updates are available.

Showroom devices should not become stuck on stale app versions.

---

## Manager App PWA

The manager app may also be installable but should prioritize correctness over aggressive caching.

Manager tools should always load the most current data.