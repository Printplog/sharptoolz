
import { describe, it, expect, beforeEach } from 'vitest';
import { useSvgStore } from '../../store/useSvgStore';

// Mocking DOMParser and XMLSerializer if not in a browser environment
// Vitest with jsdom should provide these, but we ensure they work.

describe('SVG ID Preservation', () => {
  beforeEach(() => {
    useSvgStore.getState().reset();
  });

  const oldSvg = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <rect id="rect1.text" x="10" y="10" width="100" height="100" />
      <text id="text1.textarea" x="20" y="20">Old Text</text>
      <circle id="unrelated" cx="50" cy="50" r="10" />
    </svg>
  `;

  const newSvg = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <rect id="rect1" x="15" y="15" width="110" height="110" />
      <text id="text1" x="25" y="25">New Text</text>
      <path id="newPath" d="M0 0 L10 10" />
    </svg>
  `;

  it('should preserve IDs by matching base identifiers', () => {
    // 1. Manually populate store with "old" state
    useSvgStore.getState().setInitialSvg(oldSvg);
    const oldElements = useSvgStore.getState().elements;
    
    // 2. Upload "new" SVG and request preservation from old elements
    useSvgStore.getState().setInitialSvg(newSvg, oldElements);
    
    const elements = useSvgStore.getState().elements;
    const workingSvg = useSvgStore.getState().workingSvg;

    // Verify rect1 was preserved (rect1 matches rect1.text via base ID "rect1")
    const rectMatch = Object.values(elements).find(el => el.originalId === 'rect1');
    expect(rectMatch).toBeDefined();
    expect(rectMatch?.id).toBe('rect1.text');
    
    // Verify text1 was preserved (text1 matches text1.textarea via base ID "text1")
    const textMatch = Object.values(elements).find(el => el.originalId === 'text1');
    expect(textMatch).toBeDefined();
    expect(textMatch?.id).toBe('text1.textarea');

    // Verify the SVG string itself has the preserved IDs
    expect(workingSvg).toContain('id="rect1.text"');
    expect(workingSvg).toContain('id="text1.textarea"');
    
    // Verify it kept the NEW attributes (x=15, y=25) not the old ones
    expect(workingSvg).toContain('x="15"');
    expect(workingSvg).toContain('x="25"');
  });

  it('should report mismatches correctly', () => {
    useSvgStore.getState().setInitialSvg(oldSvg);
    const oldElements = useSvgStore.getState().elements;
    
    const report = useSvgStore.getState().setInitialSvg(newSvg, oldElements);

    expect(report).toBeDefined();
    // unmatchedOld: "unrelated" should be missing in new SVG
    expect(report?.unmatchedOld.map(o => o.id)).toContain('unrelated');
    
    // unmatchedNew: "newPath" should be new in new SVG
    expect(report?.unmatchedNew.map(n => n.id)).toContain('newPath');
  });

  it('should handle edited IDs correctly (e.g. text -> textarea)', () => {
    // 1. Initial load
    const initialSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="field1" x="10" y="10">Hello</text>
      </svg>
    `;
    useSvgStore.getState().setInitialSvg(initialSvg);
    
    // 2. User edits ID from 'field1' to 'field1.textarea'
    const elements1 = useSvgStore.getState().elements;
    const internalId = Object.keys(elements1)[0];
    useSvgStore.getState().updateElement(internalId, { id: 'field1.textarea' });
    
    const elementsAfterEdit = useSvgStore.getState().elements;
    expect(elementsAfterEdit[internalId].id).toBe('field1.textarea');

    // 3. Re-upload "new" SVG (maybe same file, so id is still 'field1')
    const reuploadSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="field1" x="10" y="10">Hello</text>
      </svg>
    `;
    useSvgStore.getState().setInitialSvg(reuploadSvg, elementsAfterEdit);
    
    const finalElements = useSvgStore.getState().elements;
    const finalWorkingSvg = useSvgStore.getState().workingSvg;
    
    const fieldMatch = Object.values(finalElements).find(el => el.originalId === 'field1');
    expect(fieldMatch?.id).toBe('field1.textarea');
    expect(finalWorkingSvg).toContain('id="field1.textarea"');
  });

  it('should apply manual mappings for unmatched elements', () => {
    // 1. Old state with 'Product.text'
    const oldSvgState = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="Product.text" x="10" y="10">Old</text>
      </svg>
    `;
    useSvgStore.getState().setInitialSvg(oldSvgState);
    const oldElems = useSvgStore.getState().elements;

    // 2. New SVG where the same element is called 'NewProduct' (no auto match)
    const newSvgState = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="NewProduct" x="10" y="10">New</text>
      </svg>
    `;

    // 3. User provides manual mapping: 'NewProduct' -> 'Product.text'
    const manualMap = { 'NewProduct': 'Product.text' };
    useSvgStore.getState().setInitialSvg(newSvgState, oldElems, manualMap);

    const finalElements = useSvgStore.getState().elements;
    const finalWorkingSvg = useSvgStore.getState().workingSvg;

    const match = Object.values(finalElements).find(el => el.originalId === 'NewProduct');
    expect(match?.id).toBe('Product.text');
    expect(finalWorkingSvg).toContain('id="Product.text"');
  });

  it('should handle cases where the new SVG has its own extensions', () => {
    // 1. Old state with 'Address.textarea'
    const oldState = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="Address.textarea" x="10" y="10">Old</text>
      </svg>
    `;
    useSvgStore.getState().setInitialSvg(oldState);
    const oldElems = useSvgStore.getState().elements;

    // 2. New SVG where the element has 'Address.text'
    const newSvgState = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="Address.text" x="10" y="10">New</text>
      </svg>
    `;

    // 3. Preservation
    useSvgStore.getState().setInitialSvg(newSvgState, oldElems);

    const finalElements = useSvgStore.getState().elements;
    const finalWorkingSvg = useSvgStore.getState().workingSvg;

    const match = Object.values(finalElements).find(el => el.originalId === 'Address.text');
    expect(match?.id).toBe('Address.textarea'); // Should prefer the current config
    expect(finalWorkingSvg).toContain('id="Address.textarea"');
    expect(finalWorkingSvg).not.toContain('id="Address.text"');
  });

  it('should successfully re-apply existing patches after SVG replacement', () => {
    // 1. Setup initial SVG
    const initialSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <rect id="rect1.text" x="10" y="10" width="100" height="100" />
      </svg>
    `;
    useSvgStore.getState().setInitialSvg(initialSvg);
    const oldElements = useSvgStore.getState().elements;

    // 2. Define a transformation patch for "rect1.text" (Actual UI format)
    const patches: any[] = [
      { id: 'rect1.text', attribute: 'transform', value: 'rotate(90)' }
    ];

    // 3. New SVG where the rect is called "rect1" (matching "rect1.text")
    const newSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <rect id="rect1" x="20" y="20" width="100" height="100" />
      </svg>
    `;

    // 4. Perform replacement with logical ID preservation
    useSvgStore.getState().setInitialSvg(newSvg, oldElements);
    
    // 5. Verify ID was preserved but visual state matches raw new SVG
    let elements = useSvgStore.getState().elements;
    let rectId = Object.keys(elements)[0];
    let rect = elements[rectId];
    expect(rect.id).toBe('rect1.text');
    expect(rect.attributes.transform).toBeUndefined(); // Raw new file has no transform

    // 6. Manually replay the patches (this is what SvgEditor will do)
    useSvgStore.getState().applyPatches(patches);

    // 7. Verify visual configuration was restored
    elements = useSvgStore.getState().elements;
    rect = elements[rectId];
    expect(rect.id).toBe('rect1.text');
    expect(rect.attributes.transform).toBe('rotate(90)');
    expect(useSvgStore.getState().workingSvg).toContain('transform="rotate(90)"');
  });

  it('should preserve live session state (transform/text) during re-upload without using patches', () => {
    // 1. Setup initial SVG
    const initialSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="field1.text" x="10" y="10">Old Text</text>
      </svg>
    `;
    useSvgStore.getState().setInitialSvg(initialSvg);
    
    // 2. Simulate "Live" edits in the store (no patches involved here)
    const internalId = useSvgStore.getState().elementOrder[0];
    useSvgStore.getState().updateElement(internalId, {
      attributes: { transform: 'rotate(45)', style: 'transform-origin: center' },
      innerText: 'Live Edited Text'
    });

    const oldElements = useSvgStore.getState().elements;

    // 3. New SVG where the field is raw
    const newSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text id="field1" x="20" y="20">New Text From File</text>
      </svg>
    `;

    // 4. Perform replacement with logical ID preservation
    useSvgStore.getState().setInitialSvg(newSvg, oldElements);
    
    // 5. Verify the "Live Transplant"
    const elements = useSvgStore.getState().elements;
    const newId = useSvgStore.getState().elementOrder[0];
    const el = elements[newId];

    expect(el.id).toBe('field1.text'); // ID Preserved
    expect(el.innerText).toBe('Live Edited Text'); // Text Preserved from Live Session
    expect(el.attributes.transform).toBe('rotate(45)'); // Transformation Preserved from Live Session
    expect(el.attributes.style).toContain('transform-origin: center'); // Style Preserved
    expect(el.attributes.x).toBe('20'); // Geometry taken from NEW file

    // 6. Verify "Cooking" (Actually in the SVG string)
    const workingSvg = useSvgStore.getState().workingSvg;
    expect(workingSvg).toContain('transform="rotate(45)"');
    expect(workingSvg).toContain('style="transform-origin: center"');
    expect(workingSvg).toContain('Live Edited Text');
  });
});
