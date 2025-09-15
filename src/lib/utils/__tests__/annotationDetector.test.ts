/**
 * Test file for annotationDetector utility
 * This ensures the blue border detection logic works correctly
 */

import { annotationDetector } from '../annotationDetector';

// Mock ImageData for testing
const createMockImageData = (width: number, height: number, bluePixels: { x: number; y: number }[]) => {
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Fill with black pixels
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;     // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  
  // Add blue pixels
  bluePixels.forEach(({ x, y }) => {
    const index = (y * width + x) * 4;
    data[index] = 0;     // R
    data[index + 1] = 0; // G
    data[index + 2] = 255; // B (blue)
    data[index + 3] = 255; // A
  });
  
  return new ImageData(data, width, height);
};

describe('AnnotationDetector', () => {
  test('should detect blue border annotations', () => {
    const width = 100;
    const height = 100;
    
    // Create blue border pixels (10px border)
    const bluePixels: { x: number; y: number }[] = [];
    
    // Top border
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < 10; y++) {
        bluePixels.push({ x, y });
      }
    }
    
    // Bottom border
    for (let x = 0; x < width; x++) {
      for (let y = height - 10; y < height; y++) {
        bluePixels.push({ x, y });
      }
    }
    
    // Left border
    for (let x = 0; x < 10; x++) {
      for (let y = 10; y < height - 10; y++) {
        bluePixels.push({ x, y });
      }
    }
    
    // Right border
    for (let x = width - 10; x < width; x++) {
      for (let y = 10; y < height - 10; y++) {
        bluePixels.push({ x, y });
      }
    }
    
    const imageData = createMockImageData(width, height, bluePixels);
    const result = annotationDetector.detectBlueBorderAnnotations(imageData);
    
    expect(result).not.toBeNull();
    expect(result?.content.width).toBe(80); // 100 - 10 - 10
    expect(result?.content.height).toBe(80); // 100 - 10 - 10
    expect(result?.content.aspectRatio).toBe(1); // 80/80 = 1
    expect(result?.borderThickness).toBe(10);
  });
  
  test('should return null when no blue pixels found', () => {
    const width = 100;
    const height = 100;
    const imageData = createMockImageData(width, height, []);
    
    const result = annotationDetector.detectBlueBorderAnnotations(imageData);
    
    expect(result).toBeNull();
  });
});
