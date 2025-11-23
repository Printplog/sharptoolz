/**
 * Utility functions for download progress estimation
 */

// Estimate internet speed (MB/s)
// Uses Network Information API if available, otherwise estimates based on connection type
export function estimateInternetSpeed(): number {
  // Try to use Network Information API
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (connection) {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink; // in Mbps
    
    if (downlink) {
      // Convert Mbps to MB/s (divide by 8)
      // Use 70% of theoretical max for realistic estimate
      return (downlink / 8) * 0.7;
    }
    
    // Estimate based on effective type (more realistic speeds)
    const speedMap: Record<string, number> = {
      'slow-2g': 0.05, // ~50 KB/s
      '2g': 0.1,        // ~100 KB/s
      '3g': 0.5,        // ~500 KB/s
      '4g': 5.0,        // ~5 MB/s (more realistic for modern connections)
    };
    
    return speedMap[effectiveType] || 5.0; // Default to 5 MB/s (more realistic)
  }
  
  // Fallback: default to 5 MB/s (realistic for modern broadband)
  return 5.0;
}

// Estimate conversion time based on output type and SVG size
export function estimateConversionTime(svgSizeMB: number, outputType: 'pdf' | 'png'): number {
  // Base conversion time in seconds (server-side conversion is usually fast)
  // PDF conversion (Cairo/Playwright) is typically faster than PNG rendering
  const baseTime = outputType === 'pdf' ? 1 : 1.5; // seconds (reduced from 2-3)
  
  // Add time based on SVG size (larger SVGs take longer, but not linearly)
  // More realistic: 0.1 seconds per MB for PDF, 0.2 seconds per MB for PNG
  // Cap the additional time to prevent overestimation
  const sizeMultiplier = outputType === 'pdf' ? 0.1 : 0.2;
  const additionalTime = Math.min(svgSizeMB * sizeMultiplier, 3); // Cap at 3 seconds
  
  return baseTime + additionalTime;
}

// Calculate SVG size in MB
export function calculateSvgSize(svg: string): number {
  // Convert string to bytes (UTF-8 encoding)
  const bytes = new Blob([svg]).size;
  // Convert to MB
  return bytes / (1024 * 1024);
}

// Estimate output file size
export function estimateOutputSize(svgSizeMB: number, outputType: 'pdf' | 'png'): number {
  // More realistic estimates based on actual file compression
  // - PDF: Usually much smaller than SVG (compressed, typically 10-30% of SVG size)
  // - PNG: Can be larger, but typically 50-100% of SVG size for most documents
  const outputSizeMultiplier = outputType === 'pdf' ? 0.2 : 0.8;
  return svgSizeMB * outputSizeMultiplier;
}

// Calculate total download time (for initial estimate)
export function calculateTotalTime(
  svgSizeMB: number,
  outputType: 'pdf' | 'png',
  internetSpeedMBps: number
): number {
  // Estimate output file size
  const estimatedOutputSizeMB = estimateOutputSize(svgSizeMB, outputType);
  
  // Conversion time (server-side processing)
  const conversionTime = estimateConversionTime(svgSizeMB, outputType);
  
  // Download time (time to receive the file)
  // Use conservative estimate for initial calculation
  const downloadTime = estimatedOutputSizeMB / Math.max(internetSpeedMBps, 5); // At least 5 MB/s
  
  // Total time with minimum of 2 seconds (even for very small files)
  const totalTime = conversionTime + downloadTime;
  return Math.max(totalTime, 2);
}

// Format time remaining
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

