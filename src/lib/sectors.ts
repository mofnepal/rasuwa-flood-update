/**
 * Sector classification of the contributor register.
 *
 * The stored `Contribution.sector` is an editable field; these rules only supply
 * the suggestion an officer sees at entry time and the initial value at import.
 */

export interface Sector {
  code: string;
  name_ne: string;
  name_en: string;
}

export const SECTORS: readonly Sector[] = [
  { code: 'individual', name_ne: 'व्यक्तिगत', name_en: 'Individuals' },
  { code: 'bank', name_ne: 'बैंक तथा वित्तीय संस्था', name_en: 'Banks & financial institutions' },
  { code: 'insurance', name_ne: 'बीमा', name_en: 'Insurance' },
  { code: 'industry', name_ne: 'उद्योग तथा उत्पादन', name_en: 'Industry & manufacturing' },
  { code: 'trade', name_ne: 'व्यापार, अटो तथा सेवा', name_en: 'Trade, auto & services' },
  { code: 'hospitality', name_ne: 'होटल तथा पर्यटन', name_en: 'Hotels & tourism' },
  { code: 'tech', name_ne: 'सूचना प्रविधि तथा दूरसञ्चार', name_en: 'IT & telecom' },
  { code: 'health', name_ne: 'स्वास्थ्य', name_en: 'Health' },
  { code: 'education', name_ne: 'शिक्षा', name_en: 'Education' },
  { code: 'media', name_ne: 'सञ्चार तथा चलचित्र', name_en: 'Media & film' },
  { code: 'energy', name_ne: 'ऊर्जा / जलविद्युत', name_en: 'Energy / hydropower' },
  {
    code: 'association',
    name_ne: 'संघ, संस्था तथा सामाजिक',
    name_en: 'Associations, trusts & social',
  },
  { code: 'gov', name_ne: 'सरकारी / नियामक निकाय', name_en: 'Government & regulators' },
  { code: 'embassy', name_ne: 'दूतावास', name_en: 'Embassies' },
  { code: 'other', name_ne: 'अन्य कम्पनी', name_en: 'Other companies' },
];

export const SECTOR_CODES = SECTORS.map((s) => s.code);

export function sectorByCode(code: string): Sector | undefined {
  return SECTORS.find((s) => s.code === code);
}

export function sectorName(code: string, locale: 'ne' | 'en'): string {
  const sector = sectorByCode(code);
  if (!sector) return code;
  return locale === 'ne' ? sector.name_ne : sector.name_en;
}

