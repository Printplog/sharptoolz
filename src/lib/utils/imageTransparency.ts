/** True when the image's edges are see-through, i.e. the background is already gone. */
export function hasTransparentEdges(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let edge = 0;
        let clear = 0;
        for (let i = 0; i < size; i++) {
          for (const [x, y] of [[i, 0], [i, size - 1], [0, i], [size - 1, i]]) {
            edge++;
            if (data[(y * size + x) * 4 + 3] < 32) clear++;
          }
        }
        resolve(clear / edge > 0.5);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}
