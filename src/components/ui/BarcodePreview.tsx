import { useEffect, useState } from "react";
import { generateBarcodeDataUrl } from "@/lib/utils/barcodeGenerator";

interface BarcodePreviewProps {
  value: string;
  symbology?: string;
  maxHeight?: number;
  maxWidth?: number;
}

/**
 * Live barcode preview. Bakes `value` as `symbology` via bwip-js (lazy-loaded)
 * and renders the resulting PNG, or a short error if the input is invalid for
 * the symbology. Shared by the end-user input and the admin rule builder.
 */
export default function BarcodePreview({
  value,
  symbology,
  maxHeight = 90,
  maxWidth = 180,
}: BarcodePreviewProps) {
  const [src, setSrc] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setSrc("");
      setError("");
      return;
    }
    generateBarcodeDataUrl(value, symbology).then(({ dataUrl, error: encodeError }) => {
      if (cancelled) return;
      setSrc(dataUrl);
      setError(dataUrl ? "" : encodeError || "Invalid for symbology");
    });
    return () => {
      cancelled = true;
    };
  }, [value, symbology]);

  if (error) {
    return <div className="text-[9px] text-red-400/70 leading-tight">{error}</div>;
  }
  if (!src) return null;
  return (
    <img
      src={src}
      alt="barcode preview"
      style={{ maxHeight, maxWidth }}
      className="object-contain"
    />
  );
}
