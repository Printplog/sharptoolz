import type { FormField } from "@/types";
import { extractFromDependency } from "./fieldExtractor";
import updateSvgFromFormData from "./updateSvgFromFormData";

/**
 * Frontend SVG Watermark Utility
 *
 * Injects "FAKE DOCUMENT" watermarks into an SVG string for preview display.
 * This mirrors the backend's WaterMark class but runs client-side.
 *
 * Rules:
 * - Non-purchased template (browsing /tools/:id): always apply watermark
 * - Purchased template (/documents/:id): only apply if `test === true`
 */

const NON_MASKABLE_FIELD_TYPES = new Set([
    "upload",
    "file",
    "sign",
    "checkbox",
    "color",
    "range",
    "hide",
    "status",
]);

function looksLikeImageValue(value: string): boolean {
    return value.startsWith("data:image/") || value.startsWith("blob:");
}

function getFieldDisplayValue(field: FormField): string {
    if (field.options && field.options.length > 0) {
        const selected = field.options.find(
            (option) => String(option.value) === String(field.currentValue)
        );

        return String(
            selected?.displayText ??
            selected?.label ??
            field.currentValue ??
            ""
        );
    }

    return String(field.currentValue ?? "");
}

function shouldMaskField(field: FormField, resolvedValue: string): boolean {
    const type = (field.type || "text").toLowerCase();

    if (field.options && field.options.length > 0) return false;
    if (NON_MASKABLE_FIELD_TYPES.has(type)) return false;
    if (!resolvedValue.trim()) return false;
    if (looksLikeImageValue(resolvedValue)) return false;

    return true;
}

export function maskTestTextValue(value: string): string {
    if (!value) return value;

    let revealNext = true;

    return Array.from(value).map((char) => {
        if (!/[a-z0-9]/i.test(char)) {
            revealNext = true;
            return char;
        }

        const maskedChar = revealNext ? char : "*";
        revealNext = !revealNext;
        return maskedChar;
    }).join("");
}

export function applyMaskedTestContentToSvg(svgContent: string, fields: FormField[] = []): string {
    if (!svgContent || fields.length === 0) return svgContent;

    const maskedFieldValues: Record<string, string | number | boolean | unknown> = {};

    fields.forEach((field) => {
        const displayValue = getFieldDisplayValue(field);
        maskedFieldValues[field.id] = shouldMaskField(field, displayValue)
            ? maskTestTextValue(displayValue)
            : displayValue;
    });

    const maskedFields = fields.flatMap((field) => {
        const resolvedValue = field.dependsOn
            ? extractFromDependency(field.dependsOn, maskedFieldValues)
            : String(maskedFieldValues[field.id] ?? "");

        if (!shouldMaskField(field, resolvedValue)) {
            return [];
        }

        return [{
            ...field,
            currentValue: resolvedValue,
            dependsOn: undefined,
            options: undefined,
        }];
    });

    if (maskedFields.length === 0) return svgContent;

    return updateSvgFromFormData(svgContent, maskedFields) as string;
}

export function addWatermarkToSvg(svgContent: string): string {
    if (!svgContent || !svgContent.includes("</svg>")) return svgContent;

    // Parse dimensions from viewBox or width/height attrs
    let width = 400;
    let height = 300;

    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
    if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/\s+/);
        if (parts.length >= 4) {
            width = parseFloat(parts[2]);
            height = parseFloat(parts[3]);
        }
    } else {
        const wMatch = svgContent.match(/\bwidth=["']([^"'px]+)/);
        const hMatch = svgContent.match(/\bheight=["']([^"'px]+)/);
        if (wMatch) width = parseFloat(wMatch[1]);
        if (hMatch) height = parseFloat(hMatch[1]);
    }

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return svgContent;

    // Fixed font size and spacing — same on every document size.
    // Bigger documents just get more watermarks, not wider gaps.
    const fontSize = 42;
    const squareSize = 380; // fixed px spacing between watermark centers

    // Extra padding on each side to push watermarks beyond visible edges
    // so the outermost rows/cols visually touch the border
    const bleed = squareSize * 0.5;

    const startX = -bleed;
    const startY = -bleed;
    const endX = width + bleed;
    const endY = height + bleed;

    const cols = Math.ceil((endX - startX) / squareSize) + 1;
    const rows = Math.ceil((endY - startY) / squareSize) + 1;

    const watermarks: string[] = [];

    for (let r = 0; r < rows; r++) {
        // Stagger alternate rows by half a column for a nice diagonal spread
        const offsetX = r % 2 === 0 ? 0 : squareSize / 2;

        for (let c = 0; c < cols; c++) {
            const cx = startX + offsetX + c * squareSize;
            const cy = startY + r * squareSize;

            watermarks.push(
                `<g transform="rotate(-45, ${cx.toFixed(1)}, ${cy.toFixed(1)})" pointer-events="none">` +
                `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" ` +
                `font-size="${fontSize}" font-weight="900" font-family="Arial, sans-serif" ` +
                `fill="black" text-anchor="middle" ` +
                `letter-spacing="2" pointer-events="none">FAKE DOCUMENT</text>` +
                `</g>`
            );
        }
    }

    if (watermarks.length === 0) return svgContent;

    const insertPos = svgContent.lastIndexOf("</svg>");
    return (
        svgContent.slice(0, insertPos) +
        "\n<!-- watermark-start -->\n" +
        watermarks.join("\n") +
        "\n<!-- watermark-end -->\n" +
        svgContent.slice(insertPos)
    );
}

export function removeWatermarkFromSvg(svgContent: string): string {
    if (!svgContent) return svgContent;
    // Remove injected watermark block
    return svgContent.replace(
        /\n<!-- watermark-start -->[\s\S]*?<!-- watermark-end -->\n/g,
        ""
    );
}
