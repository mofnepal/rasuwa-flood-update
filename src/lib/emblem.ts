import emblem from '../../public/img/emblem-112.png';

/**
 * The Emblem of Nepal, imported statically so its URL carries the basePath and
 * Next can serve it at the size it is actually displayed. This is the 112px copy
 * made by `node scripts/make-icons.mjs` — twice the 56px it is shown at — so the
 * static edition, which has no image optimiser, never ships the 292 KB original.
 * It is only ever resampled — never recoloured, restyled or cropped. Replace
 * `public/img/emblem.png` with the ministry's original and rerun the script.
 */
export const EMBLEM = emblem;
