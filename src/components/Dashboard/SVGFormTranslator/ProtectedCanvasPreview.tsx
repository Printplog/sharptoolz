import { useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, Loader2, ShieldCheck } from "lucide-react";

import { formatDate } from "@/lib/utils/dateFormatter";
import useToolStore from "@/store/formStore";
import type { FormField, ProtectedPreview, ProtectedPreviewLayer } from "@/types";


type Props = {
  preview: ProtectedPreview;
  embedToken: string;
  parentOrigin: string;
  isTest: boolean;
  templateName: string;
};

type LoadedImages = Map<string, ImageBitmap>;

async function fetchImage(url: string, embedToken: string, parentOrigin: string) {
  const response = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Embed ${embedToken}`,
      "X-Embed-Origin": parentOrigin,
    },
  });
  if (!response.ok) throw new Error(`Protected preview asset failed (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Protected preview returned an invalid asset.");
  return createImageBitmap(blob);
}

function fieldText(field: FormField | undefined) {
  if (!field) return "";
  const value = field.currentValue ?? "";
  if (field.dateFormat && typeof value === "string" && value) {
    return formatDate(value, field.dateFormat) || value;
  }
  return String(value);
}

function shouldDraw(layer: ProtectedPreviewLayer, field: FormField | undefined) {
  if (!field) return false;
  if (layer.option_value !== null) {
    return String(field.currentValue ?? "") === String(layer.option_value);
  }
  if (layer.field_type === "hide" || layer.field_type === "status") {
    const raw = field.currentValue;
    const enabled = typeof raw === "boolean" ? raw : raw === "true" || raw === "1";
    return layer.inverted ? !enabled : enabled;
  }
  return true;
}

function applyMatrix(context: CanvasRenderingContext2D, layer: ProtectedPreviewLayer) {
  const { a, b, c, d, e, f } = layer.matrix;
  context.setTransform(a, b, c, d, e, f);
}

function drawText(context: CanvasRenderingContext2D, layer: ProtectedPreviewLayer, value: string) {
  const fontSize = layer.fontSize || 16;
  context.font = `${layer.fontStyle || "normal"} ${layer.fontWeight || "400"} ${fontSize}px ${layer.fontFamily || "Arial"}`;
  context.fillStyle = layer.fill || "#000000";
  context.textBaseline = "alphabetic";
  context.textAlign = layer.textAnchor === "middle" ? "center" : layer.textAnchor === "end" ? "right" : "left";
  const letterSpacingContext = context as CanvasRenderingContext2D & { letterSpacing?: string };
  if (typeof letterSpacingContext.letterSpacing === "string") {
    letterSpacingContext.letterSpacing = layer.letterSpacing || "0px";
  }
  value.split("\n").forEach((line, index) => {
    context.fillText(line, layer.x, layer.y + index * fontSize * 1.2);
  });
}

function drawWatermark(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.resetTransform();
  context.globalAlpha = 0.28;
  context.fillStyle = "#111827";
  context.font = "700 20px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 4);
  const diagonal = Math.hypot(width, height);
  for (let y = -diagonal; y <= diagonal; y += 120) {
    for (let x = -diagonal; x <= diagonal; x += 260) {
      context.fillText("FAKE DOCUMENT", x, y);
    }
  }
  context.restore();
}

function isBackdrop(layer: ProtectedPreviewLayer, preview: ProtectedPreview) {
  return layer.kind === "image" &&
    (layer.width || 0) >= preview.width * 0.8 &&
    (layer.height || 0) >= preview.height * 0.8;
}

export default function ProtectedCanvasPreview({
  preview,
  embedToken,
  parentOrigin,
  isTest,
  templateName,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fields = useToolStore((state) => state.fields);
  const [images, setImages] = useState<LoadedImages | null>(null);
  const [error, setError] = useState("");

  const imageUrls = useMemo(() => {
    const urls = new Set<string>([preview.base_url]);
    preview.layers.forEach((layer) => {
      if (layer.asset_url) urls.add(layer.asset_url);
    });
    return Array.from(urls);
  }, [preview]);

  useEffect(() => {
    let cancelled = false;
    let loaded: LoadedImages | null = null;
    setImages(null);
    setError("");
    Promise.all(
      imageUrls.map(async (url) => [url, await fetchImage(url, embedToken, parentOrigin)] as const),
    )
      .then((entries) => {
        loaded = new Map(entries);
        if (cancelled) {
          loaded.forEach((image) => image.close());
          return;
        }
        setImages(loaded);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Protected preview could not be loaded.");
        }
      });
    return () => {
      cancelled = true;
      loaded?.forEach((image) => image.close());
    };
  }, [embedToken, imageUrls, parentOrigin]);

  useEffect(() => {
    if (!images) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const base = images.get(preview.base_url);
    if (!canvas || !context || !base) return;

    const frame = requestAnimationFrame(() => {
      const fieldsById = new Map(fields.map((field) => [field.id, field]));
      context.resetTransform();
      context.clearRect(0, 0, preview.width, preview.height);
      context.drawImage(base, 0, 0, preview.width, preview.height);

      const orderedLayers = [
        ...preview.layers.filter((layer) => isBackdrop(layer, preview)),
        ...preview.layers.filter((layer) => !isBackdrop(layer, preview)),
      ];
      orderedLayers.forEach((layer) => {
        const field = fieldsById.get(layer.field_id);
        if (!shouldDraw(layer, field)) return;
        context.save();
        applyMatrix(context, layer);
        // Select options are hidden in the source until chosen. Once chosen,
        // mirror the SVG translator by making that active layer fully visible.
        context.globalAlpha = layer.option_value !== null
          ? 1
          : Number.isFinite(layer.opacity) ? layer.opacity : 1;
        if (layer.kind === "image" && layer.asset_url) {
          const image = images.get(layer.asset_url);
          if (image && layer.width && layer.height) {
            context.drawImage(image, layer.x, layer.y, layer.width, layer.height);
          }
        } else if (layer.kind === "text") {
          drawText(context, layer, fieldText(field));
        }
        context.restore();
      });

      if (isTest) drawWatermark(context, preview.width, preview.height);
    });
    return () => cancelAnimationFrame(frame);
  }, [fields, images, isTest, preview]);

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-red-300">
        <ImageOff className="h-9 w-9" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div data-protected-preview className="relative min-h-[400px] overflow-hidden rounded-lg bg-white">
      {!images ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-zinc-950/85 text-sm text-white">
          <Loader2 className="h-5 w-5 animate-spin" /> Preparing protected preview…
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        width={preview.width}
        height={preview.height}
        role="img"
        aria-label={`Live protected preview of ${templateName}`}
        className="block h-auto w-full"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-zinc-950/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
        <ShieldCheck className="h-3.5 w-3.5 text-lime-300" /> SVG protected
      </div>
    </div>
  );
}
