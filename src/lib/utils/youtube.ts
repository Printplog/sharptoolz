/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Pattern for youtube.com/watch?v=VIDEO_ID
  const watchPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(watchPattern);
  
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Generate YouTube thumbnail URL
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality ('maxres' for highest, 'hq' for high quality)
 * @returns Thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'maxres' | 'hq' = 'maxres'): string {
  const qualityPath = quality === 'maxres' ? 'maxresdefault' : 'hqdefault';
  return `https://img.youtube.com/vi/${videoId}/${qualityPath}.jpg`;
}

/**
 * Get YouTube thumbnail from URL
 * Attempts maxres first, falls back to hq if needed
 */
export function getYouTubeThumbnailFromUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return getYouTubeThumbnail(videoId, 'maxres');
}

