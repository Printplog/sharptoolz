/**
 * Blue Border Annotation Detection Utility
 * Extracted from browser-annotation-analyzer.html
 * Detects blue border annotations in images to extract content dimensions
 */

export interface BlueColor {
  r: number;
  g: number;
  b: number;
  name: string;
}

export interface BorderDetection {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface AnnotationResult {
  imageWidth: number;
  imageHeight: number;
  border: BorderDetection;
  content: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  center?: {
    x: number;
    y: number;
  };
  rotation?: number;
  borderThickness: number;
  bluePixelCount: number;
  confidence: number;
}

export class AnnotationDetector {
  private readonly BLUE_COLORS: BlueColor[] = [
    { r: 0, g: 0, b: 255, name: 'Pure Blue' },
    { r: 0, g: 100, b: 255, name: 'Light Blue' },
    { r: 0, g: 0, b: 200, name: 'Dark Blue' },
    { r: 50, g: 50, b: 255, name: 'Blue-ish' },
    { r: 0, g: 150, b: 255, name: 'Sky Blue' }
  ];
  
  private readonly COLOR_TOLERANCE = 100;

  private readonly RED_COLORS: BlueColor[] = [
    { r: 255, g: 0, b: 0, name: 'Pure Red' },
    { r: 200, g: 0, b: 0, name: 'Dark Red' },
    { r: 255, g: 50, b: 50, name: 'Light Red' }
  ];

  private readonly GREEN_COLORS: BlueColor[] = [
    { r: 0, g: 255, b: 0, name: 'Pure Green' },
    { r: 0, g: 200, b: 0, name: 'Dark Green' },
    { r: 50, g: 255, b: 50, name: 'Light Green' }
  ];

