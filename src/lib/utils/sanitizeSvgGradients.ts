/**
 * Sanitizes SVG gradient definitions to prevent rendering artifacts when an SVG
 * is injected inline into the page DOM via dangerouslySetInnerHTML.
 *
 * Fixes:
 *  1. Gradient ID collisions (namespaces all IDs with a hash of the SVG string)
 *  2. Premultiplied-alpha "black smear" (copies donor RGB to transparent stops)
 *  3. 8-bit quantization banding / ridges in Chrome (injects feTurbulence noise dither)
 *  4. Degenerate zero-length gradient axes
 */

export function svgNamespace(svg: string): string {
    let h = 5381;
    for (let i = 0; i < Math.min(svg.length, 2000); i++) {
        h = ((h << 5) + h) ^ svg.charCodeAt(i);
        h = h >>> 0;
    }
    return h.toString(36);
}

function remapUrlRefs(value: string, idMap: Map<string, string>): string {
    return value.replace(/url\(\s*["']?#([^"')]+)["']?\s*\)/g, (_m, origId) => {
        const newId = idMap.get(origId);
        return newId ? `url(#${newId})` : _m;
    });
}

export function sanitizeSvgGradients(svgString: string, namespace: string): string {
    if (!svgString || typeof DOMParser === "undefined") return svgString;

    let doc: Document;
    try {
        doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
        if (doc.querySelector("parsererror")) return svgString;
    } catch {
        return svgString;
    }

    const REFERENCEABLE = new Set([
        "lineargradient", "radialgradient", "pattern",
        "clippath", "mask", "filter", "marker", "symbol",
    ]);

    const idMap = new Map<string, string>();

    // ── 1. Namespace all referenceable IDs ──────────────────────────────────
    doc.querySelectorAll("*").forEach((el) => {
        if (!REFERENCEABLE.has(el.tagName.toLowerCase())) return;
        const origId = el.getAttribute("id");
        if (!origId) return;
        const newId = `ns-${namespace}-${origId}`;
        idMap.set(origId, newId);
        el.setAttribute("id", newId);
    });

    if (idMap.size === 0) return svgString;

    const URL_ATTRS = [
        "fill", "stroke", "filter", "clip-path", "mask",
        "marker-start", "marker-mid", "marker-end",
    ];

    doc.querySelectorAll("*").forEach((el) => {
        URL_ATTRS.forEach((attr) => {
            const val = el.getAttribute(attr);
            if (!val) return;
            const r = remapUrlRefs(val, idMap);
            if (r !== val) el.setAttribute(attr, r);
        });

        const style = el.getAttribute("style");
        if (style) {
            const r = remapUrlRefs(style, idMap);
            if (r !== style) el.setAttribute("style", r);
        }

        const xlinkHref = el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        if (xlinkHref?.startsWith("#")) {
            const newId = idMap.get(xlinkHref.slice(1));
            if (newId) el.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${newId}`);
        }

        const href = el.getAttribute("href");
        if (href?.startsWith("#")) {
            const newId = idMap.get(href.slice(1));
            if (newId) el.setAttribute("href", `#${newId}`);
        }
    });

    // ── 2. Fix premultiplied-alpha "black smear" + inject midpoint stops ─────
    doc.querySelectorAll("linearGradient, radialGradient").forEach((grad) => {
        const stops = Array.from(grad.querySelectorAll("stop"));
        if (stops.length < 2) return;

        type StopInfo = { r: number; g: number; b: number; a: number; el: Element };

        const parseColor = (el: Element): { r: number; g: number; b: number } => {
            const raw = (el.getAttribute("stop-color") ?? "").trim();
            const hex6 = raw.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
            if (hex6) return { r: parseInt(hex6[1], 16), g: parseInt(hex6[2], 16), b: parseInt(hex6[3], 16) };
            const hex3 = raw.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (hex3) return {
                r: parseInt(hex3[1] + hex3[1], 16),
                g: parseInt(hex3[2] + hex3[2], 16),
                b: parseInt(hex3[3] + hex3[3], 16),
            };
            const rgba = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3] };
            if (raw === "white") return { r: 255, g: 255, b: 255 };
            if (raw === "black") return { r: 0, g: 0, b: 0 };
            return { r: 0, g: 0, b: 0 };
        };

        const infos: StopInfo[] = stops.map(el => {
            const op = parseFloat(el.getAttribute("stop-opacity") ?? "1");
            const { r, g, b } = parseColor(el);
            return { r, g, b, a: op, el };
        });

        // Ensure explicit stop-opacity and offset on every stop
        infos.forEach((s, i) => {
            if (!s.el.hasAttribute("stop-opacity")) s.el.setAttribute("stop-opacity", "1");
            if (!s.el.hasAttribute("offset")) {
                const offsetVal = stops.length > 1 ? i / (stops.length - 1) : 0;
                s.el.setAttribute("offset", `${offsetVal}`);
            }
        });

        // Insert midpoint stop between opaque↔transparent transitions
        if (infos.some(s => s.a === 0)) {
            for (let i = 0; i < infos.length - 1; i++) {
                if ((infos[i].a > 0 && infos[i + 1].a === 0) || (infos[i].a === 0 && infos[i + 1].a > 0)) {
                    const midStop = doc.createElementNS("http://www.w3.org/2000/svg", "stop");
                    let offset1 = parseFloat(infos[i].el.getAttribute("offset") || "0");
                    let offset2 = parseFloat(infos[i + 1].el.getAttribute("offset") || "1");
                    if (infos[i].el.getAttribute("offset")?.includes("%")) offset1 /= 100;
                    if (infos[i + 1].el.getAttribute("offset")?.includes("%")) offset2 /= 100;
                    midStop.setAttribute("offset", `${(offset1 + offset2) / 2}`);
                    const midR = Math.round((infos[i].r + infos[i + 1].r) / 2);
                    const midG = Math.round((infos[i].g + infos[i + 1].g) / 2);
                    const midB = Math.round((infos[i].b + infos[i + 1].b) / 2);
                    midStop.setAttribute("stop-color", `rgb(${midR},${midG},${midB})`);
                    midStop.setAttribute("stop-opacity", "0.5");
                    infos[i].el.after(midStop);
                }
            }
        }

        // Copy donor RGB to transparent stops (fixes black smear from premultiplied alpha)
        infos.forEach((stop, i) => {
            if (stop.a > 0) return;
            let donor: StopInfo | null = null;
            for (let j = i - 1; j >= 0; j--) {
                if (infos[j].a > 0) { donor = infos[j]; break; }
            }
            if (!donor) {
                for (let j = i + 1; j < infos.length; j++) {
                    if (infos[j].a > 0) { donor = infos[j]; break; }
                }
            }
            if (!donor) return;
            stop.el.setAttribute("stop-color", `rgb(${donor.r},${donor.g},${donor.b})`);
            stop.el.setAttribute("stop-opacity", "0");
        });

        // linearRGB = physically correct for light blending, smoother opaque→transparent
        grad.setAttribute("color-interpolation", "linearRGB");

        // Fix degenerate zero-length gradient axis
        if (!grad.hasAttribute("spreadMethod")) grad.setAttribute("spreadMethod", "pad");
        if (grad.tagName.toLowerCase() === "lineargradient") {
            const x1 = parseFloat(grad.getAttribute("x1") ?? "0");
            const y1 = parseFloat(grad.getAttribute("y1") ?? "0");
            const x2 = parseFloat(grad.getAttribute("x2") ?? "1");
            const y2 = parseFloat(grad.getAttribute("y2") ?? "0");
            if (x1 === x2 && y1 === y2) grad.setAttribute("x2", String(x2 + 0.0001));
        }
    });

    // ── 3. Inject feTurbulence noise dither ──────────────────────────────────
    //
    // Chrome does NOT dither SVG gradients. With 8 bits per channel there are only
    // 256 steps across a gradient span — these land visibly far apart as "ridges".
    //
    // Fix: inject feTurbulence fractal noise (~1.5% intensity) to scatter the
    // quantization steps randomly per-pixel. Invisible to the eye, eliminates bands.
    // Identical technique to Figma/After Effects SVG exports.
    const NS = "http://www.w3.org/2000/svg";
    const DITHER_FILTER_ID = `ns-${namespace}-dither`;

    const hasTransparentGradients =
        doc.querySelectorAll("linearGradient stop[stop-opacity='0'], radialGradient stop[stop-opacity='0']").length > 0;

    if (hasTransparentGradients) {
        let defs = doc.querySelector("defs");
        if (!defs) {
            defs = doc.createElementNS(NS, "defs");
            doc.documentElement.insertBefore(defs, doc.documentElement.firstChild);
        }

        if (!doc.getElementById(DITHER_FILTER_ID)) {
            const filter = doc.createElementNS(NS, "filter");
            filter.setAttribute("id", DITHER_FILTER_ID);
            filter.setAttribute("x", "0%");
            filter.setAttribute("y", "0%");
            filter.setAttribute("width", "100%");
            filter.setAttribute("height", "100%");
            filter.setAttribute("color-interpolation-filters", "linearRGB");

            // Step 1: fractal noise
            const turbulence = doc.createElementNS(NS, "feTurbulence");
            turbulence.setAttribute("type", "fractalNoise");
            turbulence.setAttribute("baseFrequency", "0.65");
            turbulence.setAttribute("numOctaves", "3");
            turbulence.setAttribute("stitchTiles", "stitch");
            turbulence.setAttribute("result", "noiseOut");
            filter.appendChild(turbulence);

            // Step 2: desaturate to neutral gray
            const colorMatrix = doc.createElementNS(NS, "feColorMatrix");
            colorMatrix.setAttribute("type", "saturate");
            colorMatrix.setAttribute("values", "0");
            colorMatrix.setAttribute("in", "noiseOut");
            colorMatrix.setAttribute("result", "grayNoise");
            filter.appendChild(colorMatrix);

            // Step 3: blend at 1.5% intensity
            const composite = doc.createElementNS(NS, "feComposite");
            composite.setAttribute("operator", "arithmetic");
            composite.setAttribute("k1", "0");
            composite.setAttribute("k2", "1");
            composite.setAttribute("k3", "0.015");
            composite.setAttribute("k4", "0");
            composite.setAttribute("in", "SourceGraphic");
            composite.setAttribute("in2", "grayNoise");
            composite.setAttribute("result", "dithered");
            filter.appendChild(composite);

            // Step 4: clip to original alpha
            const clip = doc.createElementNS(NS, "feComposite");
            clip.setAttribute("operator", "in");
            clip.setAttribute("in", "dithered");
            clip.setAttribute("in2", "SourceGraphic");
            filter.appendChild(clip);

            defs.appendChild(filter);
        }

        // Collect gradient IDs that have transparent stops
        const transparentGradientIds = new Set<string>();
        doc.querySelectorAll("linearGradient, radialGradient").forEach((grad) => {
            const hasTransStop = Array.from(grad.querySelectorAll("stop")).some(
                (s) => parseFloat(s.getAttribute("stop-opacity") ?? "1") < 0.1
            );
            if (hasTransStop) {
                const id = grad.getAttribute("id");
                if (id) transparentGradientIds.add(id);
            }
        });

        // Apply dither filter to elements referencing those gradient IDs
        doc.querySelectorAll("*").forEach((el) => {
            const fill = el.getAttribute("fill") ?? "";
            const style = el.getAttribute("style") ?? "";
            const fillUrl =
                fill.match(/url\(["']?#([^"')]+)["']?\)/)?.[1] ??
                style.match(/fill:\s*url\(["']?#([^"')]+)["']?\)/)?.[1];
            if (fillUrl && transparentGradientIds.has(fillUrl)) {
                if (!el.getAttribute("filter")) {
                    el.setAttribute("filter", `url(#${DITHER_FILTER_ID})`);
                }
            }
        });
    }

    doc.documentElement.setAttribute("shape-rendering", "geometricPrecision");

    try {
        return new XMLSerializer().serializeToString(doc.documentElement);
    } catch {
        return svgString;
    }
}
