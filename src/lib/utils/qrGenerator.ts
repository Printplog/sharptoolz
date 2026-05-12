import qrcode from 'qrcode-generator';

/**
 * Generate a QR code as a data URL (PNG) synchronously
 * @param data The text to encode
 * @returns A data URL string
 */
export function generateQrDataUrlSync(data: string): string {
  if (!data) return '';
  try {
    const typeNumber = 0; // Auto-detect
    const errorCorrectionLevel = 'L';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(data);
    qr.make();
    
    // Return as data URL. 
    // cellSize of 4 and margin of 10 are reasonable defaults
    return qr.createDataURL(4, 10);
  } catch (err) {
    console.error('QR Generation Error (Sync):', err);
    return '';
  }
}
