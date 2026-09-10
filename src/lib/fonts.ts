import { BASE_PATH } from './constants';

/**
 * Mukta (SIL Open Font License) — one family covering Devanagari and Latin,
 * self-hosted so the portal never depends on an external font service.
 *
 * The .woff2 files are subsetted from the originals in `prototype/assets/fonts/`
 * by `python3 scripts/build-fonts.py`, which cuts 1.6 MB of TTF to 468 KB while
 * keeping every Devanagari shaping feature.
 *
 * The faces are declared here rather than through next/font because
 * `preload` there is all-or-nothing, and preloading all four weights delayed the
 * headline by seconds on a phone. Only weight 800 is preloaded — the headline,
 * the grand total and every KPI figure are painted in it, and it is what the
 * largest contentful paint waits for. The other three arrive normally and swap
 * into body copy and smaller labels, where a late swap is not noticeable.
 */

export const FONT_FAMILY = 'Mukta';

/** The weight the largest contentful paint is painted in. */
export const PRELOADED_FONTS = [`${BASE_PATH}/fonts/Mukta-ExtraBold.woff2`] as const;

const FACES = [
  ['Regular', 400],
  ['SemiBold', 600],
  ['Bold', 700],
  ['ExtraBold', 800],
] as const;

/**
 * The @font-face rules, rendered into the page by the locale layout. They live
 * here rather than in globals.css because a stylesheet cannot read the base
 * path, and the static edition is mounted somewhere else.
 * `swap` paints text in the fallback at once and refines it when Mukta lands.
 */
export const FONT_FACE_CSS = FACES.map(
  ([name, weight]) =>
    `@font-face{font-family:Mukta;src:url('${BASE_PATH}/fonts/Mukta-${name}.woff2') format('woff2');font-weight:${weight};font-style:normal;font-display:swap}`,
).join('');
