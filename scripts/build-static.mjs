/**
 * Builds the static edition of the public portal into ./out, for GitHub Pages.
 *
 *   DATABASE_URL=… NEXT_PUBLIC_BASE_PATH=/rasuwa-flood-update node scripts/build-static.mjs
 *
 * Every public page, share card and open-data file is rendered once, from the
 * published records in the database — so seed (or import) first. Next cannot
 * export a project that also contains server features (admin, sign-in, the API,
 * middleware, the message form), so the build runs on a temporary copy with
 * those removed. The repository itself is never modified.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/rasuwa-flood';

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  fail('DATABASE_URL is not set. The static edition is rendered from a seeded database.');
}

/** What the public pages need. */
const COPY = [
  'src',
  'public',
  'seed',
  'next.config.ts',
  'next-env.d.ts',
  'tsconfig.json',
  'postcss.config.mjs',
  'package.json',
];

/** Server features, which a static export cannot contain. */
const SERVER_ONLY = [
  'src/middleware.ts',
  'src/app/admin',
  'src/app/api',
  'src/app/[locale]/search',
  'src/app/[locale]/contact/actions.ts',
];

/** Files replaced in the copy because their original imports a server feature. */
const STUBS = {
  // The contact page shows the ministry's email address instead in this edition.
  'src/app/[locale]/contact/MessageForm.tsx':
    '/** The message form needs the server edition. */\nexport function MessageForm() {\n  return null;\n}\n',
};

const work = await mkdtemp(path.join(os.tmpdir(), 'rasuwa-static-'));
console.log(`static edition · base path "${basePath || '/'}" · building in ${work}`);

