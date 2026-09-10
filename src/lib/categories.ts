import type { Locale } from './format';

/**
 * The four categories of contribution, and the words used to explain them.
 *
 * Wording is the ministry's own, carried over from the approved prototype. The
 * arithmetic behind it lives in `lib/totals.ts`; the public pages explain the
 * rule in sentences and never print it as a formula.
 */

export interface ContributionCategory {
  code: 'A' | 'B' | 'C' | 'D';
  name_ne: string;
  name_en: string;
  description_ne: string;
  description_en: string;
}

export const CONTRIBUTION_CATEGORIES: readonly ContributionCategory[] = [
  {
    code: 'A',
    name_ne: 'अनलाइन / बैंकिङ च्यानल (रु.)',
    name_en: 'Online / banking channels (NPR)',
    description_ne:
      'donate.gov.np मार्फत NCHL र Fonepay नेटवर्कबाट कोषका बैंक खातामा जम्मा भएको रकम। कोष स्थिति विवरण (नेपाल राष्ट्र बैंक) को बैंक-अनुसार विवरण यसै रकमको खाता स्थिति हो — थप गरिँदैन।',
    description_en:
      "Amounts settled into the Fund's bank accounts via the NCHL and Fonepay networks through donate.gov.np. The bank-wise fund status statement (Nepal Rastra Bank) is the account view of this same money and is not added on top.",
  },
  {
    code: 'B',
    name_ne: 'चेक / हस्तान्तरण — मा. अर्थमन्त्री समक्ष (रु.)',
    name_en: 'Cheque / handover to the Hon. Finance Minister (NPR)',
    description_ne:
      'संस्था तथा व्यक्तिले मा. अर्थमन्त्री समक्ष हस्तान्तरण गरेका चेक र बैंक ट्रान्सफर — नामसहितको छुट्टै डाटाबेस।',
    description_en:
      'Cheques and bank transfers handed over to the Hon. Finance Minister by institutions and individuals — a separate, name-wise database.',
  },
  {
    code: 'C',
    name_ne: 'वैदेशिक सहयोग — विदेशी मुद्रा जम्मा (USD)',
    name_en: 'Foreign assistance — foreign-currency deposits (USD)',
    description_ne:
      'कोषका USD खाता (हिमालयन बैंक, लक्ष्मी सनराइज बैंक) मा बाढीपछि जम्मा भएको कुल विदेशी मुद्रा — प्रधानमन्त्री दैवी प्रकोप उद्धार कोषको कोष स्थिति विवरण (नेपाल राष्ट्र बैंक) अनुसार। यही रकम वैदेशिक सहयोगको कुल हो; नामसहित पहिचान भएका दाता यसैको उपसमूह हुन्।',
    description_en:
      "Total foreign currency deposited after the flood in the Fund's USD accounts (Himalayan Bank, Laxmi Sunrise Bank) per the Prime Minister Disaster Relief Fund status statement (Nepal Rastra Bank). This is the foreign-assistance total; named contributors are a subset of it.",
  },
  {
    code: 'D',
    name_ne: 'वैदेशिक सहयोग — नामसहित पहिचान (USD)',
    name_en: 'Foreign assistance — identified contributors (USD)',
    description_ne:
      'विदेशी सरकार, दूतावास, कम्पनी तथा दातृ निकायबाट प्राप्त, नाम र मितिसहित प्रमाणित सहयोग (हस्तान्तरण गरिएका USD चेक समेत) — वर्ग ग भित्रै समावेश, थप गरिँदैन।',
    description_en:
      'Verified, named contributions from foreign governments, embassies, corporations and donors, including USD cheques handed over to the Hon. Finance Minister — already inside C, not added again.',
  },
];

export const CATEGORY_BLOCK_TITLE_NE = 'सहयोगका वर्ग तथा गणना विधि';
export const CATEGORY_BLOCK_TITLE_EN = 'Contribution categories and how they are counted';
export const CATEGORY_BLOCK_SUBTITLE_NE =
  'प्रधानमन्त्री दैवी प्रकोप उद्धार कोषमा प्राप्त सहयोगको आधिकारिक वर्गीकरण';
export const CATEGORY_BLOCK_SUBTITLE_EN =
  'Official classification of contributions received by the Prime Minister Disaster Relief Fund';

export function categoryName(category: ContributionCategory, locale: Locale): string {
  return locale === 'ne' ? category.name_ne : category.name_en;
}

export function categoryDescription(category: ContributionCategory, locale: Locale): string {
  return locale === 'ne' ? category.description_ne : category.description_en;
}
