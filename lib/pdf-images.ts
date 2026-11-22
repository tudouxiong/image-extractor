import { imagesFromBinary, type PackedImage } from "@/lib/packed-images";

const MAX_PDF_PAGES = 30;

type PdfImageObject = {
  width?: number;
  height?: number;
  kind?: number;
  data?: Uint8Array;
  bitmap?: ImageBitmap;
};

type ObjStore = {
  has?: (name: string) => boolean;
  get: (name: string, callback: (obj: PdfImageObject | null) => void, errorCallback?: () => void) => void;
};

type PdfPage = {
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  objs: ObjStore;
  commonObjs: ObjStore;
  cleanup: () => void;
};

function readObject(store: ObjStore, name: string) {
  return new Promise<PdfImageObject | null>((resolve) => {
    if (store.has && !store.has(name)) {
      resolve(null);
      return;
    }
    try {
      store.get(
        name,
        (obj) => resolve(obj),
        () => resolve(null),
      );
    } catch {
      resolve(null);
    }
  });
}

async function objectToImage(obj: PdfImageObject | null, index: number, kinds: { gray: number; rgb: number; rgba: number }): Promise<PackedImage | null> {
  if (!obj) return null;
  if (obj.data && obj.data.length > 500 && obj.data[0] === 0xff && obj.data[1] === 0xd8) {
    return { name: `image-${index}.jpg`, bytes: obj.data.slice(), type: "image/jpeg" };
  }

  const width = obj.width || obj.bitmap?.width || 0;
  const height = obj.height || obj.bitmap?.height || 0;
  if (width < 8 || height < 8) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (obj.bitmap) {
    ctx.drawImage(obj.bitmap, 0, 0);
  } else if (obj.data) {
    const imageData = ctx.createImageData(width, height);
    const src = obj.data;
    const dst = imageData.data;
    if (obj.kind === kinds.rgba || src.length === width * height * 4) {
      dst.set(src.subarray(0, dst.length));
    } else if (obj.kind === kinds.rgb || src.length === width * height * 3) {
      for (let i = 0, j = 0; i + 2 < src.length && j + 3 < dst.length; i += 3, j += 4) {
        dst[j] = src[i] ?? 0;
        dst[j + 1] = src[i + 1] ?? 0;
        dst[j + 2] = src[i + 2] ?? 0;
        dst[j + 3] = 255;
      }
    } else if (obj.kind === kinds.gray) {
      let pixel = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const bitIndex = y * width + x;
          const byte = src[bitIndex >> 3] ?? 0;
          const bit = (byte >> (7 - (bitIndex & 7))) & 1;
          const value = bit ? 255 : 0;
          dst[pixel] = value;
          dst[pixel + 1] = value;
          dst[pixel + 2] = value;
          dst[pixel + 3] = 255;
          pixel += 4;
        }
      }
    } else if (src.length === width * height) {
      for (let i = 0; i < src.length && i * 4 + 3 < dst.length; i += 1) {
        const value = src[i] ?? 0;
        dst[i * 4] = value;
        dst[i * 4 + 1] = value;
        dst[i * 4 + 2] = value;
        dst[i * 4 + 3] = 255;
      }
    } else {
      return null;
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    return null;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
  if (!blob) return null;
  return { name: `image-${index}.png`, bytes: new Uint8Array(await blob.arrayBuffer()), type: "image/png" };
}

export async function imagesFromPdf(data: ArrayBuffer): Promise<{ images: PackedImage[]; limited: boolean }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: new Uint8Array(data) });
  const doc = await task.promise;
  const images: PackedImage[] = [];
  const seen = new Set<string>();

  try {
    const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
    const kinds = {
      gray: pdfjs.ImageKind.GRAYSCALE_1BPP,
      rgb: pdfjs.ImageKind.RGB_24BPP,
      rgba: pdfjs.ImageKind.RGBA_32BPP,
    };
    const paint = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject]);

    for (let pageNumber = 1; pageNumber <= pageCount && images.length < 80; pageNumber += 1) {
      const page = (await doc.getPage(pageNumber)) as PdfPage;
      const ops = await page.getOperatorList();
      for (let i = 0; i < ops.fnArray.length && images.length < 80; i += 1) {
        const fn = ops.fnArray[i];
        if (fn === undefined || !paint.has(fn)) continue;
        const name = ops.argsArray[i]?.[0];
        if (typeof name !== "string" || seen.has(name)) continue;
        seen.add(name);
        const obj = page.objs.has?.(name)
          ? await readObject(page.objs, name)
          : await readObject(page.commonObjs, name);
        const image = await objectToImage(obj, images.length + 1, kinds);
        if (image) images.push(image);
      }
      page.cleanup();
    }

    if (images.length === 0) {
      return { images: imagesFromBinary(new Uint8Array(data)), limited: doc.numPages > MAX_PDF_PAGES };
    }
    return { images, limited: doc.numPages > MAX_PDF_PAGES };
  } finally {
    await doc.cleanup();
    await task.destroy();
  }
}
