# SVG Editor Utilities

## CSS Selector Escaping Rule

**IMPORTANT RULE**: Always escape IDs before using in `querySelector` to handle special characters like `.`, `:`, etc.

### Why?
SVG element IDs can contain special characters (e.g., `Shipment_Date.date__MM_DD_YYYY_hh:mm_A`). These characters have special meaning in CSS selectors and must be escaped.

### Solution
Use the `escapeCssSelector()` function from `svgUtils.ts` or the `getSvgElementById()` helper function which handles escaping automatically.

### Example
```typescript
// ❌ WRONG - Will throw error for IDs with special characters
const element = svgDoc.querySelector(`#${el.id}`);

// ✅ CORRECT - Use helper function
const element = getSvgElementById(svgContent, el.id);

// ✅ CORRECT - Manual escaping
const escapedId = escapeCssSelector(el.id);
const element = svgDoc.querySelector(`#${escapedId}`);
```

## File Organization

- `svgUtils.ts` - Core SVG utility functions (selector escaping, element checks, filtering)
- `regenerateSvg.ts` - SVG regeneration logic
- `extractFormFields.ts` - Form field extraction from SVG elements

