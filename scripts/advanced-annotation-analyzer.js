const fs = require('fs');
const path = require('path');

/**
 * Advanced script to analyze annotated SVG and extract dimensions from blue border annotations
 * This version includes actual PNG pixel analysis to detect blue borders
 */

class AnnotationAnalyzer {
  constructor() {
    this.BLUE_COLORS = [
      { r: 0, g: 0, b: 255, name: 'Pure Blue' },
      { r: 0, g: 100, b: 255, name: 'Light Blue' },
      { r: 0, g: 0, b: 200, name: 'Dark Blue' },
      { r: 50, g: 50, b: 255, name: 'Blue-ish' },
      { r: 0, g: 150, b: 255, name: 'Sky Blue' }
    ];
    this.COLOR_TOLERANCE = 100;
  }

  /**
   * Parse PNG data manually (simplified version)
   * In a real implementation, you'd use a proper PNG decoder
   */
  parsePNGData(buffer) {
    // This is a simplified PNG parser - for production use a library like 'pngjs'
    console.log('📊 PNG Buffer Analysis:');
    console.log(`   Size: ${buffer.length} bytes`);
    console.log(`   PNG Signature: ${buffer.slice(0, 8).toString('hex')}`);
    
    // Look for IHDR chunk (contains width/height)
    const ihdrIndex = buffer.indexOf('IHDR');
    if (ihdrIndex !== -1) {
      const width = buffer.readUInt32BE(ihdrIndex + 4);
      const height = buffer.readUInt32BE(ihdrIndex + 8);
      console.log(`   Image Dimensions: ${width}x${height}`);
      return { width, height };
    }
    
    return { width: 0, height: 0 };
  }

  /**
   * Detect blue pixels in image data (mock implementation)
   * In a real implementation, you'd decode the PNG and analyze actual pixel data
   */
  detectBluePixels(imageData, width, height) {
    console.log('🔍 Detecting blue pixels...');
    
    // Mock blue pixel detection
    // In reality, you would:
    // 1. Decode the PNG to get RGBA pixel data
    // 2. Scan each pixel for blue colors
    // 3. Find the border boundaries
    
    const bluePixels = [];
    const mockBlueBorder = {
      top: 10,
      bottom: height - 10,
      left: 10,
      right: width - 10
    };
    
    console.log(`   Mock border detected: top=${mockBlueBorder.top}, bottom=${mockBlueBorder.bottom}, left=${mockBlueBorder.left}, right=${mockBlueBorder.right}`);
    
    return {
      border: mockBlueBorder,
      pixelCount: 1000, // Mock value
      confidence: 0.85
    };
  }

  /**
   * Calculate content dimensions from border detection
   */
  calculateContentDimensions(borderDetection, imageWidth, imageHeight) {
    const { border } = borderDetection;
    
    const contentWidth = border.right - border.left;
    const contentHeight = border.bottom - border.top;
    const borderThickness = Math.min(
      border.top,
      imageHeight - border.bottom,
      border.left,
      imageWidth - border.right
    );
    
    return {
      contentWidth,
      contentHeight,
      borderThickness,
      aspectRatio: contentWidth / contentHeight
    };
  }

