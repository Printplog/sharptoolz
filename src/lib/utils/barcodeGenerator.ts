// Barcode generation via bwip-js (BWIPP).
//
// We "bake" upstream: the input component encodes text -> PNG data URL and
// persists that as the field value. Both the client-side SVG render and the
// server-side PDF/PNG render then just inject the finished image. This is the
// single-source design — nothing regenerates the barcode downstream.

import bwipjs from "bwip-js/browser";
import { getSymbology, showsHumanText, DEFAULT_SYMBOLOGY } from "./barcodeSymbologies";

export interface BarcodeOptions {
  scale?: number; // pixel scaling factor (default 3)
  height?: number; // bar height in mm for linear codes (default 10)
  includetext?: boolean; // override human-readable text
}

export interface BarcodeResult {
  dataUrl: string; // PNG data URL, or "" on failure
  error?: string; // bwip-js error message when encoding failed (e.g. bad input)
}

/**
 * Generate a barcode synchronously and return a PNG data URL.
 * Returns empty string on failure.
 */
export function generateBarcodeDataUrlSync(
  text: string,
  bcid: string = DEFAULT_SYMBOLOGY,
  opts: BarcodeOptions = {}
): string {
  if (!text) return "";

  const def = getSymbology(bcid);
  const is2D = def?.category === "2D";
  const isPostal = def?.category === "Postal";
  const showText = opts.includetext ?? showsHumanText(bcid);

  const canvas = document.createElement("canvas");
  try {
    bwipjs.toCanvas(canvas, {
      bcid: bcid || DEFAULT_SYMBOLOGY,
      text,
      scale: opts.scale ?? 3,
      // Height only applies to linear/height-modulated codes; matrix codes size by scale.
      ...(is2D ? {} : { height: opts.height ?? (isPostal ? undefined : 10) }),
      includetext: showText,
      textxalign: "center",
      backgroundcolor: "ffffff", // light quiet zone — required for reliable scanning
      paddingwidth: 2,
      paddingheight: 2,
    });
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Barcode Generation Error (Sync):", e);
    return "";
  }
}

/**
 * Encode `text` as `bcid` and return a PNG data URL.
 * Returns { dataUrl: "" , error } when the input is invalid for the symbology
 * (e.g. letters in an EAN-13) so the caller can surface a clear message.
 */
export async function generateBarcodeDataUrl(
  text: string,
  bcid: string = DEFAULT_SYMBOLOGY,
  opts: BarcodeOptions = {}
): Promise<BarcodeResult> {
  if (!text) return { dataUrl: "" };

  const def = getSymbology(bcid);
  const is2D = def?.category === "2D";
  const isPostal = def?.category === "Postal";
  const showText = opts.includetext ?? showsHumanText(bcid);

  const canvas = document.createElement("canvas");
  try {
    bwipjs.toCanvas(canvas, {
      bcid: bcid || DEFAULT_SYMBOLOGY,
      text,
      scale: opts.scale ?? 3,
      // Height only applies to linear/height-modulated codes; matrix codes size by scale.
      ...(is2D ? {} : { height: opts.height ?? (isPostal ? undefined : 10) }),
      includetext: showText,
      textxalign: "center",
      backgroundcolor: "ffffff", // light quiet zone — required for reliable scanning
      paddingwidth: 2,
      paddingheight: 2,
    });
    return { dataUrl: canvas.toDataURL("image/png") };
  } catch (e) {
    // bwip-js throws a string or Error when the text is invalid for the symbology.
    const message = e instanceof Error ? e.message : String(e);
    return { dataUrl: "", error: message };
  }
}

