import { NextResponse } from 'next/server';
import * as openData from '@/lib/open-data';
import { csvResponse, jsonResponse } from '@/lib/api';
import { getSearchIndex } from '@/lib/search';
import { BASE_PATH, STATIC_EXPORT } from '@/lib/constants';
import { OPEN_DATA_FILES, type OpenDataFile } from '@/lib/open-data-files';

// Built per request on the ministry's server. The static edition writes each file
// once at build time instead: scripts/build-static.mjs removes this line from its copy.
export const dynamic = 'force-dynamic';

/**
 * Complete open-data files — the whole register, not a page of it. On the
 * ministry's server they are built per request; the static edition writes each
 * one out at build time, so GitHub Pages can serve them as plain files.
 */
export function generateStaticParams() {
  return STATIC_EXPORT ? Object.keys(OPEN_DATA_FILES).map((file) => ({ file })) : [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!(file in OPEN_DATA_FILES)) return jsonResponse({ error: 'no such file' }, 404);

  const respond = (result: openData.OpenData, csvName?: string) => {
    if (!result.ok) return jsonResponse({ error: result.error }, 404);
    return csvName ? csvResponse(result.rows ?? [], csvName) : jsonResponse(result.body);
  };

  switch (file as OpenDataFile) {
    case 'index.json':
      return jsonResponse({
        portal: 'रसुवा–भोटेकोशी बाढी अपडेट — MoF Rasuwa–Bhotekoshi Flood Update',
        publisher: 'Government of Nepal, Ministry of Finance',
        licence: 'Open data. Attribution to the Ministry of Finance is requested.',
        note: 'Published records only. Every file carries the as_of of its source.',
        files: Object.fromEntries(
          Object.entries(OPEN_DATA_FILES).map(([name, about]) => [
            name,
            { url: `${BASE_PATH}/open-data/${name}`, about },
          ]),
        ),
      });
    case 'summary.json':
      return respond(await openData.summary());
    case 'contributions.json':
      return respond(await openData.contributions());
    case 'contributions.csv':
      return respond(await openData.contributions(), 'rasuwa-flood-contributions.csv');
    case 'channels.json':
      return respond(await openData.channels());
    case 'fund-status.json':
      return respond(await openData.fundStatus());
    case 'foreign.json':
      return respond(await openData.foreign());
    case 'foreign.csv':
      return respond(await openData.foreign(), 'rasuwa-flood-foreign-assistance.csv');
    case 'rescue-latest.json':
      return respond(await openData.rescueLatest());
    case 'rescue-reports.json':
      return respond(await openData.rescueReports());
    case 'decisions.json':
      return respond(await openData.decisions());
    case 'contacts.json':
      return respond(await openData.contacts());
    case 'search-ne.json':
    case 'search-en.json':
      return NextResponse.json(await getSearchIndex(file === 'search-en.json' ? 'en' : 'ne'), {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
  }
}
