/**
 * Device Detection Utility
 * Detects device capability to adjust performance settings accordingly
 */

interface DeviceInfo {
  isLowEnd: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  isMobile: boolean;
}

// Cache device info to avoid repeated detection
let cachedDeviceInfo: DeviceInfo | null = null;

/**
 * Detect device capability level
 * @returns Device info object with performance recommendations
 */
export function detectDevice(): DeviceInfo {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  // Get hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  // Get device memory (RAM in GB) - only available in secure contexts
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })?.deviceMemory;
  
  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Determine if device is low-end
  // Criteria: ≤4 CPU cores OR ≤4GB RAM OR mobile device
  const isLowEnd = 
    hardwareConcurrency <= 4 || 
    (deviceMemory !== undefined && deviceMemory <= 4) ||
    isMobile;

  cachedDeviceInfo = {
    isLowEnd,
    hardwareConcurrency,
    deviceMemory,
    isMobile
  };

  return cachedDeviceInfo;
}

/**
 * Check if current device is low-end
 * @returns true if device has limited resources
 */
export function isLowEndDevice(): boolean {
  return detectDevice().isLowEnd;
}

/**
 * Get recommended debounce delay based on device capability
 * @param baseDelay - Base delay in ms (for high-end devices)
 * @param lowEndDelay - Delay for low-end devices (default: 2x base)
 * @returns Recommended delay in ms
 */
export function getAdaptiveDebounce(baseDelay: number, lowEndDelay?: number): number {
  return isLowEndDevice() ? (lowEndDelay ?? baseDelay * 2) : baseDelay;
}

/**
 * Get recommended cache stale time based on device capability
 * @param baseTime - Base stale time in ms (for high-end devices)
 * @param lowEndTime - Stale time for low-end devices (default: 2x base)
 * @returns Recommended stale time in ms
 */
export function getAdaptiveStaleTime(baseTime: number, lowEndTime?: number): number {
  return isLowEndDevice() ? (lowEndTime ?? baseTime * 2) : baseTime;
}
