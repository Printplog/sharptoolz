// Barcode ID carrier helpers — single-carrier format, modelled on .qrcode_.
//
//   Base.barcode_(symbology)(generator rule tokens)
//        │       │           └ same paren-token syntax as gen/qrcode rules
//        │       └ first (…) token is the symbology (bcid)
//        └ optional AUTO: prefix → auto-generate
//
//   e.g.  Flight_QR.barcode_(pdf417)(dep_Passenger_Name)(rn[6])
//         Order.barcode_AUTO:(code128)(dep_OrderId)
//         Pkg.barcode_(ean13)                       ← symbology only, content from text/user
//
// The whole thing lives in one ".barcode_" carrier (no separate ".gen_"), just
// like QR keeps everything in ".qrcode_".

import { DEFAULT_SYMBOLOGY } from "./barcodeSymbologies";

// Split an ID on dots that are NOT inside parentheses (rule tokens may contain dots).
const ID_SPLIT = /\.(?![^(]*\))/g;

export interface BarcodeCarrier {
  symbology: string; // bcid; "" when omitted (caller applies DEFAULT_SYMBOLOGY)
  rule: string; // content generation rule (paren tokens), without AUTO: prefix
  isAuto: boolean; // AUTO: prefix present → auto-generate
}

/** Parse the value that follows "barcode_" (or "" for a bare .barcode). */
export function parseBarcodeCarrier(value: string): BarcodeCarrier {
  let v = value || "";
  let isAuto = false;
  if (v.startsWith("AUTO:")) {
    isAuto = true;
    v = v.slice(5);
  }
  // Preferred format: (symbology) followed by the rule.
  const m = v.match(/^\(([^)]*)\)(.*)$/);
  if (m) {
    return { symbology: m[1], rule: m[2], isAuto };
  }
  // Backward-compat: bare symbology with no parens (legacy .barcode_pdf417).
  const sym = v.match(/^[^(]*/)?.[0] ?? "";
  return { symbology: sym, rule: v.slice(sym.length), isAuto };
}

/** Build the value that follows "barcode_". */
export function buildBarcodeCarrier(symbology: string, rule: string, isAuto: boolean): string {
  const sym = symbology || DEFAULT_SYMBOLOGY;
  return `${isAuto ? "AUTO:" : ""}(${sym})${rule || ""}`;
}

/** Read the barcode carrier out of a full element ID, or null if there's no barcode part. */
export function readBarcodeFromId(id: string): BarcodeCarrier | null {
  const part = (id || "").split(ID_SPLIT).find((p) => p === "barcode" || p.startsWith("barcode_"));
  if (!part) return null;
  return parseBarcodeCarrier(part === "barcode" ? "" : part.slice("barcode_".length));
}

/**
 * Rewrite the barcode carrier inside a full ID, preserving everything else
 * (base id, late modifiers like .editable / .showIf_). Only the provided fields
 * are changed; the rest are kept from the existing carrier.
 */
export function writeBarcodeToId(
  id: string,
  patch: { symbology?: string; rule?: string; isAuto?: boolean }
): string {
  const parts = (id || "").split(ID_SPLIT);
  const idx = parts.findIndex((p) => p === "barcode" || p.startsWith("barcode_"));
  if (idx === -1) return id;
  const cur = parseBarcodeCarrier(parts[idx] === "barcode" ? "" : parts[idx].slice("barcode_".length));
  const sym = patch.symbology ?? cur.symbology;
  const rule = patch.rule ?? cur.rule;
  const isAuto = patch.isAuto ?? cur.isAuto;
  parts[idx] = `barcode_${buildBarcodeCarrier(sym, rule, isAuto)}`;
  return parts.join(".");
}
