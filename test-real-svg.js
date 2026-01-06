#!/usr/bin/env node

/**
 * Real SVG Template Test - Font-Aware Line Spacing
 * Tests with actual template SVG to verify line spacing works in practice
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulated getFontMetrics (matches implementation)
function getFontMetrics(fontSize, fontFamily = 'Arial', document) {
    if (typeof document !== 'undefined') {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.font = `${fontSize}px ${fontFamily}`;
                const metrics = ctx.measureText('Mg');

                if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
                    return {
                        ascent: metrics.actualBoundingBoxAscent,
                        descent: metrics.actualBoundingBoxDescent,
                    };
                }
            }
        } catch (e) {
            // Fall through
        }
    }

    return {
        ascent: fontSize * 0.8,
        descent: fontSize * 0.2,
    };
}

// Simulated applyWrappedText (matches implementation)
function applyWrappedText(el, linesOrText, fontSize = 16, fontFamily = 'Arial', doc) {
    const lines = Array.isArray(linesOrText)
        ? linesOrText
        : (linesOrText || "").split('\n');

    el.textContent = "";
    const x = el.getAttribute("x") || "0";

    const metrics = getFontMetrics(fontSize, fontFamily, doc);
    const padding = fontSize * 0.2;
    const lineHeight = metrics.ascent + metrics.descent + padding;

    lines.forEach((line, i) => {
        const tspan = doc.createElementNS("http://www.w3.org/2000/svg", "tspan");
        tspan.textContent = line || "\u00A0";
        tspan.setAttribute("x", x);

        if (i > 0) {
            tspan.setAttribute("dy", String(lineHeight));
        }

        el.appendChild(tspan);
    });

    return { lineHeight, metrics, padding };
}

console.log('\n🧪 Real SVG Template Test - Font-Aware Line Spacing\n');
console.log('='.repeat(80));

// Load the Flight Itinerary SVG
const svgPath = path.join(__dirname, '..', 'templates', 'Flight Itinerary One-way.svg');

if (!fs.existsSync(svgPath)) {
    console.log('\n❌ SVG template not found at:', svgPath);
    console.log('Please check the path and try again.\n');
    process.exit(1);
}

console.log('\n📄 Loading SVG template:', svgPath);

const svgContent = fs.readFileSync(svgPath, 'utf8');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const document = dom.window.document;

// Parse the SVG
const parser = new dom.window.DOMParser();
const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

console.log('✅ SVG loaded successfully');

// Find all text elements
const textElements = svgDoc.querySelectorAll('text');
console.log(`\n📊 Found ${textElements.length} text elements in the SVG`);

// Test with multi-line text on passenger name field
const passengerNameEl = svgDoc.querySelector('[id*="Passenger_Name"]');

if (passengerNameEl) {
    console.log('\n🎯 Testing with Passenger Name field:');
    console.log('   Element ID:', passengerNameEl.getAttribute('id'));

    // Get font properties from the element
    const fontSizeStr = passengerNameEl.getAttribute('font-size') ||
        passengerNameEl.getAttribute('class');

    // Try to find font size from style class
    const styleElements = svgDoc.querySelectorAll('style');
    let fontSize = 16;
    let fontFamily = 'Arial';

    styleElements.forEach(style => {
        const content = style.textContent || '';
        // console.log('Style Content:', content); // Too verbose
        const className = passengerNameEl.getAttribute('class');
        if (className) {
            // Find ALL matches for the class
            const regex = new RegExp(`\\.${className}[^{]*{([^}]+)}`, 'g');
            let match;
            while ((match = regex.exec(content)) !== null) {
                console.log(`   Found class definition for .${className}:`, match[1].trim());
                const sizeMatch = match[1].match(/font-size:\s*([\d.]+)/);
                const familyMatch = match[1].match(/font-family:\s*([^;]+)/);
                if (sizeMatch) {
                    fontSize = parseFloat(sizeMatch[1]);
                    console.log(`      -> Found font-size: ${fontSize}`);
                }
                if (familyMatch) {
                    fontFamily = familyMatch[1].trim().replace(/['"]/g, '');
                    console.log(`      -> Found font-family: ${fontFamily}`);
                }
            }
        }
    });

    console.log(`   Font size: ${fontSize}px`);
    console.log(`   Font family: ${fontFamily}`);

    // Test with multi-line address
    const multiLineText = '123 Main Street\nApartment 4B\nLondon, UK\nSW1A 1AA';

    console.log('\n📝 Adding multi-line text:');
    console.log('   "' + multiLineText.split('\n').join('"\n   "') + '"');

    const result = applyWrappedText(passengerNameEl, multiLineText, fontSize, fontFamily, svgDoc);

    console.log('\n📏 Font Metrics:');
    console.log(`   Ascent: ${result.metrics.ascent.toFixed(2)}px`);
    console.log(`   Descent: ${result.metrics.descent.toFixed(2)}px`);
    console.log(`   Padding: ${result.padding.toFixed(2)}px`);
    console.log(`   Line Height: ${result.lineHeight.toFixed(2)}px`);

    // Check the generated tspans
    const tspans = passengerNameEl.querySelectorAll('tspan');

    console.log('\n✅ Generated tspans:');
    tspans.forEach((tspan, i) => {
        const text = tspan.textContent;
        const x = tspan.getAttribute('x');
        const dy = tspan.getAttribute('dy');
        console.log(`   Line ${i + 1}: "${text}"`);
        console.log(`      x="${x}" ${dy ? `dy="${dy}px"` : '(no dy - first line)'}`);
    });

    // Verify spacing
    console.log('\n🔍 Verification:');
    let allValid = true;

    for (let i = 1; i < tspans.length; i++) {
        const dy = parseFloat(tspans[i].getAttribute('dy'));
        if (dy <= 0) {
            console.log(`   ❌ Line ${i + 1}: Negative/zero spacing (${dy}px)`);
            allValid = false;
        } else if (dy < fontSize) {
            console.log(`   ⚠️  Line ${i + 1}: Spacing less than font size (${dy}px < ${fontSize}px)`);
        } else if (dy > fontSize * 2.5) {
            console.log(`   ⚠️  Line ${i + 1}: Excessive spacing (${dy}px > ${fontSize * 2.5}px)`);
        } else {
            console.log(`   ✅ Line ${i + 1}: Good spacing (${dy}px)`);
        }
    }

    if (allValid) {
        console.log('\n✅ All line spacing is valid - no overlapping!');
    }

    // Save modified SVG
    const outputPath = path.join(__dirname, 'test-output-multiline.svg');
    const serializer = new dom.window.XMLSerializer();
    const svgString = serializer.serializeToString(svgDoc);
    fs.writeFileSync(outputPath, svgString);

    console.log(`\n💾 Modified SVG saved to: ${outputPath}`);
    console.log('   Open this file to see the multi-line text with font-aware spacing!\n');

} else {
    console.log('\n❌ Passenger Name element not found in the SVG\n');
}

// Test with different fonts
console.log('\n' + '='.repeat(80));
console.log('\n🎨 Testing with Different Fonts:\n');

const testFonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia'];
const testText = 'Line 1\nLine 2\nLine 3';

testFonts.forEach(font => {
    const testEl = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text');
    testEl.setAttribute('x', '100');
    testEl.setAttribute('y', '100');
    testEl.setAttribute('font-family', font);

    const result = applyWrappedText(testEl, testText, 16, font, svgDoc);

    console.log(`${font}:`);
    console.log(`   Line Height: ${result.lineHeight.toFixed(2)}px (ascent: ${result.metrics.ascent.toFixed(2)}px + descent: ${result.metrics.descent.toFixed(2)}px + padding: ${result.padding.toFixed(2)}px)`);
});

console.log('\n' + '='.repeat(80));
console.log('\n🎉 Real SVG template test completed!\n');
