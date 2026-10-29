// Every ISO 3166-1 alpha-2 country code. Names come from the browser (Intl), flags from flagcdn.
const CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS " +
  "BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE " +
  "EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM " +
  "HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC " +
  "LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA " +
  "NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO " +
  "TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW"
).split(" ");

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  displayNames = null;
}

export function countryName(code: string): string {
  const upper = code.toUpperCase();
  if (upper === "XK") return "Kosovo";
  return displayNames?.of(upper) ?? upper;
}

export type CountryOption = { code: string; name: string };

/** All countries, sorted by name. */
export const ALL_COUNTRIES: CountryOption[] = CODES.map((code) => ({ code, name: countryName(code) })).sort(
  (a, b) => a.name.localeCompare(b.name),
);

/** Flag image for a 2-letter code, `width` 20/40/80/160 px. */
export function flagUrl(code: string, width: 20 | 40 | 80 | 160 = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

/** Also match common short names people type, e.g. "usa", "uk", "uae". */
const ALIASES: Record<string, string[]> = {
  US: ["usa", "america"],
  GB: ["uk", "britain", "england", "scotland", "wales"],
  AE: ["uae", "dubai"],
  KR: ["korea"],
  CD: ["drc", "congo"],
  NL: ["holland"],
  CZ: ["czech republic"],
};

export function matchesCountry(country: CountryOption, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    country.name.toLowerCase().includes(needle) ||
    country.code.toLowerCase() === needle ||
    (ALIASES[country.code] ?? []).some((alias) => alias.startsWith(needle))
  );
}
