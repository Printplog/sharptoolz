import { useMemo } from "react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

export const useElementTransform = (
  localElement: SvgElement,
  handleLocalUpdate: (updates: Partial<SvgElement>) => void,
  allElements: SvgElement[] = []
) => {
  const currentTransform = useMemo(() => {
    const style = localElement.attributes.style || "";
    const transformAttr = localElement.attributes.transform || "";
    const combined = `${style} ${transformAttr}`.replace(/,/g, " ");

    const getVal = (regex: RegExp) => {
      const match = combined.match(regex);
      return match ? parseFloat(match[1]) : null;
    };

    let rotate = getVal(/rotate\s*\(\s*(-?\d+\.?\d*)/);
    let scale = getVal(/scale\s*\(\s*(-?\d+\.?\d*)/);

    const transMatch = combined.match(/translate\s*\(\s*(-?\d+\.?\d*)\s*(-?\d+\.?\d*|)/);
    let translateX = 0;
    let translateY = 0;
    if (transMatch) {
      translateX = parseFloat(transMatch[1]);
      translateY = transMatch[2] ? parseFloat(transMatch[2]) : 0;
    }

    const matrixMatch = combined.match(
      /matrix\s*\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)\s*\)/
    );
    if (matrixMatch) {
      const a = parseFloat(matrixMatch[1]);
      const b = parseFloat(matrixMatch[2]);
      translateX = parseFloat(matrixMatch[5]);
      translateY = parseFloat(matrixMatch[6]);

      if (rotate === null) {
        rotate = Math.round(Math.atan2(b, a) * (180 / Math.PI));
      }
      if (scale === null) {
        scale = parseFloat(Math.sqrt(a * a + b * b).toFixed(2));
      }
    }

    const baseX = parseFloat(localElement.attributes.x || localElement.attributes.cx || "0");
    const baseY = parseFloat(localElement.attributes.y || localElement.attributes.cy || "0");
    const safeBaseX = isNaN(baseX) ? 0 : baseX;
    const safeBaseY = isNaN(baseY) ? 0 : baseY;

    const absoluteX = safeBaseX + translateX;
    const absoluteY = safeBaseY + translateY;

    return {
      rotate: rotate ?? 0,
      scale: scale ?? 1,
      translateX: absoluteX,
      translateY: absoluteY,
    };
  }, [
    localElement.attributes.style,
    localElement.attributes.transform,
    localElement.attributes.x,
    localElement.attributes.y,
    localElement.attributes.cx,
    localElement.attributes.cy,
  ]);

  const center = useMemo(() => {
    const tag = localElement.tag.toLowerCase();
    const transform = localElement.attributes.transform || "";
    const rotateMatch = transform.match(/rotate\s*\(\s*(-?[\d.]+)\s*(?:[ ,]\s*(-?[\d.]+)\s*[ ,]\s*(-?[\d.]+)\s*)?\)/);
    if (rotateMatch && rotateMatch[2] && rotateMatch[3]) {
      const cx = parseFloat(rotateMatch[2]);
      const cy = parseFloat(rotateMatch[3]);
      if (!isNaN(cx) && !isNaN(cy)) return { cx, cy };
    }

    if (tag === 'circle' || tag === 'ellipse') {
       const cx = parseFloat(localElement.attributes.cx || "0");
       const cy = parseFloat(localElement.attributes.cy || "0");
       if (!isNaN(cx) && !isNaN(cy)) return { cx, cy };
    }

    const xAttr = localElement.attributes.x || localElement.attributes.cx || "0";
    const yAttr = localElement.attributes.y || localElement.attributes.cy || "0";
    let wAttr = localElement.attributes.width || "";
    let hAttr = localElement.attributes.height || "";

    if (tag === "use" && (!wAttr || !hAttr)) {

      const hrefAttr = localElement.attributes.href || localElement.attributes['xlink:href'] || "";
      if (hrefAttr.startsWith("#")) {
        const referencedId = hrefAttr.substring(1);
        const referencedEl = allElements.find(el => el.id === referencedId || el.originalId === referencedId);
        if (referencedEl) {
          if (!wAttr) wAttr = referencedEl.attributes.width || "";
          if (!hAttr) hAttr = referencedEl.attributes.height || "";
        }
      }
    }

    const x = parseFloat(xAttr);
    const y = parseFloat(yAttr);
    const w = parseFloat(wAttr);
    const h = parseFloat(hAttr);

    if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return { cx: x + w / 2, cy: y + h / 2 };
    }

    if (tag === 'text' && !isNaN(x) && !isNaN(y)) {
      return { cx: x, cy: y };
    }

    return { cx: isNaN(x) ? 0 : x, cy: isNaN(y) ? 0 : y };
  }, [localElement, allElements]);

  const updateTransform = (
    key: "rotate" | "scale" | "translateX" | "translateY",
    value: number
  ) => {
    const transformAttr = localElement.attributes.transform || "";
    const matrixRegex =
      /matrix\s*\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+(-?[\d.]+)\s*\)/;
    const matrixMatch = transformAttr.match(matrixRegex);

    const tag = localElement.tag.toLowerCase();
    const hasXY = ["rect", "image", "use", "text", "tspan"].includes(tag);
    const hasCxCy = ["circle", "ellipse"].includes(tag);

    const style = localElement.attributes.style || "";
    const combined = `${style} ${transformAttr}`.replace(/,/g, " ");
    const hasTranslate = /translate\s*\(/.test(combined);

    const baseX = parseFloat(localElement.attributes.x || localElement.attributes.cx || "0");
    const baseY = parseFloat(localElement.attributes.y || localElement.attributes.cy || "0");
    const safeBaseX = isNaN(baseX) ? 0 : baseX;
    const safeBaseY = isNaN(baseY) ? 0 : baseY;

    if (matrixMatch && (key === "translateX" || key === "translateY")) {
      const a = matrixMatch[1];
      const b = matrixMatch[2];
      const c = matrixMatch[3];
      const d = matrixMatch[4];

      const relativeTx =
        key === "translateX" ? value - safeBaseX : currentTransform.translateX - safeBaseX;
      const relativeTy =
        key === "translateY" ? value - safeBaseY : currentTransform.translateY - safeBaseY;

      const newMatrix = `matrix(${a} ${b} ${c} ${d} ${relativeTx} ${relativeTy})`;
      const updatedTransform = transformAttr.replace(matrixRegex, newMatrix);
      handleLocalUpdate({
        attributes: {
          ...localElement.attributes,
          transform: updatedTransform,
        },
      });
      return;
    }

    if (!matrixMatch && !hasTranslate && (key === "translateX" || key === "translateY")) {
      if (hasXY) {
        const attrKey = key === "translateX" ? "x" : "y";
        handleLocalUpdate({
          attributes: {
            ...localElement.attributes,
            [attrKey]: String(value),
          },
        });
        return;
      } else if (hasCxCy) {
        const attrKey = key === "translateX" ? "cx" : "cy";
        handleLocalUpdate({
          attributes: {
            ...localElement.attributes,
            [attrKey]: String(value),
          },
        });
        return;
      }
    }

    const newTransformAbsolute = { ...currentTransform, [key]: value };
    const relTx = newTransformAbsolute.translateX - safeBaseX;
    const relTy = newTransformAbsolute.translateY - safeBaseY;

    const components: string[] = [];

    if ((!hasXY && !hasCxCy) || hasTranslate) {
      if (relTx !== 0 || relTy !== 0) {
        components.push(`translate(${relTx} ${relTy})`);
      }
    }

    if (newTransformAbsolute.rotate !== 0) {
      const { cx, cy } = center;
      components.push(`rotate(${newTransformAbsolute.rotate} ${cx} ${cy})`);
    }

    if (newTransformAbsolute.scale !== 1) {
      components.push(`scale(${newTransformAbsolute.scale})`);
    }

    const tStr = components.join(" ");

    let newStyle = localElement.attributes.style || "";
    // Remove transform-related CSS properties to let the native SVG transform attribute work reliably on all tags (including <use>)
    newStyle = newStyle.replace(/transform-origin:[^;]+;?/g, "").trim();
    newStyle = newStyle.replace(/transform-box:[^;]+;?/g, "").trim();
    newStyle = newStyle.replace(/transform:[^;]+;?/g, "").trim();

    handleLocalUpdate({
      attributes: {
        ...localElement.attributes,
        style: newStyle.replace(/;;/g, ";"),
        transform: tStr,
      },
    });
  };

  return { currentTransform, updateTransform };
};
