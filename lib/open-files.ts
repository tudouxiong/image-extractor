import { MAX_DOCUMENT_BYTES, MAX_LOCAL_IMAGES } from "@/lib/constants";
import { imagesFromOffice, imagesFromBinary, type PackedImage } from "@/lib/packed-images";
import { imagesFromPdf } from "@/lib/pdf-images";
import type { ExtractedImage } from "@/lib/types";

function toBlobImages(packed: PackedImage[]) {
  return packed.slice(0, MAX_LOCAL_IMAGES).map((image) => {
    const copy = new Uint8Array(image.bytes.byteLength);
    copy.set(image.bytes);
    const blob = new Blob([copy.buffer], { type: image.type });
    return {
      url: URL.createObjectURL(blob),
      alt: image.name,
      width: null,
      height: null,
    } satisfies ExtractedImage;
  });
}

export async function imagesFromDocuments(files: File[]) {
  const images: ExtractedImage[] = [];
  const notes: string[] = [];

  for (const file of files) {
    if (images.length >= MAX_LOCAL_IMAGES) {
      notes.push(`Showing the first ${MAX_LOCAL_IMAGES} images.`);
      break;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      notes.push(`${file.name} is larger than 30 MB and was skipped.`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "doc" || ext === "ppt") {
      notes.push(`${file.name} uses an older format. Save it as .docx or .pptx and try again.`);
      continue;
    }
    if (ext !== "pdf" && ext !== "docx" && ext !== "pptx") {
      notes.push(`${file.name} is not a PDF, Word, or PowerPoint file.`);
      continue;
    }

    const data = await file.arrayBuffer();
    let packed: PackedImage[] = [];
    try {
      if (ext === "pdf") {
        try {
          const pdf = await imagesFromPdf(data);
          packed = pdf.images;
          if (pdf.limited) notes.push(`${file.name} is long, so only the first 30 pages were read.`);
        } catch (error) {
          packed = imagesFromBinary(new Uint8Array(data));
          if (packed.length === 0) {
            const message = error instanceof Error ? error.message : "";
            notes.push(/password/i.test(message) ? `${file.name} is password protected.` : `${file.name} could not be read.`);
          }
        }
      } else {
        packed = await imagesFromOffice(data);
      }
    } catch {
      notes.push(`${file.name} could not be opened. Save Word and PowerPoint files as .docx or .pptx.`);
      continue;
    }

    if (packed.length === 0) {
      notes.push(`No images found in ${file.name}.`);
      continue;
    }
    images.push(...toBlobImages(packed).slice(0, MAX_LOCAL_IMAGES - images.length));
  }

  return { images, notes };
}
