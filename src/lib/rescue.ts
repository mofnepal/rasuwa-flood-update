import { z } from 'zod';

/**
 * Structure of the NDRRMA and Nepal Police daily reports.
 * `RescueReport.data` is validated against these before it can be saved, so an
 * import can never put a malformed report in front of the public.
 */

export const ndrrmaSchema = z.object({
  as_of: z.string(),
  as_of_bs: z.string(),
  source: z.string(),
  human_casualties: z.number(),
  bodies_by_district: z.record(z.string(), z.number()),
  bodies_note_ne: z.string().optional(),
  bodies_note_en: z.string().optional(),
  injured_note_ne: z.string().optional(),
  injured_note_en: z.string().optional(),
  dead_body_handover: z.number(),
  dna_note_ne: z.string().optional(),
  dna_note_en: z.string().optional(),
  missing_total_approx: z.number(),
  missing_breakdown: z.record(z.string(), z.number()),
  /// Where the report breaks one district down further, as it does for Rasuwa.
  missing_rasuwa_breakdown: z.record(z.string(), z.number()).optional(),
  missing_nuwakot_breakdown: z.record(z.string(), z.number()).optional(),
  /// True where the report states that the bodies handed over have already been
  /// deducted from the missing total. Earlier reports did not deduct them, so
  /// this must be read from the report rather than assumed.
  missing_excludes_handover: z.boolean().optional(),
  missing_note_ne: z.string().optional(),
  missing_note_en: z.string().optional(),
  rescued_till_date: z.number(),
  helicopter_flights: z.object({
    nepali_army_total: z.number(),
    nepali_army_total_as_of: z.string().optional(),
    nepali_army_today: z.number().optional(),
    apf: z.number().optional(),
    private_from_kathmandu: z.number().optional(),
  }),
  /// Some reports print a headline total for the injured and some only the parts.
  injured_receiving_treatment: z.number().optional(),
  /// True when the total above is the sum of the parts rather than a figure the
  /// agency printed. The page says so wherever it shows it.
  injured_total_derived: z.boolean().optional(),
  injured_breakdown: z.record(z.string(), z.number()),
  security_personnel_mobilised: z.number(),
  security_breakdown: z.record(z.string(), z.number()),
  cash_support_npr: z.record(z.string(), z.number()),
  holding_center_people: z.number(),
  holding_centers_count: z.number().optional(),
  holding_center_breakdown: z.record(z.string(), z.number()),
  /// Not every report carries this; when it is absent the portal shows nothing
  /// rather than repeating an older figure.
  electricity_restored_pct: z.record(z.string(), z.number()).optional(),
  psychosocial_health_personnel: z.number().optional(),
  relief_supplies_ne: z.string().optional(),
  relief_supplies_en: z.string().optional(),
  /// Road and bridge links restored, where a report mentions them.
  bridge_note_ne: z.string().optional(),
  bridge_note_en: z.string().optional(),
  fuel_stock: z.record(z.string(), z.number()).optional(),
  telecom_towers: z.record(z.string(), z.array(z.number())).optional(),
  footer_note_ne: z.string().optional(),
  footer_note_en: z.string().optional(),
});

export const policeSchema = z.object({
  as_of: z.string(),
  as_of_bs: z.string(),
  source: z.string(),
  personnel_mobilised: z.number(),
  personnel_affected: z.number().optional(),
  personnel_out_of_contact: z.number().optional(),
  awareness_programs: z.object({ participants: z.number(), programs: z.number() }).optional(),
  bodies_found: z.object({
    male: z.number(),
    female: z.number(),
    partial_remains: z.number(),
    total: z.number(),
  }),
  bodies_managed_buried: z.number(),
  body_handover: z.number(),
  missing: z.object({
    domestic: z.object({ male: z.number(), female: z.number(), total: z.number() }),
    foreign: z.object({
      male: z.number(),
      female: z.number(),
      other: z.number().optional(),
      total: z.number(),
    }),
    total: z.number(),
  }),
  injured_rescued: z.object({
    male: z.number(),
    female: z.number(),
    unknown: z.number().optional(),
    total: z.number(),
  }),
  unidentified_uploaded_to_website: z.number(),
  in_holding_center: z.number(),
  dna: z.object({ deceased: z.number(), relatives: z.number(), total: z.number() }),
});

export type NdrrmaReport = z.infer<typeof ndrrmaSchema>;
export type PoliceReport = z.infer<typeof policeSchema>;

/** Districts nearest the breach; everything else is downstream. */
export const CORE_DISTRICTS = ['Rasuwa', 'Nuwakot', 'Dhading'] as const;

