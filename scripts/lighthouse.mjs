/**
 * Runs Lighthouse against the mobile home page several times and reports the
 * median of each category. A single run on a developer machine is too noisy to
 * judge a regression by.
 *
 *   node scripts/lighthouse.mjs [url] [runs]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:3111/rasuwa-flood/ne';
const runs = Number(process.argv[3] ?? 5);
const dir = mkdtempSync(path.join(tmpdir(), 'lh-'));

const scores = { performance: [], accessibility: [], 'best-practices': [], seo: [] };
const metrics = { fcp: [], lcp: [], tbt: [], cls: [] };

for (let i = 0; i < runs; i++) {
  const out = path.join(dir, `run-${i}.json`);
  execFileSync(
    'npx',
    [
      '--yes',
      'lighthouse@12',
      url,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--throttling-method=simulate',
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox',
      '--output=json',
      `--output-path=${out}`,
    ],
    { stdio: 'ignore' },
  );
  const report = JSON.parse(readFileSync(out, 'utf8'));
  for (const key of Object.keys(scores))
    scores[key].push(Math.round(report.categories[key].score * 100));
  metrics.fcp.push(report.audits['first-contentful-paint'].numericValue);
  metrics.lcp.push(report.audits['largest-contentful-paint'].numericValue);
  metrics.tbt.push(report.audits['total-blocking-time'].numericValue);
  metrics.cls.push(report.audits['cumulative-layout-shift'].numericValue);
  process.stdout.write(`run ${i + 1}/${runs} … perf ${scores.performance.at(-1)}\n`);
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

console.log(`\nmedian of ${runs} runs — ${url}`);
for (const [key, values] of Object.entries(scores)) {
  const m = median(values);
  console.log(
    `  ${key.padEnd(16)} ${String(m).padStart(3)}  ${m >= 90 ? 'PASS' : 'BELOW 90'}   (${values.join(', ')})`,
  );
}
console.log(
  `  metrics          FCP ${Math.round(median(metrics.fcp))}ms  LCP ${Math.round(median(metrics.lcp))}ms  ` +
    `TBT ${Math.round(median(metrics.tbt))}ms  CLS ${median(metrics.cls).toFixed(3)}`,
);
