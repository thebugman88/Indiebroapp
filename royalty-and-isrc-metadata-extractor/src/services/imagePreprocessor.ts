/**
 * Image Preprocessing utilities for Tesseract.js OCR
 * Cleans up noise, boosts contrast, and applies binarization to maximize ISRC & royalty text detection
 */

export interface PreprocessOptions {
  grayscale?: boolean;
  enhanceContrast?: boolean;
  contrastFactor?: number; // e.g. 1.5
  binarize?: boolean;
  threshold?: number; // 0 - 255
}

export async function preprocessImage(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  options: PreprocessOptions = {}
): Promise<string> {
  const {
    grayscale = true,
    enhanceContrast = true,
    contrastFactor = 1.3,
    binarize = false,
    threshold = 128,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : img.src);
          return;
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Process pixel data
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // 1. Grayscale
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // 2. Contrast Enhancement
          if (enhanceContrast) {
            gray = ((gray / 255 - 0.5) * contrastFactor + 0.5) * 255;
            gray = Math.min(255, Math.max(0, gray));
          }

          // 3. Binarization / Thresholding
          if (binarize) {
            gray = gray >= threshold ? 255 : 0;
          }

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
          // data[i+3] is alpha, left untouched
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Image preprocessing failed, using original source:', err);
        resolve(typeof imageSource === 'string' ? imageSource : img.src);
      }
    };

    img.onerror = (e) => {
      console.warn('Failed to load image for preprocessing:', e);
      if (typeof imageSource === 'string') {
        resolve(imageSource);
      } else {
        reject(e);
      }
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof HTMLImageElement) {
      img.src = imageSource.src;
    } else if (imageSource instanceof HTMLCanvasElement) {
      img.src = imageSource.toDataURL('image/png');
    }
  });
}
