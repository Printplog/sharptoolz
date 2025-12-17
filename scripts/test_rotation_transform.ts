
import { JSDOM } from 'jsdom';
import { FormField } from "../src/types";

// Polyfill DOMParser and XMLSerializer
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;

// Dynamic import to ensure globals are set before module load
const { default: updateSvgFromFormData } = await import("../src/lib/utils/updateSvgFromFormData");

// Mock FormField
const mockFields: FormField[] = [
  {
    id: "image1",
    svgElementId: "image1",
    name: "Test Image",
    type: "upload",
    currentValue: "data:image/png;base64,fakeimage",
    rotation: 45, // 45 degrees rotation
    touched: true,
  },
  {
    id: "image2",
    svgElementId: "image2",
    name: "Test Image No Rotation",
    type: "upload",
    currentValue: "data:image/png;base64,fakeimage2",
    // No rotation
    touched: true,
  }
];

// Mock SVG with image elements
// image1 has x=10, y=10, width=100, height=100. Center should be (60, 60).
// image2 has x=200, y=10, width=50, height=50. Center should be (225, 35).
const mockSvgRaw = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <image id="image1" x="10" y="10" width="100" height="100" href="placeholder.png" />
  <image id="image2" x="200" y="10" width="50" height="50" href="placeholder.png" />
</svg>
`;

console.log("Running Rotation Transform Test...");

try {
  const updatedSvg = updateSvgFromFormData(mockSvgRaw, mockFields);
  
  // Check image1 for rotation
  // Center: x=10 + 100/2 = 60, y=10 + 100/2 = 60
  // Expected transform: rotate(45, 60, 60)
  const expectedTransform = 'rotate(45, 60, 60)';
  
  if (updatedSvg.includes(expectedTransform)) {
    console.log("✅ SUCCESS: Found expected rotation transform on image1");
  } else {
    console.error("❌ FAILURE: Did not find expected transform on image1");
    console.error(`Expected to contain: "${expectedTransform}"`);
    console.log("Updated SVG Content:", updatedSvg);
  }

} catch (error) {
  console.error("❌ ERROR: Verification script failed with exception:", error);
}