try {
  for (const entry of COPY) {
    await cp(path.join(root, entry), path.join(work, entry), { recursive: true });
  }
  await symlink(path.join(root, 'node_modules'), path.join(work, 'node_modules'), 'dir');
  for (const entry of SERVER_ONLY) {
    await rm(path.join(work, entry), { recursive: true, force: true });
  }
  for (const [file, content] of Object.entries(STUBS)) {
    await writeFile(path.join(work, file), content);
  }
  await renderAtBuildTime(path.join(work, 'src', 'app'));

  const build = spawnSync(
    process.execPath,
    [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'],
    {
      cwd: work,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_PUBLIC_STATIC_EXPORT: '1',
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  );
  if (build.status !== 0) fail('next build failed');

  const out = path.join(work, 'out');
  await finish(out);
  await check(out);

  await rm(path.join(root, 'out'), { recursive: true, force: true });
  await cp(out, path.join(root, 'out'), { recursive: true });
  console.log('\n✓ static edition written to ./out');
} finally {
  await rm(work, { recursive: true, force: true });
}

/**
 * On the ministry's server the public pages and files are rendered per request —
 * `export const dynamic = 'force-dynamic'`. A static export is rendered once, at
 * build time, so the copy drops that line. Next requires the setting to be a
 * literal, which is why it is removed here rather than switched in the code.
 */
async function renderAtBuildTime(appDirectory) {
  const line = /^export const dynamic = 'force-dynamic';\n/m;
  let changed = 0;
  for await (const file of walk(appDirectory)) {
    if (!/\.tsx?$/.test(file)) continue;
    const source = await readFile(file, 'utf8');
    if (!line.test(source)) continue;
    await writeFile(file, source.replace(line, ''));
    changed++;
  }
  if (changed === 0) fail('found no per-request routes to render at build time');
  console.log(`rendering ${changed} per-request routes once, at build time`);
}

/** The files GitHub Pages needs around the exported pages. */
async function finish(out) {
  // The bare site address is what the ministry links to and what people share, and
  // link-preview crawlers do not follow its redirect — so it carries its own
  // favicon and preview: the Nepali share card, in both languages' words.
  const messages = {
    ne: JSON.parse(await readFile(path.join(root, 'src', 'messages', 'ne.json'), 'utf8')),
    en: JSON.parse(await readFile(path.join(root, 'src', 'messages', 'en.json'), 'utf8')),
  };
  const share = {
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? basePath).replace(/\/$/, ''),
    description: `${messages.ne.site.footerBlurb} · ${messages.en.site.footerBlurb}`,
    imageAlt: messages.ne.site.shareImageAlt,
  };
  const iconTags = [
    `<link rel="icon" href="${basePath}/favicon.ico" sizes="16x16 32x32 48x48">`,
    `<link rel="icon" href="${basePath}/img/favicon-32.png" type="image/png" sizes="32x32">`,
    `<link rel="icon" href="${basePath}/img/favicon-48.png" type="image/png" sizes="48x48">`,
    `<link rel="apple-touch-icon" href="${basePath}/img/apple-touch-icon.png" sizes="180x180">`,
    `<link rel="manifest" href="${basePath}/manifest.webmanifest">`,
    '<meta name="theme-color" content="#003893">',
  ].join('\n');

  // The portal has no page at its root; readers land on the Nepali edition.
  await writeFile(
    path.join(out, 'index.html'),
    `<!doctype html>
<html lang="ne">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update</title>
<meta name="description" content="${escapeHtml(share.description)}">
${iconTags}
<meta property="og:type" content="website">
<meta property="og:site_name" content="रसुवा–भोटेकोशी बाढी अपडेट">
<meta property="og:title" content="रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update">
<meta property="og:description" content="${escapeHtml(share.description)}">
<meta property="og:url" content="${share.siteUrl}/">
<meta property="og:locale" content="ne_NP">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:image" content="${share.siteUrl}/og/home-ne.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(share.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update">
<meta name="twitter:description" content="${escapeHtml(share.description)}">
<meta name="twitter:image" content="${share.siteUrl}/og/home-ne.png">
<meta http-equiv="refresh" content="0; url=${basePath}/ne/">
<link rel="canonical" href="${basePath}/ne/">
<script>location.replace('${basePath}/ne/' + location.hash)</script>
</head>
<body style="font-family:system-ui,sans-serif;padding:2rem">
<a href="${basePath}/ne/">रसुवा–भोटेकोशी बाढी अपडेट</a> · <a href="${basePath}/en/">MoF Rasuwa–Bhotekoshi Flood Update</a>
</body>
</html>
`,
  );

  await writeFile(
    path.join(out, '404.html'),
    `<!doctype html>
<html lang="ne">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>पृष्ठ फेला परेन · Page not found</title>
${iconTags}
<style>
body{margin:0;font-family:Mukta,system-ui,sans-serif;color:#14213D;background:#F4F6FA}
.s{height:6px;background:linear-gradient(90deg,#C8102E 50%,#003893 50%)}
main{max-width:640px;margin:12vh auto;padding:0 24px}
h1{color:#003893;font-size:28px;margin:0 0 8px}
p{color:#5B6478;line-height:1.6}
a{display:inline-block;margin:8px 12px 0 0;padding:10px 16px;border-radius:8px;background:#003893;color:#fff;text-decoration:none}
a.r{background:#C8102E}
</style>
</head>
<body>
<div class="s"></div>
<main>
<h1>पृष्ठ फेला परेन · Page not found</h1>
<p>तपाईंले खोज्नुभएको पृष्ठ यो पोर्टलमा छैन। The page you were looking for is not on this portal.</p>
<a href="${basePath}/ne/">रसुवा–भोटेकोशी बाढी अपडेट</a>
<a class="r" href="${basePath}/en/">MoF Rasuwa–Bhotekoshi Flood Update</a>
</main>
</body>
</html>
`,
  );

  // Without it GitHub Pages runs Jekyll, which drops the _next folder.
  await writeFile(path.join(out, '.nojekyll'), '');
}

/** Refuses to publish an export that is missing a page or points at the wrong base path. */
async function check(out) {
  const required = [
    'ne/index.html',
    'en/index.html',
    ...['contributions', 'foreign', 'rescue', 'initiatives', 'contact'].flatMap((page) => [
      `ne/${page}/index.html`,
      `en/${page}/index.html`,
    ]),
    'open-data/index.json',
    'open-data/summary.json',
    'open-data/contributions.csv',
    'open-data/search-ne.json',
    'og/home-ne.png',
    'fonts/Mukta-ExtraBold.woff2',
    'favicon.ico',
    'manifest.webmanifest',
    'img/favicon-48.png',
    'img/icon-512.png',
  ];
  const absent = required.filter((file) => !existsSync(path.join(out, file)));
  if (absent.length) fail(`the export is missing: ${absent.join(', ')}`);

  const summary = JSON.parse(await readFile(path.join(out, 'open-data/summary.json'), 'utf8'));
  if (!(summary.grand_total_npr > 0)) fail('open-data/summary.json has no grand total');

  // A page built for one address must not link into another.
  if (basePath !== '/rasuwa-flood') {
    const stray = [];
    for await (const file of walk(out)) {
      if (!/\.(html|txt|json|js|css)$/.test(file)) continue;
      if (/["'(]\/rasuwa-flood\//.test(await readFile(file, 'utf8'))) {
        stray.push(path.relative(out, file));
      }
    }
    if (stray.length) {
      fail(`links to /rasuwa-flood/ in a build for ${basePath}: ${stray.slice(0, 10).join(', ')}`);
    }
  }

  let pages = 0;
  for await (const file of walk(out)) if (file.endsWith('.html')) pages++;
  console.log(
    `\n✓ ${pages} pages · grand total NPR ${summary.grand_total_npr} · as of ${summary.as_of}`,
  );
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}