/** Order matters — the first matching rule wins. */
const RULES: ReadonlyArray<readonly [string, readonly RegExp[]]> = [
  ['embassy', [/\bembassy\b/]],
  [
    'gov',
    [
      /insurance authority/,
      /tea development/,
      /nepse/,
      /karmachari sanchaya/,
      /citizen investment/,
      /rastriya banijya/,
      /nepal bank limited/,
      /agricultural development bank/,
      /nifra/,
      /salt trading/,
      /nagarik stock/,
    ],
  ],
  ['insurance', [/insurance/, /beema/, /reinsurance/]],
  [
    'bank',
    [
      /\bbank\b/,
      /laghubitta/,
      /bittiya/,
      /finance/,
      /securities/,
      /stock dealer/,
      /hire purchase/,
      /khalti/,
      /co-?operative/,
      /investment/,
      /hathway/,
      /financial services/,
      /ime limited/,
      /ime co/,
      /eshare/,
    ],
  ],
  ['energy', [/hydropower/, /power company/, /electric\b/, /\bpower\b/]],
  [
    'health',
    [
      /medical/,
      /path lab/,
      /hos\. &/,
      /hospital/,
      /\beye\b/,
      /health/,
      /healing/,
      /hygiene/,
      /medicine/,
      /cataract/,
      /pharma/,
      /vigen/,
    ],
  ],
  [
    'education',
    [
      /institute/,
      /studies/,
      /\bait\b/,
      /school/,
      /education/,
      /consultancy/,
      /\becan\b/,
      /publication/,
      /books/,
      /learning/,
      /academ/,
      /college/,
      /kiec/,
    ],
  ],
  ['media', [/films/, /production/, /media/, /television/, /\bfm\b/]],
  [
    'association',
    [
      /art of living/,
      /shanti kendra/,
      /samsad/,
      /manch/,
      /isha nepal/,
      /masjid/,
      /monast/,
      /democracy/,
      /wellness/,
      /cliff/,
      /association/,
      /federation/,
      /\bfed\./,
      /\bclub\b/,
      /samaj/,
      /sangh/,
      /foundation/,
      /trust/,
      /guthi/,
      /satsang/,
      /tapoban/,
      /takiya/,
      /surveyors/,
      /auditors/,
      /\bnada\b/,
      /nafea/,
      /chamber/,
      /yoga/,
      /pariwar/,
      /social service/,
      /ahmadiyya/,
      /gurudham/,
      /jaya janata/,
      /ananda/,
      /pranic/,
      /osho/,
      /kalyankari/,
      /world wildlife/,
      /lions/,
      /cataract project/,
      /\bsamiti\b/,
      /seva/,
      /welfare/,
      /\bnepal\s+\w+\s+association/,
    ],
  ],
  [
    'tech',
    [
      /technolog/,
      /ncell/,
      /info developers/,
      /software/,
      /data vault/,
      /\btech\b/,
      /solutions/,
      /\beon\b/,
      /neoteric/,
      /flextecs/,
      /digital/,
      /insights/,
      /stream peak/,
      /bizcare/,
      /rigo/,
      /midas/,
      /smart choice/,
      /swift/,
    ],
  ],
  [
    'hospitality',
    [
      /sekuwa/,
      /restaurant/,
      /hotel/,
      /trekking/,
      /expedition/,
      /cablecar/,
      /cable car/,
      /hills limited/,
      /darshan/,
      /travels/,
      /soaltee/,
      /dwarika/,
      /resort/,
      /tourism/,
      /airlines/,
    ],
  ],
  [
    'industry',
    [
      /surya nepal/,
      /mottrox/,
      /vanaspati/,
      /processing/,
      /c\.g\. square/,
      /rolling mills/,
      /oils/,
      /packaging/,
      /milk/,
      /distilleries/,
      /polymers/,
      /berger/,
      /jensen/,
      /cement/,
      /steel/,
      /ispat/,
      /distillery/,
      /brewery/,
      /beverage/,
      /foods/,
      /\bfeed/,
      /sugar/,
      /paints/,
      /plywood/,
      /spinning/,
      /wires/,
      /rotomould/,
      /plast/,
      /minerals/,
      /\boil\b/,
      /udyog/,
      /udhyog/,
      /industr/,
      /liquors/,
      /brewing/,
      /herbs/,
      /\btea\b/,
      /synpack/,
      /khadya/,
      /manufactur/,
      /bullion/,
      /agro/,
      /breeder/,
      /spices/,
      /metal/,
      /pellet/,
      /body works/,
      /engineering/,
      /chemical/,
      /patanjali/,
      /ayurved/,
      /gorkha lahari/,
      /jagdamba/,
    ],
  ],
  [
    'trade',
    [
      /automobiles/,
      /clearing/,
      /forwarding/,
      /forewarding/,
      /logistics/,
      /lube/,
      /builders/,
      /contractor/,
      /events/,
      /holding/,
      /company pvt/,
      /trading/,
      /motors/,
      /automotive/,
      /\bauto\b/,
      /rides/,
      /enterprises/,
      /distributors/,
      /emporium/,
      /supply/,
      /syakar/,
      /sipradi/,
      /cimex/,
      /holdings/,
      /\bgroup\b/,
      /mart/,
      /service center/,
      /suzuki/,
      /\bstc\b/,
      /international/,
      /glocal/,
      /silver lining/,
      /broker/,
    ],
  ],
];

/**
 * Suggests a sector from the contributor's name. Individuals are always
 * `individual`; anything unmatched falls back to `other`.
 */
export function suggestSector(
  contributorName: string,
  contributorType: 'institutional' | 'individual' | string,
): string {
  if (contributorType === 'individual') return 'individual';
  const name = (contributorName || '').toLowerCase();
  for (const [code, patterns] of RULES) {
    if (patterns.some((p) => p.test(name))) return code;
  }
  return 'other';
}

/** The official note printed under the sector charts. */
export const SECTOR_NOTE_NE =
  'यो वर्गीकरण माननीय अर्थमन्त्रीज्यूलाई हस्तान्तरण गरिएको सहयोगको नामअनुसारको अभिलेखमा मात्र आधारित छ; बैंक, NCHL र Fonepay मार्फत प्राप्त रकम कुल जम्मा रूपमा मात्र उपलब्ध हुने हुँदा त्यसमा दाताको वर्गीकरण हुँदैन।';
export const SECTOR_NOTE_EN =
  'This classification is based only on the name-wise record of contributions handed over to the Hon. Finance Minister; amounts received through banks, NCHL and Fonepay are available only as totals and carry no contributor categories.';
