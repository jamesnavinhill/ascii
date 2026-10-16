/*
 * The studio's per-item color grid: one labeled swatch per palette entry,
 * each named by the scene itself. Scenes list their labels file by file in
 * lib/swatches/<slug>.ts — one string per palette index, in order — so every
 * block gets its own name from the scene's own design, never a pattern match.
 */

const modules = import.meta.glob<{ labels: string[] }>("./swatches/*.ts", { eager: true });

const LABELS: Record<string, string[]> = Object.fromEntries(
  Object.entries(modules).map(([path, m]) => [
    path.replace(/^.*swatches\//, "").replace(/\.ts$/, ""),
    m.labels,
  ]),
);

/** The scene's labels, index-aligned with its palette; null when unmapped. */
export function labelsFor(slug: string): string[] | null {
  return LABELS[slug] ?? null;
}

export const mappedSlugs = Object.keys(LABELS);
