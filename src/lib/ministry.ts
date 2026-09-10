import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';

export interface MinistryDetails {
  name_ne: string;
  name_en: string;
  address_ne: string;
  address_en: string;
  phones: string[];
  emails: string[];
  website: string;
  donate: string;
}

export interface ExternalPortal {
  label_ne: string;
  label_en: string;
  owner: string;
  url: string;
}

interface ReferenceFile {
  ministry: MinistryDetails;
  external_portals: ExternalPortal[];
  contact_intro_ne?: string;
  contact_intro_en?: string;
}

/**
 * Ministry address, telephone numbers and the official portal list.
 * These are published details of the ministry itself rather than disaster
 * records, so they are read from the reference file the ministry supplies.
 */
export const getMinistryReference = cache(async (): Promise<ReferenceFile> => {
  const file = path.join(process.cwd(), 'seed', 'decisions.json');
  const parsed = JSON.parse(await readFile(file, 'utf8')) as ReferenceFile;
  return parsed;
});
