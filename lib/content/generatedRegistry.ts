import { Battle } from "./types";

/**
 * Auto-generated Battle registry entries from scripts/author-challenge.ts.
 * Spread into the main registry in registry.ts. Hand-authored battles stay
 * in registry.ts's battleRegistry; generated ones live here.
 */
export interface GeneratedBattleEntry {
  id: string;
  trackId: string;
  arcId: string;
  order: number;
  loader: () => Promise<Battle>;
}

export const generatedBattles: GeneratedBattleEntry[] = [
    {
    id: "tag-list-direct-mutation",
    trackId: "frontend-debugging",
    arcId: "js-logic-and-state",
    order: 7,
    loader: () => import("./challenges/tag-list-direct-mutation").then((m) => m.tagListDirectMutationBattle),
  },
    {
    id: "gallery-filter-logic",
    trackId: "frontend-debugging",
    arcId: "js-logic-and-state",
    order: 8,
    loader: () => import("./challenges/gallery-filter-logic").then((m) => m.galleryFilterLogicBattle),
  },
    {
    id: "stale-currency-display",
    trackId: "frontend-debugging",
    arcId: "react-and-components",
    order: 2,
    loader: () => import("./challenges/stale-currency-display").then((m) => m.staleCurrencyDisplayBattle),
  },
    {
    id: "modal-content-invisible",
    trackId: "frontend-debugging",
    arcId: "browser-and-dom",
    order: 1,
    loader: () => import("./challenges/modal-content-invisible").then((m) => m.modalContentInvisibleBattle),
  },
    {
    id: "stale-profile-display",
    trackId: "frontend-debugging",
    arcId: "async-network-and-effects",
    order: 3,
    loader: () => import("./challenges/stale-profile-display").then((m) => m.staleProfileDisplayBattle),
  },
    {
    id: "profile-editor-stale-data",
    trackId: "frontend-debugging",
    arcId: "react-and-components",
    order: 3,
    loader: () => import("./challenges/profile-editor-stale-data").then((m) => m.profileEditorStaleDataBattle),
  },
    {
    id: "product-list-key-issue",
    trackId: "frontend-debugging",
    arcId: "react-and-components",
    order: 4,
    loader: () => import("./challenges/product-list-key-issue").then((m) => m.productListKeyIssueBattle),
  },
    {
    id: "expensive-filter-rerun",
    trackId: "frontend-debugging",
    arcId: "performance-and-memory",
    order: 2,
    loader: () => import("./challenges/expensive-filter-rerun").then((m) => m.expensiveFilterRerunBattle),
  },
    {
    id: "callback-prop-invalidation",
    trackId: "frontend-debugging",
    arcId: "performance-and-memory",
    order: 3,
    loader: () => import("./challenges/callback-prop-invalidation").then((m) => m.callbackPropInvalidationBattle),
  },
    {
    id: "search-response-race",
    trackId: "frontend-debugging",
    arcId: "production-debugging-boss",
    order: 1,
    loader: () => import("./challenges/search-response-race").then((m) => m.searchResponseRaceBattle),
  },
    {
    id: "optimistic-update-no-rollback",
    trackId: "frontend-debugging",
    arcId: "production-debugging-boss",
    order: 2,
    loader: () => import("./challenges/optimistic-update-no-rollback").then((m) => m.optimisticUpdateNoRollbackBattle),
  },
    {
    id: "interval-stale-closure-freeze",
    trackId: "frontend-debugging",
    arcId: "production-debugging-boss",
    order: 3,
    loader: () => import("./challenges/interval-stale-closure-freeze").then((m) => m.intervalStaleClosureFreezeBattle),
  },
    {
    id: "listener-leak-double-count",
    trackId: "frontend-debugging",
    arcId: "production-debugging-boss",
    order: 4,
    loader: () => import("./challenges/listener-leak-double-count").then((m) => m.listenerLeakDoubleCountBattle),
  },
    {
    id: "label-input-association-broken",
    trackId: "frontend-debugging",
    arcId: "browser-and-dom",
    order: 2,
    loader: () => import("./challenges/label-input-association-broken").then((m) => m.labelInputAssociationBrokenBattle),
  },
    {
    id: "accordion-aria-expanded-stale",
    trackId: "frontend-debugging",
    arcId: "browser-and-dom",
    order: 3,
    loader: () => import("./challenges/accordion-aria-expanded-stale").then((m) => m.accordionAriaExpandedStaleBattle),
  },
    {
    id: "show-password-type-toggle",
    trackId: "frontend-debugging",
    arcId: "browser-and-dom",
    order: 4,
    loader: () => import("./challenges/show-password-type-toggle").then((m) => m.showPasswordTypeToggleBattle),
  },
  // GENERATED ENTRIES — appended by scripts/author-challenge.ts
];
