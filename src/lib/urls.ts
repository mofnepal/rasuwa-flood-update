import { BASE_PATH, STATIC_EXPORT } from './constants';

/**
 * A stored document's public address under the current base path.
 *
 * Uploads are recorded with the prefix in force when they were stored, such as
 * `/rasuwa-flood/uploads/…`. The files always sit under `<base path>/uploads`,
 * so the prefix is re-applied here and the same records serve the ministry's
 * server and the GitHub Pages edition alike. Absolute URLs (object storage) are
 * returned unchanged.
 */
export function publicFileUrl(url: string): string;
export function publicFileUrl(url: string | null | undefined): string | null;
export function publicFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = /^\/(?:[^/]+\/)*uploads\/(.+)$/.exec(url);
  return match ? `${BASE_PATH}/uploads/${match[1]}` : url;
}

/**
 * A plain `<a href>` to a page of the portal, for places that cannot use the
 * locale-aware `Link`. The static edition is served as `page/index.html`, so its
 * addresses end in a slash; without it GitHub Pages answers with a redirect.
 *
 *   sitePath('en', '/contributions?q=Kumari#register')
 *     → /rasuwa-flood/en/contributions?q=Kumari#register        (server)
 *     → /rasuwa-flood-update/en/contributions/?q=Kumari#register (static)
 */
export function sitePath(locale: string, href: string): string {
  const [, pathname = '', rest = ''] = /^([^?#]*)(.*)$/.exec(href) ?? [];
  let path = `${BASE_PATH}/${locale}${pathname === '/' ? '' : pathname}`;
  if (STATIC_EXPORT && !path.endsWith('/')) path += '/';
  return `${path}${rest}`;
}
