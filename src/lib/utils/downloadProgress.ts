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

// Estimate processing time based on output type and SVG size (local generation)
export function estimateConversionTime(svgSizeMB: number, outputType: 'pdf' | 'png'): number {
  // Local processing is generally faster than server round-trips but can vary by device
  const baseTime = outputType === 'pdf' ? 0.5 : 0.8; // seconds

  // Complexity penalty (roughly based on size)
  const complexityMultiplier = outputType === 'pdf' ? 0.2 : 0.5;
  const additionalTime = Math.min(svgSizeMB * complexityMultiplier, 5);

  return baseTime + additionalTime;
}

// Calculate SVG size in MB
export function calculateSvgSize(svg: string): number {
  if (!svg) return 0;
  const bytes = new Blob([svg]).size;
  return bytes / (1024 * 1024);
}

// Estimate output file size
export function estimateOutputSize(svgSizeMB: number, outputType: 'pdf' | 'png'): number {
  // PDF (compressed) is often smaller than SVG, PNG can be larger
  const outputSizeMultiplier = outputType === 'pdf' ? 0.3 : 1.2;
  return svgSizeMB * outputSizeMultiplier;
}

// Calculate total time (for local generation)
export function calculateTotalTime(
  svgSizeMB: number,
  outputType: 'pdf' | 'png'
): number {
  return estimateConversionTime(svgSizeMB, outputType);
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

