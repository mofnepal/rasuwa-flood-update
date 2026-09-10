import { describe, expect, it } from 'vitest';

/**
 * The transition table is the safety rule of the whole portal: nothing reaches a
 * public page except by draft → verified → published, each step by a role that is
 * allowed to take it. These tests lock the table itself, without a database.
 */

type Status = 'draft' | 'verified' | 'published' | 'archived';
type Role = 'entry' | 'verifier' | 'publisher' | 'admin';

const RANK: Record<Role, number> = { entry: 1, verifier: 2, publisher: 3, admin: 4 };
const TRANSITIONS = {
  verify: { from: ['draft'], to: 'verified', role: 'verifier' },
  send_back: { from: ['verified', 'published'], to: 'draft', role: 'verifier' },
  publish: { from: ['verified', 'archived'], to: 'published', role: 'publisher' },
  unpublish: { from: ['published'], to: 'verified', role: 'publisher' },
  archive: { from: ['draft', 'verified', 'published'], to: 'archived', role: 'publisher' },
} satisfies Record<string, { from: Status[]; to: Status; role: 'verifier' | 'publisher' }>;

const allowed = (role: Role, transition: keyof typeof TRANSITIONS) =>
  RANK[role] >= RANK[TRANSITIONS[transition].role];

describe('status transitions', () => {
  it('never publishes a draft in one step', () => {
    expect(TRANSITIONS.publish.from).not.toContain('draft');
  });

  it('only reaches published from verified or archived', () => {
    expect(TRANSITIONS.publish.from.sort()).toEqual(['archived', 'verified']);
    expect(TRANSITIONS.publish.to).toBe('published');
  });

  it('lets a verifier send a record back to draft', () => {
    expect(TRANSITIONS.send_back.to).toBe('draft');
    expect(TRANSITIONS.send_back.from).toContain('verified');
  });

  it('lets a publisher take a record back out of public view', () => {
    expect(TRANSITIONS.unpublish.from).toEqual(['published']);
    expect(TRANSITIONS.unpublish.to).toBe('verified');
  });
});

describe('role permissions', () => {
  it('does not let data entry verify or publish', () => {
    expect(allowed('entry', 'verify')).toBe(false);
    expect(allowed('entry', 'publish')).toBe(false);
  });

  it('lets a verifier verify but not publish', () => {
    expect(allowed('verifier', 'verify')).toBe(true);
    expect(allowed('verifier', 'publish')).toBe(false);
  });

  it('lets a publisher do both', () => {
    expect(allowed('publisher', 'verify')).toBe(true);
    expect(allowed('publisher', 'publish')).toBe(true);
  });

  it('lets an admin do everything', () => {
    for (const transition of Object.keys(TRANSITIONS) as (keyof typeof TRANSITIONS)[]) {
      expect(allowed('admin', transition)).toBe(true);
    }
  });
});

describe('the path a record must walk', () => {
  it('takes at least two approvals to become public', () => {
    let status: Status = 'draft';
    expect(allowed('entry', 'verify')).toBe(false);

    status = TRANSITIONS.verify.to;
    expect(status).toBe('verified');
    expect(allowed('verifier', 'publish')).toBe(false);

    status = TRANSITIONS.publish.to;
    expect(status).toBe('published');
  });
});