export const DISTRICT_NAMES_NE: Record<string, string> = {
  Rasuwa: 'रसुवा',
  Nuwakot: 'नुवाकोट',
  Dhading: 'धादिङ',
  Gorkha: 'गोरखा',
  Chitwan: 'चितवन',
  Tanahun: 'तनहुँ',
  'Nawalparasi East': 'नवलपरासी (पूर्व)',
  'Nawalparasi West': 'नवलपरासी (पश्चिम)',
};

export function districtName(key: string, locale: 'ne' | 'en'): string {
  return locale === 'ne' ? (DISTRICT_NAMES_NE[key] ?? key) : key;
}

/**
 * The agencies key their breakdowns however they please — sometimes a field name
 * (`nepali_army`), sometimes an English phrase ("Armed Police Force"). Neither
 * belongs on a public page untranslated, so every key the reports have used is
 * given a label in both languages here.
 *
 * An unmapped key falls back to a readable form of itself rather than showing an
 * identifier: `hospitals_discharged` becomes "Hospitals discharged".
 */
const BREAKDOWN_LABELS: Record<string, { ne: string; en: string }> = {
  // injured
  hospitals: { ne: 'अस्पतालमा उपचार', en: 'In hospital' },
  hospitals_discharged: { ne: 'अस्पतालबाट डिस्चार्ज', en: 'Discharged from hospital' },
  nepali_army: { ne: 'नेपाली सेनाद्वारा उपचार', en: 'Treated by the Nepali Army' },
  apf: { ne: 'सशस्त्र प्रहरीद्वारा उपचार', en: 'Treated by the Armed Police Force' },
  // security
  'Nepal Police': { ne: 'नेपाल प्रहरी', en: 'Nepal Police' },
  'Nepali Army': { ne: 'नेपाली सेना', en: 'Nepali Army' },
  'Armed Police Force': { ne: 'सशस्त्र प्रहरी बल', en: 'Armed Police Force' },
  // missing, by source
  'Foreign tourists': { ne: 'विदेशी पर्यटक', en: 'Foreign tourists' },
  'Foreign nationals': { ne: 'विदेशी नागरिक', en: 'Foreign nationals' },
  'DAO Rasuwa': { ne: 'जि.प्र.का. रसुवा', en: 'DAO Rasuwa' },
  'DAO Nuwakot': { ne: 'जि.प्र.का. नुवाकोट', en: 'DAO Nuwakot' },
  'Security personnel & govt officials': {
    ne: 'सुरक्षाकर्मी तथा सरकारी कर्मचारी',
    en: 'Security personnel and government officials',
  },
  // missing from Rasuwa, in detail
  'Citizens of Rasuwa District': { ne: 'रसुवा जिल्लाका नागरिक', en: 'Citizens of Rasuwa District' },
  'Citizens of other districts': { ne: 'अन्य जिल्लाका नागरिक', en: 'Citizens of other districts' },
  'Government employees': { ne: 'सरकारी कर्मचारी', en: 'Government employees' },
  'Bank and financial institution employees': {
    ne: 'बैंक तथा वित्तीय संस्थाका कर्मचारी',
    en: 'Bank and financial institution employees',
  },
  'While undergoing treatment at Kathmandu': {
    ne: 'काठमाडौँमा उपचारका क्रममा',
    en: 'While undergoing treatment in Kathmandu',
  },
  'Citizens from Rasuwa': { ne: 'रसुवाका नागरिक', en: 'Citizens from Rasuwa' },
  'Citizens from Nuwakot': { ne: 'नुवाकोटका नागरिक', en: 'Citizens from Nuwakot' },
  'Citizens of other districts (excluding Rasuwa)': {
    ne: 'अन्य जिल्लाका नागरिक (रसुवा बाहेक)',
    en: 'Citizens of other districts (excluding Rasuwa)',
  },
  // cash support
  '15 affected local governments': {
    ne: '१५ प्रभावित स्थानीय तह',
    en: '15 affected local governments',
  },
  // fuel
  diesel_l: { ne: 'डिजेल (लिटर)', en: 'Diesel (litres)' },
  petrol_l: { ne: 'पेट्रोल (लिटर)', en: 'Petrol (litres)' },
  aviation_l: { ne: 'हवाई इन्धन (लिटर)', en: 'Aviation fuel (litres)' },
  lpg_cylinders: { ne: 'एलपी ग्यास सिलिन्डर', en: 'LP gas cylinders' },
};

/** A breakdown key, rendered for readers rather than for machines. */
export function breakdownLabel(key: string, locale: 'ne' | 'en'): string {
  const mapped = BREAKDOWN_LABELS[key];
  if (mapped) return locale === 'ne' ? mapped.ne : mapped.en;

  const district = DISTRICT_NAMES_NE[key];
  if (district) return locale === 'ne' ? district : key;

  // Never show a raw identifier: turn one into ordinary words.
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(key)) {
    const words = key.replace(/_/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  return key;
}