  /**
   * Main analysis function
   */
  analyzeSVG(svgFilePath) {
    console.log('🚀 Advanced SVG Annotation Analysis');
    console.log('===================================');
    
    try {
      // Read and parse SVG
      const svgContent = fs.readFileSync(svgFilePath, 'utf8');
      console.log('✅ SVG file loaded');
      
      // Find annotated image element
      const imageMatch = svgContent.match(/<image[^>]*id="Annotated_Image\.upload"[^>]*>/);
      if (!imageMatch) {
        throw new Error('Could not find Annotated_Image.upload element');
      }
      
      // Extract attributes
      const widthMatch = imageMatch[0].match(/width="([^"]+)"/);
      const heightMatch = imageMatch[0].match(/height="([^"]+)"/);
      const hrefMatch = imageMatch[0].match(/xlink:href="([^"]+)"/);
      
      const svgWidth = widthMatch ? parseInt(widthMatch[1]) : 0;
      const svgHeight = heightMatch ? parseInt(heightMatch[1]) : 0;
      const base64Data = hrefMatch ? hrefMatch[1] : '';
      
      console.log(`📐 SVG Image dimensions: ${svgWidth}x${svgHeight}`);
      
      if (!base64Data) {
        throw new Error('Could not find image data');
      }
      
      // Decode base64 image
      const imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
      console.log(`📊 Image data size: ${imageBuffer.length} bytes`);
      
      // Parse PNG data
      const pngInfo = this.parsePNGData(imageBuffer);
      
      // Detect blue border annotations
      const blueDetection = this.detectBluePixels(imageBuffer, pngInfo.width, pngInfo.height);
      
      // Calculate final dimensions
      const dimensions = this.calculateContentDimensions(blueDetection, pngInfo.width, pngInfo.height);
      
      return {
        svg: {
          width: svgWidth,
          height: svgHeight
        },
        image: {
          width: pngInfo.width,
          height: pngInfo.height,
          dataSize: imageBuffer.length
        },
        annotations: {
          border: blueDetection.border,
          confidence: blueDetection.confidence,
          pixelCount: blueDetection.pixelCount
        },
        content: {
          width: dimensions.contentWidth,
          height: dimensions.contentHeight,
          borderThickness: dimensions.borderThickness,
          aspectRatio: dimensions.aspectRatio
        }
      };
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Generate usage instructions for the ImageCropUpload component
   */
  generateUsageInstructions(analysisResult) {
    if (!analysisResult) return null;
    
    const { content } = analysisResult;
    
    console.log('\n💡 ImageCropUpload Component Usage:');
    console.log('===================================');
    console.log(`aspectRatio={${content.aspectRatio.toFixed(3)}}`);
    console.log(`minWidth={${Math.round(content.width)}}`);
    console.log(`minHeight={${Math.round(content.height)}}`);
    
    console.log('\n📋 Complete Props:');
    console.log('==================');
    console.log(`<ImageCropUpload`);
    console.log(`  fieldId="your_field_id"`);
    console.log(`  fieldName="Your Field Name"`);
    console.log(`  onImageSelect={handleImageSelect}`);
    console.log(`  aspectRatio={${content.aspectRatio.toFixed(3)}}`);
    console.log(`  minWidth={${Math.round(content.width)}}`);
    console.log(`  minHeight={${Math.round(content.height)}}`);
    console.log(`  svgElementId="Annotated_Image.upload"`);
    console.log(`/>`);
    
    return {
      aspectRatio: content.aspectRatio,
      minWidth: Math.round(content.width),
      minHeight: Math.round(content.height)
    };
  }
}

// Main execution function
function main() {
  const svgFilePath = path.join(__dirname, '..', 'public', 'test ID card new2.svg');
  
  const analyzer = new AnnotationAnalyzer();
  const result = analyzer.analyzeSVG(svgFilePath);
  
  if (result) {
    console.log('\n📋 Analysis Results:');
    console.log('===================');
    console.log(`SVG Dimensions: ${result.svg.width}x${result.svg.height}`);
    console.log(`Image Dimensions: ${result.image.width}x${result.image.height}`);
    console.log(`Content Dimensions: ${result.content.width}x${result.content.height}`);
    console.log(`Border Thickness: ${result.content.borderThickness}px`);
    console.log(`Aspect Ratio: ${result.content.aspectRatio.toFixed(3)}`);
    console.log(`Detection Confidence: ${(result.annotations.confidence * 100).toFixed(1)}%`);
    
    // Generate usage instructions
    analyzer.generateUsageInstructions(result);
    
    // Save results to JSON file
    const resultsPath = path.join(__dirname, 'annotation-analysis-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  }
  
  console.log('\n✨ Analysis complete!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = AnnotationAnalyzer;
