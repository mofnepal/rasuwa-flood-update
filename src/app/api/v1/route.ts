import { jsonResponse } from '@/lib/api';
import { BASE_PATH } from '@/lib/constants';
import { OPEN_DATA_FILES } from '@/lib/open-data-files';

/** Index of the open-data endpoints. */
export async function GET() {
  const base = `${BASE_PATH}/api/v1`;
  return jsonResponse({
    portal: 'रसुवा–भोटेकोशी बाढी अपडेट — MoF Rasuwa–Bhotekoshi Flood Update',
    publisher: 'Government of Nepal, Ministry of Finance',
    licence: 'Open data. Attribution to the Ministry of Finance is requested.',
    note: 'Published records only. Every response carries the as_of of its source.',
    endpoints: {
      summary: `${base}/summary`,
      contributions: `${base}/contributions?type=&mode=&sector=&from=&to=&q=&page=&format=csv`,
      channels: `${base}/channels?network=NCHL|FONEPAY&period=cumulative|daily`,
      fund_status: `${base}/fund-status`,
      foreign: `${base}/foreign?format=csv`,
      rescue_latest: `${base}/rescue/latest`,
      rescue_reports: `${base}/rescue/reports`,
      decisions: `${base}/decisions`,
      contacts: `${base}/contacts`,
    },
    files: Object.fromEntries(
      Object.entries(OPEN_DATA_FILES).map(([file, about]) => [
        file,
        { url: `${BASE_PATH}/open-data/${file}`, about },
      ]),
    ),
  });
}
