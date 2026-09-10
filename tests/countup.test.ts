import { describe, expect, it } from 'vitest';

/**
 * The count-up eases a figure from zero to its published value. It must never
 * render a figure the ministry has not published — in particular never a
 * negative one, and never a value above the target.
 *
 * requestAnimationFrame reports the time the frame began, which can predate the
 * performance.now() captured when the animation was scheduled. Unclamped, that
 * drives progress negative and the easing overshoots below zero.
 */
const easedValue = (value: number, elapsedMs: number, duration = 900) => {
  const progress = Math.min(1, Math.max(0, elapsedMs / duration));
  const eased = 1 - Math.pow(1 - progress, 3);
  return value * eased;
};

describe('the count-up easing', () => {
  const target = 11_865_953_338.77;

  it('never goes below zero, even when the first frame predates the start', () => {
    for (const elapsed of [-500, -120, -16, -1, 0]) {
      expect(easedValue(target, elapsed)).toBe(0);
    }
  });

  it('never exceeds the published figure', () => {
    for (const elapsed of [0, 100, 450, 899, 900, 1200, 60_000]) {
      const shown = easedValue(target, elapsed);
      expect(shown).toBeGreaterThanOrEqual(0);
      expect(shown).toBeLessThanOrEqual(target);
    }
  });

  it('rises monotonically and lands exactly on the target', () => {
    let previous = -1;
    for (let elapsed = -100; elapsed <= 900; elapsed += 50) {
      const shown = easedValue(target, elapsed);
      expect(shown).toBeGreaterThanOrEqual(previous);
      previous = shown;
    }
    expect(easedValue(target, 900)).toBe(target);
  });
});
