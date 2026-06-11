// Barcode symbology catalog (bwip-js / BWIPP backed).
//
// Each entry maps a human-friendly label to a bwip-js `bcid`. The catalog drives
// the admin symbology picker (grouped by category, like TEC-IT) and the
// aspect-ratio decision at injection time.
//
// `fixedAspect: true` means the code must NOT be stretched to fill its box — its
// module grid is geometry-sensitive (all 2D matrices, MaxiCode, and the
// height-modulated postal codes). Linear codes tolerate horizontal/vertical
// stretch, so they default to fixedAspect: false.

export type SymbologyCategory =
  | "Linear"
  | "EAN / UPC"
  | "GS1 DataBar"
  | "Postal"
  | "2D";

export interface SymbologyDef {
  bcid: string; // bwip-js barcode id
  label: string;
  category: SymbologyCategory;
  fixedAspect?: boolean; // preserve aspect ratio on injection (2D / postal / fixed-geometry)
}

export const SYMBOLOGIES: SymbologyDef[] = [
  // --- Linear ---
  { bcid: "code128", label: "Code 128", category: "Linear" },
  { bcid: "code39", label: "Code 39", category: "Linear" },
  { bcid: "code93", label: "Code 93", category: "Linear" },
  { bcid: "code11", label: "Code 11", category: "Linear" },
  { bcid: "codabar", label: "Codabar", category: "Linear" },
  { bcid: "interleaved2of5", label: "Interleaved 2 of 5", category: "Linear" },
  { bcid: "itf14", label: "ITF-14", category: "Linear" },
  { bcid: "msi", label: "MSI", category: "Linear" },
  { bcid: "pharmacode", label: "Pharmacode", category: "Linear" },
  { bcid: "telepen", label: "Telepen", category: "Linear" },

  // --- EAN / UPC ---
  { bcid: "ean13", label: "EAN-13", category: "EAN / UPC" },
  { bcid: "ean8", label: "EAN-8", category: "EAN / UPC" },
  { bcid: "upca", label: "UPC-A", category: "EAN / UPC" },
  { bcid: "upce", label: "UPC-E", category: "EAN / UPC" },
  { bcid: "isbn", label: "ISBN", category: "EAN / UPC" },
  { bcid: "ismn", label: "ISMN", category: "EAN / UPC" },
  { bcid: "issn", label: "ISSN", category: "EAN / UPC" },

  // --- GS1 DataBar ---
  { bcid: "databaromni", label: "GS1 DataBar Omnidirectional", category: "GS1 DataBar" },
  { bcid: "databarstacked", label: "GS1 DataBar Stacked", category: "GS1 DataBar" },
  { bcid: "databarlimited", label: "GS1 DataBar Limited", category: "GS1 DataBar" },
  { bcid: "databarexpanded", label: "GS1 DataBar Expanded", category: "GS1 DataBar" },
  { bcid: "gs1-128", label: "GS1-128", category: "GS1 DataBar" },
  { bcid: "gs1datamatrix", label: "GS1 DataMatrix", category: "GS1 DataBar", fixedAspect: true },
  { bcid: "gs1qrcode", label: "GS1 QR Code", category: "GS1 DataBar", fixedAspect: true },

  // --- Postal (height-modulated: must preserve aspect) ---
  { bcid: "onecode", label: "USPS Intelligent Mail", category: "Postal", fixedAspect: true },
  { bcid: "postnet", label: "POSTNET", category: "Postal", fixedAspect: true },
  { bcid: "planet", label: "PLANET", category: "Postal", fixedAspect: true },
  { bcid: "royalmail", label: "Royal Mail", category: "Postal", fixedAspect: true },
  { bcid: "auspost", label: "Australia Post", category: "Postal", fixedAspect: true },
  { bcid: "japanpost", label: "Japan Post", category: "Postal", fixedAspect: true },
  { bcid: "kix", label: "Royal TNT (KIX)", category: "Postal", fixedAspect: true },

  // --- 2D ---
  { bcid: "qrcode", label: "QR Code", category: "2D", fixedAspect: true },
  { bcid: "microqr", label: "Micro QR Code", category: "2D", fixedAspect: true },
  { bcid: "datamatrix", label: "Data Matrix", category: "2D", fixedAspect: true },
  { bcid: "azteccode", label: "Aztec Code", category: "2D", fixedAspect: true },
  { bcid: "pdf417", label: "PDF417", category: "2D", fixedAspect: true },
  { bcid: "micropdf417", label: "Micro PDF417", category: "2D", fixedAspect: true },
  { bcid: "maxicode", label: "MaxiCode", category: "2D", fixedAspect: true },
  { bcid: "codablockf", label: "Codablock-F", category: "2D", fixedAspect: true },
  { bcid: "dotcode", label: "DotCode", category: "2D", fixedAspect: true },
  { bcid: "hanxin", label: "Han Xin Code", category: "2D", fixedAspect: true },
];

export const DEFAULT_SYMBOLOGY = "code128";

export const SYMBOLOGY_CATEGORIES: SymbologyCategory[] = [
  "Linear",
  "EAN / UPC",
  "GS1 DataBar",
  "Postal",
  "2D",
];

const BY_BCID: Record<string, SymbologyDef> = Object.fromEntries(
  SYMBOLOGIES.map((s) => [s.bcid, s])
);

/** Look up a symbology definition by its bwip-js bcid. */
export function getSymbology(bcid?: string | null): SymbologyDef | undefined {
  if (!bcid) return undefined;
  return BY_BCID[bcid];
}

/** Human-friendly label for a bcid, falling back to the raw bcid for custom codes. */
export function symbologyLabel(bcid?: string | null): string {
  if (!bcid) return "Barcode";
  return BY_BCID[bcid]?.label ?? bcid;
}

/**
 * Whether a symbology's aspect ratio must be preserved on injection.
 * Unknown (custom) bcids are treated as fixed-aspect — the safe default, since
 * stretching only ever helps plain linear codes.
 */
export function isFixedAspect(bcid?: string | null): boolean {
  if (!bcid) return false;
  const def = BY_BCID[bcid];
  if (!def) return true; // unknown custom code → don't risk stretching it
  return !!def.fixedAspect;
}

/** Whether the symbology renders human-readable text below the bars. */
export function showsHumanText(bcid?: string | null): boolean {
  const def = getSymbology(bcid);
  if (!def) return false;
  return def.category === "Linear" || def.category === "EAN / UPC";
}
