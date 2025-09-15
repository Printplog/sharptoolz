#!/usr/bin/env node

/**
 * Quick SVG Annotation Analyzer
 * Simple script to extract dimensions from annotated SVG
 */

const fs = require('fs');
const path = require('path');

function quickAnalyze() {
  const svgPath = path.join(__dirname, '..', 'public', 'test ID card new2.svg');
  
  console.log('🚀 Quick SVG Annotation Analyzer');
  console.log('================================');
  console.log(`📁 Analyzing: ${svgPath}`);
  
  try {
    // Read SVG file
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    console.log('✅ SVG file loaded');
    
    // Find the annotated image element
    const imageMatch = svgContent.match(/<image[^>]*id="Annotated_Image\.upload"[^>]*>/);
    if (!imageMatch) {
      console.error('❌ Could not find Annotated_Image.upload element');
      return;
    }
    
    console.log('✅ Found annotated image element');
    
    // Extract dimensions from SVG attributes
    const widthMatch = imageMatch[0].match(/width="([^"]+)"/);
    const heightMatch = imageMatch[0].match(/height="([^"]+)"/);
    
    const svgWidth = widthMatch ? parseInt(widthMatch[1]) : null;
    const svgHeight = heightMatch ? parseInt(heightMatch[1]) : null;
    
    console.log(`📐 SVG Image dimensions: ${svgWidth}x${svgHeight}`);
    
    // Extract base64 data info
    const hrefMatch = imageMatch[0].match(/xlink:href="([^"]+)"/);
    if (hrefMatch) {
      const base64Data = hrefMatch[1];
      const dataSize = base64Data.length;
      console.log(`📊 Base64 data size: ${dataSize} characters`);
      
      // Save image for manual inspection
      const imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
      const tempPath = path.join(__dirname, 'extracted-annotated-image.png');
      fs.writeFileSync(tempPath, imageBuffer);
      console.log(`💾 Extracted image saved to: ${tempPath}`);
    }
    
    // Estimate content dimensions (assuming 10px border on all sides)
    const estimatedBorderThickness = 10;
    const estimatedContentWidth = svgWidth - (estimatedBorderThickness * 2);
    const estimatedContentHeight = svgHeight - (estimatedBorderThickness * 2);
    const estimatedAspectRatio = estimatedContentWidth / estimatedContentHeight;
    
    console.log('\n📋 Estimated Results (assuming 10px border):');
    console.log('============================================');
    console.log(`Content Width: ${estimatedContentWidth}px`);
    console.log(`Content Height: ${estimatedContentHeight}px`);
    console.log(`Aspect Ratio: ${estimatedAspectRatio.toFixed(3)}`);
    
    console.log('\n💡 ImageCropUpload Props:');
    console.log('=========================');
    console.log(`aspectRatio={${estimatedAspectRatio.toFixed(3)}}`);
    console.log(`minWidth={${estimatedContentWidth}}`);
    console.log(`minHeight={${estimatedContentHeight}}`);
    
    console.log('\n🔧 Complete Component Usage:');
    console.log('============================');
    console.log(`<ImageCropUpload`);
    console.log(`  fieldId="your_field_id"`);
    console.log(`  fieldName="Your Field Name"`);
    console.log(`  onImageSelect={handleImageSelect}`);
    console.log(`  aspectRatio={${estimatedAspectRatio.toFixed(3)}}`);
    console.log(`  minWidth={${estimatedContentWidth}}`);
    console.log(`  minHeight={${estimatedContentHeight}}`);
    console.log(`  svgElementId="Annotated_Image.upload"`);
    console.log(`/>`);
    
    // Save results to JSON
    const results = {
      svg: {
        width: svgWidth,
        height: svgHeight
      },
      estimated: {
        contentWidth: estimatedContentWidth,
        contentHeight: estimatedContentHeight,
        aspectRatio: estimatedAspectRatio,
        borderThickness: estimatedBorderThickness
      },
      props: {
        aspectRatio: estimatedAspectRatio,
        minWidth: estimatedContentWidth,
        minHeight: estimatedContentHeight
      }
    };
    
    const resultsPath = path.join(__dirname, 'quick-analysis-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    
    console.log('\n✨ Analysis complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Open the extracted image to verify the border thickness');
    console.log('2. Adjust the estimated values if needed');
    console.log('3. Use the generated props in your ImageCropUpload component');
    console.log('4. For precise analysis, use the browser analyzer: scripts/browser-annotation-analyzer.html');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
quickAnalyze();