  /**
   * Check if a pixel matches any of the defined blue colors
   */
  private isBluePixel(r: number, g: number, b: number): boolean {
    for (const color of this.BLUE_COLORS) {
      if (
        Math.abs(r - color.r) <= this.COLOR_TOLERANCE &&
        Math.abs(g - color.g) <= this.COLOR_TOLERANCE &&
        Math.abs(b - color.b) <= this.COLOR_TOLERANCE
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a pixel matches any of the defined red colors
   */
  private isRedPixel(r: number, g: number, b: number): boolean {
    for (const color of this.RED_COLORS) {
      if (
        Math.abs(r - color.r) <= this.COLOR_TOLERANCE &&
        Math.abs(g - color.g) <= this.COLOR_TOLERANCE &&
        Math.abs(b - color.b) <= this.COLOR_TOLERANCE
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a pixel matches any of the defined green colors
   */
  private isGreenPixel(r: number, g: number, b: number): boolean {
    for (const color of this.GREEN_COLORS) {
      if (
        Math.abs(r - color.r) <= this.COLOR_TOLERANCE &&
        Math.abs(g - color.g) <= this.COLOR_TOLERANCE &&
        Math.abs(b - color.b) <= this.COLOR_TOLERANCE
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect annotations (blue border, red dot, green line) in image data
   */
  detectAnnotations(imageData: ImageData): AnnotationResult | null {
    const { data, width, height } = imageData;
    
    // Store pixels of interest
    const bluePixels: { x: number; y: number }[] = [];
    const redPixels: { x: number; y: number }[] = [];
    const greenPixels: { x: number; y: number }[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];

        // Skip transparent pixels
        if (a < 50) continue;
        
        if (this.isBluePixel(r, g, b)) {
          bluePixels.push({ x, y });
        } else if (this.isRedPixel(r, g, b)) {
          redPixels.push({ x, y });
        } else if (this.isGreenPixel(r, g, b)) {
          greenPixels.push({ x, y });
        }
      }
    }
    
    if (bluePixels.length === 0) {
      return null;
    }
    
    // --- Blue Border Analysis ---
    const xs = bluePixels.map(p => p.x);
    const ys = bluePixels.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const borderThickness = Math.min(minX, minY, width - maxX, height - maxY);

    // --- Red Dot Analysis (Center) ---
    let center = { x: width / 2, y: height / 2 }; // Default to image center
    if (redPixels.length > 0) {
      const sumX = redPixels.reduce((sum, p) => sum + p.x, 0);
      const sumY = redPixels.reduce((sum, p) => sum + p.y, 0);
      center = {
        x: sumX / redPixels.length,
        y: sumY / redPixels.length
      };
    }

    // --- Green Line Analysis (Rotation) ---
    let rotation = 0;
    if (greenPixels.length > 10) { // Need enough pixels for a line
      // Find leftmost and rightmost green pixels to determine slope
      // Sort by x coordinate
      greenPixels.sort((a, b) => a.x - b.x);
      
      // Take average of first 10% and last 10% to be more robust against noise
      const sampleSize = Math.max(1, Math.floor(greenPixels.length * 0.1));
      
      const startPixels = greenPixels.slice(0, sampleSize);
      const endPixels = greenPixels.slice(-sampleSize);
      
      const startX = startPixels.reduce((sum, p) => sum + p.x, 0) / sampleSize;
      const startY = startPixels.reduce((sum, p) => sum + p.y, 0) / sampleSize;
      
      const endX = endPixels.reduce((sum, p) => sum + p.x, 0) / sampleSize;
      const endY = endPixels.reduce((sum, p) => sum + p.y, 0) / sampleSize;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Calculate angle in degrees
      // Math.atan2 returns angle in radians between -PI and PI
      rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    }
    
    const result: AnnotationResult = {
      imageWidth: width,
      imageHeight: height,
      border: {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY
      },
      content: {
        width: contentWidth,
        height: contentHeight,
        aspectRatio: contentWidth / contentHeight
      },
      center,
      rotation,
      borderThickness,
      bluePixelCount: bluePixels.length,
      confidence: Math.min(1, bluePixels.length / (width * height * 0.01))
    };
    
    return result;
  }

  /**
   * Legacy method alias for backward compatibility
   */
  detectBlueBorderAnnotations(imageData: ImageData): AnnotationResult | null {
    return this.detectAnnotations(imageData);
  }

  /**
   * Load and analyze an image from a URL or data URL
   */
  async loadAndAnalyzeImage(imageSrc: string): Promise<AnnotationResult | null> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create a canvas to analyze the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image to the canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Analyze for blue border annotations
          const result = this.detectBlueBorderAnnotations(imageData);
          resolve(result);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageSrc;
    });
  }

  /**
   * Parse SVG text to extract image data directly
   */
  parseSvgTextForImage(svgText: string, svgElementId: string): string | null {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Find the image element by ID
      const imageElement = doc.getElementById(svgElementId);
      if (!imageElement) {
        return null;
      }
      
      // Get the href attribute
      const href = imageElement.getAttribute('xlink:href') || imageElement.getAttribute('href');
      if (!href) {
        return null;
      }
      
      return href;
      
    } catch {
      return null;
    }
  }

  /**
   * Find and analyze the default image in an SVG element
   */
  async findAndAnalyzeDefaultImage(svgElementId: string, svgText?: string): Promise<AnnotationResult | null> {
    // First, try to parse from SVG text if provided
    if (svgText) {
      const imageData = this.parseSvgTextForImage(svgText, svgElementId);
      if (imageData) {
        return await this.loadAndAnalyzeImage(imageData);
      }
    }
    
    // Fallback: Look for SVG preview div
    const svgPreviewDiv = document.querySelector('[data-svg-preview]');
    if (svgPreviewDiv) {
      const imageElement = svgPreviewDiv.querySelector(`#${svgElementId}`);
      if (imageElement) {
        const href = imageElement.getAttribute('xlink:href') || imageElement.getAttribute('href');
        if (href) {
          return await this.loadAndAnalyzeImage(href);
        }
      }
    }
    
    // Final fallback: Look for element in DOM
    const svgElement = document.getElementById(svgElementId);
    if (!svgElement) {
      return null;
    }
    
    // Check if this element itself is an image
    if (svgElement.tagName === 'image') {
      const href = svgElement.getAttribute('xlink:href') || svgElement.getAttribute('href');
      if (href) {
        return await this.loadAndAnalyzeImage(href);
      }
    }
    
    // Look for child image elements
    const childImages = svgElement.querySelectorAll('image');
    if (childImages.length > 0) {
      const firstImage = childImages[0] as SVGImageElement;
      const href = firstImage.getAttribute('xlink:href') || firstImage.getAttribute('href');
      if (href) {
        return await this.loadAndAnalyzeImage(href);
      }
    }
    
    // Check for CSS background-image
    const computedStyle = window.getComputedStyle(svgElement);
    const backgroundImage = computedStyle.backgroundImage;
    if (backgroundImage && backgroundImage !== 'none') {
      const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch) {
        return await this.loadAndAnalyzeImage(urlMatch[1]);
      }
    }
    
    return null;
  }
}

// Export a singleton instance
export const annotationDetector = new AnnotationDetector();
